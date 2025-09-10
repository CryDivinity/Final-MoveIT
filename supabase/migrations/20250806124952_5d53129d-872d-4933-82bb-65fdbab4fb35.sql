-- Add QR code data storage to profiles table
ALTER TABLE public.profiles 
ADD COLUMN qr_code_data TEXT;