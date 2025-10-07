-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns for sensitive data
ALTER TABLE public.students 
ADD COLUMN aadhaar_encrypted bytea,
ADD COLUMN pan_encrypted bytea,
ADD COLUMN account_number_encrypted bytea;

-- Migrate existing plaintext data to encrypted columns
UPDATE public.students
SET 
  aadhaar_encrypted = CASE 
    WHEN aadhaar_number IS NOT NULL AND aadhaar_number != '' 
    THEN pgp_sym_encrypt(aadhaar_number, current_setting('app.encryption_key', true))
    ELSE NULL 
  END,
  pan_encrypted = CASE 
    WHEN pan_number IS NOT NULL AND pan_number != '' 
    THEN pgp_sym_encrypt(pan_number, current_setting('app.encryption_key', true))
    ELSE NULL 
  END,
  account_number_encrypted = CASE 
    WHEN account_number IS NOT NULL AND account_number != '' 
    THEN pgp_sym_encrypt(account_number, current_setting('app.encryption_key', true))
    ELSE NULL 
  END
WHERE aadhaar_number IS NOT NULL OR pan_number IS NOT NULL OR account_number IS NOT NULL;

-- Drop the plaintext columns (commented out for safety - uncomment after verifying encryption works)
-- ALTER TABLE public.students 
-- DROP COLUMN aadhaar_number,
-- DROP COLUMN pan_number,
-- DROP COLUMN account_number;

-- Create helper functions for encryption/decryption
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(plaintext text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_encrypt(plaintext, current_setting('app.encryption_key', true));
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(encrypted, current_setting('app.encryption_key', true));
END;
$$;

-- Add comment explaining the encryption
COMMENT ON COLUMN public.students.aadhaar_encrypted IS 'Encrypted Aadhaar number using pgcrypto';
COMMENT ON COLUMN public.students.pan_encrypted IS 'Encrypted PAN number using pgcrypto';
COMMENT ON COLUMN public.students.account_number_encrypted IS 'Encrypted account number using pgcrypto';