import express from "express";
import { requireAuth } from "../middleware/auth";
import createModelAdapter from "../adapters";
import prisma from "../db";

const router = express.Router();
const adapter = createModelAdapter();

// non-streaming proxy
router.post("/", requireAuth, async (req, res) => {
  try {
    const { messages, projectId } = req.body;
    const text = await adapter.sendMessage(messages || []);
    if (projectId) {
      await prisma.message.create({ data: { role: "assistant", content: text, projectId } });
    }
    res.json({ text });
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
});

// streaming proxy (basic form) - requires adapter.streamMessage to be implemented for upstream SSE/WebSocket
router.post("/stream", requireAuth, async (req, res) => {
  if (!adapter.streamMessage) return res.status(400).json({ error: "stream not supported by adapter" });
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders?.();

  try {
    await adapter.streamMessage(req.body.messages || [], (delta, done) => {
      if (done) {
        res.write(`data: [DONE]\n\n`);
        res.end();
      } else {
        // event data must be safe for SSE; we send raw delta
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    });
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

export default router;