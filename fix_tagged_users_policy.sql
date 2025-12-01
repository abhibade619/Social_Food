-- Allow tagged users to update their own tag status (e.g. show_in_diary)
CREATE POLICY "Tagged users can update their own status"
ON public.tagged_users FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
