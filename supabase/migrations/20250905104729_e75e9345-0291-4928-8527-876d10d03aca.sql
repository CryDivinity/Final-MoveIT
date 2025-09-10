-- Update existing penalties to set proper end_date for 6-month expiry
UPDATE public.penalties 
SET end_date = (start_date::date + INTERVAL '6 months')::timestamptz
WHERE end_date IS NULL AND start_date IS NOT NULL;

-- Create function to auto-expire penalties after 6 months
CREATE OR REPLACE FUNCTION public.auto_expire_penalties()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Deactivate penalties older than 6 months
  UPDATE public.penalties 
  SET is_active = false
  WHERE is_active = true 
    AND end_date IS NOT NULL 
    AND end_date < NOW();
    
  -- Log how many penalties were expired
  RAISE NOTICE 'Auto-expired penalties older than 6 months';
END;
$$;

-- Create a trigger to automatically set end_date when inserting new penalties
CREATE OR REPLACE FUNCTION public.set_penalty_expiry_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If end_date is not set, auto-set it to 6 months from start_date
  IF NEW.end_date IS NULL AND NEW.start_date IS NOT NULL THEN
    NEW.end_date = (NEW.start_date::date + INTERVAL '6 months')::timestamptz;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new penalty insertions
CREATE TRIGGER set_penalty_expiry_before_insert
  BEFORE INSERT ON public.penalties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_penalty_expiry_date();

-- Create trigger for penalty updates
CREATE TRIGGER set_penalty_expiry_before_update
  BEFORE UPDATE ON public.penalties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_penalty_expiry_date();