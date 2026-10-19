/*
# Fix name_logins constraints for correct signup behavior

1. Changes
- Drop the case-insensitive unique index on display_name.
- Add a case-sensitive unique constraint so "Akash Bihari 1" and "akash bihari 1" are different names.
- Keep hidden_email unique (case-insensitive via lower index) so the same email can't register twice.

2. Important notes
- Existing rows are unchanged.
- The error code 23505 now reliably indicates either a name or email collision.
*/

DROP INDEX IF EXISTS idx_name_logins_display_name_lower;

CREATE UNIQUE INDEX IF NOT EXISTS idx_name_logins_display_name_exact
  ON name_logins (display_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_name_logins_hidden_email_lower
  ON name_logins (lower(hidden_email));
