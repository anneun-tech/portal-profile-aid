-- Create RPC functions to handle student data with encryption

-- Function to insert student record with encryption
CREATE OR REPLACE FUNCTION public.insert_student_encrypted(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_branch text,
  p_year integer,
  p_address text,
  p_phone_number text,
  p_parents_phone_number text,
  p_aadhaar_number text,
  p_pan_number text,
  p_account_number text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  INSERT INTO public.students (
    user_id, name, email, branch, year, address,
    phone_number, parents_phone_number,
    aadhaar_encrypted, pan_encrypted, account_number_encrypted
  ) VALUES (
    p_user_id, p_name, p_email, p_branch, p_year, p_address,
    p_phone_number, p_parents_phone_number,
    encrypt_sensitive_data(p_aadhaar_number),
    encrypt_sensitive_data(p_pan_number),
    encrypt_sensitive_data(p_account_number)
  )
  RETURNING student_id INTO v_student_id;
  
  RETURN v_student_id;
END;
$$;

-- Function to update student record with encryption
CREATE OR REPLACE FUNCTION public.update_student_encrypted(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_branch text,
  p_year integer,
  p_address text,
  p_phone_number text,
  p_parents_phone_number text,
  p_aadhaar_number text,
  p_pan_number text,
  p_account_number text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.students
  SET
    name = p_name,
    email = p_email,
    branch = p_branch,
    year = p_year,
    address = p_address,
    phone_number = p_phone_number,
    parents_phone_number = p_parents_phone_number,
    aadhaar_encrypted = encrypt_sensitive_data(p_aadhaar_number),
    pan_encrypted = encrypt_sensitive_data(p_pan_number),
    account_number_encrypted = encrypt_sensitive_data(p_account_number)
  WHERE user_id = p_user_id;
END;
$$;

-- Function to get student data with decryption
CREATE OR REPLACE FUNCTION public.get_student_decrypted(p_user_id uuid)
RETURNS TABLE (
  student_id uuid,
  user_id uuid,
  name text,
  email text,
  branch text,
  year integer,
  address text,
  phone_number text,
  parents_phone_number text,
  aadhaar_number text,
  pan_number text,
  account_number text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.student_id,
    s.user_id,
    s.name,
    s.email,
    s.branch,
    s.year,
    s.address,
    s.phone_number,
    s.parents_phone_number,
    decrypt_sensitive_data(s.aadhaar_encrypted) as aadhaar_number,
    decrypt_sensitive_data(s.pan_encrypted) as pan_number,
    decrypt_sensitive_data(s.account_number_encrypted) as account_number,
    s.created_at
  FROM public.students s
  WHERE s.user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.insert_student_encrypted IS 'Inserts student record with automatic encryption of sensitive fields';
COMMENT ON FUNCTION public.update_student_encrypted IS 'Updates student record with automatic encryption of sensitive fields';
COMMENT ON FUNCTION public.get_student_decrypted IS 'Retrieves student record with automatic decryption of sensitive fields';