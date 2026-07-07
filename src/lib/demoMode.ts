import { supabase } from './supabase';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
export const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

export async function getCurrentUserId(): Promise<string | null> {
  if (DEMO_MODE) return DEMO_USER_ID;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
