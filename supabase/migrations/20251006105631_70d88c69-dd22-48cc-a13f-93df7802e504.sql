-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.ncc_wing_type AS ENUM ('air', 'army', 'navy');
CREATE TYPE public.experience_type AS ENUM ('placement', 'internship');

-- Create students table
CREATE TABLE public.students (
  student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  branch TEXT,
  year INTEGER,
  address TEXT,
  phone_number TEXT,
  parents_phone_number TEXT,
  aadhaar_number TEXT,
  pan_number TEXT,
  account_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students can view and edit their own data
CREATE POLICY "Users can view own student record"
  ON public.students FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own student record"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own student record"
  ON public.students FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create NCC details table
CREATE TABLE public.ncc_details (
  ncc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  ncc_wing public.ncc_wing_type NOT NULL,
  regimental_number TEXT,
  enrollment_date DATE,
  cadet_rank TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ncc_details ENABLE ROW LEVEL SECURITY;

-- Users can view their own NCC details
CREATE POLICY "Users can view own NCC details"
  ON public.ncc_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_id = ncc_details.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own NCC details"
  ON public.ncc_details FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_id = ncc_details.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own NCC details"
  ON public.ncc_details FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_id = ncc_details.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Admins can view all NCC details
CREATE POLICY "Admins can view all NCC details"
  ON public.ncc_details FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create placements/internships table
CREATE TABLE public.placements_internships (
  experience_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  experience public.experience_type NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.placements_internships ENABLE ROW LEVEL SECURITY;

-- Users can view their own experience records
CREATE POLICY "Users can view own experiences"
  ON public.placements_internships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_id = placements_internships.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own experiences"
  ON public.placements_internships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_id = placements_internships.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own experiences"
  ON public.placements_internships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_id = placements_internships.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own experiences"
  ON public.placements_internships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_id = placements_internships.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Admins can view all experiences
CREATE POLICY "Admins can view all experiences"
  ON public.placements_internships FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all students
CREATE POLICY "Admins can view all students"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));