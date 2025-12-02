-- Add background_image_url column to hospitals table
-- This allows hospitals to upload custom background images for their login pages

ALTER TABLE hospitals 
ADD COLUMN background_image_url TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hospitals' 
  AND column_name = 'background_image_url';

-- Example: Set a background image for a hospital
-- UPDATE hospitals 
-- SET background_image_url = '/uploads/hospital-ward-background.jpg'
-- WHERE subdomain = 'function';
