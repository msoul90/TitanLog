import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchProfiles = vi.fn();
const fetchAdmins = vi.fn();
const showToast = vi.fn();
const insert = vi.fn();
const delEq = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchProfiles: (...args: unknown[]) => fetchProfiles(...args),
  fetchAdmins: (...args: unknown[]) => fetchAdmins(...args),
  sb: {
    from: (table: string) => {
      if (table !== 'gym_admins') throw new Error('unexpected table');
      return {
        insert: (...args: unknown[]) => insert(...args),
        delete: () => ({ eq: (...args: unknown[]) => delEq(...args) }),
      };
    },
  },
}));

vi.mock('../../dashboard/helpers', () => ({
  initials: (name: string) => (name || '?').slice(0, 1).toUpperCase(),
  showToast: (...args: unknown[]) => showToast(...args),
}));

describe('dashboard admin page', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    document.body.innerHTML = '<input id="admin-search" /><table><tbody id="admin-tbody"></tbody></table>';
    insert.mockResolvedValue({ error: null });
    delEq.mockResolvedValue({ error: null });

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
    expect(insert).toHaveBeenCalled();

    target.checked = false;
    target.dispatchEvent(new Event('change'));
    await Promise.resolve();
    expect(delEq).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalled();
  });
});
