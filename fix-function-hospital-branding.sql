-- Fix Function Hospital Branding
-- Run this on your production database

-- 1. Check current state
SELECT 
  id,
  name,
  subdomain,
  active,
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  tagline
FROM hospitals
WHERE subdomain = 'function';

-- 2. Update branding with correct colors
-- (Update the logoUrl with your actual uploaded file path)
UPDATE hospitals
SET 
  "primaryColor" = '#e00000',
  "secondaryColor" = '#2368c7',
  active = true
WHERE subdomain = 'function';

-- 3. If logo isn't showing, update with full public URL
-- Option A: If you have the file name from upload
-- UPDATE hospitals
-- SET "logoUrl" = '/uploads/1733140800000-your-logo-filename.png'
-- WHERE subdomain = 'function';

-- Option B: Use an external image host (recommended for testing)
-- Upload your logo to imgur.com or similar, then:
-- UPDATE hospitals
-- SET "logoUrl" = 'https://i.imgur.com/YourImageID.png'
-- WHERE subdomain = 'function';

-- 4. Verify the update
SELECT 
  id,
  name,
  subdomain,
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  active
FROM hospitals
WHERE subdomain = 'function';

-- Expected result:
-- primaryColor:   #e00000
-- secondaryColor: #2368c7
-- logoUrl:        /uploads/xxx-xxx.png (or external URL)
-- active:         t (true)
