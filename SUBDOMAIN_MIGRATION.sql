-- Momentum EMR: Add Subdomain Support to Hospitals
-- Run this after Prisma migration to add subdomains to existing hospitals

-- Step 1: View current hospitals without subdomains
SELECT id, name, subdomain FROM hospitals;

-- Step 2: Auto-generate subdomains for existing hospitals
-- This uses a simple slug generation (lowercase, remove special chars, replace spaces with hyphens)
UPDATE hospitals 
SET subdomain = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
)
WHERE subdomain IS NULL OR subdomain = '';

-- Step 3: Handle duplicate subdomains (if any)
-- Add a number suffix to duplicates
WITH duplicates AS (
    SELECT subdomain, COUNT(*) as count
    FROM hospitals
    GROUP BY subdomain
    HAVING COUNT(*) > 1
)
UPDATE hospitals h
SET subdomain = h.subdomain || '-' || h.id
WHERE h.subdomain IN (SELECT subdomain FROM duplicates);

-- Step 4: Verify all hospitals have unique subdomains
SELECT id, name, subdomain FROM hospitals ORDER BY id;

-- Step 5: Check for any NULL or empty subdomains
SELECT id, name, subdomain FROM hospitals WHERE subdomain IS NULL OR subdomain = '';

-- If you see any, manually set them:
-- UPDATE hospitals SET subdomain = 'your-subdomain' WHERE id = X;

-- Step 6: Verify uniqueness
SELECT subdomain, COUNT(*) as count 
FROM hospitals 
GROUP BY subdomain 
HAVING COUNT(*) > 1;
-- Should return no rows (all subdomains are unique)
