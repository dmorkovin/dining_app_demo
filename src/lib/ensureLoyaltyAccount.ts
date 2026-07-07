import { supabase } from './supabase';

export async function ensureLoyaltyAccount(userId: string) {
  try {
    const { data: existing } = await supabase
      .from('loyalty_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return existing;

    await supabase.from('loyalty_accounts').insert({
      user_id: userId,
      balance: 0,
      lifetime_earned: 0,
      lifetime_redeemed: 0,
      coffee_drinks_count: 0,
      coffee_drinks_lifetime: 0,
      founding_falcon_badge: false,
      welcome_week_stations_visited: [],
      tier: 'Bronze',
      tier_progress_points: 0,
    });

    await supabase.rpc('award_bonus', {
      p_user_id: userId,
      p_points: 200,
      p_source_rule: 'welcome',
      p_reason: 'Welcome bonus',
    });

    const { data: created } = await supabase
      .from('loyalty_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return created;
  } catch (err) {
    console.error('ensureLoyaltyAccount failed:', err);
    return null;
  }
}
