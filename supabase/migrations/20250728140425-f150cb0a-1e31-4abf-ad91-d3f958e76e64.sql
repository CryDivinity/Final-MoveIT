-- Fix the function search path security issue
DROP FUNCTION IF EXISTS public.validate_friendship();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Also fix the existing functions to have proper search paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_user_by_plate_number(plate_number text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT user_id FROM public.cars WHERE cars.plate_number = find_user_by_plate_number.plate_number LIMIT 1;
$function$;