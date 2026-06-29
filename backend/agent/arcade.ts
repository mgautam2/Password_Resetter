import Arcade from '@arcadeai/arcadejs';

export const ARCADE_USER_ID = process.env.ARCADE_USER_ID!;

const client = new Arcade({ apiKey: process.env.ARCADE_API_KEY });

export async function checkAuth(): Promise<{ authorized: boolean; url?: string; id?: string }> {
  const r = await client.tools.authorize({
    tool_name: 'Gmail.ListEmails',
    user_id: ARCADE_USER_ID,
  });
  return { authorized: r.status === 'completed', url: r.url ?? undefined, id: r.id ?? undefined };
}

export async function waitForAuthById(id: string): Promise<void> {
  await client.auth.waitForCompletion(id);
}

export async function listEmailsByHeader(): Promise<unknown[]> {
  const r = await client.tools.execute({
    tool_name: 'Gmail.ListEmailsByHeader',
    user_id: ARCADE_USER_ID,
    input: { subject: 'password', date_range: 'today', exclude_automated: false, max_results: 10 },
  });
  const value = r.output?.value as { emails?: unknown[] } | unknown[] | null;
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'emails' in value) return (value as { emails: unknown[] }).emails ?? [];
  return [];
}
