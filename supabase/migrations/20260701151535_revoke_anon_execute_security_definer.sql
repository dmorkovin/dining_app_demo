-- Revoke EXECUTE from public role (which anon/authenticated inherit from)
-- Then explicitly grant back to authenticated for the functions the app needs

REVOKE EXECUTE ON FUNCTION public.award_bonus(uuid, integer, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.decrement_event_attendees(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.earn_points(uuid, uuid, numeric, text, integer, uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_coffee_counter(uuid, integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_poll_option_vote(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.redeem_reward(uuid, uuid) FROM public;

-- Grant back to authenticated (the app calls these while signed in)
GRANT EXECUTE ON FUNCTION public.award_bonus(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_event_attendees(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.earn_points(uuid, uuid, numeric, text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coffee_counter(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_poll_option_vote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid, uuid) TO authenticated;

-- handle_new_user: no one calls it via RPC; it's invoked as a trigger
-- (no GRANT needed)
