import fetch from "node-fetch";
import { MODEL_PROXY_URL, MODEL_API_KEY } from "../config";

/**
 * Very small model proxy adapter.
 * - sendText: send messages as a single prompt and return final text
 * - streamText: start an SSE stream from upstream if supported and forward events to client
 *
 * Extend this file to support different model backends.
 */

export async function sendText(prompt: string) {
  // default: POST JSON { inputs } to MODEL_PROXY_URL
  const res = await fetch(MODEL_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(MODEL_API_KEY ? { Authorization: `Bearer ${MODEL_API_KEY}` } : {})
    },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512 } })
  });
  const json = await res.json();
  if (Array.isArray(json) && json[0]) {
    return json[0].generated_text || json[0].text || JSON.stringify(json[0]);
  }
  if (json.outputs?.[0]?.text) return json.outputs[0].text;
  if (json.text) return json.text;
  return JSON.stringify(json);
}

export function streamProxySSE(req: any, res: any) {
  // Basic SSE forwarder: connect to upstream SSE endpoint and stream events to client.
  const upstream = MODEL_PROXY_URL.replace(/\/$/, "") + "/stream";
  const headers = {
    ...(MODEL_API_KEY ? { Authorization: `Bearer ${MODEL_API_KEY}` } : {}),
    "Content-Type": "application/json"
  };

  // very small SSE client using node-fetch's body stream
  fetch(upstream, {
    method: "POST",
    headers,
    body: JSON.stringify(req.body)
  }).then(async (uRes) => {
    if (!uRes.ok) {
      res.status(uRes.status).send(await uRes.text());
      return;
    }
    res.setHeader("Content-Type", "text/event-stream");
    // pipe chunks to client
    const reader = (uRes.body as any).getReader();
    const decoder = new TextDecoder();
    async function pump() {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // forward as SSE data lines
        res.write(`data: ${chunk}\n\n`);
      }
      res.end();
    }
    pump().catch((e) => {
      res.end();
    });
  }).catch((err) => {
    res.status(500).json({ error: "upstream error", details: String(err) });
  });
}