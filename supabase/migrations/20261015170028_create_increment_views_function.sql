/*
# Create increment_views function

## Overview
Creates a SECURITY DEFINER function to atomically increment a video's view count.

## New Functions
- increment_views(video_id uuid) — increments the views column for the given video
*/

CREATE OR REPLACE FUNCTION increment_views(video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE videos SET views = views + 1 WHERE id = video_id;
$$;

GRANT EXECUTE ON FUNCTION increment_views(uuid) TO anon, authenticated;
