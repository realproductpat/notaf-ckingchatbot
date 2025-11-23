import { Client } from "pg";
import { DATABASE_URL } from "../config";

const client = new Client({ connectionString: DATABASE_URL });

export async function connect() {
  await client.connect();
  // Note: creating extension may require superuser. Prefer running backend/sql/pgvector_setup.sql separately.
}

export async function insertEmbedding(params: {
  fileId?: number;
  projectId?: number;
  content: string;
  embedding: number[];
}) {
  const { fileId, projectId, content, embedding } = params;
  // create array literal string like "[0.1,0.2,...]" then cast to vector
  const vecString = `[${embedding.join(",")}]`;
  // use parameterized query for fileId/projectId/content; embed vecString inline and cast to vector
  const sql = `
    INSERT INTO embeddings (file_id, project_id, content, embedding)
    VALUES ($1, $2, $3, $4::vector)
    RETURNING id
  `;
  const res = await client.query(sql, [fileId || null, projectId || null, content, vecString]);
  return res.rows[0];
}

/**
 * Query nearest neighbors using <=> operator (pgvector)
 * Returns rows with id and distance, score or raw content.
 */
export async function queryNearest(embedding: number[], k = 5) {
  const vecString = `[${embedding.join(",")}]`;
  const sql = `
    SELECT id, file_id, project_id, content, 1 - (embedding <=> $1::vector) AS score
    FROM embeddings
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `;
  const res = await client.query(sql, [vecString, k]);
  return res.rows;
}

export async function end() {
  await client.end();
}

export default client;