import { Adapter } from "../adapter";
import { Message } from "../../types";

/**
 * LocalAI / text-generation-inference style adapter.
 *
 * Example LocalAI / tgi endpoints:
 * - LocalAI (llama.cpp frontend) often exposes /v1/chat or /v1/generate
 * - text