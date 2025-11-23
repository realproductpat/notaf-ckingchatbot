import prisma from "../db";
import { processFileById } from "../ingest/processFile";

/**
 * Simple CLI worker to process pending files.
 * Usage:
 *   node dist/worker/ingestWorker.js            # process all files (for demo)
 *   node dist/worker/ingestWorker.js 123       # process file id 123
 *
 * This is intentionally small — in production use Bull/Redis or a dedicated queue.
 */

async function runOne(fileId?: number) {
  if (fileId) {
    console.log("Processing file", fileId);
    await processFileById(fileId);
    return;
  }

  // process all files (naive): process all fileMeta rows
  const files = await prisma.fileMeta.findMany();
  for (const f of files) {
    try {
      console.log("Processing file", f.id, f.filename);
      await processFileById(f.id);
    } catch (err) {
      console.error("Failed to process file", f.id, err);
    }
  }
}

if (require.main === module) {
  const arg = process.argv[2];
  const id = arg ? Number(arg) : undefined;
  runOne(id)
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { runOne as processAll };