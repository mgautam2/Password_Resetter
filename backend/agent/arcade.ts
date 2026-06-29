import Arcade from '@arcadeai/arcadejs';

export const ARCADE_USER_ID = 'mrinaldavis2@gmail.com';

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
