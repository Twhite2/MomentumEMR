/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `hospitals` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subdomain` to the `hospitals` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add subdomain column as nullable first
ALTER TABLE "hospitals" ADD COLUMN "subdomain" TEXT;

-- Step 2: Auto-generate subdomains for existing hospitals based on their names
-- This converts "City General Hospital" to "city-general-hospital"
UPDATE "hospitals" 
SET "subdomain" = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE("name", '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
)
WHERE "subdomain" IS NULL;

-- Step 3: Handle any potential duplicates by appending hospital ID
WITH duplicates AS (
    SELECT "subdomain", COUNT(*) as count
    FROM "hospitals"
    GROUP BY "subdomain"
    HAVING COUNT(*) > 1
)
UPDATE "hospitals" h
SET "subdomain" = h."subdomain" || '-' || h."id"
WHERE h."subdomain" IN (SELECT "subdomain" FROM duplicates);

-- Step 4: Make subdomain NOT NULL now that all rows have values
ALTER TABLE "hospitals" ALTER COLUMN "subdomain" SET NOT NULL;

-- Step 5: Create unique index
CREATE UNIQUE INDEX "hospitals_subdomain_key" ON "hospitals"("subdomain");
