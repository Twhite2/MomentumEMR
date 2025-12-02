-- Check hospital branding data for troubleshooting
-- Run this to see what's stored in the database

-- 1. Check all hospitals with branding info
SELECT 
  id,
  name,
  subdomain,
  active,
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  tagline,
  "createdAt"
FROM hospitals
ORDER BY "createdAt" DESC;

-- 2. Check specific hospital by subdomain (replace 'function' with your subdomain)
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

-- 3. Update hospital branding (if needed - replace values)
-- UPDATE hospitals
-- SET 
--   "logoUrl" = '/uploads/your-logo-filename.png',
--   "primaryColor" = '#e00000',
--   "secondaryColor" = '#2368c7',
--   tagline = 'Your tagline here',
--   active = true
-- WHERE subdomain = 'function';

-- 4. Verify the update
-- SELECT * FROM hospitals WHERE subdomain = 'function';
