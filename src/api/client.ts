// Frontend API client - add to your Expo app under src/api/client.ts
export const API_BASE = (typeof window !== "undefined" && (window as any).__env?.API_BASE) || "http://localhost:4000";

export async function apiFetch(path: string, token?: string, opts: any = {}) {
  const headers = {
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