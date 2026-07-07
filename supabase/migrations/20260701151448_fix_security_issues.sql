-- ============================================================
-- SECURITY FIX: Enable RLS on orders / order_items
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Replace the overly-broad public policies on orders with user-scoped ones
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;

CREATE POLICY "select_own_orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- order_items: user owns if they own the parent order
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;

CREATE POLICY "select_own_order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

CREATE POLICY "insert_own_order_items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

-- ============================================================
-- SECURITY FIX: Replace overly-permissive "Allow public write" policies
-- ============================================================

-- loyalty_accounts: users read/write own row; RPCs use SECURITY DEFINER to bypass
DROP POLICY IF EXISTS "Allow public read" ON public.loyalty_accounts;
DROP POLICY IF EXISTS "Allow public write" ON public.loyalty_accounts;

CREATE POLICY "select_own_loyalty_account" ON public.loyalty_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_loyalty_account" ON public.loyalty_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- loyalty_transactions: users read own; writes happen via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Allow public read" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Allow public write" ON public.loyalty_transactions;

CREATE POLICY "select_own_loyalty_transactions" ON public.loyalty_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- plan_conversion_events: keep the user-scoped policies, remove public ones
DROP POLICY IF EXISTS "Allow public read" ON public.plan_conversion_events;
DROP POLICY IF EXISTS "Allow public write" ON public.plan_conversion_events;
DROP POLICY IF EXISTS "Public can insert plan conversion events" ON public.plan_conversion_events;
DROP POLICY IF EXISTS "Public can read plan conversion events" ON public.plan_conversion_events;

-- reward_redemptions: users read own; writes happen via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Allow public read" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Allow public write" ON public.reward_redemptions;

CREATE POLICY "select_own_reward_redemptions" ON public.reward_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- staff: remove unrestricted update (increment_smile_count RPC handles writes)
DROP POLICY IF EXISTS "Authenticated users can update staff smile count" ON public.staff;

-- theme_proposals: remove unrestricted update (increment_theme_vote RPC handles writes)
DROP POLICY IF EXISTS "Authenticated users can update theme vote count" ON public.theme_proposals;

-- ============================================================
-- SECURITY FIX: Set immutable search_path on functions
-- ============================================================

ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.increment(row_id uuid, count_column text, x integer) SET search_path = '';
ALTER FUNCTION public.increment_poll_option_vote(option_id uuid) SET search_path = '';
ALTER FUNCTION public.increment_smile_count(staff_id uuid) SET search_path = '';
ALTER FUNCTION public.increment_theme_vote(proposal_id uuid) SET search_path = '';
ALTER FUNCTION public.decrement_event_attendees(event_id uuid) SET search_path = '';
ALTER FUNCTION public.earn_points(p_user_id uuid, p_order_id uuid, p_amount numeric, p_payment_method text, p_station_id integer, p_promo_id uuid) SET search_path = '';
ALTER FUNCTION public.award_bonus(p_user_id uuid, p_points integer, p_source_rule text, p_reason text) SET search_path = '';
ALTER FUNCTION public.increment_coffee_counter(p_user_id uuid, p_drinks integer) SET search_path = '';
ALTER FUNCTION public.redeem_reward(p_user_id uuid, p_reward_catalog_id uuid) SET search_path = '';

-- ============================================================
-- SECURITY FIX: Revoke EXECUTE from anon on SECURITY DEFINER functions
-- These should only be callable by authenticated users (or triggers).
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.award_bonus(uuid, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_event_attendees(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.earn_points(uuid, uuid, numeric, text, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_coffee_counter(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_poll_option_vote(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_reward(uuid, uuid) FROM anon;

-- handle_new_user is a trigger function; revoke from authenticated too
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
