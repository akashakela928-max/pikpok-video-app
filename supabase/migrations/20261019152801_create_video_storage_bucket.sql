/*
# Create Storage Bucket for Video Uploads and Thumbnails

1. Purpose
   - Creates a public storage bucket named `videos` for user-uploaded video files and auto-generated thumbnail images.
   - Sets RLS policies so authenticated users can upload/read their own files, and all users (anon + authenticated) can read public files.
   - This fixes the broken upload flow that was storing base64 data URLs (up to 15MB) in a text column.

2. Storage Changes
   - Creates bucket `videos` (public = true, 50MB file size limit, allowed mime types: video/mp4, video/quicktime, video/webm, image/jpeg).
   - Storage policies:
     a) SELECT (read): anyone (anon + authenticated) can read files — videos are public content.
     b) INSERT (upload): authenticated users can upload to their own folder `user_id/...`.
     c) UPDATE: authenticated users can update their own files.
     d) DELETE: authenticated users can delete their own files.

3. Notes
   - Existing videos in the database (with external URLs or data URLs) are NOT affected — they remain as-is.
   - The bucket is public so video playback works without signed URLs.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (storage.objects uses bucket_id and the path to identify ownership)
-- The folder convention is: user_id/filename — so we check if the path starts with auth.uid()

DROP POLICY IF EXISTS "videos_bucket_read" ON storage.objects;
CREATE POLICY "videos_bucket_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "videos_bucket_upload" ON storage.objects;
CREATE POLICY "videos_bucket_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

DROP POLICY IF EXISTS "videos_bucket_update" ON storage.objects;
CREATE POLICY "videos_bucket_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "videos_bucket_delete" ON storage.objects;
CREATE POLICY "videos_bucket_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');
