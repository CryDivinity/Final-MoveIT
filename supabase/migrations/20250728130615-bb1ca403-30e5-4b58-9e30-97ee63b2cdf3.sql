-- Create penalties table for penalty management
CREATE TABLE public.penalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  penalty_type TEXT NOT NULL,
  description TEXT,
  fine_amount NUMERIC,
  penalty_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'overdue')),
  payment_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  violation_location TEXT,
  plate_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

-- Create policies for penalty access
CREATE POLICY "Users can view their own penalties" 
ON public.penalties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own penalties" 
ON public.penalties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own penalties" 
ON public.penalties 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own penalties" 
ON public.penalties 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_penalties_updated_at
BEFORE UPDATE ON public.penalties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();