import chalk from 'chalk';
import { Socket } from 'socket.io';
import { generatePassword, SocketEvents } from './utils.js';
import { listEmailsByHeader } from './arcade.js';

type ToolInput = Record<string, string>;
type ToolHandler = (input: ToolInput) => Promise<string>;

export class Runner {
  private pendingDom: { resolve: (dom: string) => void; reject: (err: Error) => void } | null = null;
  private tools: Record<string, ToolHandler>;
  private sessionStartedAt = Date.now();
  private inboxAttempts = 0;

  constructor(private socket: Socket) {
    socket.on('dom_result', (dom: string) => {
      console.info(chalk.redBright(`[DOM LENGTH] — ${dom.length} chars`));
      this.pendingDom?.resolve(dom);
      this.pendingDom = null;
    });

    this.tools = this.buildTools();
  }

  private emit<E extends keyof SocketEvents>(event: E, payload: SocketEvents[E]) {
    this.socket.emit(event, payload);
  }

  private waitForDom(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.pendingDom = { resolve, reject };
    });
  }

  private truncateDom(dom: string, max = 50_000): string {
    if (dom.length <= max) return dom;
    return dom.slice(0, max) + `\n<!-- DOM truncated: ${dom.length} → ${max} chars -->`;
  }

  private buildTools(): Record<string, ToolHandler> {
    return {
      check_inbox: async () => {
        this.emit('status', { message: 'Checking inbox…' });
        this.inboxAttempts++;
        const emails = await listEmailsByHeader();
        const floor = this.sessionStartedAt - 2 * 60 * 1000;
        const parseDate = (d: string) => new Date(String(d ?? '').replace(' at ', ' ')).getTime();
        const recent = emails.filter((e: any) => parseDate(e.date) >= floor);
        console.log(chalk.green("[inbox]"), `${recent.length}/${emails.length} email(s) in window`);
        if (recent.length > 0) {
          return JSON.stringify(recent.map((e: any) => ({ from: e.from_ ?? e.from, subject: e.subject, date: e.date, body: e.body ?? e.snippet, html_body: e.html_body })));
        }
        if (this.inboxAttempts >= 5) return 'Max attempts reached. Call stuck().';
        return `No emails yet. Attempt ${this.inboxAttempts}/5. Call wait({ seconds: "30" }) then check_inbox again.`;
      },

      wait: async ({ seconds }) => {
        const ms = parseInt(seconds, 10) * 1000;
        this.emit('status', { message: `Waiting ${seconds}s for email…` });
        await new Promise(r => setTimeout(r, ms));
        return 'Done waiting. Call check_inbox again.';
      },

      wait_and_read: async () => {
        this.emit('status', { message: 'Waiting for the page to settle...' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        this.emit('action', { type: 'read' });
        const dom = await this.waitForDom();
        return this.truncateDom(dom);
      },

      generate_password: async () => {
        this.emit('status', { message: 'Generating password...' });
        return generatePassword();
      },

      navigate: async ({ url }) => {
        this.emit('status', { message: `Navigating to ${url}...` });
        this.emit('action', { type: 'navigate', url });
        const dom = await this.waitForDom();
        this.emit('milestone', { label: 'Page loaded' });
        return dom;
      },

      click: async ({ selector }) => {
        this.emit('status', { message: `Clicking ${selector}...` });
        this.emit('action', { type: 'click', selector });
        return this.waitForDom();
      },

      fill: async ({ selector, value }) => {
        this.emit('status', { message: `Filling ${selector}...` });
        this.emit('action', { type: 'fill', selector, value });
        return this.waitForDom();
      },

      done: async ({ password, message }) => {
        this.emit('milestone', { label: 'Complete' });
        this.emit('session_done', { password, message });
        return 'done';
      },

      stuck: async ({ reason }) => {
        this.emit('session_stuck', { reason });
        return 'stuck';
      },
    };
  }

  stop() {
    this.pendingDom?.reject(new Error('aborted'));
    this.pendingDom = null;
  }

  async run(name: string, input: ToolInput): Promise<string> {
    const handler = this.tools[name];
    if (!handler) return `unknown tool: ${name}`;
    console.log(chalk.dim(`[runner]`) + ' ' + chalk.yellow(name), chalk.dim(JSON.stringify(input)));
    return handler(input);
  }
}
