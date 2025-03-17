/*
  # Add audit_sent field

  1. Changes
    - Add audit_sent boolean field to audits table
    - Set default value to false
    - Update existing records to have this field set to false
*/

-- Add audit_sent field to audits table
ALTER TABLE audits 
  ADD COLUMN audit_sent BOOLEAN DEFAULT false;

-- Update existing records to have this field set to false
UPDATE audits 
SET audit_sent = false
WHERE audit_sent IS NULL;
