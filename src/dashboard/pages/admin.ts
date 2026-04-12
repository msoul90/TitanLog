import { fetchAdmins, fetchProfiles, fetchSuperAdmins, manageUser, sb } from '../data';
import { escapeHtml, initials, safeColor, showToast } from '../helpers';
import { AdminUserRow, AuthUser } from '../types';

let adminData: AdminUserRow[] = [];
let getCurrentUserRef: () => AuthUser | null = () => null;
let signOutRef: () => Promise<void> = async () => {};
let canInvite = false;
let isSuperAdmin = false;

function toBool(value: unknown): boolean {
  return value === true;
}

function applyInviteUiState(): void {
  const card = document.getElementById('invite-card');
  const lockMessage = document.getElementById('invite-lock-message');
  const grantWrap = document.getElementById('invite-grant-wrap');
  const grantInput = document.getElementById('invite-grant-dashboard') as HTMLInputElement | null;
  const submitButton = document.getElementById('invite-submit') as HTMLButtonElement | null;

  if (card) card.classList.toggle('is-hidden', !canInvite);
  if (lockMessage) lockMessage.classList.toggle('is-hidden', canInvite);

  if (grantWrap) grantWrap.classList.toggle('is-hidden', !canInvite || !isSuperAdmin);
  if (grantInput) {
    grantInput.disabled = !canInvite || !isSuperAdmin;
    if (!isSuperAdmin) grantInput.checked = false;
  }
  if (submitButton) submitButton.disabled = !canInvite;
}

async function loadAdminPermissions(): Promise<void> {
  const [inviteRes, superRes] = await Promise.all([sb.rpc('can_invite'), sb.rpc('is_super_admin')]);
  if (inviteRes.error) throw inviteRes.error;
  if (superRes.error) throw superRes.error;

  canInvite = toBool(inviteRes.data);
  isSuperAdmin = toBool(superRes.data);
  applyInviteUiState();
}

export function initAdminPage(options: { getCurrentUser: () => AuthUser | null; signOut: () => Promise<void> }): void {
  getCurrentUserRef = options.getCurrentUser;
  signOutRef = options.signOut;

  document.getElementById('admin-search')?.addEventListener('input', (e: Event) => {
    const q = ((e.target as HTMLInputElement | null)?.value || '').toLowerCase();
    renderAdminTable(adminData.filter((u) => (u.name || '').toLowerCase().includes(q)));
  });

  document.getElementById('invite-form')?.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    void submitInvite();
  });
}

export async function loadAdmin(): Promise<void> {
  const [profiles, admins, superAdmins] = await Promise.all([
    fetchProfiles(),
    fetchAdmins(),
    fetchSuperAdmins(),
    loadAdminPermissions(),
  ]);
  const adminSet = new Set(admins);
  const superSet = new Set(superAdmins);
  const currentUser = getCurrentUserRef();

  adminData = profiles.map((p) => {
    const isSuper = superSet.has(p.id) || Boolean(isSuperAdmin && currentUser?.id === p.id);
    const isGym = isSuper || adminSet.has(p.id);
    return { ...p, isAdmin: isGym, isSuperAdmin: isSuper, isDisabled: Boolean(p.is_disabled) };
  });

  renderAdminTable(adminData);
}

async function submitInvite(): Promise<void> {
  const emailInput = document.getElementById('invite-email') as HTMLInputElement | null;
  const grantInput = document.getElementById('invite-grant-dashboard') as HTMLInputElement | null;
  const submitButton = document.getElementById('invite-submit') as HTMLButtonElement | null;

  const emailRaw = (emailInput?.value || '').trim().toLowerCase();
  if (!emailRaw?.includes('@')) {
    showToast('Ingresa un email valido', 'error');
    return;
  }

  if (!canInvite) {
    showToast('No tienes permisos para invitar usuarios', 'error');
    return;
  }

  const grantDashboardAccess = Boolean(isSuperAdmin && grantInput?.checked);
  if (submitButton) submitButton.disabled = true;

  try {
    const sessionRes = (await sb.auth.getSession()) as {
      data?: { session?: { access_token?: string | null } | null };
      error?: { message: string } | null;
    };
    if (sessionRes.error) throw sessionRes.error;

    const accessToken = sessionRes.data?.session?.access_token;
    if (!accessToken) {
      throw new Error('Sesion expirada. Cierra y vuelve a iniciar sesion.');
    }

    const { data, error } = await sb.functions.invoke('invite-user', {
      body: {
        email: emailRaw,
        grant_dashboard_access: grantDashboardAccess,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (error) throw error;

    const inviteResult = (data as { invited_email?: string; default_password_masked?: string } | null) || null;
    const invited = inviteResult?.invited_email || emailRaw;
    const maskedPassword = inviteResult?.default_password_masked || 'Ele******26';
    showToast(`Usuario creado: ${invited}. Password temporal configurado: ${maskedPassword}`, 'success');
    if (emailInput) emailInput.value = '';
    if (grantInput) grantInput.checked = false;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error al invitar: ' + message, 'error');
  } finally {
    if (submitButton) submitButton.disabled = false;
    applyInviteUiState();
  }
}

function renderAdminTable(data: AdminUserRow[]): void {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  const currentUser = getCurrentUserRef();

  tbody.innerHTML = data.length
    ? data
        .map((u) => {
          const color = safeColor(u.color, '#9090b8');
          const name = escapeHtml(u.name || '—');
          const avatar = escapeHtml(initials(u.name));
          const userId = escapeHtml(u.id);
          let roleSideBadge = '<span class="badge badge-side badge-member">Miembro</span>';
          let roleColBadge = '<span class="badge badge-member">Miembro</span>';
          if (u.isSuperAdmin) {
            roleSideBadge = '<span class="badge badge-side badge-super-admin">Super Admin</span>';
            roleColBadge = '<span class="badge badge-super-admin">Super Admin</span>';
          } else if (u.isAdmin) {
            roleSideBadge = '<span class="badge badge-side badge-gym-admin">Gym Admin</span>';
            roleColBadge = '<span class="badge badge-gym-admin">Gym Admin</span>';
          }

          const disabledBadge = u.isDisabled
            ? '<span class="badge badge-inactive badge-side" style="margin-left:6px">Deshabilitado</span>'
            : '';

          // Action buttons: only super admins can act on non-super-admin users (not themselves)
          let actionCell = '<td></td>';
          if (isSuperAdmin && !u.isSuperAdmin && currentUser?.id !== u.id) {
            const toggleLabel = u.isDisabled ? 'Habilitar' : 'Deshabilitar';
            const toggleClass = u.isDisabled ? 'action-btn action-btn-success' : 'action-btn action-btn-warn';
            actionCell = `<td>
      <div class="admin-actions">
        <button class="${toggleClass} action-user-toggle" data-uid="${userId}" data-disabled="${u.isDisabled ? '1' : '0'}">${toggleLabel}</button>
        <button class="action-btn action-btn-danger action-user-delete" data-uid="${userId}" data-name="${name}">Eliminar</button>
      </div>
    </td>`;
          }

          const rowClass = u.isDisabled ? ' class="row-disabled"' : '';

          return `<tr data-uid="${userId}"${rowClass}>
    <td><div class="avatar-cell">
      <div class="avatar" style="background:${color + '33'};color:${color}">${avatar}</div>
      <div>
        <div class="avatar-name-row">
          <div class="avatar-name">${name}</div>
          ${roleSideBadge}
          ${disabledBadge}
        </div>
      </div>
    </div></td>
    <td class="text-sm text2">—</td>
    <td>${roleColBadge}</td>
    <td>
      <label class="toggle-wrap">
        <label class="toggle">
          <input type="checkbox" ${u.isAdmin ? 'checked' : ''} data-uid="${userId}" class="admin-toggle">
          <span class="toggle-slider"></span>
        </label>
        <span class="text-sm text3">${u.isAdmin ? 'Activo' : 'Sin acceso'}</span>
      </label>
    </td>
    ${actionCell}
  </tr>`;
        })
        .join('')
    : '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">Sin usuarios</div></div></td></tr>';

  tbody.querySelectorAll('.admin-toggle').forEach((input) => {
    input.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      if (!target?.dataset.uid) return;
      void toggleAdmin(target.dataset.uid, target.checked, target);
    });
  });

  tbody.querySelectorAll('.action-user-toggle').forEach((btn) => {
    btn.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLButtonElement;
      const uid = target.dataset.uid;
      if (!uid) return;
      const isCurrentlyDisabled = target.dataset.disabled === '1';
      void handleUserAction(uid, isCurrentlyDisabled ? 'enable' : 'disable');
    });
  });

  tbody.querySelectorAll('.action-user-delete').forEach((btn) => {
    btn.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLButtonElement;
      const uid = target.dataset.uid;
      const userName = target.dataset.name || 'este usuario';
      if (!uid) return;
      const confirmed = globalThis.confirm(
        `¿Eliminar permanentemente a "${userName}"?\n\nEsta acción no se puede deshacer y borrará todos sus datos.`,
      );
      if (confirmed) void handleUserAction(uid, 'delete');
    });
  });
}

async function handleUserAction(uid: string, action: 'disable' | 'enable' | 'delete'): Promise<void> {
  const messages: Record<string, string> = {
    disable: 'Usuario deshabilitado',
    enable: 'Usuario habilitado',
    delete: 'Usuario eliminado',
  };
  try {
    await manageUser(uid, action);
    showToast(messages[action], action === 'delete' ? 'error' : 'success');
    await loadAdmin();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error: ' + message, 'error');
  }
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
    const { error } = await sb.rpc('set_gym_admin', { target_user_id: uid, grant_access: grant });
    if (error) throw error;
    showToast(grant ? 'Acceso concedido' : 'Acceso revocado', grant ? 'success' : undefined);

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
