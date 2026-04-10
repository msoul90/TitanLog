import { fetchAdmins, fetchProfiles, sb } from '../data';
import { escapeHtml, initials, safeColor, showToast } from '../helpers';
import { AdminUserRow, AuthUser } from '../types';

let adminData: AdminUserRow[] = [];
let getCurrentUserRef: () => AuthUser | null = () => null;
let signOutRef: () => Promise<void> = async () => {};

export function initAdminPage(options: { getCurrentUser: () => AuthUser | null; signOut: () => Promise<void> }): void {
  getCurrentUserRef = options.getCurrentUser;
  signOutRef = options.signOut;

  document.getElementById('admin-search')?.addEventListener('input', (e: Event) => {
    const q = ((e.target as HTMLInputElement | null)?.value || '').toLowerCase();
    renderAdminTable(adminData.filter((u) => (u.name || '').toLowerCase().includes(q)));
  });
}

export async function loadAdmin(): Promise<void> {
  const [profiles, admins] = await Promise.all([fetchProfiles(), fetchAdmins()]);
  const adminSet = new Set(admins);
  adminData = profiles.map((p) => ({ ...p, isAdmin: adminSet.has(p.id) }));
  renderAdminTable(adminData);
}

function renderAdminTable(data: AdminUserRow[]): void {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;

  tbody.innerHTML = data.length
    ? data
        .map((u) => {
          const color = safeColor(u.color, '#9090b8');
          const name = escapeHtml(u.name || '—');
          const avatar = escapeHtml(initials(u.name));
          const userId = escapeHtml(u.id);

          return `<tr data-uid="${userId}">
    <td><div class="avatar-cell">
      <div class="avatar" style="background:${color + '33'};color:${color}">${avatar}</div>
      <div>
        <div class="avatar-name">${name}</div>
      </div>
    </div></td>
    <td class="text-sm text2">—</td>
    <td>${u.isAdmin ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-member">Miembro</span>'}</td>
    <td>
      <label class="toggle-wrap">
        <label class="toggle">
          <input type="checkbox" ${u.isAdmin ? 'checked' : ''} data-uid="${userId}" class="admin-toggle">
          <span class="toggle-slider"></span>
        </label>
        <span class="text-sm text3">${u.isAdmin ? 'Activo' : 'Sin acceso'}</span>
      </label>
    </td>
  </tr>`;
        })
        .join('')
    : '<tr><td colspan="4"><div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">Sin usuarios</div></div></td></tr>';

  tbody.querySelectorAll('.admin-toggle').forEach((input) => {
    input.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      if (!target?.dataset.uid) return;
      void toggleAdmin(target.dataset.uid, target.checked, target);
    });
  });
}

async function toggleAdmin(uid: string, grant: boolean, inputEl: HTMLInputElement): Promise<void> {
  const currentUser = getCurrentUserRef();

  if (!grant && currentUser?.id === uid) {
    const confirm = globalThis.confirm('¿Seguro que quieres quitarte acceso al dashboard? Perderás acceso inmediatamente.');
    if (!confirm) {
      inputEl.checked = true;
      return;
    }
  }

  try {
    if (grant) {
      const { error } = await sb.from('gym_admins').insert({ user_id: uid, added_by: currentUser?.id });
      if (error) throw error;
      showToast('Acceso concedido', 'success');
    } else {
      const { error } = await sb.from('gym_admins').delete().eq('user_id', uid);
      if (error) throw error;
      showToast('Acceso revocado');
    }

    adminData = adminData.map((u) => (u.id === uid ? { ...u, isAdmin: grant } : u));
    renderAdminTable(adminData);

    if (!grant && currentUser?.id === uid) {
      await signOutRef();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error: ' + message, 'error');
    inputEl.checked = !grant;
  }
}
