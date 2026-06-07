CREATE TABLE IF NOT EXISTS system_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_status TEXT NOT NULL DEFAULT 'Idle',
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists
INSERT INTO system_status (id, current_status, last_fetched_at)
VALUES (1, 'Idle', NOW())
ON CONFLICT (id) DO NOTHING;
