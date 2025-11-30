-- ============================================
-- STORAGE SETUP (Simplified)
-- ============================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('log-photos', 'log-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- IF THE BELOW FAILS, USE THE SUPABASE DASHBOARD
-- Go to Storage -> Policies -> New Policy
-- ============================================

-- Avatars: Public Read
CREATE POLICY "Avatar Public Read" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

-- Avatars: Authenticated Upload
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Avatars: Owner Update
CREATE POLICY "Avatar Owner Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Log Photos: Public Read
CREATE POLICY "Log Photos Public Read" ON storage.objects FOR SELECT USING ( bucket_id = 'log-photos' );

-- Log Photos: Authenticated Upload
CREATE POLICY "Log Photos Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'log-photos' AND auth.role() = 'authenticated' );
