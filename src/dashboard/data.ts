import { SUPABASE_ANON, SUPABASE_URL } from './config';
import type { AdminRecord, BodyMetric, GymSession, HiitSession, Profile } from './types';

declare const supabase: any;

export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

type CacheStore = {
  gymSessions?: { data: GymSession[]; _since: string };
  hiitSessions?: { data: HiitSession[]; _since: string };
  profiles?: Profile[];
  bodyMetrics?: BodyMetric[];
  allUsers?: Profile[];
};

const cache: CacheStore = {};

export function invalidateCache(): void {
  delete cache.gymSessions;
  delete cache.hiitSessions;
  delete cache.profiles;
  delete cache.bodyMetrics;
  delete cache.allUsers;
}

export async function fetchGymSessions(since: string): Promise<GymSession[]> {
  const cachedGym = cache.gymSessions;
  if (cachedGym?._since === since) return cachedGym.data;
  const { data } = await sb
    .from('gym_sessions')
    .select('id,user_id,date,exercises')
    .gte('date', since)
    .order('date', { ascending: false });
  const result = (data || []) as GymSession[];
  cache.gymSessions = { data: result, _since: since };
  return result;
}

export async function fetchHiitSessions(since: string): Promise<HiitSession[]> {
  const cachedHiit = cache.hiitSessions;
  if (cachedHiit?._since === since) return cachedHiit.data;
  const { data } = await sb
    .from('hiit_sessions')
    .select('id,user_id,date,name,rounds,duration,rpe')
    .gte('date', since)
    .order('date', { ascending: false });
  const result = (data || []) as HiitSession[];
  cache.hiitSessions = { data: result, _since: since };
  return result;
}

export async function fetchProfiles(): Promise<Profile[]> {
  if (cache.profiles) return cache.profiles;
  const { data } = await sb.from('profiles').select('id,name,color');
  cache.profiles = (data || []) as Profile[];
  return cache.profiles;
}

export async function fetchBodyMetrics(): Promise<BodyMetric[]> {
  if (cache.bodyMetrics) return cache.bodyMetrics;
  const { data } = await sb
    .from('body_metrics')
    .select('id,user_id,date,weight,weight_unit,fat_pct,muscle_pct')
    .order('date', { ascending: true });
  cache.bodyMetrics = (data || []) as BodyMetric[];
  return cache.bodyMetrics;
}

export async function fetchAdmins(): Promise<string[]> {
  const { data } = await sb.from('gym_admins').select('user_id');
  return ((data || []) as AdminRecord[]).map((r) => r.user_id);
}

export async function fetchAllUsers(): Promise<Profile[]> {
  if (cache.allUsers) return cache.allUsers;
  const profiles = await fetchProfiles();
  cache.allUsers = profiles;
  return cache.allUsers;
}
