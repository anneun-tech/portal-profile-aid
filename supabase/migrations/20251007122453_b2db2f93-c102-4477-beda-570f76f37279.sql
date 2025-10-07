-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(text);
DROP FUNCTION IF EXISTS public.decrypt_sensitive_data(bytea);

-- Create helper functions for encryption/decryption using the APP_ENCRYPTION_KEY secret
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(plaintext text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  
  -- Get encryption key from Supabase vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'APP_ENCRYPTION_KEY'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  
  RETURN pgp_sym_encrypt(plaintext, encryption_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get encryption key from Supabase vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'APP_ENCRYPTION_KEY'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  
  RETURN pgp_sym_decrypt(encrypted, encryption_key);
END;
$$;

-- Add comments explaining the encryption
COMMENT ON FUNCTION public.encrypt_sensitive_data IS 'Encrypts sensitive data using APP_ENCRYPTION_KEY from vault';
COMMENT ON FUNCTION public.decrypt_sensitive_data IS 'Decrypts sensitive data using APP_ENCRYPTION_KEY from vault';