-- Create sequence for audit reference numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS audit_reference_seq START 1;

-- Set the sequence to start after the highest existing reference number
SELECT setval(
  'audit_reference_seq',
  (
    SELECT COALESCE(
      MAX(NULLIF(REGEXP_REPLACE(reference_number, '[^0-9]', '', 'g'), '')::integer),
      0
    )
    FROM audits
  )
);

-- Create or replace the function to generate sequential audit reference numbers
CREATE OR REPLACE FUNCTION generate_audit_reference()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_ref text;
  attempts integer := 0;
  max_attempts constant integer := 10;
BEGIN
  LOOP
    -- Get next number from sequence
    SELECT nextval('audit_reference_seq') INTO next_num;
    
    -- Format reference number with current date (YYMMDD) and sequence number
    new_ref := 'RA' || 
               to_char(CURRENT_DATE, 'YYMMDD') || 
               LPAD(next_num::text, 3, '0');
    
    -- Check if this reference number is already used
    IF NOT EXISTS (
      SELECT 1 
      FROM audits 
      WHERE reference_number = new_ref
    ) THEN
      RETURN new_ref;
    END IF;
    
    -- Increment attempts counter
    attempts := attempts + 1;
    
    -- If we've tried too many times, raise an error
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique reference number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION set_audit_reference()
RETURNS trigger AS $$
DECLARE
  ref_exists boolean;
BEGIN
  -- For new records or empty reference numbers
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_audit_reference();
    RETURN NEW;
  END IF;

  -- For existing records being updated
  SELECT EXISTS (
    SELECT 1 
    FROM audits 
    WHERE reference_number = NEW.reference_number 
    AND id != NEW.id
  ) INTO ref_exists;

  IF ref_exists THEN
    RAISE EXCEPTION 'Duplicate audit reference number: %', NEW.reference_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_reference_trigger ON audits;

-- Create the trigger
CREATE TRIGGER audit_reference_trigger
  BEFORE INSERT OR UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_reference();

-- Update any audits without reference numbers
UPDATE audits
SET reference_number = generate_audit_reference()
WHERE reference_number IS NULL OR reference_number = '';

-- Add NOT NULL constraint if not already present
ALTER TABLE audits 
  ALTER COLUMN reference_number SET NOT NULL;

-- Ensure unique constraint exists
ALTER TABLE audits 
  DROP CONSTRAINT IF EXISTS audits_reference_number_key;

ALTER TABLE audits
  ADD CONSTRAINT audits_reference_number_unique 
  UNIQUE (reference_number);

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_audits_reference_number 
  ON audits (reference_number);
