import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateUser = vi.fn();
const showToast = vi.fn();

vi.mock('../../dashboard/data', () => ({
  sb: {
    auth: {
      updateUser: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

vi.mock('../../dashboard/helpers', () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

describe('dashboard config page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
      <form id="config-password-form">
        <input id="config-password-new" />
        <input id="config-password-confirm" />
        <button id="config-password-submit" type="submit">Actualizar contraseña</button>
        <div id="config-password-error"></div>
      </form>
      <div id="config-account-email"></div>
      <div data-rule="length"></div>
      <div data-rule="upper"></div>
      <div data-rule="lower"></div>
      <div data-rule="digit"></div>
      <div data-rule="symbol"></div>
    `;

    updateUser.mockResolvedValue({ error: null });
  });

  it('muestra email de la cuenta activa', async () => {
    const mod = await import('../../dashboard/pages/config');

    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });
    await mod.loadConfig();

    expect(document.getElementById('config-account-email')?.textContent).toBe('admin@test.com');
  });

  it('bloquea submit si las contraseñas no coinciden', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    (document.getElementById('config-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-confirm') as HTMLInputElement).value = 'Otra1!';
    (document.getElementById('config-password-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();

    expect(updateUser).not.toHaveBeenCalled();
    expect(document.getElementById('config-password-error')?.textContent).toContain('no coinciden');
  });

  it('actualiza la contraseña cuando cumple validaciones', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    (document.getElementById('config-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-confirm') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(updateUser).toHaveBeenCalledWith({ password: 'Segura1!' });
    expect(showToast).toHaveBeenCalledWith('Contraseña actualizada', 'success');
    expect((document.getElementById('config-password-new') as HTMLInputElement).value).toBe('');
  });

  it('bloquea submit si los campos estan vacios', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    (document.getElementById('config-password-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();

    expect(updateUser).not.toHaveBeenCalled();
    expect(document.getElementById('config-password-error')?.textContent).toContain('Completa ambos campos');
  });

  it('bloquea submit si la contraseña no cumple validaciones', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    (document.getElementById('config-password-new') as HTMLInputElement).value = 'debil';
    (document.getElementById('config-password-confirm') as HTMLInputElement).value = 'debil';
    (document.getElementById('config-password-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();

    expect(updateUser).not.toHaveBeenCalled();
    expect(document.getElementById('config-password-error')?.textContent).toBeTruthy();
  });

  it('muestra error cuando updateUser devuelve error', async () => {
    updateUser.mockResolvedValue({ error: { message: 'Token de sesion expirado' } });

    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    (document.getElementById('config-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-confirm') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('config-password-error')?.textContent).toContain('Token de sesion expirado');
  });

  it('muestra error cuando updateUser lanza excepcion', async () => {
    updateUser.mockRejectedValue(new Error('error de red'));

    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    (document.getElementById('config-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-confirm') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('config-password-error')?.textContent).toContain('error de red');
  });

  it('no re-inicializa el formulario si ya fue inicializado', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    // Second call should be a no-op (form.dataset.initialized === 'true')
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    // Submit should only be handled once (no duplicate listeners)
    (document.getElementById('config-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-confirm') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('config-password-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  it('evento input en campo contraseña actualiza reglas y limpia error', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    const errorEl = document.getElementById('config-password-error');
    if (errorEl) errorEl.textContent = 'error previo';

    const pwInput = document.getElementById('config-password-new') as HTMLInputElement;
    pwInput.value = 'Segura1!';
    pwInput.dispatchEvent(new Event('input'));

    expect(document.getElementById('config-password-error')?.textContent).toBe('');
    const lengthRule = document.querySelector('[data-rule="length"]');
    expect(lengthRule?.classList.contains('is-ok')).toBe(true);
  });

  it('evento input en campo confirmacion limpia error', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => ({ id: 'u1', email: 'admin@test.com' }) });

    const errorEl = document.getElementById('config-password-error');
    if (errorEl) errorEl.textContent = 'error previo';

    const confirmInput = document.getElementById('config-password-confirm') as HTMLInputElement;
    confirmInput.dispatchEvent(new Event('input'));

    expect(document.getElementById('config-password-error')?.textContent).toBe('');
  });

  it('muestra sesion activa cuando no hay email de usuario', async () => {
    const mod = await import('../../dashboard/pages/config');
    mod.initConfigPage({ getCurrentUser: () => null });

    expect(document.getElementById('config-account-email')?.textContent).toBe('Sesion activa');
  });
});