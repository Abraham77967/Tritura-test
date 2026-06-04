-- Add new detailed fields
ALTER TABLE insights 
ADD COLUMN IF NOT EXISTS author_context TEXT,
ADD COLUMN IF NOT EXISTS market_impact TEXT,
ADD COLUMN IF NOT EXISTS tech_impact TEXT,
ADD COLUMN IF NOT EXISTS catalysts TEXT,
ADD COLUMN IF NOT EXISTS contrarian_view TEXT;

-- Rename summary_bullets to core_thesis
ALTER TABLE insights RENAME COLUMN summary_bullets TO core_thesis;
