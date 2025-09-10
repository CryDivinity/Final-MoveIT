-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.cleanup_incomplete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
END;
$$;

-- Also fix the existing set_admin_session function
CREATE OR REPLACE FUNCTION public.set_admin_session(session_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT set_config('app.admin_session', session_token, false);
$$;