-- Migration: Convert styleId from String to String[] array
-- This migration preserves ALL existing data - no data will be lost
-- Single values are converted to single-item arrays

-- Step 1: Remove the foreign key constraint (required before changing column type)
-- This is safe - the constraint will be removed but data remains intact
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_styleId_fkey;

-- Step 2: Remove the index on styleId (can't index array columns directly)
DROP INDEX IF EXISTS posts_styleId_idx;

-- Step 3: Convert styleId column to TEXT[] array type
-- USING clause ensures data preservation:
--   - NULL values → empty array []
--   - Empty strings → empty array []
--   - Single values → single-item array ["value"]
ALTER TABLE posts 
ALTER COLUMN "styleId" TYPE TEXT[] USING 
  CASE 
    WHEN "styleId" IS NULL THEN ARRAY[]::TEXT[]
    WHEN "styleId" = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["styleId"]::TEXT[]
  END;

-- Step 4: Set default to empty array
ALTER TABLE posts 
ALTER COLUMN "styleId" SET DEFAULT ARRAY[]::TEXT[];

