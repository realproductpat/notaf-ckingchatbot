import fetch from "node-fetch";
import { Adapter } from "./types";

/**
 * LocalAI adapter with streaming support.
 * - sendMessage: non-streaming call
 * - streamMessage: opens POST to /v1/generate (or configured URL) and reads chunked output.
 *
 * This tries to be permissive to different LocalAI streaming shapes:
 * - newline-delimited JSON chunks
 * - plain text chunks
 * - SSE-like "data: {...}" chunks
 */

export default function localaiAdapter(config: { url: string }): Adapter {
  const { url } = config;

  async function send(messages: { role: string; content: string }[]) {
    const prompt = messages
      .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`))
      .join("\n") + "\nAssistant:";

    const res = await fetch(`${url}/v1/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, max_new_tokens: 512 })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    if (json.output && json.output[0] && json.output[0].content) return json.output[0].content;
    if (json.results && json.results[0] && json.results[0].text) return json.results[0].text;
    return JSON.stringify(json);
  }

  async function streamMessage(
    messages: { role: string; content: string }[],
    onDelta: (d: string, done?: boolean) => void
  ) {
    const prompt = messages
      .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`))
      .join("\n") + "\nAssistant:";

    // Many LocalAI setups accept ?stream=true or {stream:true}
    const endpoint = `${url}/v1/generate`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, max_new_tokens: 512, stream: true })
    });
    if (!res.ok) {
      onDelta(`Stream error: ${res.status}`, true);
      return;
    }

    if (!res.body) {
      onDelta("No stream body from LocalAI", true);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Split into SSE-like events (data: ...)
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        // possible shapes:
        // data: {"delta":"..."}
        // {"id":...,"text":"..."}
        // plain text chunk
        const line = part.trim();
        if (!line) continue;

        // try SSE lines
        if (line.startsWith("data:")) {
          const payload = line.replace(/^data:\s*/, "");
          try {
            const p = JSON.parse(payload);
            const delta = p.delta || p.text || p.chunk || JSON.stringify(p);
            onDelta(delta, false);
            continue;
          } catch {
            onDelta(payload, false);
            continue;
          }
        }

        // try JSON
        try {
          const j = JSON.parse(line);
          const delta = j.delta || j.text || j.chunk || (Array.isArray(j.output) ? j.output.map((o: any) => o.content || o.text).join("") : JSON.stringify(j));
          onDelta(delta, false);
          continue;
        } catch {
          // fallback raw text
          onDelta(line, false);
        }
      }
    }

    // flush leftover buffer
    if (buffer.trim()) {
      try {
        const j = JSON.parse(buffer);
        const delta = j.delta || j.text || j.chunk || JSON.stringify(j);
        onDelta(delta, false);
      } catch {
        onDelta(buffer, false);
      }
    }

    onDelta("", true);
  }

  return {
    id: "localai",
    sendMessage: send,
    streamMessage
  } as Adapter;
}