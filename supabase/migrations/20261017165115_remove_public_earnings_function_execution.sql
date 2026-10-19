/*
# Remove public execution from authenticated PikPok functions

1. Modified functions
- `ensure_wallet`, `send_gift`, `request_withdrawal`, `claim_daily_bonus`, and `increment_views`.

2. Security changes
- Removes inherited EXECUTE permission from the public role.
- Grants execution only to authenticated users.
- Anonymous browsers can no longer invoke these SECURITY DEFINER functions.

3. Important notes
- Function logic and stored data are unchanged.
- Signed-in app features retain the required execution permission.
*/

REVOKE EXECUTE ON FUNCTION ensure_wallet(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION send_gift(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION request_withdrawal(bigint, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_daily_bonus() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_views(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION ensure_wallet(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_gift(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdrawal(bigint, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_daily_bonus() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_views(uuid) TO authenticated;
