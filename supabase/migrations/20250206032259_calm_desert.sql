-- Update brand_prices table to include separate product and installation costs
ALTER TABLE brand_prices 
  DROP COLUMN price,
  ADD COLUMN product_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN installation_cost numeric NOT NULL DEFAULT 0;

-- Update the unique constraint
ALTER TABLE brand_prices 
  DROP CONSTRAINT brand_prices_brand_id_damage_type_key,
  ADD CONSTRAINT brand_prices_brand_id_damage_type_key UNIQUE (brand_id, damage_type);
