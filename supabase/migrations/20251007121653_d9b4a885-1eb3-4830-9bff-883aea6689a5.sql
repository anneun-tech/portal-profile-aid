-- Add DELETE policy for students table to allow admins to manage data retention
CREATE POLICY "Admins can delete student records"
ON public.students
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));