/*
# Restrict profile creation ownership fields

1. Modified table
- `profiles`: authenticated clients may insert only user-editable profile fields.

2. Security changes
- Ownership and authentication-link columns are filled by database defaults from `auth.uid()`.
- The browser cannot provide or replace those ownership values during profile creation.

3. Important notes
- Existing profile rows and user content are unchanged.
- Profile editing remains limited to display name, username, bio, and avatar URL.
*/

REVOKE INSERT ON profiles FROM authenticated;
GRANT INSERT (username, display_name, avatar_url, bio) ON profiles TO authenticated;
