/*
# PikPok - TikTok-style Short Video App Schema

## Overview
Creates the full database schema for PikPok, a TikTok-style short video app.
No authentication/sign-in is used; a local user identity is auto-created on first visit
and stored in localStorage. All policies allow anon + authenticated access.

## New Tables

1. **profiles** — User profiles (auto-created for each visitor)
   - id (uuid, PK)
   - username (text, unique)
   - display_name (text)
   - avatar_url (text)
   - bio (text)
   - created_at (timestamptz)

2. **videos** — Short video posts
   - id (uuid, PK)
   - user_id (uuid, FK -> profiles)
   - video_url (text) — direct video file URL
   - cover_url (text) — thumbnail/cover image URL
   - caption (text)
   - music (text) — music/sound name
   - views (bigint, default 0)
   - created_at (timestamptz)

3. **likes** — Video likes (unique per user per video)
   - id (uuid, PK)
   - user_id (uuid, FK -> profiles)
   - video_id (uuid, FK -> videos)
   - created_at (timestamptz)
   - UNIQUE(user_id, video_id)

4. **comments** — Comments on videos
   - id (uuid, PK)
   - user_id (uuid, FK -> profiles)
   - video_id (uuid, FK -> videos)
   - text (text)
   - created_at (timestamptz)

5. **follows** — Follow relationships (unique per follower/following pair)
   - id (uuid, PK)
   - follower_id (uuid, FK -> profiles)
   - following_id (uuid, FK -> profiles)
   - created_at (timestamptz)
   - UNIQUE(follower_id, following_id)

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` since there is no sign-in screen.
- All data is intentionally public/shared (social feed app).

## Indexes
- videos.user_id, videos.created_at
- likes.video_id, likes.user_id
- comments.video_id, comments.created_at
- follows.follower_id, follows.following_id
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  cover_url text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  music text NOT NULL DEFAULT '',
  views bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_videos" ON videos;
CREATE POLICY "anon_select_videos" ON videos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_videos" ON videos;
CREATE POLICY "anon_insert_videos" ON videos FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_videos" ON videos;
CREATE POLICY "anon_update_videos" ON videos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_videos" ON videos;
CREATE POLICY "anon_delete_videos" ON videos FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_likes" ON likes;
CREATE POLICY "anon_select_likes" ON likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_likes" ON likes;
CREATE POLICY "anon_insert_likes" ON likes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_likes" ON likes;
CREATE POLICY "anon_delete_likes" ON likes FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comments" ON comments;
CREATE POLICY "anon_select_comments" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_follows" ON follows;
CREATE POLICY "anon_select_follows" ON follows FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_follows" ON follows;
CREATE POLICY "anon_insert_follows" ON follows FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_follows" ON follows;
CREATE POLICY "anon_delete_follows" ON follows FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
