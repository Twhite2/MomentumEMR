-- Fix the auto-increment sequence for hospitals table
-- This resets the sequence to the maximum existing ID + 1

-- For PostgreSQL:
SELECT setval('hospitals_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM hospitals), false);

-- Alternative if the sequence name is different:
-- SELECT setval(pg_get_serial_sequence('hospitals', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM hospitals), false);

-- Verify the fix:
SELECT nextval('hospitals_id_seq');
SELECT currval('hospitals_id_seq');
