-- Create a new migration file to fix the damage record reference numbers

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS damage_reference_trigger ON damage_records;

-- Create or replace the function to generate sequential reference numbers
CREATE OR REPLACE FUNCTION generate_damage_reference()
RETURNS text AS $$
DECLARE
  last_ref text;
  next_num integer;
BEGIN
  -- Get the last reference number
  SELECT reference_number 
  INTO last_ref 
  FROM damage_records 
  WHERE reference_number IS NOT NULL AND reference_number != ''
  ORDER BY reference_number DESC 
  LIMIT 1;

  -- Extract number and increment, or start at 1
  IF last_ref IS NULL THEN
    next_num := 1;
  ELSE
    -- Extract only the numeric part after 'DR'
    next_num := (REGEXP_REPLACE(last_ref, '[^0-9]', '', 'g')::integer) + 1;
  END IF;

  -- Format new reference number with leading zeros
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

-- Update existing records that don't have a reference number
UPDATE damage_records
SET reference_number = generate_damage_reference()
WHERE reference_number IS NULL OR reference_number = '';
