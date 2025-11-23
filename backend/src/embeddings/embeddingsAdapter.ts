import fetch from "node-fetch";
import { EMBEDDINGS_PROVIDER, OPENAI_API_KEY, HF_API_KEY } from "../config";

/**
 * Embeddings adapter that supports:
 * - openai: uses OpenAI embeddings API
 * - huggingface: uses sentence-transformers hosted on HF (inference API)
 *
 * Returns float[] array for each input.
 */

export async function embedText(texts: string[]): Promise<number[][]> {
  const provider = EMBEDDINGS_PROVIDER;
  if (provider === "openai") {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ input: texts, model: "text-embedding-3-small" })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.data.map((d: any) => d.embedding);
  } else {
    // HF sentence-transformers endpoint (model must be hosted with embeddings support)
    if (!HF_API_KEY) throw new Error("HF_API_KEY not set");
    const res = await fetch("https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${HF_API_KEY}` },
      body: JSON.stringify(texts)
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json as number[][];
  }
}