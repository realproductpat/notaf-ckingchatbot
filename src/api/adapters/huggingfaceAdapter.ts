import { Adapter } from "../adapter";
import { Message } from "../../types";

/**
 * Minimal Hugging Face Inference adapter (non-streaming).
 * Expects BACKEND_URL to be a model endpoint like:
 *  https://api-inference.huggingface.co/models/gpt2
 *
 * The HF inference API expects {"inputs": "<prompt>"} for text-generation.
 * For chat-style models you should format messages into a single prompt string.
 */

export default function huggingfaceAdapter(config: {
  url: string;
  apiKey?: string;
  model?: string;
}): Adapter {
  const { url, apiKey } = config;
  const endpoint = url;

  async function sendMessage(messages: Message[]) {
    // Convert chat messages to a single prompt.
    const prompt = messages
      .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`))
      .join("\n") + "\nAssistant:";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 512 }
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HuggingFace error: ${res.status} ${text}`);
    }

    const json = await res.json();
    // HF returns an array with generated_text in many cases
    if (Array.isArray(json) && json[0]) {
      return json[0].generated_text || json[0].text || JSON.stringify(json[0]);
    }
    return JSON.stringify(json);
  }

  return {
    id: "huggingface",
    displayName: "Hugging Face",
    sendMessage
  };
}