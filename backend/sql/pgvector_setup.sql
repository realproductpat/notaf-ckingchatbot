-- Run this once on your Postgres instance (requires superuser for CREATE EXTENSION)
-- Creates the pgvector extension and a simple embeddings table.
CREATE EXTENSION IF NOT EXISTS vector;

-- example embeddings table: one row per file (or document chunk)
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  file_id INTEGER,      -- FK to file_meta.id (optional)
  project_id INTEGER,   -- FK to project.id (optional)
  content TEXT,
  embedding vector(1536), -- adjust dimension to your embeddings model
  created_at TIMESTAMP DEFAULT now()
);

-- Index to accelerate nearest neighbor queries (using L2 distance)
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);