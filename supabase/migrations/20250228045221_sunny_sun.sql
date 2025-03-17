/*
  # Add audit status fields

  1. Changes
    - Add is_invoiced, quote_sent, and is_archived boolean fields to audits table
    - Set default values to false
    - Update existing records to have these fields set to false
*/

-- Add status fields to audits table
ALTER TABLE audits 
  ADD COLUMN is_invoiced BOOLEAN DEFAULT false,
  ADD COLUMN quote_sent BOOLEAN DEFAULT false,
  ADD COLUMN is_archived BOOLEAN DEFAULT false;

-- Update existing records to have these fields set to false
UPDATE audits 
SET 
  is_invoiced = false,
  quote_sent = false,
  is_archived = false
WHERE 
  is_invoiced IS NULL OR
  quote_sent IS NULL OR
  is_archived IS NULL;
