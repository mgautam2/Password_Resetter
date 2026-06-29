import Anthropic from '@anthropic-ai/sdk';
import { Socket } from 'socket.io';
import { TOOLS } from './tools.js';
import { Runner } from './runner.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an agent that resets passwords automatically. If you get stuck, do not attempt anything outside your given set of tools.

Your flow:
1. Call check_inbox. It returns emails (as JSON with html_body) received around now, or a retry message.
2. Look through the returned emails for one that is a password-reset email. Extract its reset URL and call navigate(url).
3. If no emails yet, follow the retry instruction in the tool response (wait then check_inbox again).
4. Never invent a URL — the link must come from the email html_body.
5. Read the DOM, generate a password with generate_password(), fill the form fields using fill()
6. Submit using click()
7. Confirm success from DOM, then call done()

Rules:
- A reset link may land on a homepage and open the form as a modal a moment later. If you don't see the form, call wait_and_read() before concluding the page is wrong.
- wait_and_read() is a last resort — only call it when you genuinely cannot proceed without a fresh DOM read. Prefer acting on the DOM you already have.
- Call done() when you see a success confirmation on the page
- If you can go past captcha, do so
- Call stuck() ONLY for 2FA, or truly unrecoverable situations — NOT for CAPTCHA/challenge pages
- Always focus on the actual component to reset the password. Forget the irrelevant forms on the screen
- Never hardcode selectors — infer them from the DOM
- Never invent a password — always call generate_password()
- After submitting the form, if you are redirected to a completely different page (dashboard, home, jobs, profile) that is NOT the reset form, treat that as success — the site logged you in with the new password. Call done() immediately.
- Look at the confirmation text on the screen to see if you reset the password or if you see the user has logged in

CAPTCHA / Cloudflare challenge pages:
- If the DOM is very short (<300 chars) or mentions "one more step", "checking your browser", "just a moment", or similar, AND the reset form fields are not present, the page is a blocking challenge — call wait_and_read() once to wait for it to clear.
- If the reset form fields ARE visible in the DOM, fill them immediately even if a Turnstile or g-recaptcha widget is present. Both auto-resolve on submit — you do not need to interact with them or wait before filling.
- Invisible reCAPTCHA v3 (g-recaptcha, g-recaptcha-response hidden field) is handled server-side automatically. NEVER call stuck() because you see a g-recaptcha element — just fill and submit the form.
- Do NOT call wait_and_read() just because Turnstile or reCAPTCHA is present alongside a visible form.
- After submitting, if you are redirected to a home page, call done() immediately — no extra wait_and_read() needed.

Your responses should be short

** Do not click on the reset password button. Just fill the password **

`;

export class AgentSession {
  private runner: Runner;
  private aborted = false;

  constructor(socket: Socket) {
    this.runner = new Runner(socket);
  }

  stop() {
    this.aborted = true;
    this.runner.stop();
  }

  async run() {
    console.log("Running Agent 🤖")
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: 'Reset the password.' },
    ];

    while (!this.aborted) {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      console.log(response.content)

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        console.log('[session] ended without calling done/stuck');
        break;
      }

      if (response.stop_reason !== 'tool_use') break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let terminal = false;

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue; // skip text blocks

        const result = await this.runner.run(block.name, block.input as Record<string, string>);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });

        if (block.name === 'done' || block.name === 'stuck') {
          terminal = true; // end the session after flushing results
          break;
        }
      }

      messages.push({ role: 'user', content: toolResults });
      if (terminal) return;
    }
  }
}
