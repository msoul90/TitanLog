import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminPage from '../../dashboard/pages/admin';

const fetchProfiles = vi.fn();
const fetchAdmins = vi.fn();
const fetchSuperAdmins = vi.fn();
const showToast = vi.fn();
const rpc = vi.fn();
const getSessionAdmin = vi.fn();
const fetchMock = vi.fn();
const manageUser = vi.fn();
const invalidateCache = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchProfiles: (...args: unknown[]) => fetchProfiles(...args),
  fetchAdmins: (...args: unknown[]) => fetchAdmins(...args),
  fetchSuperAdmins: (...args: unknown[]) => fetchSuperAdmins(...args),
  manageUser: (...args: unknown[]) => manageUser(...args),
  invalidateCache: (...args: unknown[]) => invalidateCache(...args),
  sb: {
    auth: {
      getSession: (...args: unknown[]) => getSessionAdmin(...args),
    },
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

vi.mock('../../dashboard/helpers', () => ({
  initials: (name: string) => (name || '?').slice(0, 1).toUpperCase(),
  escapeHtml: (value: unknown) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;'),
  safeColor: (value: string | null | undefined, fallback: string) => {
    const normalized = (value || '').trim();
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized) ? normalized : fallback;
  },
  showToast: (...args: unknown[]) => showToast(...args),
}));

describe('dashboard admin page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    document.body.innerHTML = `
      <input id="admin-search" />
      <div id="invite-card" class="is-hidden"></div>
      <div id="invite-lock-message" class="is-hidden"></div>
      <form id="invite-form">
        <input id="invite-email" />
        <div id="invite-grant-wrap"></div>
        <input id="invite-grant-dashboard" type="checkbox" />
        <button id="invite-submit" type="submit">Invitar</button>
      </form>
      <table><tbody id="admin-tbody"></tbody></table>
      <section id="admin-disabled-section" class="is-hidden">
        <span id="admin-disabled-count"></span>
        <table><tbody id="admin-disabled-tbody"></tbody></table>
      </section>
    `;
    rpc.mockImplementation((fn: unknown) => {
      if (fn === 'can_invite') return Promise.resolve({ data: true, error: null });
      if (fn === 'is_super_admin') return Promise.resolve({ data: true, error: null });
      return Promise.resolve({ data: null, error: null });
    });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ invited_email: 'nuevo@test.com', default_password_masked: 'Ele******26' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    getSessionAdmin.mockResolvedValue({ data: { session: { access_token: 'jwt-token-123' } }, error: null });
    manageUser.mockResolvedValue(undefined);
    invalidateCache.mockImplementation(() => {});

    fetchProfiles.mockResolvedValue([
      { id: 'u1', name: 'Ana', color: '#111' },
      { id: 'u2', name: 'Luis', color: '#222' },
    ]);
    fetchAdmins.mockResolvedValue(['u2']);
    fetchSuperAdmins.mockResolvedValue(['u1']);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renderiza tabla y filtra por busqueda', async () => {
    const signOut = vi.fn(async () => {});

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut });
    await adminPage.loadAdmin();

    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('Ana');
    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('Super Admin');
    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('Gym Admin');

    const search = document.getElementById('admin-search') as HTMLInputElement;
    search.value = 'luis';
    search.dispatchEvent(new Event('input'));

    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('Luis');
    expect(document.getElementById('admin-tbody')?.innerHTML).not.toContain('Ana');
  });

  it('concede y revoca acceso admin', async () => {
    const signOut = vi.fn(async () => {});

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut });
    await adminPage.loadAdmin();

    const toggles = Array.from(document.querySelectorAll('.admin-toggle')) as HTMLInputElement[];
    const target = toggles.find((t) => t.dataset.uid === 'u2');
    if (!target) throw new Error('toggle not found');

    target.checked = true;
    target.dispatchEvent(new Event('change'));
    await Promise.resolve();
    expect(rpc).toHaveBeenCalledWith('set_gym_admin', { target_user_id: 'u2', grant_access: true });

    target.checked = false;
    target.dispatchEvent(new Event('change'));
    await Promise.resolve();
    expect(rpc).toHaveBeenCalledWith('set_gym_admin', { target_user_id: 'u2', grant_access: false });
    expect(showToast).toHaveBeenCalled();
  });

  it('escapa nombres y sanea colores al renderizar', async () => {
    fetchProfiles.mockResolvedValue([{ id: 'u1', name: '<img src=x onerror=alert(1)>', color: 'url(javascript:alert(1))' }]);
    fetchAdmins.mockResolvedValue(['u1']);

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    expect(document.querySelector('#admin-tbody img')).toBeNull();
    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('&lt;img');
    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('#9090b8');
  });

  it('invita usuarios via edge function', async () => {
    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const email = document.getElementById('invite-email') as HTMLInputElement;
    const grant = document.getElementById('invite-grant-dashboard') as HTMLInputElement;
    email.value = 'nuevo@test.com';
    grant.checked = true;

    (document.getElementById('invite-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/functions/v1/invite-user'), {
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer jwt-token-123',
      }),
      body: JSON.stringify({
        email: 'nuevo@test.com',
        grant_dashboard_access: true,
      }),
    });
    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Usuario creado: nuevo@test.com. Password temporal configurado: Ele******26', 'success');
    });
  });

  it('submitInvite muestra error cuando email es invalido', async () => {
    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const email = document.getElementById('invite-email') as HTMLInputElement;
    email.value = 'emailsinarroba';
    (document.getElementById('invite-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Ingresa un email valido', 'error');
  });

  it('submitInvite muestra error cuando no hay permiso para invitar', async () => {
    rpc.mockImplementation((fn: unknown) => {
      if (fn === 'can_invite') return Promise.resolve({ data: false, error: null });
      if (fn === 'is_super_admin') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const email = document.getElementById('invite-email') as HTMLInputElement;
    email.value = 'nuevo@test.com';
    (document.getElementById('invite-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('No tienes permisos para invitar usuarios', 'error');
  });

  it('submitInvite muestra error cuando no hay token de sesion', async () => {
    getSessionAdmin.mockResolvedValue({ data: { session: null }, error: null });

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const email = document.getElementById('invite-email') as HTMLInputElement;
    email.value = 'nuevo@test.com';
    (document.getElementById('invite-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Error al invitar'), 'error');
  });

  it('submitInvite muestra error cuando fetch lanza excepcion', async () => {
    fetchMock.mockRejectedValue(new Error('function error'));

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const email = document.getElementById('invite-email') as HTMLInputElement;
    email.value = 'nuevo@test.com';
    (document.getElementById('invite-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(showToast).toHaveBeenCalledWith('Error al invitar: function error', 'error');
  });

  it('submitInvite muestra error cuando getSession devuelve error', async () => {
    getSessionAdmin.mockResolvedValue({ data: { session: null }, error: { message: 'session error' } });

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const email = document.getElementById('invite-email') as HTMLInputElement;
    email.value = 'nuevo@test.com';
    (document.getElementById('invite-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Error al invitar: Error desconocido', 'error');
  });

  it('submitInvite muestra error cuando edge function responde no-ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'invite failed' }),
    });

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const email = document.getElementById('invite-email') as HTMLInputElement;
    email.value = 'nuevo@test.com';
    (document.getElementById('invite-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Error al invitar: invite failed', 'error');
    });
  });

  it('toggleAdmin cancela cuando usuario rechaza quitarse su propio acceso', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const toggles = Array.from(document.querySelectorAll('.admin-toggle')) as HTMLInputElement[];
    const selfToggle = toggles.find((t) => t.dataset.uid === 'u1');
    if (!selfToggle) throw new Error('self toggle not found');

    selfToggle.checked = false;
    selfToggle.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(rpc).not.toHaveBeenCalledWith('set_gym_admin', expect.anything());
    expect(selfToggle.checked).toBe(true);
  });

  it('toggleAdmin llama signOut cuando usuario revoca su propio acceso y confirma', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const signOut = vi.fn(async () => {});

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut });
    await adminPage.loadAdmin();

    const toggles = Array.from(document.querySelectorAll('.admin-toggle')) as HTMLInputElement[];
    const selfToggle = toggles.find((t) => t.dataset.uid === 'u1');
    if (!selfToggle) throw new Error('self toggle not found');

    selfToggle.checked = false;
    selfToggle.dispatchEvent(new Event('change'));
    await Promise.resolve();
    await Promise.resolve();

    expect(rpc).toHaveBeenCalledWith('set_gym_admin', { target_user_id: 'u1', grant_access: false });
    await vi.waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it('toggleAdmin muestra error y revierte checkbox cuando rpc falla', async () => {
    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    rpc.mockImplementation((fn: unknown) => {
      if (fn === 'set_gym_admin') return Promise.resolve({ data: null, error: { message: 'permiso denegado' } });
      return Promise.resolve({ data: null, error: null });
    });

    const toggles = Array.from(document.querySelectorAll('.admin-toggle')) as HTMLInputElement[];
    const target = toggles.find((t) => t.dataset.uid === 'u2');
    if (!target) throw new Error('toggle not found');

    const initialChecked = target.checked;
    target.checked = !initialChecked;
    target.dispatchEvent(new Event('change'));
    await Promise.resolve();
    await Promise.resolve();

    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Error'), 'error');
    expect(target.checked).toBe(initialChecked);
  });

  it('renderAdminTable muestra estado vacio cuando no hay usuarios', async () => {
    fetchProfiles.mockResolvedValue([]);
    fetchAdmins.mockResolvedValue([]);
    fetchSuperAdmins.mockResolvedValue([]);

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('Sin usuarios');
  });

  it('acciones de usuario deshabilitan y eliminan desde botones de fila', async () => {
    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    const disableBtn = document.querySelector('.action-user-toggle[data-uid="u2"]') as HTMLButtonElement;
    const deleteBtn = document.querySelector('.action-user-delete[data-uid="u2"]') as HTMLButtonElement;
    disableBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(manageUser).toHaveBeenCalledWith('u2', 'disable');
    expect(invalidateCache).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Usuario deshabilitado', 'success');

    deleteBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(manageUser).toHaveBeenCalledWith('u2', 'delete');
    expect(showToast).toHaveBeenCalledWith('Usuario eliminado', 'error');
  });

  it('renderiza seccion de deshabilitados y permite habilitar usuario', async () => {
    fetchProfiles.mockResolvedValue([
      { id: 'u1', name: 'Ana', color: '#111' },
      { id: 'u2', name: 'Luis', color: '#222', is_disabled: true },
    ]);

    adminPage.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await adminPage.loadAdmin();

    expect(document.getElementById('admin-disabled-section')?.classList.contains('is-hidden')).toBe(false);
    expect(document.getElementById('admin-disabled-count')?.textContent).toBe('1');

    const enableBtn = document.querySelector('#admin-disabled-tbody .action-user-toggle[data-uid="u2"]') as HTMLButtonElement;
    enableBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(manageUser).toHaveBeenCalledWith('u2', 'enable');
    expect(showToast).toHaveBeenCalledWith('Usuario habilitado', 'success');
  });
});
