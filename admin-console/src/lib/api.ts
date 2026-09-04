const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const TOKEN_KEY = "rr_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Fetch wrapper with a transparent retry on Hostinger's intermittent 502/503 edge errors
 * (CLAUDE.md #5). Only retries idempotent GETs and only on those two statuses / network failures.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const retryable = method === "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < (retryable ? 3 : 1); attempt++) {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
      if ((res.status === 502 || res.status === 503) && retryable) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      if (res.status === 401) {
        clearToken();
        throw new Error("Session expired — sign in again");
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      lastErr = err;
      if (!retryable) break;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr;
}
