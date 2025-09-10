-- Clean up incomplete user data for victor07m@gmail.com
-- This user exists in auth.users but has no profile or role data

-- First, let's check if there are any related records to clean up
DELETE FROM public.cars WHERE user_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';
DELETE FROM public.penalties WHERE user_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';
DELETE FROM public.services WHERE user_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';
DELETE FROM public.reports WHERE reporter_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5' OR reported_user_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';
DELETE FROM public.emergency_calls WHERE user_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';
DELETE FROM public.feedback WHERE user_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';
DELETE FROM public.chat_messages WHERE sender_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5' OR receiver_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';
DELETE FROM public.friendships WHERE requester_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5' OR addressee_id = 'e42e6b0a-7d80-4f98-a4a9-798a71bec9e5';

-- Create a function to properly clean up users with all related data
CREATE OR REPLACE FUNCTION public.cleanup_incomplete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all related data first
  DELETE FROM public.cars WHERE user_id = target_user_id;
  DELETE FROM public.penalties WHERE user_id = target_user_id;
  DELETE FROM public.services WHERE user_id = target_user_id;
  DELETE FROM public.reports WHERE reporter_id = target_user_id OR reported_user_id = target_user_id;
  DELETE FROM public.emergency_calls WHERE user_id = target_user_id;
  DELETE FROM public.feedback WHERE user_id = target_user_id;
  DELETE FROM public.chat_messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.friendships WHERE requester_id = target_user_id OR addressee_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Note: We cannot delete from auth.users here as it's in a different schema
  -- This needs to be done through Supabase Admin API or dashboard
END;
$$;