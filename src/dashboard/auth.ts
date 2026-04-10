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

function showScreen(screen: 'auth' | 'noaccess' | 'app' | 'set-password'): void {
  const auth = document.getElementById('auth-screen');
  const noaccess = document.getElementById('noaccess-screen');
  const app = document.getElementById('app');
  const setpw = document.getElementById('set-password-screen');
  if (!auth || !noaccess || !app) return;

  auth.style.display = screen === 'auth' ? 'flex' : 'none';
  noaccess.style.display = screen === 'noaccess' ? 'flex' : 'none';
  app.style.display = screen === 'app' ? 'block' : 'none';
  if (setpw) setpw.style.display = screen === 'set-password' ? 'flex' : 'none';

  if (screen === 'app') {
    const submit = document.getElementById('auth-submit') as HTMLButtonElement | null;
    if (submit) {
      submit.disabled = false;
      submit.textContent = 'Iniciar sesión';
    }
  }
}

// Exported so tests can validate rules directly
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Mínimo 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una letra mayúscula.';
  if (!/[a-z]/.test(password)) return 'Debe incluir al menos una letra minúscula.';
  if (!/\d/.test(password)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z\d]/.test(password)) return 'Debe incluir al menos un símbolo (! @ # $ % …).';
  return null;
}

function computeStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: '' };
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z\d]/.test(p)) score++;
  const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
  const colors = ['', '#e53935', '#fb8c00', '#fdd835', '#7cb342', '#2e7d32'];
  return { score, label: labels[score], color: colors[score] };
}

function initSetPasswordForm(onAuthorized: () => Promise<void> | void, mode: 'invite' | 'recovery' = 'invite'): void {
  const newPwEl = document.getElementById('set-password-new') as HTMLInputElement | null;
  const confirmEl = document.getElementById('set-password-confirm') as HTMLInputElement | null;
  const submitBtn = document.getElementById('set-password-submit') as HTMLButtonElement | null;
  const errorEl = document.getElementById('set-password-error');
  const strengthFill = document.getElementById('pw-strength-fill');
  const strengthLabel = document.getElementById('pw-strength-label');
  const subEl = document.getElementById('set-password-sub');

  if (!newPwEl || !confirmEl || !submitBtn) return;

  const btnLabel = mode === 'recovery' ? 'Restablecer contraseña' : 'Activar cuenta';
  submitBtn.textContent = btnLabel;
  if (subEl) {
    subEl.textContent = mode === 'recovery'
      ? 'Ingresa tu nueva contraseña para restablecer el acceso'
      : 'Bienvenido — crea tu contraseña para activar tu cuenta';
  }

  newPwEl.addEventListener('input', () => {
    const { score, label, color } = computeStrength(newPwEl.value);
    if (strengthFill) {
      strengthFill.style.width = `${(score / 5) * 100}%`;
      strengthFill.style.background = color;
    }
    if (strengthLabel) {
      strengthLabel.textContent = label;
      strengthLabel.style.color = color;
    }
  });

  const doSubmit = async (): Promise<void> => {
    const password = newPwEl.value;
    const confirm = confirmEl.value;
    if (errorEl) errorEl.textContent = '';

    if (password !== confirm) {
      if (errorEl) errorEl.textContent = 'Las contraseñas no coinciden.';
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      if (errorEl) errorEl.textContent = validationError;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando…';

    try {
      const { error } = (await sb.auth.updateUser({ password })) as { error: { message: string } | null };
      if (error) {
        if (errorEl) errorEl.textContent = error.message;
        return;
      }
      // Remove invite tokens from URL so refreshing doesn't re-trigger the flow
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      await handleUser(currentUser, onAuthorized);
    } catch (err) {
      if (errorEl) errorEl.textContent = getErrorMessage(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = btnLabel;
    }
  };

  submitBtn.addEventListener('click', () => void doSubmit());
  confirmEl.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') void doSubmit();
  });
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data, error } = await sb.rpc('is_gym_admin', { uid: userId });
  if (error) {
    throw error;
  }
  return Boolean(data);
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
  let isAdmin = false;
  try {
    isAdmin = await checkAdmin(user.id);
  } catch (error) {
    setAuthError('No se pudo validar el acceso admin. Revisa RLS/tabla gym_admins e intenta de nuevo.');
    console.error('Error checking admin access:', getErrorMessage(error));
    showScreen('auth');
    return;
  }
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
  currentUser = null;
  showScreen('auth');

  // Always return to login UI, even if remote sign-out fails.
  try {
    await sb.auth.signOut();
  } catch (error) {
    console.error('Error while signing out:', getErrorMessage(error));
    setAuthError('No se pudo cerrar sesión en el servidor, pero saliste localmente.');
  }
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

  sb.auth.onAuthStateChange(async (event: string) => {
    if (event === 'SIGNED_OUT') {
      showScreen('auth');
    }
    if (event === 'PASSWORD_RECOVERY') {
      const { data: { session } } = (await sb.auth.getSession()) as {
        data: { session?: { user?: AuthUser | null } | null };
      };
      if (session?.user) {
        currentUser = session.user as AuthUser;
        showScreen('set-password');
        initSetPasswordForm(onAuthorized, 'recovery');
      }
    }
  });

  // Detect invite/recovery flow from URL hash
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hashType = hashParams.get('type');
  const isSetPasswordFlow = hashType === 'invite' || hashType === 'recovery';

  try {
    const {
      data: { session },
    } = (await sb.auth.getSession()) as {
      data: { session?: { user?: AuthUser | null } | null };
    };

    if (isSetPasswordFlow && session?.user) {
      currentUser = session.user as AuthUser;
      showScreen('set-password');
      initSetPasswordForm(onAuthorized, hashType as 'invite' | 'recovery');
      return;
    }

    if (session?.user) {
      await handleUser(session.user, onAuthorized);
    }
  } catch (error) {
    setAuthError(getErrorMessage(error));
  }
}
