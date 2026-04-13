import { getSupabaseConfigError, SUPABASE_ANON, SUPABASE_URL } from './config';
import type { AdminRecord, BodyMetric, ExerciseCatalogEntry, ExerciseRecommendation, GymSession, HiitSession, Profile } from './types';

type DashboardSupabaseClient = {
  auth: {
    getSession(): Promise<unknown>;
    onAuthStateChange(callback: (event: string) => void): unknown;
    signInWithPassword(credentials: { email: string; password: string }): Promise<unknown>;
    signOut(): Promise<unknown>;
    updateUser(attrs: { password: string }): Promise<unknown>;
  };
  from(table: string): any;
  rpc(functionName: string, args?: Record<string, unknown>): Promise<{
    data: unknown;
    error: { message: string; code?: string; hint?: string; details?: string } | null;
  }>;
  functions: {
    invoke(
      functionName: string,
      options?: { body?: unknown; headers?: Record<string, string> },
    ): Promise<{ data: unknown; error: { message: string } | null }>;
  };
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

function isMissingRpcFunctionError(error: { message: string; code?: string; hint?: string; details?: string } | null): boolean {
  if (!error) return false;
  const code = (error.code || '').toUpperCase();
  const msg = (error.message || '').toLowerCase();
  const hint = (error.hint || '').toLowerCase();
  const details = (error.details || '').toLowerCase();

  return (
    code === 'PGRST202' ||
    msg.includes('could not find the function') ||
    hint.includes('perhaps you meant to call') ||
    details.includes('searched for the function')
  );
}

type CacheStore = {
  gymSessions?: { data: GymSession[]; _since: string };
  hiitSessions?: { data: HiitSession[]; _since: string };
  profiles?: Profile[];
  bodyMetrics?: BodyMetric[];
  allUsers?: Profile[];
};

type CatalogRpcPreference = 'admin' | 'light';
type CatalogRpcSource = 'admin' | 'light';

const CATALOG_RPC_PREF_KEY = 'dashboard.catalog.rpc.preference.v2';

function readCatalogRpcPreference(): CatalogRpcPreference {
  try {
    const value = globalThis.localStorage?.getItem(CATALOG_RPC_PREF_KEY);
    return value === 'light' ? 'light' : 'admin';
  } catch {
    return 'admin';
  }
}

function persistCatalogRpcPreference(pref: CatalogRpcPreference): void {
  try {
    globalThis.localStorage?.setItem(CATALOG_RPC_PREF_KEY, pref);
  } catch {
    // Ignore localStorage errors (private mode / restricted envs)
  }
}

let catalogRpcPreference: CatalogRpcPreference = readCatalogRpcPreference();
let catalogRpcSource: CatalogRpcSource = catalogRpcPreference;

const cache: CacheStore = {};

export function invalidateCache(): void {
  delete cache.gymSessions;
  delete cache.hiitSessions;
  delete cache.profiles;
  delete cache.bodyMetrics;
  delete cache.allUsers;
}

function normalizeLightCatalogRows(rows: unknown): ExerciseCatalogEntry[] {
  const list = (rows || []) as Array<{ id: string; slug: string; canonical_name: string; muscle_group: string }>;
  return list.map((row) => ({
    id: row.id,
    slug: row.slug,
    canonical_name: row.canonical_name,
    muscle_group: row.muscle_group,
    is_active: true,
    rec_count: 0,
  }));
}

export function getCatalogRpcHealthMode(): 'admin' | 'fallback' {
  return catalogRpcSource === 'admin' ? 'admin' : 'fallback';
}

function asAdminCatalogRows(rows: unknown): ExerciseCatalogEntry[] {
  return (rows || []) as ExerciseCatalogEntry[];
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
  const { data } = await sb.from('profiles').select('id,name,color,is_disabled');
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

export async function fetchSuperAdmins(): Promise<string[]> {
  const { data, error } = await sb.rpc('list_super_admins');
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('forbidden') || msg.includes('42501')) return [];
    throw error;
  }
  return ((data || []) as AdminRecord[]).map((r) => r.user_id);
}

export async function fetchAllUsers(): Promise<Profile[]> {
  if (cache.allUsers) return cache.allUsers;
  const profiles = await fetchProfiles();
  cache.allUsers = profiles;
  return cache.allUsers;
}

export async function fetchAdminCatalog(): Promise<ExerciseCatalogEntry[]> {
  if (catalogRpcPreference === 'light') {
    const adminAttempt = await sb.rpc('admin_list_exercise_catalog');
    if (!adminAttempt.error) {
      catalogRpcPreference = 'admin';
      catalogRpcSource = 'admin';
      persistCatalogRpcPreference(catalogRpcPreference);
      return asAdminCatalogRows(adminAttempt.data);
    }

    const fallback = await sb.rpc('list_exercise_catalog_light');
    if (fallback.error) throw fallback.error;
    catalogRpcSource = 'light';
    return normalizeLightCatalogRows(fallback.data);
  }

  const { data, error } = await sb.rpc('admin_list_exercise_catalog');
  if (!error) {
    catalogRpcSource = 'admin';
    return asAdminCatalogRows(data);
  }
  if (!isMissingRpcFunctionError(error)) throw error;

  catalogRpcPreference = 'light';
  catalogRpcSource = 'light';
  persistCatalogRpcPreference(catalogRpcPreference);

  const fallback = await sb.rpc('list_exercise_catalog_light');
  if (fallback.error) throw fallback.error;
  return normalizeLightCatalogRows(fallback.data);
}

export async function fetchExerciseRecommendations(exerciseId: string): Promise<ExerciseRecommendation[]> {
  const { data, error } = await sb.rpc('admin_list_exercise_recommendations', { p_exercise_id: exerciseId });
  if (error) throw error;
  return (data || []) as ExerciseRecommendation[];
}

export async function saveExercise(
  canonicalName: string,
  muscleGroup: string,
  slug: string,
  exerciseId?: string,
): Promise<string> {
  const { data, error } = await sb.rpc('admin_save_exercise', {
    p_canonical_name: canonicalName,
    p_muscle_group: muscleGroup,
    p_slug: slug,
    p_exercise_id: exerciseId ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function toggleExercise(exerciseId: string, isActive: boolean): Promise<void> {
  const { error } = await sb.rpc('admin_toggle_exercise', {
    p_exercise_id: exerciseId,
    p_is_active: isActive,
  });
  if (error) throw error;
}

export async function saveRecommendation(
  exerciseId: string,
  section: string,
  orderIndex: number,
  content: string,
  recId?: number,
): Promise<number> {
  const { data, error } = await sb.rpc('admin_save_recommendation', {
    p_exercise_id: exerciseId,
    p_section: section,
    p_order_index: orderIndex,
    p_content: content,
    p_rec_id: recId ?? null,
  });
  if (error) throw error;
  return data as number;
}

export async function deleteRecommendation(recId: number): Promise<void> {
  const { error } = await sb.rpc('admin_delete_recommendation', { p_rec_id: recId });
  if (error) throw error;
}

export async function manageUser(targetUserId: string, action: 'disable' | 'enable' | 'delete'): Promise<void> {
  const sessionRes = (await sb.auth.getSession()) as {
    data?: { session?: { access_token?: string | null } | null };
    error?: { message: string } | null;
  };
  if (sessionRes.error) throw sessionRes.error;

  const accessToken = sessionRes.data?.session?.access_token;
  if (!accessToken) {
    throw new Error('Sesion expirada. Cierra y vuelve a iniciar sesion.');
  }

  const { data, error } = await sb.functions.invoke('manage-user', {
    body: { target_user_id: targetUserId, action },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) throw error;

  const result = (data as { ok?: boolean; error?: string } | null) || null;
  if (!result?.ok) {
    throw new Error(result?.error || 'Error desconocido');
  }
}
