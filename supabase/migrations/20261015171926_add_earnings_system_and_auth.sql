/*
# PikPok Earnings System + Auth Link

## Overview
Adds the full "Earn Money" system to PikPok: creator wallets, coins, gifts,
transactions, withdrawals, and in-feed ads. Also adds Google OAuth support
by linking profiles to Supabase auth users.

## Changes to Existing Tables

### profiles (modified)
- Added `auth_user_id` (uuid, nullable, REFERENCES auth.users ON DELETE SET NULL)
  Links a profile to a Supabase auth user (for Google OAuth). Guest profiles
  have this as null; authenticated profiles have it set to auth.uid().

## New Tables

1. **wallets** — Creator coin wallets (1:1 with profiles)
   - id, user_id (FK profiles, unique), coins (default 100), total_earned (default 0),
     total_withdrawn (default 0), last_bonus_claim (date), created_at

2. **gifts** — Gift catalog (static data)
   - id, name, emoji, coin_value, color (gradient), created_at

3. **video_gifts** — Gifts sent on specific videos
   - id, sender_id, receiver_id, video_id, gift_id, coins, created_at

4. **transactions** — Wallet transaction history
   - id, user_id, type, amount, description, created_at

5. **withdrawals** — Withdrawal requests
   - id, user_id, amount_coins, amount_usd, status, method, details, created_at

6. **ads** — In-feed advertisements
   - id, title, description, image_url, cta_url, cta_label, sponsor, gradient, created_at

## Security (RLS)
- gifts, ads: SELECT to anon, authenticated (public catalog/ads)
- wallets: SELECT/UPDATE own (via auth_user_id link)
- video_gifts: SELECT all
- transactions: SELECT/INSERT own (via auth_user_id link)
- withdrawals: SELECT/INSERT own (via auth_user_id link)

## SECURITY DEFINER Functions
1. ensure_wallet(p_user_id) — Creates wallet with 100 coins if not exists
2. send_gift(p_video_id, p_gift_id) — Sends gift, deducts coins, records transactions
3. request_withdrawal(p_amount, p_method, p_details) — Creates withdrawal request
4. claim_daily_bonus() — Claims 50 free coins once per day
*/

-- Add auth_user_id to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_user_id') THEN
    ALTER TABLE profiles ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  coins bigint NOT NULL DEFAULT 100,
  total_earned bigint NOT NULL DEFAULT 0,
  total_withdrawn bigint NOT NULL DEFAULT 0,
  last_bonus_claim date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallet" ON wallets;
CREATE POLICY "select_own_wallet" ON wallets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = wallets.user_id AND p.auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_wallet" ON wallets;
CREATE POLICY "update_own_wallet" ON wallets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = wallets.user_id AND p.auth_user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = wallets.user_id AND p.auth_user_id = auth.uid())
  );

-- Gifts catalog
CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '',
  coin_value bigint NOT NULL DEFAULT 1,
  color text NOT NULL DEFAULT 'from-rose-500 to-orange-400',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gifts" ON gifts;
CREATE POLICY "anon_select_gifts" ON gifts FOR SELECT
  TO anon, authenticated USING (true);

-- Video gifts
CREATE TABLE IF NOT EXISTS video_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  gift_id uuid NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  coins bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE video_gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_video_gifts" ON video_gifts;
CREATE POLICY "anon_select_video_gifts" ON video_gifts FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_video_gifts_video_id ON video_gifts(video_id);
CREATE INDEX IF NOT EXISTS idx_video_gifts_receiver_id ON video_gifts(receiver_id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount bigint NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = transactions.user_id AND p.auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = transactions.user_id AND p.auth_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_coins bigint NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'bank',
  details text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawals" ON withdrawals;
CREATE POLICY "select_own_withdrawals" ON withdrawals FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = withdrawals.user_id AND p.auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_withdrawals" ON withdrawals;
CREATE POLICY "insert_own_withdrawals" ON withdrawals FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = withdrawals.user_id AND p.auth_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);

-- Ads
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '#',
  cta_label text NOT NULL DEFAULT 'Learn More',
  sponsor text NOT NULL DEFAULT '',
  gradient text NOT NULL DEFAULT 'from-blue-600 to-cyan-500',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ads" ON ads;
CREATE POLICY "anon_select_ads" ON ads FOR SELECT
  TO anon, authenticated USING (true);

-- Ensure wallet function
CREATE OR REPLACE FUNCTION ensure_wallet(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO wallets (user_id, coins, total_earned, total_withdrawn)
  VALUES (p_user_id, 100, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_wallet(uuid) TO anon, authenticated;

-- Send gift function
CREATE OR REPLACE FUNCTION send_gift(p_video_id uuid, p_gift_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_receiver_id uuid;
  v_coins bigint;
  v_balance bigint;
BEGIN
  SELECT id INTO v_sender_id FROM profiles WHERE auth_user_id = auth.uid();
  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT coin_value INTO v_coins FROM gifts WHERE id = p_gift_id;
  IF v_coins IS NULL THEN
    RETURN jsonb_build_object('error', 'gift_not_found');
  END IF;

  SELECT user_id INTO v_receiver_id FROM videos WHERE id = p_video_id;
  IF v_receiver_id IS NULL THEN
    RETURN jsonb_build_object('error', 'video_not_found');
  END IF;

  IF v_sender_id = v_receiver_id THEN
    RETURN jsonb_build_object('error', 'cannot_gift_self');
  END IF;

  SELECT coins INTO v_balance FROM wallets WHERE user_id = v_sender_id;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'wallet_not_found');
  END IF;
  IF v_balance < v_coins THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  UPDATE wallets SET coins = coins - v_coins WHERE user_id = v_sender_id;

  INSERT INTO wallets (user_id, coins, total_earned, total_withdrawn)
  VALUES (v_receiver_id, 0, v_coins, 0)
  ON CONFLICT (user_id) DO UPDATE SET total_earned = wallets.total_earned + v_coins;

  INSERT INTO video_gifts (sender_id, receiver_id, video_id, gift_id, coins)
  VALUES (v_sender_id, v_receiver_id, p_video_id, p_gift_id, v_coins);

  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_sender_id, 'gift_sent', -v_coins, 'Gift sent to creator');
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_receiver_id, 'gift_received', v_coins, 'Gift received from fan');

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION send_gift(uuid, uuid) TO authenticated;

-- Request withdrawal function
CREATE OR REPLACE FUNCTION request_withdrawal(p_amount_coins bigint, p_method text, p_details text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_available bigint;
  v_usd numeric(10,2);
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE auth_user_id = auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT total_earned - total_withdrawn INTO v_available FROM wallets WHERE user_id = v_user_id;
  IF v_available IS NULL THEN
    RETURN jsonb_build_object('error', 'wallet_not_found');
  END IF;

  IF v_available < p_amount_coins THEN
    RETURN jsonb_build_object('error', 'insufficient_earnings');
  END IF;

  IF p_amount_coins < 1000 THEN
    RETURN jsonb_build_object('error', 'minimum_1000_coins');
  END IF;

  v_usd := p_amount_coins::numeric / 100.0;

  UPDATE wallets SET total_withdrawn = total_withdrawn + p_amount_coins WHERE user_id = v_user_id;

  INSERT INTO withdrawals (user_id, amount_coins, amount_usd, status, method, details)
  VALUES (v_user_id, p_amount_coins, v_usd, 'pending', p_method, p_details);

  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'withdrawal', -p_amount_coins, 'Withdrawal request');

  RETURN jsonb_build_object('success', true, 'amount_usd', v_usd);
END;
$$;

GRANT EXECUTE ON FUNCTION request_withdrawal(bigint, text, text) TO authenticated;

-- Claim daily bonus function
CREATE OR REPLACE FUNCTION claim_daily_bonus()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_last_claim date;
  v_coins bigint;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE auth_user_id = auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT last_bonus_claim, coins INTO v_last_claim, v_coins FROM wallets WHERE user_id = v_user_id;
  IF v_coins IS NULL THEN
    RETURN jsonb_build_object('error', 'wallet_not_found');
  END IF;

  IF v_last_claim = CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'already_claimed');
  END IF;

  UPDATE wallets SET coins = coins + 50, last_bonus_claim = CURRENT_DATE WHERE user_id = v_user_id;

  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'bonus', 50, 'Daily bonus claimed');

  RETURN jsonb_build_object('success', true, 'coins', v_coins + 50);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_daily_bonus() TO authenticated;
