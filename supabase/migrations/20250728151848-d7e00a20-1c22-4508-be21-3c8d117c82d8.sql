-- Fix missing foreign key relationships

-- Add foreign key constraint between cars and profiles
ALTER TABLE public.cars 
ADD CONSTRAINT cars_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key constraint between user_roles and profiles  
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;