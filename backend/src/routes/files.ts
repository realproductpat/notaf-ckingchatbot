import express from "express";
import multer from "multer";
import fs from "fs";
import { UPLOAD_DIR } from "../config";
import { requireAuth, AuthRequest } from "../middleware/auth";
import prisma from "../db";
import path from "path";

const router = express.Router();
const uploadDir = UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

router.use(requireAuth);

// upload file to project
router.post("/:projectId", upload.single("file"), async (req: AuthRequest, res) => {
  const userId = (req.user as any).id;
  const projectId = Number(req.params.projectId);
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) return res.status(404).json({ error: "Not found" });
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file" });
  const meta = await prisma.fileMeta.create({
    data: {
      filename: file.originalname,
      path: file.filename,
      size: file.size,
      projectId
    }
  });
  res.json(meta);
});

// download file
router.get("/download/:id", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);
  const file = await prisma.fileMeta.findUnique({ where: { id } });
  if (!file) return res.status(404).send("Not found");
  const full = path.join(uploadDir, file.path);
  res.download(full, file.filename);
});

export default router;