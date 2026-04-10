import { validatePassword } from '../auth';
import { sb } from '../data';
import { showToast } from '../helpers';
import type { AuthUser } from '../types';

let getCurrentUserRef: () => AuthUser | null = () => null;

function setConfigError(message: string): void {
  const errorEl = document.getElementById('config-password-error');
  if (errorEl) {
    errorEl.textContent = message;
  }
}

function renderAccountSummary(): void {
  const emailEl = document.getElementById('config-account-email');
  if (!emailEl) return;

  const currentUser = getCurrentUserRef();
  emailEl.textContent = currentUser?.email || 'Sesion activa';
}

function updatePasswordRules(password: string): void {
  const rules: Record<string, boolean> = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z\d]/.test(password),
  };

  Object.entries(rules).forEach(([rule, passed]) => {
    const node = document.querySelector(`[data-rule="${rule}"]`);
    if (node) {
      node.classList.toggle('is-ok', passed);
    }
  });
}

function setSubmitState(isBusy: boolean): void {
  const submitButton = document.getElementById('config-password-submit') as HTMLButtonElement | null;
  if (!submitButton) return;

  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? 'Actualizando…' : 'Actualizar contraseña';
}

async function submitPasswordChange(): Promise<void> {
  const passwordInput = document.getElementById('config-password-new') as HTMLInputElement | null;
  const confirmInput = document.getElementById('config-password-confirm') as HTMLInputElement | null;

  const password = passwordInput?.value || '';
  const confirmPassword = confirmInput?.value || '';

  setConfigError('');

  if (!password || !confirmPassword) {
    setConfigError('Completa ambos campos.');
    return;
  }

  if (password !== confirmPassword) {
    setConfigError('Las contraseñas no coinciden.');
    return;
  }

  const validationError = validatePassword(password);
  if (validationError) {
    setConfigError(validationError);
    return;
  }

  setSubmitState(true);

  try {
    const { error } = (await sb.auth.updateUser({ password })) as { error: { message: string } | null };
    if (error) {
      setConfigError(error.message);
      return;
    }

    if (passwordInput) passwordInput.value = '';
    if (confirmInput) confirmInput.value = '';
    updatePasswordRules('');
    showToast('Contraseña actualizada', 'success');
  } catch (error) {
    setConfigError(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.');
  } finally {
    setSubmitState(false);
  }
}

export function initConfigPage(options: { getCurrentUser: () => AuthUser | null }): void {
  getCurrentUserRef = options.getCurrentUser;
  renderAccountSummary();

  const form = document.getElementById('config-password-form') as HTMLFormElement | null;
  const passwordInput = document.getElementById('config-password-new') as HTMLInputElement | null;
  const confirmInput = document.getElementById('config-password-confirm') as HTMLInputElement | null;

  if (!form || form.dataset.initialized === 'true') {
    return;
  }

  form.dataset.initialized = 'true';
  updatePasswordRules('');

  passwordInput?.addEventListener('input', () => {
    updatePasswordRules(passwordInput.value);
    setConfigError('');
  });

  confirmInput?.addEventListener('input', () => {
    setConfigError('');
  });

  form.addEventListener('submit', (event: Event) => {
    event.preventDefault();
    void submitPasswordChange();
  });
}

export async function loadConfig(): Promise<void> {
  renderAccountSummary();
}