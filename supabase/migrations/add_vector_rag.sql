-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store individual text chunks and their vector embeddings
CREATE TABLE IF NOT EXISTS insight_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768), -- Gemini text-embedding-004 has 768 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_insight_chunks_embedding ON insight_chunks USING hnsw (embedding vector_cosine_ops);

-- Create a function to search for matching chunks within a specific insight
CREATE OR REPLACE FUNCTION match_insight_chunks (
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_insight_id uuid
)
RETURNS TABLE (
    id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        insight_chunks.id,
        insight_chunks.content,
        1 - (insight_chunks.embedding <=> query_embedding) AS similarity
    FROM insight_chunks
    WHERE insight_chunks.insight_id = filter_insight_id
      AND 1 - (insight_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY insight_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
