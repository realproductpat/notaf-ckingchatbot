export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export async function apiFetch(path: string, token?: string, opts: any = {}) {
  const headers: any = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {})
  };
  const res = await fetch(API_BASE + path, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}