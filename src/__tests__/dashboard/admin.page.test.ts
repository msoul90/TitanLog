import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchProfiles = vi.fn();
const fetchAdmins = vi.fn();
const showToast = vi.fn();
const rpc = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchProfiles: (...args: unknown[]) => fetchProfiles(...args),
  fetchAdmins: (...args: unknown[]) => fetchAdmins(...args),
  sb: {
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
    vi.resetModules();
    vi.clearAllMocks();

    document.body.innerHTML = '<input id="admin-search" /><table><tbody id="admin-tbody"></tbody></table>';
    rpc.mockResolvedValue({ error: null });

    fetchProfiles.mockResolvedValue([
      { id: 'u1', name: 'Ana', color: '#111' },
      { id: 'u2', name: 'Luis', color: '#222' },
    ]);
    fetchAdmins.mockResolvedValue(['u1']);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renderiza tabla y filtra por busqueda', async () => {
    const signOut = vi.fn(async () => {});
    const mod = await import('../../dashboard/pages/admin');

    mod.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut });
    await mod.loadAdmin();

    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('Ana');

    const search = document.getElementById('admin-search') as HTMLInputElement;
    search.value = 'luis';
    search.dispatchEvent(new Event('input'));

    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('Luis');
    expect(document.getElementById('admin-tbody')?.innerHTML).not.toContain('Ana');
  });

  it('concede y revoca acceso admin', async () => {
    const signOut = vi.fn(async () => {});
    const mod = await import('../../dashboard/pages/admin');

    mod.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut });
    await mod.loadAdmin();

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

    const mod = await import('../../dashboard/pages/admin');
    mod.initAdminPage({ getCurrentUser: () => ({ id: 'u1', email: 'a@test.com' }), signOut: async () => {} });
    await mod.loadAdmin();

    expect(document.querySelector('#admin-tbody img')).toBeNull();
    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('&lt;img');
    expect(document.getElementById('admin-tbody')?.innerHTML).toContain('#9090b8');
  });
});
