-- Function to get email by username
-- Run this in your Supabase SQL Editor

create or replace function get_email_by_username(username_input text)
returns text
language plpgsql
security definer -- Allows accessing auth.users
as $$
declare
  user_email text;
begin
  select u.email into user_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.username = username_input;
  
  return user_email;
end;
$$;
