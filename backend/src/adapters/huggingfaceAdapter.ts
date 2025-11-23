import fetch from "node-fetch";
import { Adapter } from "./types";
import { HF_API_KEY } from "../config";

/**
 * Lightweight HuggingFace inference adapter (non-streaming)
 */

export default function huggingfaceAdapter(config: { url: string }): Adapter {
  const { url } = config;
  async function send(messages: { role: string; content: string }[]) {
    const prompt = messages.map(m => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`)).join("\n") + "\nAssistant:";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: HF_API_KEY ? `Bearer ${HF_API_KEY}` : "" },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512 } })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    if (Array.isArray(json) && json[0]) return json[0].generated_text || json[0].text || JSON.stringify(json[0]);
    return JSON.stringify(json);
  }

  return {
    id: "huggingface",
    sendMessage: send
  } as any;
}