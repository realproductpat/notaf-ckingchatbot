import httpAdapter from "./adapters/httpAdapter";

/**
 * Frontend adapter factory now points at your backend proxy.
 * The backend will forward/stream to configured external model servers.
 */
export default function createAdapter() {
  const env: any = (typeof window !== "undefined" && (window as any).__env) || {};
  const url = env.BACKEND_URL || env.API_BASE || "http://localhost:4000/api/model";
  return httpAdapter({ url, apiKey: undefined });
}