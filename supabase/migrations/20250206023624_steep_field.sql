-- Add brand field to damage_records table
ALTER TABLE damage_records ADD COLUMN brand text;

-- Create brands table
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create brand_prices table
CREATE TABLE brand_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  damage_type text NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, damage_type)
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for brands
CREATE POLICY "Enable read access for all users" ON brands
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable write access for authenticated users" ON brands
  FOR ALL TO authenticated USING (true);

-- Create policies for brand_prices
CREATE POLICY "Enable read access for all users" ON brand_prices
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable write access for authenticated users" ON brand_prices
  FOR ALL TO authenticated USING (true);
