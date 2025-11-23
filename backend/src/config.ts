import dotenv from "dotenv";
dotenv.config();

export const PORT = parseInt(process.env.PORT || "4000", 10);
export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/llmapp";
export const JWT_SECRET = process.env.JWT_SECRET || "change_me";
export const MODEL_PROXY_URL = process.env.MODEL_PROXY_URL || "";
export const MODEL_API_KEY = process.env.MODEL_API_KEY || "";
export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
export const EMBEDDINGS_PROVIDER = (process.env.EMBEDDINGS_PROVIDER || "openai").toLowerCase();
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const HF_API_KEY = process.env.HF_API_KEY || "";