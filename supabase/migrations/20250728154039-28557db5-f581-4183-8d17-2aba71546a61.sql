-- Check and fix real-time functionality for chat_messages
SELECT publication_name, tables FROM pg_publication p JOIN pg_publication_tables pt ON p.oid = pt.prpubid WHERE p.pubname = 'supabase_realtime';

-- Enable real-time updates for chat_messages table if not already enabled
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add chat_messages to realtime publication if not already added
DO $$
BEGIN
    -- Check if table is already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END $$;