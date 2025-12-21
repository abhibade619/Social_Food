-- Function to check if an email exists in auth.users
-- This function is SECURITY DEFINER to allow checking the auth schema
create or replace function check_email_exists(email_input text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from auth.users
    where email = email_input
  );
end;
$$;
