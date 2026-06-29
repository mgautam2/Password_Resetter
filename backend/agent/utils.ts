import { customAlphabet } from 'nanoid';

export type SocketEvents = {
  status:        { message: string };
  milestone:     { label: string };
  action:        { type: string; url?: string; selector?: string; value?: string };
  session_done:  { password: string; message: string };
  session_stuck: { reason: string };
  auth_status:   { authorized: boolean; url?: string };
};

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
const nanoid   = customAlphabet(alphabet, 16);

export const generatePassword = () => nanoid();
