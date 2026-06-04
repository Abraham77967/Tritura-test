CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    content_type TEXT NOT NULL,
    topic_tag TEXT NOT NULL,
    core_thesis TEXT[] NOT NULL,
    author_context TEXT,
    market_impact TEXT,
    tech_impact TEXT,
    catalysts TEXT,
    contrarian_view TEXT,
    signal_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster filtering and sorting
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_signal_score ON insights(signal_score DESC);
