-- Update existing location values to use new format
UPDATE profiles 
SET location = CASE 
  WHEN location = 'all_locations' THEN 'all_locations'
  WHEN location ILIKE '%menton%' THEN 'menton'
  WHEN location ILIKE '%lyon%' THEN 'lyon'
  ELSE 'menton' -- default fallback
END;

-- Add location column to tables that need location-based data segregation
-- This will create location-aware data storage for all content

-- Add location to checklists if not exists
ALTER TABLE IF EXISTS checklists 
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Add location to inventory items if not exists  
ALTER TABLE IF EXISTS inventory
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Add location to kitchen inventory if not exists
ALTER TABLE IF EXISTS kitchen_inventory  
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Add location to equipment if not exists
ALTER TABLE IF EXISTS equipment
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Add location to cash register transactions if not exists
ALTER TABLE IF EXISTS cash_transactions
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Add location to financial reports if not exists  
ALTER TABLE IF EXISTS financial_reports
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Add location to communications/messages if not exists
ALTER TABLE IF EXISTS messages
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Add location to reports if not exists
ALTER TABLE IF EXISTS reports
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'menton';

-- Create indexes for location-based queries for better performance
CREATE INDEX IF NOT EXISTS idx_checklists_location ON checklists(location);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location);  
CREATE INDEX IF NOT EXISTS idx_kitchen_inventory_location ON kitchen_inventory(location);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_location ON cash_transactions(location);
CREATE INDEX IF NOT EXISTS idx_financial_reports_location ON financial_reports(location);
CREATE INDEX IF NOT EXISTS idx_messages_location ON messages(location);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location);

-- Add constraint to ensure valid location values
ALTER TABLE profiles 
ADD CONSTRAINT check_valid_location 
CHECK (location IN ('menton', 'lyon', 'all_locations'));

-- Update user_invitations location constraint if needed
ALTER TABLE user_invitations 
DROP CONSTRAINT IF EXISTS check_valid_invitation_location;

ALTER TABLE user_invitations
ADD CONSTRAINT check_valid_invitation_location 
CHECK (location IN ('menton', 'lyon', 'all_locations'));