-- Fix the audit reference trigger function to handle UUID comparison correctly
CREATE OR REPLACE FUNCTION set_audit_reference()
RETURNS trigger AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_audit_reference();
  ELSIF EXISTS (
    SELECT 1 
    FROM audits 
    WHERE reference_number = NEW.reference_number 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate audit reference number: %', NEW.reference_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS audit_reference_trigger ON audits;

CREATE TRIGGER audit_reference_trigger
  BEFORE INSERT OR UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_reference();

-- Add audit_sent column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'audit_sent'
  ) THEN
    ALTER TABLE audits ADD COLUMN audit_sent BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add quote_sent column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'quote_sent'
  ) THEN
    ALTER TABLE audits ADD COLUMN quote_sent BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add is_invoiced column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'is_invoiced'
  ) THEN
    ALTER TABLE audits ADD COLUMN is_invoiced BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add is_archived column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE audits ADD COLUMN is_archived BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update any null values in status columns to false
UPDATE audits 
SET 
  audit_sent = COALESCE(audit_sent, false),
  quote_sent = COALESCE(quote_sent, false),
  is_invoiced = COALESCE(is_invoiced, false),
  is_archived = COALESCE(is_archived, false)
WHERE 
  audit_sent IS NULL OR
  quote_sent IS NULL OR
  is_invoiced IS NULL OR
  is_archived IS NULL;
