-- Create notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null, -- 'tag', 'follow', 'like'
  reference_id uuid, -- ID of the log or user involved
  message text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add place_id to wishlist if it doesn't exist
alter table public.wishlist 
add column if not exists place_id text;

-- Enable RLS for notifications
alter table public.notifications enable row level security;

-- Policies for notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Anyone can insert notifications"
  on public.notifications for insert
  with check (true);
