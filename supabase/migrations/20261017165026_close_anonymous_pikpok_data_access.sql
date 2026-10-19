/*
# Close anonymous access to authenticated PikPok data

1. Purpose
- Ensure a browser without a Supabase session cannot read or mutate user-related social data through the Data API or RPC endpoints.

2. Modified tables
- `likes`: only rows connected to the signed-in user's own profile and videos are available.
- `comments`: only comments on the signed-in user's own videos are available.
- `follows`: only the signed-in user's own follower/following rows are available.
- `video_gifts`: only gifts sent by or received by the signed-in user are available.

3. Function security
- Anonymous EXECUTE is revoked from wallet and earnings SECURITY DEFINER functions.
- Authenticated execution remains available for the app's signed-in flows.

4. Important notes
- Public catalogs such as ads and gifts are intentionally unchanged.
- No rows are deleted or altered; only access rules are tightened.
*/

DROP POLICY IF EXISTS "anon_select_likes" ON likes;
DROP POLICY IF EXISTS "anon_insert_likes" ON likes;
DROP POLICY IF EXISTS "anon_delete_likes" ON likes;
CREATE POLICY "select_own_likes" ON likes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = likes.user_id AND p.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM videos v
      JOIN profiles p ON p.id = v.user_id
      WHERE v.id = likes.video_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "insert_own_likes" ON likes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = likes.user_id AND p.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM videos v
      JOIN profiles p ON p.id = v.user_id
      WHERE v.id = likes.video_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "delete_own_likes" ON likes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = likes.user_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "anon_select_comments" ON comments;
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "select_own_video_comments" ON comments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM videos v
      JOIN profiles p ON p.id = v.user_id
      WHERE v.id = comments.video_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "insert_own_video_comments" ON comments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = comments.user_id AND p.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM videos v
      JOIN profiles p ON p.id = v.user_id
      WHERE v.id = comments.video_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "delete_own_video_comments" ON comments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = comments.user_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "anon_select_follows" ON follows;
DROP POLICY IF EXISTS "anon_insert_follows" ON follows;
DROP POLICY IF EXISTS "anon_delete_follows" ON follows;
CREATE POLICY "select_own_follows" ON follows FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = follows.follower_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = follows.following_id AND p.user_id = auth.uid())
  );
CREATE POLICY "insert_own_follows" ON follows FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = follows.follower_id AND p.user_id = auth.uid())
  );
CREATE POLICY "delete_own_follows" ON follows FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = follows.follower_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "anon_select_video_gifts" ON video_gifts;
CREATE POLICY "select_own_video_gifts" ON video_gifts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = video_gifts.sender_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = video_gifts.receiver_id AND p.user_id = auth.uid())
  );

REVOKE EXECUTE ON FUNCTION ensure_wallet(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION send_gift(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION request_withdrawal(bigint, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION claim_daily_bonus() FROM anon;
REVOKE EXECUTE ON FUNCTION increment_views(uuid) FROM anon;
