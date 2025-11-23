import express from "express";
import cors from "cors";
import { PORT, UPLOAD_DIR } from "./config";
import authRoutes from "./routes/auth";
import projectsRoutes from "./routes/projects";
import modelRoutes from "./routes/model";
import ingestRoutes from "./routes/ingest";
import filesRoutes from "./routes/files";
import { apiLimiter, authLimiter, modelLimiter, uploadLimiter } from "./middleware/rateLimiter";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Apply general rate limiting to all API routes
app.use("/api/", apiLimiter);

// static uploads
const uploadDir = UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(path.resolve(uploadDir)));

// Apply specific rate limiters to routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/model", modelLimiter, modelRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/files", uploadLimiter, filesRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});