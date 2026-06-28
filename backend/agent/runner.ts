import { readFileSync } from 'fs';
import { Socket } from 'socket.io';
import { generatePassword, SocketEvents } from './utils.js';

type ToolInput = Record<string, string>;
type ToolHandler = (input: ToolInput) => Promise<string>;

export class Runner {
  private pendingDom: { resolve: (dom: string) => void; reject: (err: Error) => void } | null = null;
  private tools: Record<string, ToolHandler>;

  constructor(private socket: Socket) {
    socket.on('dom_result', (dom: string) => {
      console.log(`[runner] dom received — ${dom.length} chars`);
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

  private buildTools(): Record<string, ToolHandler> {
    return {
      read_reset_link: async () => {
        this.emit('status', { message: 'Reading reset link...' });
        const { url } = JSON.parse(readFileSync('./reset_link.json', 'utf-8'));
        this.emit('milestone', { label: 'Got reset link' });
        return url;
      },

      wait_and_read: async () => {
        this.emit('status', { message: 'Waiting for the page to settle...' });
        this.emit('action', { type: 'read' });
        return this.waitForDom();
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
    console.log(`[runner] ${name}`, input);
    return handler(input);
  }
}
