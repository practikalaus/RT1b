-- Add new columns to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS audit_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS has_drawing BOOLEAN DEFAULT false;

-- Update existing records to have has_drawing set to false
UPDATE customers 
SET has_drawing = false
WHERE has_drawing IS NULL;
