-- Fix Tagging and Notifications

-- 1. Create tagged_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tagged_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES public.logs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(log_id, user_id)
);

-- 2. Create notifications table if it doesn't exist (just in case)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null, -- 'tag', 'follow', 'like'
  reference_id uuid, -- ID of the log or user involved
  message text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
ALTER TABLE public.tagged_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts (clean slate for these tables)
DROP POLICY IF EXISTS "Anyone can view tagged users" ON public.tagged_users;
DROP POLICY IF EXISTS "Log owners can tag users" ON public.tagged_users;
DROP POLICY IF EXISTS "Log owners can remove tags" ON public.tagged_users;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

-- 5. Re-create Policies for Tagged Users
CREATE POLICY "Anyone can view tagged users"
ON public.tagged_users FOR SELECT
USING (true);

CREATE POLICY "Log owners can tag users"
ON public.tagged_users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.logs
        WHERE logs.id = log_id AND logs.user_id = auth.uid()
    )
);

CREATE POLICY "Log owners can remove tags"
ON public.tagged_users FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.logs
        WHERE logs.id = log_id AND logs.user_id = auth.uid()
    )
);

-- 6. Re-create Policies for Notifications
CREATE POLICY "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

CREATE POLICY "Anyone can insert notifications"
  on public.notifications for insert
  with check (true);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tagged_users_log ON public.tagged_users(log_id);
CREATE INDEX IF NOT EXISTS idx_tagged_users_user ON public.tagged_users(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
