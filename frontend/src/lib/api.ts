import { fetchAuthSession } from 'aws-amplify/auth';

const BASE = import.meta.env.VITE_API_URL ?? 'https://REPLACE_API_ID.execute-api.ap-south-1.amazonaws.com';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { tokens } = await fetchAuthSession();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens?.idToken?.toString()}`,
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data?.error?.message || res.statusText), {
      status: res.status,
      code: data?.error?.code,
    });
  }

  return data as T;
}

export function getRole(session: Awaited<ReturnType<typeof fetchAuthSession>>): 'ADMIN' | 'STAFF' | 'STUDENT' | null {
  const groups = (session.tokens?.idToken?.payload['cognito:groups'] as string[] | undefined) ?? [];
  return (['ADMIN', 'STAFF', 'STUDENT'] as const).find((r) => groups.includes(r)) ?? null;
}
