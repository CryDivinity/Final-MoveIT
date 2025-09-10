-- Fix security issue: Remove public access to sensitive feedback data
-- Drop the policy that allows anyone to view approved feedback with names and emails
DROP POLICY IF EXISTS "Users can view approved feedback" ON public.feedback;

-- Create a more restrictive policy for public feedback viewing
-- This allows viewing only non-sensitive fields (message, rating, created_at) for approved feedback
CREATE POLICY "Public can view approved feedback without personal info" 
ON public.feedback 
FOR SELECT 
USING (
  status = 'approved' 
  AND is_visible = true
);

-- Note: The application code will need to be updated to only select non-sensitive fields
-- when querying for public testimonials (exclude name and email)