-- Create enum types
CREATE TYPE ncc_wing_type AS ENUM ('air', 'army', 'navy');
CREATE TYPE experience_type AS ENUM ('placement', 'internship');

-- Create Students table
CREATE TABLE Students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    branch VARCHAR(100),
    year INT,
    address TEXT,
    phone_number VARCHAR(15),
    parents_phone_number VARCHAR(15),
    aadhaar_number VARCHAR(12) UNIQUE,
    pan_number VARCHAR(10) UNIQUE,
    account_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NCC_Details table
CREATE TABLE NCC_Details (
    ncc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES Students(student_id) ON DELETE CASCADE NOT NULL,
    ncc_wing ncc_wing_type NOT NULL,
    regimental_number VARCHAR(50) UNIQUE,
    enrollment_date DATE,
    cadet_rank VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Placements_Internships table
CREATE TABLE Placements_Internships (
    experience_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES Students(student_id) ON DELETE CASCADE NOT NULL,
    experience experience_type NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user roles table for admin access
CREATE TYPE app_role AS ENUM ('admin', 'student');

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable Row Level Security
ALTER TABLE Students ENABLE ROW LEVEL SECURITY;
ALTER TABLE NCC_Details ENABLE ROW LEVEL SECURITY;
ALTER TABLE Placements_Internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Students table
CREATE POLICY "Students can view their own data"
ON Students FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert their own data"
ON Students FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update their own data"
ON Students FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete student data"
ON Students FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for NCC_Details table
CREATE POLICY "Users can view their own NCC details"
ON NCC_Details FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT student_id FROM Students WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert their own NCC details"
ON NCC_Details FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (SELECT student_id FROM Students WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own NCC details"
ON NCC_Details FOR UPDATE
TO authenticated
USING (
  student_id IN (SELECT student_id FROM Students WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete NCC details"
ON NCC_Details FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for Placements_Internships table
CREATE POLICY "Users can view their own placements"
ON Placements_Internships FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT student_id FROM Students WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert their own placements"
ON Placements_Internships FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (SELECT student_id FROM Students WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own placements"
ON Placements_Internships FOR UPDATE
TO authenticated
USING (
  student_id IN (SELECT student_id FROM Students WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete placements"
ON Placements_Internships FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to auto-assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();