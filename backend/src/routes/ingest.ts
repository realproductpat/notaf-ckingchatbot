import express from "express";
import { requireAuth } from "../middleware/auth";
import { processFileById } from "../ingest/processFile";

const router = express.Router();

router.use(requireAuth);

/**
 * POST /api/ingest/:fileId
 * Triggers ingestion for a given uploaded file (synchronous).
 * In production you would enqueue a job and process in background.
 */
router.post("/:fileId", async (req: any, res) => {
  const fileId = Number(req.params.fileId);
  try {
    const row = await processFileById(fileId);
    res.json({ ok: true, row });
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;