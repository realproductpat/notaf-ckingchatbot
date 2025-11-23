import express from "express";
import cors from "cors";
import { PORT, UPLOAD_DIR } from "./config";
import authRoutes from "./routes/auth";
import projectsRoutes from "./routes/projects";
import modelRoutes from "./routes/model";
import ingestRoutes from "./routes/ingest";
import filesRoutes from "./routes/files";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// static uploads
const uploadDir = UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(path.resolve(uploadDir)));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/model", modelRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/files", filesRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});