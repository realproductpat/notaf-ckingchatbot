import fetch from "node-fetch";
import { Adapter } from "./types";

/**
 * text-generation-inference adapter with streaming support.
 * Many TGI setups stream newline-delimited JSON chunks.
 */

export default function tgiAdapter(config: { url: string }): Adapter {
  const { url } = config;

  async function send(messages: { role: string; content: string }[]) {
    const prompt = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") + "\nAssistant:";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512 } })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    if (json[0] && json[0].generated_text) return json[0].generated_text;
    if (json.generated_text) return json.generated_text;
    return JSON.stringify(json);
  }

  async function streamMessage(
    messages: { role: string; content: string }[],
    onDelta: (d: string, done?: boolean) => void
  ) {
    const prompt = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") + "\nAssistant:";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // TGI often accepts a stream parameter or uses chunked transfer with newline-delimited JSON
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512 }, stream: true })
    });
    if (!res.ok) {
      onDelta(`Stream error: ${res.status}`, true);
      return;
    }
    if (!res.body) {
      onDelta("No stream body", true);
      return;
    }

    // Node-fetch v2 body is a Node.js ReadableStream, not a Web ReadableStream
    const reader = (res.body as unknown as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // TGI streams are often newline-separated JSON objects.
      let idx;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const j = JSON.parse(line);
          const delta = j.delta || j.text || j.generated_text || JSON.stringify(j);
          onDelta(delta, false);
        } catch {
          onDelta(line, false);
        }
      }
    }

    if (buffer.trim()) {
      try {
        const j = JSON.parse(buffer);
        const delta = j.delta || j.text || j.generated_text || JSON.stringify(j);
        onDelta(delta, false);
      } catch {
        onDelta(buffer, false);
      }
    }

    onDelta("", true);
  }

  return {
    id: "tgi",
    sendMessage: send,
    streamMessage
  } as Adapter;
}