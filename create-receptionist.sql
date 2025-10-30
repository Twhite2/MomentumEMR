-- Add Receptionist user for Front Desk
-- Password: receptionist123 (hashed with bcrypt)

INSERT INTO "User" (
  email, 
  name, 
  password, 
  role, 
  "hospitalId", 
  "contactInfo", 
  active, 
  "createdAt", 
  "updatedAt"
) 
SELECT 
  'receptionist@citygeneralhospital.com',
  'Sarah Martinez',
  '$2a$10$rGfKzMxH9kqL5YwZLvHxYOq8vZp7j2XYWpqv0mK4qn5T3kW9xI2wS', -- receptionist123
  'receptionist',
  h.id,
  '{"phone": "+234-1-234-5690", "address": "45 Front Desk Lane, Lagos, Nigeria"}'::jsonb,
  true,
  NOW(),
  NOW()
FROM "Hospital" h
WHERE h.name = 'City General Hospital'
LIMIT 1;

-- Verify the user was created
SELECT 
  id, 
  name, 
  email, 
  role,
  active
FROM "User"
WHERE email = 'receptionist@citygeneralhospital.com';
