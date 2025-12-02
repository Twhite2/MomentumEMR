-- Fix auto-increment sequences for all tables
-- Run this on your production database to sync sequences with actual data

-- Hospitals table
SELECT setval(
    pg_get_serial_sequence('hospitals', 'id'), 
    (SELECT COALESCE(MAX(id), 0) + 1 FROM hospitals), 
    false
);

-- Users table
SELECT setval(
    pg_get_serial_sequence('users', 'id'), 
    (SELECT COALESCE(MAX(id), 0) + 1 FROM users), 
    false
);

-- Patients table
SELECT setval(
    pg_get_serial_sequence('patients', 'id'), 
    (SELECT COALESCE(MAX(id), 0) + 1 FROM patients), 
    false
);

-- Check the current sequence values
SELECT 'hospitals' as table_name, currval(pg_get_serial_sequence('hospitals', 'id')) as current_sequence;
SELECT 'users' as table_name, currval(pg_get_serial_sequence('users', 'id')) as current_sequence;
SELECT 'patients' as table_name, currval(pg_get_serial_sequence('patients', 'id')) as current_sequence;
