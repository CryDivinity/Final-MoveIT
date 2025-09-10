-- Add points field to penalties table for penalty management
ALTER TABLE public.penalties 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Add start_date and end_date columns for penalty duration tracking
ALTER TABLE public.penalties 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Update existing penalties to use penalty_date as start_date if not set
UPDATE public.penalties 
SET start_date = penalty_date 
WHERE start_date IS NULL;

-- Create index for better performance on penalty queries
CREATE INDEX IF NOT EXISTS idx_penalties_user_id_active ON public.penalties(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_penalties_start_date ON public.penalties(start_date);
CREATE INDEX IF NOT EXISTS idx_penalties_end_date ON public.penalties(end_date);