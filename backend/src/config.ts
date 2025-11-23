import dotenv from "dotenv";
dotenv.config();

export const PORT = parseInt(process.env.PORT || "4000", 10);
export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/llmapp";
// Critical security: JWT secrets must be set in production
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_me") {
  console.warn("WARNING: JWT_SECRET is not set or using default value. This is INSECURE for production!");
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === "change_me_refresh") {
  console.warn("WARNING: JWT_REFRESH_SECRET is not set or using default value. This is INSECURE for production!");
}

export const JWT_SECRET = process.env.JWT_SECRET || "change_me";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "change_me_refresh";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m"; // Access token expiration
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d"; // Refresh token expiration
export const MODEL_PROXY_URL = process.env.MODEL_PROXY_URL || "";
export const MODEL_API_KEY = process.env.MODEL_API_KEY || "";
export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
export const EMBEDDINGS_PROVIDER = (process.env.EMBEDDINGS_PROVIDER || "openai").toLowerCase();
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const HF_API_KEY = process.env.HF_API_KEY || "";

// Rate limiting configuration
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);
export const AUTH_RATE_LIMIT_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX || "5", 10);
export const MODEL_RATE_LIMIT_MAX = parseInt(process.env.MODEL_RATE_LIMIT_MAX || "20", 10);