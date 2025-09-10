-- Fix remaining function search path issues

-- Update find_user_by_plate_number function with proper search path
CREATE OR REPLACE FUNCTION public.find_user_by_plate_number(plate_number text)
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_id FROM public.cars WHERE cars.plate_number = find_user_by_plate_number.plate_number LIMIT 1;
$$;

-- Update update_updated_at_column function with proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update validate_friendship function with proper search path
CREATE OR REPLACE FUNCTION public.validate_friendship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;