import Anthropic from '@anthropic-ai/sdk';

type StringProp  = { type: 'string' };
type InputSchema = { type: 'object'; properties: Record<string, StringProp>; required: string[] };

const str: StringProp = { type: 'string' };

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_inbox',
    description: 'Search Gmail for a password-reset email received around now. Returns matching emails as JSON, or a retry message if none found yet.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'wait',
    description: 'Wait N seconds before retrying check_inbox.',
    input_schema: {
      type: 'object' as const,
      properties: { seconds: str },
      required: ['seconds'],
    },
  },
  {
    name: 'navigate',
    description: 'Navigate the browser to a URL. Returns the page DOM.',
    input_schema: {
      type: 'object' as const,
      properties: { url: str },
      required: ['url'],
    },
  },
  {
    name: 'click',
    description: 'Click an element by CSS selector. Returns the page DOM after the click.',
    input_schema: {
      type: 'object' as const,
      properties: { selector: str },
      required: ['selector'],
    },
  },
  {
    name: 'fill',
    description: 'Type a value into an input by CSS selector. Returns the page DOM after filling.',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: str,
        value: str,
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'wait_and_read',
    description:
      'Re-read the current page after waiting for it to settle. Use when the page may still be loading — e.g. a reset link that lands on a homepage and opens the form as a modal a moment later. Returns the page DOM.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'generate_password',
    description: 'Generate a strong 16-character password. Always use this — never invent one.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'done',
    description: 'Call this when the password has been reset successfully.',
    input_schema: {
      type: 'object' as const,
      properties: {
        password: str,
        message: str,
      },
      required: ['password', 'message'],
    },
  },
  {
    name: 'stuck',
    description: 'Call this when you truly cannot proceed — 2FA, or anything unrecoverable. Do NOT call for Cloudflare/Turnstile challenge pages; use wait_and_read() repeatedly until they clear.',
    input_schema: {
      type: 'object' as const,
      properties: { reason: str },
      required: ['reason'],
    },
  },
];
