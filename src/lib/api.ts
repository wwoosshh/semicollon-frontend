import { authStore } from "./auth-store";

const BASE = process.env.NEXT_PUBLIC_API_URL!;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = authStore.refresh;
  if (!refreshToken) return false;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  authStore.set(await res.json());
  return true;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (authStore.access) headers.set("Authorization", `Bearer ${authStore.access}`);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry && (await refreshTokens())) {
    return api<T>(path, options, false);
  }
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error((msg as { message?: string }).message ?? `요청 실패 (${res.status})`);
  }
  return res.json();
}
