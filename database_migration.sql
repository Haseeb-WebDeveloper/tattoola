-- Migration script to convert styleId from String to String[] array
-- Run this in your Supabase SQL Editor

-- Step 1: Remove the foreign key constraint (required before changing column type)
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_styleId_fkey;

-- Step 2: Remove the index on styleId (can't index array columns directly)
DROP INDEX IF EXISTS posts_styleId_idx;

-- Step 3: Convert styleId column to TEXT[] array type
-- This preserves existing data by converting single values to arrays
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

-- Step 5: Verify the change
-- You can run this to check:
-- SELECT id, "styleId", array_length("styleId", 1) as style_count FROM posts LIMIT 5;

