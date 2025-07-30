-- Remove the role column requirement from archived_users table
-- The role field is now obsolete since we removed the permission system
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archived_users' AND column_name = 'role') THEN
        ALTER TABLE archived_users DROP COLUMN role;
    END IF;
END $$;