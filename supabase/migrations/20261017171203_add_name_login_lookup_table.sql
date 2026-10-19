/*
# Add name-to-email lookup for password-only auth

1. New table
- `name_logins` — Maps display names to the hidden auto-generated email used for Supabase Auth.
  - id (uuid, PK)
  - display_name (text, unique) — The user's real name as they typed it (e.g. "Akash Kumar")
  - hidden_email (text, unique) — The auto-generated email (e.g. "akashkumar12345@pikpok.app")
  - created_at (timestamptz)

2. Security
- RLS enabled.
- SELECT is public (anon + authenticated) so login lookup works before session is established.
- INSERT is public so new sign-ups can register their name-to-email mapping.
- No UPDATE or DELETE needed from the client.

3. Important notes
- This table only stores the name and the generated email — no passwords. Passwords live in Supabase Auth.
- The display_name uniqueness is enforced by a unique constraint so duplicate sign-ups get a number suffix.
*/

CREATE TABLE IF NOT EXISTS name_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  hidden_email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE name_logins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_name_logins" ON name_logins;
CREATE POLICY "public_select_name_logins" ON name_logins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_name_logins" ON name_logins;
CREATE POLICY "public_insert_name_logins" ON name_logins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_name_logins_display_name_lower
  ON name_logins (lower(display_name));

CREATE INDEX IF NOT EXISTS idx_name_logins_hidden_email ON name_logins(hidden_email);
