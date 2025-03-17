-- Drop existing constraints and triggers first
DROP TRIGGER IF EXISTS audit_reference_trigger ON audits;
DROP SEQUENCE IF EXISTS audit_reference_seq;
DROP INDEX IF EXISTS idx_audits_reference_number;
ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_reference_number_key;
ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_reference_number_unique;

-- Create a new sequence with a larger increment to reduce collisions
CREATE SEQUENCE audit_reference_seq
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

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
  current_date_str text;
  base_num integer;
  max_daily_audits constant integer := 999;
BEGIN
  -- Get current date string in YYMMDD format
  current_date_str := to_char(CURRENT_DATE, 'YYMMDD');
  
  -- Lock the sequence to prevent concurrent access
  LOCK TABLE audit_reference_seq IN EXCLUSIVE MODE;
  
  -- Get the current daily count
  SELECT COALESCE(
    MAX(
      NULLIF(
        REGEXP_REPLACE(
          SUBSTRING(reference_number FROM 9), 
          '[^0-9]', 
          '', 
          'g'
        ),
        ''
      )::integer
    ),
    0
  )
  INTO base_num
  FROM audits
  WHERE reference_number LIKE 'RA' || current_date_str || '%';
  
  -- If we've reached the maximum daily audits, raise an error
  IF base_num >= max_daily_audits THEN
    RAISE EXCEPTION 'Maximum number of audits reached for today (%))', max_daily_audits;
  END IF;
  
  -- Generate the next number
  next_num := base_num + 1;
  
  -- Format reference number
  new_ref := 'RA' || current_date_str || LPAD(next_num::text, 3, '0');
  
  -- Verify uniqueness
  WHILE EXISTS (
    SELECT 1 
    FROM audits 
    WHERE reference_number = new_ref
  ) LOOP
    next_num := next_num + 1;
    IF next_num > max_daily_audits THEN
      RAISE EXCEPTION 'Maximum number of audits reached for today (%))', max_daily_audits;
    END IF;
    new_ref := 'RA' || current_date_str || LPAD(next_num::text, 3, '0');
  END LOOP;
  
  RETURN new_ref;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION set_audit_reference()
RETURNS trigger AS $$
BEGIN
  -- For new records or empty reference numbers
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_audit_reference();
    RETURN NEW;
  END IF;

  -- For existing records being updated, ensure uniqueness
  IF EXISTS (
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

-- Create the trigger
CREATE TRIGGER audit_reference_trigger
  BEFORE INSERT OR UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_reference();

-- Add NOT NULL constraint
ALTER TABLE audits 
  ALTER COLUMN reference_number SET NOT NULL;

-- Add unique constraint with a new name
ALTER TABLE audits
  ADD CONSTRAINT audit_reference_number_unique 
  UNIQUE (reference_number);

-- Create index for better performance
CREATE INDEX idx_audits_reference_number 
  ON audits (reference_number);

-- Update any existing records without reference numbers
UPDATE audits
SET reference_number = generate_audit_reference()
WHERE reference_number IS NULL OR reference_number = '';
