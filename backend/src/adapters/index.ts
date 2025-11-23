import { MODEL_PROXY_URL } from "../config";
import localaiAdapter from "./localaiAdapter";
import tgiAdapter from "./tgiAdapter";
import huggingfaceAdapter from "./huggingfaceAdapter";
import openaiAdapter from "./openaiAdapter";

/**
 * Factory: choose adapter based on MODEL_PROXY_URL or explicit provider.
 * Example provider strings:
 * - localai://http://localai:8080
 * - tgi://http://tgi:8080
 * - hf://https://api-inference.huggingface.co/models/...
 * - openai://api
 *
 * If MODEL_PROXY_URL begins with a scheme, we can pick.
 */

export default function createModelAdapter(url?: string) {
  const target = (url || MODEL_PROXY_URL || "").trim();
  if (target.startsWith("localai://") || target.includes("localai")) {
    return localaiAdapter({ url: target.replace(/^localai:\/\//, "").replace(/\/$/, "") });
  }
  if (target.startsWith("tgi://") || target.includes("/v1/models/")) {
    return tgiAdapter({ url: target.replace(/^tgi:\/\//, "") });
  }
  if (target.startsWith("hf://") || target.includes("huggingface.co")) {
    return huggingfaceAdapter({ url: target.replace(/^hf:\/\//, "") });
  }
  // fallback to openai-like POST
  return openaiAdapter({ url: target || "" });
}