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
});