import { getSupabaseConfigError, SUPABASE_ANON, SUPABASE_URL } from './config';
import type { AdminRecord, BodyMetric, GymSession, HiitSession, Profile } from './types';

type DashboardSupabaseClient = {
  auth: {
    getSession(): Promise<unknown>;
    onAuthStateChange(callback: (event: string) => void): unknown;
    signInWithPassword(credentials: { email: string; password: string }): Promise<unknown>;
    signOut(): Promise<unknown>;
  };
  from(table: string): any;
  rpc(functionName: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
};

type SupabaseGlobal = {
  createClient(url: string, key: string): DashboardSupabaseClient;
};

const supabaseRuntime = (globalThis as typeof globalThis & { supabase?: SupabaseGlobal }).supabase;
const hasSupabaseRuntime = Boolean(supabaseRuntime?.createClient);
const dashboardSupabaseError = getSupabaseConfigError() || (hasSupabaseRuntime ? null : 'No se pudo cargar el cliente de Supabase.');
const rawClient = dashboardSupabaseError || !supabaseRuntime ? null : supabaseRuntime.createClient(SUPABASE_URL, SUPABASE_ANON);

export const sb: DashboardSupabaseClient = new Proxy({} as DashboardSupabaseClient, {
  get(_target, property, receiver) {
    if (!rawClient || dashboardSupabaseError) {
      throw new Error(dashboardSupabaseError || 'No se pudo inicializar Supabase.');
    }

    const value = Reflect.get(rawClient, property, receiver) as unknown;
    return typeof value === 'function' ? value.bind(rawClient) : value;
  },
});

export function getDashboardSupabaseError(): string | null {
  return dashboardSupabaseError;
}

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
  const { data, error } = await sb.rpc('list_gym_admins');
  if (error) throw error;
  return ((data || []) as AdminRecord[]).map((r) => r.user_id);
}

export async function fetchAllUsers(): Promise<Profile[]> {
  if (cache.allUsers) return cache.allUsers;
  const profiles = await fetchProfiles();
  cache.allUsers = profiles;
  return cache.allUsers;
}
