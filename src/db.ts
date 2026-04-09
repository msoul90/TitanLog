// ============================================================
// db.ts — Supabase config, base de datos y autenticación
// ============================================================

import { createClient } from '@supabase/supabase-js';
import {
  User,
  UserProfile,
  Exercise,
  BodyWeightEntry,
  HIITSession,
  GymSessionData,
  HIITSessionData,
  BodyWeightData,
  AuthMode
} from './types.js';

// ══════════════════════════════════════════════════════
// SUPABASE CONFIG — reemplaza con tus propios valores
// Los encuentras en: supabase.com → tu proyecto → Settings → API
// ══════════════════════════════════════════════════════
const SUPABASE_URL: string = 'https://TU_PROJECT_ID.supabase.co';
const SUPABASE_ANON: string = 'TU_ANON_PUBLIC_KEY';
const PROFILE_COLORS: readonly string[] = ['#aaff45','#ff9f43','#45c8ff','#ff6bbd','#a78bfa','#fb923c','#34d399','#f472b6'];

const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// Runtime-safe global wrappers for browser module execution
const toast = (msg: string): void => (globalThis as any).toast?.(msg);
const openM = (modalId: string): void => (globalThis as any).openM?.(modalId);
const closeM = (modalId: string): void => (globalThis as any).closeM?.(modalId);
const initTheme = (): void => (globalThis as any).initTheme?.();
const renderToday = (): void => (globalThis as any).renderToday?.();
const renderHiitProgress = (): void => (globalThis as any).renderHiitProgress?.();

function getPasswordResetRedirectUrl(): string | undefined {
  const locationObject = (globalThis as { location?: Location }).location;
  if (!locationObject) return undefined;

  const { origin, pathname } = locationObject;
  if (!origin || !pathname) return undefined;

  return `${origin}${pathname}`;
}


// ── ESTADO GLOBAL ──
interface DBState {
  currentUser: User | null;
  currentProfile: UserProfile | null;
  gymCache: GymSessionData;
  hiitCache: HIITSessionData;
  bwCache: BodyWeightData;
}

const dbState: DBState = {
  currentUser: null,   // objeto auth.user de Supabase
  currentProfile: null,   // fila de la tabla profiles
  gymCache: {},     // cache local de sesiones gym { 'YYYY-MM-DD': [...] }
  hiitCache: {},     // cache local de sesiones HIIT { 'YYYY-MM-DD': [...] }
  bwCache: {}     // cache local de métricas { 'YYYY-MM-DD': {...} }
};

// For backward compatibility
let { currentUser, currentProfile, gymCache, hiitCache, bwCache } = dbState;

// ── HELPERS DE FECHA ──

/**
 * Creates a date key in YYYY-MM-DD format
 * @param d - Date object
 * @returns Date string in YYYY-MM-DD format
 */
function dk(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getCurrentProfile(): UserProfile | null {
  return currentProfile;
}

// ── SUPABASE: GYM SESSIONS ──

/**
 * Loads gym sessions for a specific month
 * @param year - Year
 * @param month - Month (0-based)
 */
async function loadGymMonth(year: number, month: number): Promise<void> {
  try {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await sb.from('gym_sessions')
      .select('date, exercises, id')
      .eq('user_id', currentUser!.id)
      .gte('date', from).lte('date', to);

    if (error) {
      console.error('Error cargando gym month:', error);
      toast('Error cargando sesiones. Intenta de nuevo.');
      return;
    }

    (data || []).forEach((row: any) => {
      gymCache[row.date] = { exercises: row.exercises, id: row.id };
    });
  } catch (err) {
    console.error('Exception in loadGymMonth:', err);
    toast('Error cargando sesiones.');
  }
}

/**
 * Saves gym exercises for a specific day
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param exercises - Array of exercises
 */
async function saveGymDay(dateStr: string, exercises: Exercise[]): Promise<void> {
  const existing = gymCache[dateStr];

  if (existing) {
    const { error } = await sb.from('gym_sessions')
      .update({ exercises, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (!error) {
      gymCache[dateStr] = { ...existing, exercises };
    }
  } else {
    const { data, error } = await sb.from('gym_sessions')
      .insert({ user_id: currentUser!.id, date: dateStr, exercises })
      .select('id').single();

    if (!error && data) {
      gymCache[dateStr] = { exercises, id: data.id };
    }
  }
}

/**
 * Deletes gym session for a specific day
 * @param dateStr - Date string in YYYY-MM-DD format
 */
async function deleteGymDay(dateStr: string): Promise<void> {
  const existing = gymCache[dateStr];
  if (!existing) return;

  await sb.from('gym_sessions').delete().eq('id', existing.id);
  delete gymCache[dateStr];
}

/**
 * Gets gym data in legacy format for compatibility
 * @returns Object with date keys and exercise arrays
 */
function gD(): Record<string, Exercise[]> {
  // Devuelve objeto compatible con el código existente { 'YYYY-MM-DD': [exercises] }
  const result: Record<string, Exercise[]> = {};
  for (const [date, val] of Object.entries(gymCache)) {
    result[date] = val.exercises || [];
  }
  return result;
}

// ── SUPABASE: BODY METRICS ──

/**
 * Loads all body weight metrics for the current user
 */
async function loadBWAll(): Promise<void> {
  try {
    const { data, error } = await sb.from('body_metrics')
      .select('date, weight, weight_unit, fat_pct, muscle_pct, id')
      .eq('user_id', currentUser!.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error cargando body metrics:', error);
      toast('Error cargando medidas. Intenta de nuevo.');
      return;
    }

    (data || []).forEach((row: any) => {
      bwCache[row.date] = {
        v: row.weight,
        u: row.weight_unit,
        fat: row.fat_pct,
        mmc: row.muscle_pct,
        id: row.id
      };
    });
  } catch (err) {
    console.error('Exception in loadBWAll:', err);
    toast('Error cargando medidas.');
  }
}

/**
 * Saves body weight entry for a specific day
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param entry - Body weight entry data
 */
async function saveBWDay(dateStr: string, entry: BodyWeightEntry): Promise<void> {
  const existing = bwCache[dateStr];

  if (existing) {
    const { error } = await sb.from('body_metrics')
      .update({
        weight: entry.v,
        weight_unit: entry.u,
        fat_pct: entry.fat,
        muscle_pct: entry.mmc
      })
      .eq('id', existing.id);

    if (!error) {
      bwCache[dateStr] = { ...entry, id: existing.id } as BodyWeightEntry & { id?: string };
    }
  } else {
    const { data, error } = await sb.from('body_metrics')
      .insert({
        user_id: currentUser!.id,
        date: dateStr,
        weight: entry.v,
        weight_unit: entry.u,
        fat_pct: entry.fat,
        muscle_pct: entry.mmc
      })
      .select('id').single();

    if (!error && data) {
      bwCache[dateStr] = { ...entry, id: data.id };
    }
  }
}

/**
 * Gets body weight cache
 * @returns Body weight data cache
 */
function gBW(): BodyWeightData {
  return bwCache;
}

// ── SUPABASE: HIIT SESSIONS ──

/**
 * Loads HIIT sessions for a specific month
 * @param year - Year
 * @param month - Month (0-based)
 */
async function loadHiitMonth(year: number, month: number): Promise<void> {
  try {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await sb.from('hiit_sessions')
      .select('*')
      .eq('user_id', currentUser!.id)
      .gte('date', from).lte('date', to);

    if (error) {
      console.error('Error cargando HIIT sessions:', error);
      toast('Error cargando sesiones HIIT. Intenta de nuevo.');
      return;
    }

    // Group by date
    const byDate: HIITSessionData = {};
    (data || []).forEach((row: any) => {
      const dateKey = String(row.date);
      byDate[dateKey] ??= [];
      byDate[dateKey].push({ ...row });
    });
    Object.assign(hiitCache, byDate);
  } catch (err) {
    console.error('Exception in loadHiitMonth:', err);
    toast('Error cargando sesiones HIIT.');
  }
}

/**
 * Saves a HIIT session
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param session - HIIT session data
 * @param existingId - Existing session ID for updates
 * @returns Session ID or false on error
 */
async function saveHiitSession(
  dateStr: string,
  session: Omit<HIITSession, 'id' | 'date'>,
  existingId: string | null = null
): Promise<string | false> {
  const payload = {
    user_id: currentUser!.id,
    date: dateStr,
    name: session.name,
    rounds: session.rounds ? Number.parseInt(session.rounds.toString(), 10) : null,
    duration: session.duration,
    notes: session.notes,
    rpe: session.rpe,
    exercises: session.exercises
  };

  if (existingId) {
    const { error } = await sb.from('hiit_sessions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existingId);
    return error ? false : existingId;
  } else {
    const { data, error } = await sb.from('hiit_sessions')
      .insert(payload)
      .select('id').single();
    return (!error && data) ? data.id : false;
  }
}

/**
 * Deletes a HIIT session
 * @param id - Session ID to delete
 */
async function deleteHiitSession(id: string): Promise<void> {
  await sb.from('hiit_sessions').delete().eq('id', id);
}

/**
 * Gets HIIT data in legacy format for compatibility
 * @returns Object with date keys and session arrays
 */
function gHiit(): Record<string, HIITSession[]> {
  const result: Record<string, HIITSession[]> = {};
  for (const [date, sessions] of Object.entries(hiitCache)) {
    result[date] = sessions;
  }
  return result;
}

// ── PERFIL DE USUARIO ──

/**
 * Loads user profile from database
 */
async function loadProfile(): Promise<void> {
  try {
    const { data, error } = await sb.from('profiles')
      .select('*')
      .eq('id', currentUser!.id)
      .single();

    if (!error && data) {
      currentProfile = data;
    } else {
      // Create default profile
      const name = currentUser!.email?.split('@')[0] ?? 'usuario';
      const { data: newP, error: insertErr } = await sb.from('profiles')
        .insert({ id: currentUser!.id, name, color: '#aaff45' })
        .select()
        .single();

      if (insertErr) {
        console.error('Error creating profile:', insertErr);
        currentProfile = { id: currentUser!.id, name, color: '#aaff45' };
      } else {
        currentProfile = newP || { id: currentUser!.id, name, color: '#aaff45' };
      }
    }
  } catch (err) {
    console.error('Exception in loadProfile:', err);
    // Fallback profile
    const name = currentUser!.email?.split('@')[0] ?? 'usuario';
    currentProfile = { id: currentUser!.id, name, color: '#aaff45' };
  }
}

/**
 * Applies user profile data to UI elements
 */
function applyUser(): void {
  if (!currentProfile) return;

  const { name, color } = currentProfile;

  const uName = document.getElementById('uName');
  if (uName) uName.textContent = name;

  const uDot = document.getElementById('uDot');
  if (uDot) {
    uDot.textContent = name.slice(0, 2).toUpperCase();
    uDot.style.background = color;
    uDot.style.color = '#0a1400';
  }

  const profName0 = document.getElementById('profName0');
  if (profName0) profName0.textContent = name;

  const profIc0 = document.getElementById('profIc0');
  if (profIc0) {
    profIc0.style.width = '36px';
    profIc0.style.height = '36px';
    profIc0.style.borderRadius = '50%';
    profIc0.style.border = '3px solid ' + color;
    profIc0.style.background = color + '22';
    profIc0.textContent = '';
  }
}

// EDIT PROFILE (single user)
let selectedColor: string = '#aaff45';

/**
 * Opens the edit profile modal
 */
function openEditProfile(): void {
  const epTitle = document.getElementById('epTitle');
  if (epTitle) epTitle.textContent = 'Editar mi perfil';

  const epName = document.getElementById('epName') as HTMLInputElement;
  if (epName) epName.value = currentProfile?.name || '';

  selectedColor = currentProfile?.color || '#aaff45';
  renderColorPicker();
  openM('editProfMod');
  setTimeout(() => {
    const el = document.getElementById('epName') as HTMLInputElement;
    if (el) {
      el.focus();
      el.select();
    }
  }, 340);
}

/**
 * Renders the color picker for profile editing
 */
function renderColorPicker(): void {
  const epColors = document.getElementById('epColors');
  if (!epColors) return;

  epColors.replaceChildren(
    ...PROFILE_COLORS.map(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ep-col${c === selectedColor ? ' sel' : ''}`;
      btn.style.background = c;
      btn.setAttribute('aria-label', `Color ${c}`);
      btn.setAttribute('aria-pressed', String(c === selectedColor));
      btn.addEventListener('click', () => selectColor(c));
      return btn;
    })
  );
}

/**
 * Selects a color for the profile
 * @param c - Color hex value
 */
function selectColor(c: string): void {
  selectedColor = c;
  renderColorPicker();
}

/**
 * Saves the updated profile
 */
async function saveProfile(): Promise<void> {
  try {
    const epName = document.getElementById('epName') as HTMLInputElement;
    const name = epName?.value.trim();

    if (!name) {
      toast('Escribe un nombre');
      return;
    }

    const { error } = await sb.from('profiles')
      .update({ name, color: selectedColor })
      .eq('id', currentUser!.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast('Error guardando perfil');
      return;
    }

    currentProfile = { ...(currentProfile as UserProfile), name, color: selectedColor };
    closeM('editProfMod');
    applyUser();
    toast('Perfil actualizado ✓');
  } catch (err) {
    console.error('Exception in saveProfile:', err);
    toast('Error guardando perfil. Intenta de nuevo.');
  }
}

// ── AUTH SYSTEM ──
let authMode: AuthMode = 'signin'; // 'signin' | 'signup'

function applySigninOnlyMode(): void {
  authMode = 'signin';

  const authTitle = document.getElementById('authTitle');
  if (authTitle) authTitle.textContent = 'Iniciar sesión';

  const authSub = document.getElementById('authSub');
  if (authSub) authSub.textContent = 'Accede con tu cuenta de IronLog.';

  const authBtn = document.getElementById('authBtn') as HTMLButtonElement;
  if (authBtn) authBtn.textContent = 'Entrar';

  const authNameGroup = document.getElementById('authNameGroup');
  if (authNameGroup) authNameGroup.style.display = 'none';

  const authPw = document.getElementById('authPw') as HTMLInputElement;
  if (authPw) authPw.setAttribute('autocomplete', 'current-password');

  const authToggleText = document.getElementById('authToggleText');
  if (authToggleText?.parentElement) {
    authToggleText.parentElement.style.display = 'none';
  }

  const authToggleLink = document.getElementById('authToggleLink');
  if (authToggleLink?.parentElement) {
    authToggleLink.parentElement.style.display = 'none';
  }

  const forgotPwHint = document.getElementById('forgotPwHint');
  if (forgotPwHint) forgotPwHint.style.display = 'block';
}

/**
 * Toggles between signin and signup modes
 */
function toggleAuthMode(): void { // NOSONAR
  applySigninOnlyMode();
  toast('El registro de nuevos usuarios está deshabilitado');

  const authErr = document.getElementById('authErr');
  if (authErr) authErr.textContent = 'Registro deshabilitado: solo usuarios existentes pueden iniciar sesión.';
}

/**
 * Performs authentication action (signin or signup)
 */
async function doAuthAction(): Promise<void> { // NOSONAR
  try {
    const authEmail = document.getElementById('authEmail') as HTMLInputElement;
    const authPw = document.getElementById('authPw') as HTMLInputElement;
    const authErr = document.getElementById('authErr');

    const email = authEmail?.value.trim();
    const pw = authPw?.value;

    if (authErr) authErr.textContent = '';

    if (!email || !pw) {
      if (authErr) authErr.textContent = 'Completa email y contraseña';
      return;
    }

    const authBtn = document.getElementById('authBtn') as HTMLButtonElement;
    if (authBtn) {
      authBtn.textContent = '…';
      authBtn.disabled = true;
    }

    if (authMode === 'signup') {
      applySigninOnlyMode();
      if (authErr) authErr.textContent = 'Registro deshabilitado: solo usuarios existentes pueden iniciar sesión.';
      if (authBtn) {
        authBtn.textContent = 'Entrar';
        authBtn.disabled = false;
      }
      return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });

    if (error) {
      if (authErr) authErr.textContent = 'Email o contraseña incorrectos';
    } else {
      await enterApp(data.user);
    }

    if (authBtn) {
      authBtn.textContent = 'Entrar';
      authBtn.disabled = false;
    }
  } catch (err) {
    console.error('Error in authentication:', err);

    const authErr = document.getElementById('authErr');
    if (authErr) authErr.textContent = 'Error de conexión. Intenta de nuevo.';

    const authBtn = document.getElementById('authBtn') as HTMLButtonElement;
    if (authBtn) {
      authBtn.textContent = 'Entrar';
      authBtn.disabled = false;
    }
  }
}

/**
 * Sends password reset email
 */
async function sendResetEmail(): Promise<void> {
  try {
    const authEmail = document.getElementById('authEmail') as HTMLInputElement;
    const email = authEmail?.value.trim();

    if (!email) {
      const authErr = document.getElementById('authErr');
      if (authErr) authErr.textContent = 'Escribe tu email primero';
      return;
    }

    const redirectTo = getPasswordResetRedirectUrl();
    const { error } = await sb.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined
    );
    const authErr = document.getElementById('authErr');

    if (error) {
      console.error('Error sending reset email:', error);
      if (authErr) authErr.textContent = error.message;
    } else if (authErr) {
      authErr.style.color = 'var(--accent)';
      authErr.textContent = 'Email de recuperación enviado ✓';
    }
  } catch (err) {
    console.error('Exception sending reset email:', err);
    const authErr = document.getElementById('authErr');
    if (authErr) authErr.textContent = 'Error enviando email. Intenta de nuevo.';
  }
}

/**
 * Enters the main application after successful authentication
 * @param user - Authenticated user object
 */
async function enterApp(user: User): Promise<void> {
  try {
    currentUser = user;
    showLoading(true);

    await loadProfile();

    // Load initial data for current month
    const now = new Date();
    await Promise.all([
      loadGymMonth(now.getFullYear(), now.getMonth()),
      loadBWAll(),
      loadHiitMonth(now.getFullYear(), now.getMonth()),
    ]);

    showLoading(false);
    initTheme();
    applyUser();
    (globalThis as any).viewDate = new Date();
    (globalThis as any).calDate = new Date();
    (globalThis as any).hiitDate = new Date();
    renderToday();
    renderHiitProgress();

    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.classList.add('hidden');
      setTimeout(() => loginScreen.style.display = 'none', 320);
    }
  } catch (err) {
    console.error('Error entering app:', err);
    toast('Error cargando datos. Intenta de nuevo.');
    showLoading(false);
  }
}

/**
 * Shows or hides loading indicator
 * @param show - Whether to show loading indicator
 */
function showLoading(show: boolean): void {
  const loginLoading = document.getElementById('loginLoading');
  const loginStep1 = document.getElementById('loginStep1');

  if (loginLoading) loginLoading.style.display = show ? 'block' : 'none';
  if (loginStep1) loginStep1.style.display = show ? 'none' : 'block';
}

// ── CACHE CLEANUP ──

/**
 * Clears all cached data
 */
function clearCache(): void {
  gymCache = {};
  hiitCache = {};
  bwCache = {};
  currentUser = null;
  currentProfile = null;
}

/**
 * Logs out the current user
 */
async function doLogout(): Promise<void> {
  if (!confirm('¿Cerrar sesión?')) return;
  clearCache();
  await sb.auth.signOut();
  location.reload();
}

/**
 * Initializes the login process
 */
async function initLogin(): Promise<void> {
  try {
    initTheme();

    // Check existing session
    const { data: { session } } = await sb.auth.getSession();

    if (session?.user) {
      await enterApp(session.user);
    } else {
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) loginScreen.style.display = 'flex';
      applySigninOnlyMode();
    }
  } catch (err) {
    console.error('Error initializing login:', err);
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.style.display = 'flex';
  }
}

// ── EXPORTS ──

export {
  // Constants
  SUPABASE_URL,
  SUPABASE_ANON,
  PROFILE_COLORS,

  // State
  dbState,

  // Date helpers
  dk,

  // Gym functions
  loadGymMonth,
  saveGymDay,
  deleteGymDay,
  gD,

  // Body weight functions
  loadBWAll,
  saveBWDay,
  gBW,

  // HIIT functions
  loadHiitMonth,
  saveHiitSession,
  deleteHiitSession,
  gHiit,

  // Profile functions
  loadProfile,
  applyUser,
  openEditProfile,
  renderColorPicker,
  selectColor,
  saveProfile,

  // Auth functions
  toggleAuthMode,
  doAuthAction,
  sendResetEmail,
  enterApp,
  showLoading,
  clearCache,
  doLogout,
  initLogin
};

// Make functions globally available for backward compatibility
(globalThis as any).loadGymMonth = loadGymMonth;
(globalThis as any).saveGymDay = saveGymDay;
(globalThis as any).deleteGymDay = deleteGymDay;
(globalThis as any).gD = gD;
(globalThis as any).loadBWAll = loadBWAll;
(globalThis as any).saveBWDay = saveBWDay;
(globalThis as any).gBW = gBW;
(globalThis as any).loadHiitMonth = loadHiitMonth;
(globalThis as any).saveHiitSession = saveHiitSession;
(globalThis as any).deleteHiitSession = deleteHiitSession;
(globalThis as any).gHiit = gHiit;
(globalThis as any).loadProfile = loadProfile;
(globalThis as any).applyUser = applyUser;
(globalThis as any).openEditProfile = openEditProfile;
(globalThis as any).renderColorPicker = renderColorPicker;
(globalThis as any).selectColor = selectColor;
(globalThis as any).saveProfile = saveProfile;
(globalThis as any).toggleAuthMode = toggleAuthMode;
(globalThis as any).doAuthAction = doAuthAction;
(globalThis as any).sendResetEmail = sendResetEmail;
(globalThis as any).enterApp = enterApp;
(globalThis as any).showLoading = showLoading;
(globalThis as any).clearCache = clearCache;
(globalThis as any).doLogout = doLogout;
(globalThis as any).initLogin = initLogin;
