import Anthropic from '@anthropic-ai/sdk';

type StringProp  = { type: 'string' };
type InputSchema = { type: 'object'; properties: Record<string, StringProp>; required: string[] };

const str: StringProp = { type: 'string' };

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_reset_link',
    description: 'Get the password reset URL from the email inbox',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
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
    description: 'Call this when you cannot proceed — CAPTCHA, 2FA, unexpected page, etc.',
    input_schema: {
      type: 'object' as const,
      properties: { reason: str },
      required: ['reason'],
    },
  },
];
