-- Add email and phone fields to auditors table
ALTER TABLE auditors 
  ADD COLUMN email TEXT,
  ADD COLUMN phone TEXT;
