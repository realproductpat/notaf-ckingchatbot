import fetch from "node-fetch";
import { Adapter } from "./types";

/**
 * Generic OpenAI-like adapter: forwards to an OpenAI-compatible API or custom endpoint.
 * If you use real OpenAI, implement the chat completion call. For other servers, adapt accordingly.
 */

export default function openaiAdapter(config: { url: string }): Adapter {
  const { url } = config;

  async function send(messages: { role: string; content: string }[]) {
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    const res = await fetch(url || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // Authorization header added by model proxy or client if needed
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    if (json.choices && json.choices[0] && json.choices[0].message) return json.choices[0].message.content;
    return JSON.stringify(json);
  }

  return {
    id: "openai",
    sendMessage: send
  } as any;
}