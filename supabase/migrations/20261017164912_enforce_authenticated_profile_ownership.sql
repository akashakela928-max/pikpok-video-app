/*
# Enforce authenticated, owner-only PikPok profiles and videos

1. New columns
- `profiles.user_id` (uuid, references auth.users): the permanent Supabase Auth owner of each profile.

2. Modified tables
- `profiles`: existing authenticated profiles are linked to `user_id`; new rows default ownership from `auth.uid()`.
- `videos`: access is restricted through the owning profile's `user_id`.

3. Security changes
- Anonymous access is removed from profiles and videos.
- Authenticated users can select, insert, update, and delete only their own profile.
- Authenticated users can select, insert, update, and delete only videos attached to their own profile.
- Profile updates are limited to name, username, bio, and avatar columns; ownership and auth-link columns cannot be changed by the browser.

4. Important notes
- Existing profile rows linked through `auth_user_id` are backfilled without deleting data.
- Existing unlinked guest rows remain stored but are inaccessible through the authenticated client.
- New profile ownership is derived from the signed-in session, not from a user-supplied owner value.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE profiles
SET user_id = auth_user_id
WHERE user_id IS NULL AND auth_user_id IS NOT NULL;

ALTER TABLE profiles ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE profiles ALTER COLUMN auth_user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "select_own_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_own_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profiles" ON profiles;
DROP POLICY IF EXISTS "delete_own_profiles" ON profiles;

CREATE POLICY "select_own_profiles" ON profiles FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert_own_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_profiles" ON profiles FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete_own_profiles" ON profiles FOR DELETE
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "anon_select_videos" ON videos;
DROP POLICY IF EXISTS "anon_insert_videos" ON videos;
DROP POLICY IF EXISTS "anon_update_videos" ON videos;
DROP POLICY IF EXISTS "anon_delete_videos" ON videos;
DROP POLICY IF EXISTS "select_own_videos" ON videos;
DROP POLICY IF EXISTS "insert_own_videos" ON videos;
DROP POLICY IF EXISTS "update_own_videos" ON videos;
DROP POLICY IF EXISTS "delete_own_videos" ON videos;

CREATE POLICY "select_own_videos" ON videos FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = videos.user_id AND p.user_id = auth.uid())
  );
CREATE POLICY "insert_own_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = videos.user_id AND p.user_id = auth.uid())
  );
CREATE POLICY "update_own_videos" ON videos FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = videos.user_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = videos.user_id AND p.user_id = auth.uid())
  );
CREATE POLICY "delete_own_videos" ON videos FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = videos.user_id AND p.user_id = auth.uid())
  );

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, username, bio, avatar_url) ON profiles TO authenticated;
