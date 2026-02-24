-- Migration: Add first_occurred_at column to callsigns table
-- Purpose: Track the first occurrence time of similar callsigns
-- Date: 2026-02-24

-- Step 1: Add the new column
ALTER TABLE callsigns
ADD COLUMN IF NOT EXISTS first_occurred_at TIMESTAMP;

-- Step 2: Populate first_occurred_at for existing records
-- For records without callsign_occurrences, use uploaded_at (엑셀 업로드 시간)
-- For records with callsign_occurrences, use the earliest occurrence date
UPDATE callsigns cs
SET first_occurred_at = COALESCE(
  (SELECT MIN(occurred_date) FROM callsign_occurrences
   WHERE callsign_id = cs.id),
  cs.uploaded_at,
  cs.created_at
)
WHERE first_occurred_at IS NULL;

-- Step 3: Verify the migration
-- SELECT
--   id, callsign_pair, first_occurred_at, last_occurred_at, created_at, uploaded_at
-- FROM callsigns
-- WHERE first_occurred_at IS NOT NULL
-- LIMIT 10;
