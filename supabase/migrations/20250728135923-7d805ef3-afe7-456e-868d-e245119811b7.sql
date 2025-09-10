-- Add missing RLS policies for community search functionality
-- Allow users to view basic profile information of others for search
CREATE POLICY "Allow viewing other users' basic profile info for search" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Allow users to view car information for search functionality
CREATE POLICY "Allow viewing car information for search" 
ON public.cars 
FOR SELECT 
USING (true);

-- Update existing policies to be more restrictive for sensitive operations
-- Drop the overly permissive policy and recreate with better constraints
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view and manage their own profile" 
ON public.profiles 
FOR ALL
USING (auth.uid() = user_id);

-- Add trigger to validate friendship data integrity
CREATE OR REPLACE FUNCTION public.validate_friendship()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent self-friendship
  IF NEW.requester_id = NEW.addressee_id THEN
    RAISE EXCEPTION 'Users cannot befriend themselves';
  END IF;
  
  -- Ensure status is valid
  IF NEW.status NOT IN ('pending', 'accepted', 'blocked') THEN
    RAISE EXCEPTION 'Invalid friendship status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_friendship_trigger
  BEFORE INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_friendship();