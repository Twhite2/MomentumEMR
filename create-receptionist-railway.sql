-- Insert receptionist user for City General Hospital
-- Password: receptionist123 (hashed with bcrypt)

INSERT INTO users (
    hospital_id,
    name,
    email,
    hashed_password,
    role,
    active,
    must_change_password,
    created_at,
    updated_at
)
VALUES (
    1,  -- Assuming City General Hospital has ID 1
    'Sarah Martinez',
    'receptionist@citygeneralhospital.com',
    '$2a$10$rQZ9vXZYXqYxN0pKqVxX7.8JK5mKqYZqYZqYZqYZqYZqYZqYZqYZ',  -- This will be replaced with actual hash
    'receptionist',
    true,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active;
