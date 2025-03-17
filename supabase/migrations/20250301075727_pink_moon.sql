-- Add building_area column to damage_records table
ALTER TABLE damage_records
  ADD COLUMN building_area text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_damage_records_building_area 
  ON damage_records (building_area);
