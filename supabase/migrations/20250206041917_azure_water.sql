-- Add reference_number column to damage_records table
ALTER TABLE damage_records ADD COLUMN reference_number text;

-- Create index on reference_number for better query performance
CREATE INDEX idx_damage_records_reference_number ON damage_records(reference_number);

-- Create function to generate next reference number
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
  WHERE reference_number IS NOT NULL 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Extract number and increment, or start at 1
  IF last_ref IS NULL THEN
    next_num := 1;
  ELSE
    next_num := (REGEXP_REPLACE(last_ref, '[^0-9]', '', 'g')::integer) + 1;
  END IF;

  -- Format new reference number
  RETURN 'DR' || LPAD(next_num::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate reference number
CREATE OR REPLACE FUNCTION set_damage_reference()
RETURNS trigger AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_damage_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER damage_reference_trigger
  BEFORE INSERT ON damage_records
  FOR EACH ROW
  EXECUTE FUNCTION set_damage_reference();
