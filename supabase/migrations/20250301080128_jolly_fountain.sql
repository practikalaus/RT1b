-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS damage_reference_trigger ON damage_records;

-- Create or replace the function to generate sequential reference numbers
CREATE OR REPLACE FUNCTION generate_damage_reference()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_ref text;
  attempts integer := 0;
  max_attempts constant integer := 10;
BEGIN
  LOOP
    -- Get next number from sequence
    SELECT nextval('damage_record_seq') INTO next_num;
    
    -- Format reference number
    new_ref := 'DR' || LPAD(next_num::text, 6, '0');
    
    -- Check if this reference number is already used
    IF NOT EXISTS (
      SELECT 1 
      FROM damage_records 
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
CREATE OR REPLACE FUNCTION set_damage_reference()
RETURNS trigger AS $$
BEGIN
  -- For new records or empty reference numbers
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_damage_reference();
    RETURN NEW;
  END IF;

  -- For existing records being updated, ensure uniqueness
  IF EXISTS (
    SELECT 1 
    FROM damage_records 
    WHERE reference_number = NEW.reference_number 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate damage reference number: %', NEW.reference_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER damage_reference_trigger
  BEFORE INSERT OR UPDATE ON damage_records
  FOR EACH ROW
  EXECUTE FUNCTION set_damage_reference();

-- Add NOT NULL constraint if not already present
ALTER TABLE damage_records 
  ALTER COLUMN reference_number SET NOT NULL;

-- Ensure unique constraint exists
ALTER TABLE damage_records 
  DROP CONSTRAINT IF EXISTS damage_records_reference_number_unique;

ALTER TABLE damage_records
  ADD CONSTRAINT damage_records_reference_number_unique 
  UNIQUE (reference_number);

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_damage_records_reference_number 
  ON damage_records (reference_number);
