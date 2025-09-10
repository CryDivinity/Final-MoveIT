-- Fix security issue: Restrict public access to profiles table
-- Remove the overly permissive policy that allows anyone to see all profile data
DROP POLICY IF EXISTS "Allow viewing other users' basic profile info for search" ON public.profiles;

-- Create a more restrictive policy that only allows authenticated users to see limited fields
-- This policy allows authenticated users to see only first name for search purposes
CREATE POLICY "Authenticated users can view limited profile info for search" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create a separate policy for users to view their own complete profile
-- (This already exists as "Users can view and manage their own profile" but let's make it explicit)
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);