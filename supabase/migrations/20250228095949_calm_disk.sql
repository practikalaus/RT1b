-- First, identify and fix any duplicate reference numbers
DO $$
DECLARE
  r RECORD;
  new_ref text;
BEGIN
  -- Find all duplicate reference numbers
  FOR r IN 
    SELECT DISTINCT d1.reference_number, array_agg(d1.id) as ids
    FROM damage_records d1
    JOIN damage_records d2 ON d1.reference_number = d2.reference_number
    WHERE d1.id != d2.id
    GROUP BY d1.reference_number
  LOOP
    -- For each duplicate set, update all but the first record with new reference numbers
    FOR i IN 2..array_length(r.ids, 1) LOOP
      -- Generate a new unique reference number
      SELECT 'DR' || LPAD(nextval('damage_record_seq')::text, 6, '0') INTO new_ref;
      
      -- Update the record
      UPDATE damage_records
      SET reference_number = new_ref
      WHERE id = r.ids[i];
    END LOOP;
  END LOOP;
END $$;

-- Drop and recreate the sequence to ensure we start after the highest number
DROP SEQUENCE IF EXISTS damage_record_seq;

CREATE SEQUENCE damage_record_seq;

-- Set the sequence to start after the highest existing reference number
SELECT setval(
  'damage_record_seq',
  (
    SELECT COALESCE(
      MAX(NULLIF(REGEXP_REPLACE(reference_number, '[^0-9]', '', 'g'), '')::integer),
      0
    )
    FROM damage_records
  )
);

-- Drop existing trigger
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
    
    -- Format new reference number
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
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_damage_reference();
  ELSIF EXISTS (
    SELECT 1 
    FROM damage_records 
    WHERE reference_number = NEW.reference_number 
    AND id != COALESCE(NEW.id, -1)
  ) THEN
    RAISE EXCEPTION 'Duplicate reference number: %', NEW.reference_number;
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

-- Drop and recreate the unique constraint
ALTER TABLE damage_records 
  DROP CONSTRAINT IF EXISTS damage_records_reference_number_unique;

ALTER TABLE damage_records
  ADD CONSTRAINT damage_records_reference_number_unique 
  UNIQUE (reference_number);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_damage_records_reference_number 
  ON damage_records (reference_number);
