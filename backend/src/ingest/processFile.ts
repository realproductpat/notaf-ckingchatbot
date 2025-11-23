import path from "path";
import fs from "fs/promises";
import prisma from "../db";
import { embedText } from "../embeddings/embeddingsAdapter";
import { insertEmbedding } from "../vector/pgvector";
import { UPLOAD_DIR } from "../config";

/**
 * Simple ingestion: reads uploaded file (text/plain) and creates a single embedding row.
 * For PDFs and other formats extend this module to extract text (pdf-parse, tesseract, etc.)
 */

export async function processFileById(fileId: number) {
  const file = await prisma.fileMeta.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("file not found");
  const full = path.join(UPLOAD_DIR, file.path);

  // very simple content extraction: text files only
  const lower = (file.filename || "").toLowerCase();
  let text = "";
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".json") || lower.endsWith(".csv")) {
    text = await fs.readFile(full, "utf-8");
  } else {
    // placeholder: for pdf/images, implement pdf/tika/ocr extraction
    text = `File ${file.filename} uploaded; content extraction not implemented for this file type.`;
  }

  // create embedding(s)
  const embeddings = await embedText([text]); // returns number[][]
  const embedding = embeddings[0];

  // store into pgvector
  const row = await insertEmbedding({ fileId: file.id, projectId: file.projectId, content: text.slice(0, 2000), embedding });

  // update file meta with processed flag (if you want) - adding a metadata JSON column would be better
  await prisma.fileMeta.update({ where: { id: file.id }, data: {} });

  return row;
}