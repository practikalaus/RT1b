-- Create a sequence for damage record reference numbers
CREATE SEQUENCE IF NOT EXISTS damage_record_seq START 1;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS damage_reference_trigger ON damage_records;

-- Create or replace the function to generate sequential reference numbers
CREATE OR REPLACE FUNCTION generate_damage_reference()
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  -- Get next number from sequence
  SELECT nextval('damage_record_seq') INTO next_num;
  
  -- Format new reference number with leading zeros (6 digits)
  RETURN 'DR' || LPAD(next_num::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION set_damage_reference()
RETURNS trigger AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_damage_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER damage_reference_trigger
  BEFORE INSERT ON damage_records
  FOR EACH ROW
  EXECUTE FUNCTION set_damage_reference();

-- Reset sequence to max existing reference number + 1
DO $$
DECLARE
  max_ref integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE(reference_number, '[^0-9]', '', 'g'), '')::integer), 0)
  INTO max_ref
  FROM damage_records;
  
  PERFORM setval('damage_record_seq', max_ref);
END $$;

-- Update existing records that don't have a reference number
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT id 
    FROM damage_records 
    WHERE reference_number IS NULL OR reference_number = ''
    ORDER BY created_at ASC
  LOOP
    UPDATE damage_records
    SET reference_number = generate_damage_reference()
    WHERE id = r.id;
  END LOOP;
END $$;

-- Add unique constraint to reference_number
ALTER TABLE damage_records
  ADD CONSTRAINT damage_records_reference_number_unique UNIQUE (reference_number);

-- Add not null constraint to reference_number
ALTER TABLE damage_records
  ALTER COLUMN reference_number SET NOT NULL;
