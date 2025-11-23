import express from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import prisma from "../db";

const router = express.Router();

router.use(requireAuth);

// list projects for user
router.get("/", async (req: AuthRequest, res) => {
  const userId = (req.user as any).id;
  const projects = await prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  res.json(projects);
});

// create project
router.post("/", async (req: AuthRequest, res) => {
  const userId = (req.user as any).id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const project = await prisma.project.create({ data: { name, userId } });
  res.json(project);
});

// get project by id
router.get("/:id", async (req: AuthRequest, res) => {
  const userId = (req.user as any).id;
  const id = Number(req.params.id);
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

// get messages for project
router.get("/:id/messages", async (req: AuthRequest, res) => {
  const userId = (req.user as any).id;
  const projectId = Number(req.params.id);
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) return res.status(404).json({ error: "Not found" });
  const messages = await prisma.message.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
  res.json(messages);
});

// create message for project
router.post("/:id/messages", async (req: AuthRequest, res) => {
  const userId = (req.user as any).id;
  const projectId = Number(req.params.id);
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) return res.status(404).json({ error: "Not found" });
  const { role, content, metadata } = req.body;
  if (!role || !content) return res.status(400).json({ error: "role and content required" });
  const message = await prisma.message.create({ data: { role, content, metadata, projectId } });
  res.json(message);
});

// get files for project
router.get("/:id/files", async (req: AuthRequest, res) => {
  const userId = (req.user as any).id;
  const projectId = Number(req.params.id);
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) return res.status(404).json({ error: "Not found" });
  const files = await prisma.fileMeta.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
  res.json(files);
});

export default router;