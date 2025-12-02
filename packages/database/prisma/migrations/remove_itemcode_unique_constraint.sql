-- Remove unique constraint from item_code to allow multiple items without batch numbers
-- This is necessary because batch numbers are optional and many items won't have them

-- Drop the unique constraint
ALTER TABLE "inventory" DROP CONSTRAINT IF EXISTS "inventory_item_code_key";

-- Note: Items can still have batch numbers, they just won't be enforced as unique
-- This makes sense because:
-- 1. Not all items have batch numbers
-- 2. Multiple items without batch numbers (NULL values) were causing conflicts
-- 3. Batch numbers are informational rather than identifying
