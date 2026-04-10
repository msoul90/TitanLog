import { safeColor } from './helpers';
import { getDashboardSupabaseError, sb } from './data';
import type { AuthUser } from './types';

let currentUser: AuthUser | null = null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'No se pudo completar la autenticacion.';
}

function setAuthError(message: string): void {
  const errorNode = document.getElementById('auth-error');
  if (errorNode) {
    errorNode.textContent = message;
  }
}

function showScreen(screen: 'auth' | 'noaccess' | 'app'): void {
  const auth = document.getElementById('auth-screen');
  const noaccess = document.getElementById('noaccess-screen');
  const app = document.getElementById('app');
  if (!auth || !noaccess || !app) return;

  auth.style.display = screen === 'auth' ? 'flex' : 'none';
  noaccess.style.display = screen === 'noaccess' ? 'flex' : 'none';
  app.style.display = screen === 'app' ? 'block' : 'none';

  if (screen === 'app') {
    const submit = document.getElementById('auth-submit') as HTMLButtonElement | null;
    if (submit) {
      submit.disabled = false;
      submit.textContent = 'Iniciar sesión';
    }
  }
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data } = await sb.from('gym_admins').select('user_id').eq('user_id', userId).single();
  return !!data;
}

async function loadProfile(userId: string): Promise<void> {
  const { data } = await sb.from('profiles').select('name,color').eq('id', userId).single();
  const fallbackName = currentUser?.email?.split('@')[0] || 'Admin';
  const name = data?.name || fallbackName;

  const sidebarName = document.getElementById('sidebar-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarAvatar) {
    sidebarAvatar.textContent = name[0]?.toUpperCase() || 'A';
    if (data?.color) {
      const avatarColor = safeColor(data.color, '#4ab8ff');
      sidebarAvatar.style.background = avatarColor + '33';
      sidebarAvatar.style.color = avatarColor;
    }
  }
}

async function handleUser(user: AuthUser | null | undefined, onAuthorized: () => Promise<void> | void): Promise<void> {
  if (!user) {
    showScreen('auth');
    return;
  }
  currentUser = user;
  const isAdmin = await checkAdmin(user.id);
  if (!isAdmin) {
    showScreen('noaccess');
    return;
  }
  await loadProfile(user.id);
  showScreen('app');
  await onAuthorized();
}

async function signIn(onAuthorized: () => Promise<void> | void): Promise<void> {
  const emailEl = document.getElementById('auth-email') as HTMLInputElement | null;
  const passwordEl = document.getElementById('auth-password') as HTMLInputElement | null;
  const btn = document.getElementById('auth-submit') as HTMLButtonElement | null;
  if (!emailEl || !passwordEl || !btn) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  setAuthError('');

  if (!email || !password) {
    setAuthError('Completa todos los campos.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Iniciando…';

  try {
    const { data, error } = (await sb.auth.signInWithPassword({ email, password })) as {
      data: { user?: AuthUser | null };
      error: { message: string } | null;
    };

    if (error) {
      setAuthError(error.message);
      return;
    }

    await handleUser(data.user, onAuthorized);
  } catch (error) {
    setAuthError(getErrorMessage(error));
  } finally {
    if (document.getElementById('app')?.style.display !== 'block') {
      btn.disabled = false;
      btn.textContent = 'Iniciar sesión';
    }
  }
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export async function signOut(): Promise<void> {
  await sb.auth.signOut();
  currentUser = null;
  showScreen('auth');
}

export async function initAuth(onAuthorized: () => Promise<void> | void): Promise<void> {
  showScreen('auth');
  const dashboardSupabaseError = getDashboardSupabaseError();
  if (dashboardSupabaseError) {
    setAuthError(dashboardSupabaseError);
  }

  const submit = document.getElementById('auth-submit');
  const password = document.getElementById('auth-password');
  const noAccessSignOut = document.getElementById('noaccess-signout');
  const topbarSignOut = document.getElementById('signout-btn');

  submit?.addEventListener('click', () => signIn(onAuthorized));
  password?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') signIn(onAuthorized);
  });
  noAccessSignOut?.addEventListener('click', () => signOut());
  topbarSignOut?.addEventListener('click', () => signOut());

  try {
    const {
      data: { session },
    } = (await sb.auth.getSession()) as {
      data: { session?: { user?: AuthUser | null } | null };
    };

    if (session?.user) {
      await handleUser(session.user, onAuthorized);
    }

    sb.auth.onAuthStateChange(async (event: string) => {
      if (event === 'SIGNED_OUT') {
        showScreen('auth');
      }
    });
  } catch (error) {
    setAuthError(getErrorMessage(error));
  }
}
