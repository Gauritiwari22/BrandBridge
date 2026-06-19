
CREATE POLICY "Avatars are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Brochures are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'brochures');
CREATE POLICY "Users upload own brochure" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brochures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own brochure" ON storage.objects FOR UPDATE USING (bucket_id = 'brochures' AND auth.uid()::text = (storage.foldername(name))[1]);
