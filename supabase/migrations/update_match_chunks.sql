-- Upgrade the match_insight_chunks function to support cross-insight searching (RAG)
-- When filter_insight_id is NULL or omitted, it searches across all documents.
CREATE OR REPLACE FUNCTION match_insight_chunks (
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_insight_id uuid DEFAULT NULL
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
    WHERE (filter_insight_id IS NULL OR insight_chunks.insight_id = filter_insight_id)
      AND 1 - (insight_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY insight_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
