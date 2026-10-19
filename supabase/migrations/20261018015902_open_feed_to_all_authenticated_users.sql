/*
# Open video feed to all authenticated users

1. Purpose
- Make the Home feed show videos from ALL authenticated users, not just the current user's own videos.
- Allow all authenticated users to see likes, comments, and follows across the platform.
- Keep insert/update/delete owner-only so users can only modify their own content.

2. Modified tables
- `videos`: SELECT is now open to all authenticated users. INSERT/UPDATE/DELETE remain owner-only.
- `profiles`: SELECT is now open to all authenticated users (needed for video card avatars/names). UPDATE remains owner-only.
- `likes`: SELECT is open to all authenticated users. INSERT/DELETE remain owner-only (only the liker can like/unlike).
- `comments`: SELECT is open to all authenticated users. INSERT/DELETE remain owner-only (only the commenter can add/delete).
- `follows`: SELECT is open to all authenticated users. INSERT/DELETE remain owner-only.
- `video_gifts`: SELECT is open to all authenticated users.

3. Security changes
- Anonymous (unauthenticated) users cannot read or write any of these tables.
- Authenticated users can browse the full feed, see all profiles, likes, comments, and follows.
- Authenticated users can only insert/update/delete their own rows.

4. Important notes
- No data is deleted or altered.
- Profile ownership and edit restrictions from previous migrations remain in effect.
*/

-- Videos: all authenticated users can view, only owner can modify
DROP POLICY IF EXISTS "select_own_videos" ON videos;
CREATE POLICY "select_all_videos" ON videos FOR SELECT
  TO authenticated USING (true);

-- Profiles: all authenticated users can view, only owner can edit
DROP POLICY IF EXISTS "select_own_profiles" ON profiles;
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Likes: all authenticated users can view, only owner can insert/delete
DROP POLICY IF EXISTS "select_own_likes" ON likes;
CREATE POLICY "select_all_likes" ON likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_likes" ON likes;
CREATE POLICY "insert_own_likes" ON likes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = likes.user_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_likes" ON likes;
CREATE POLICY "delete_own_likes" ON likes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = likes.user_id AND p.user_id = auth.uid())
  );

-- Comments: all authenticated users can view, only owner can insert/delete
DROP POLICY IF EXISTS "select_own_video_comments" ON comments;
CREATE POLICY "select_all_comments" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_video_comments" ON comments;
CREATE POLICY "insert_own_comments" ON comments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = comments.user_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_video_comments" ON comments;
CREATE POLICY "delete_own_comments" ON comments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = comments.user_id AND p.user_id = auth.uid())
  );

-- Follows: all authenticated users can view, only owner can insert/delete
DROP POLICY IF EXISTS "select_own_follows" ON follows;
CREATE POLICY "select_all_follows" ON follows FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_follows" ON follows;
CREATE POLICY "insert_own_follows" ON follows FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = follows.follower_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_follows" ON follows;
CREATE POLICY "delete_own_follows" ON follows FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = follows.follower_id AND p.user_id = auth.uid())
  );

-- Video gifts: all authenticated users can view
DROP POLICY IF EXISTS "select_own_video_gifts" ON video_gifts;
CREATE POLICY "select_all_video_gifts" ON video_gifts FOR SELECT
  TO authenticated USING (true);
