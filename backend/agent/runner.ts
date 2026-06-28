import { readFileSync } from 'fs';
import { Socket } from 'socket.io';

type ToolInput = Record<string, string>;
type ToolHandler = (input: ToolInput) => Promise<string>;

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let pw = '';
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export class Runner {
  private pendingDom: { resolve: (dom: string) => void; reject: (err: Error) => void } | null = null;
  private tools: Record<string, ToolHandler>;

  constructor(private socket: Socket) {
    socket.on('dom_result', (dom: string) => {
      console.log(dom.length)
      this.pendingDom?.resolve(dom);
      this.pendingDom = null;
    });

    const waitForDom = () =>
      new Promise<string>((resolve, reject) => { this.pendingDom = { resolve, reject }; });

    const status = (message: string) => socket.emit('status', { message });
    const milestone = (label: string) => socket.emit('milestone', { label });

    this.tools = {
      read_reset_link: async () => {
        status('Reading reset link...');
        const { url } = JSON.parse(readFileSync('./reset_link.json', 'utf-8'));
        milestone('Got reset link');
        return url;
      },

      wait_and_read: async () => {
        status('Waiting for the page to settle...');
        socket.emit('action', { type: 'read' });
        return waitForDom();
      },

      generate_password: async () => {
        status('Generating password...');
        return generatePassword();
      },

      navigate: async ({ url }) => {
        status(`Navigating to ${url}...`);
        socket.emit('action', { type: 'navigate', url });
        const dom = await waitForDom();
        milestone('Page loaded');
        return dom;
      },

      click: async ({ selector }) => {
        status(`Clicking ${selector}...`);
        socket.emit('action', { type: 'click', selector });
        return waitForDom();
      },

      fill: async ({ selector, value }) => {
        status(`Filling ${selector}...`);
        socket.emit('action', { type: 'fill', selector, value });
        return waitForDom();
      },

      done: async ({ password, message }) => {
        milestone('Complete');
        socket.emit('session_done', { password, message });
        return 'done';
      },

      stuck: async ({ reason }) => {
        socket.emit('session_stuck', { reason });
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
    console.log(`[runner] ${name}`, input);
    return handler(input);
  }
}
