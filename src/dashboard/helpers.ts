export function showToast(msg: string, type = ''): void {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
  requireText?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
};

export function confirmAction(options: ConfirmDialogOptions): Promise<boolean> {
  const fallbackMessage = `${options.title}\n\n${options.message}`.trim();
  const canRenderModal = typeof document !== 'undefined' && Boolean(document.body);
  const isJsdom = /jsdom/i.test(globalThis.navigator?.userAgent || '');

  if (!canRenderModal || isJsdom) {
    if (options.requireText) {
      const typed = globalThis.prompt(
        `${fallbackMessage}\n\nEscribe ${options.requireText} para confirmar.`,
        '',
      );
      return Promise.resolve((typed || '').trim() === options.requireText);
    }
    return Promise.resolve(globalThis.confirm(fallbackMessage));
  }

  return new Promise<boolean>((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = `confirm-dialog ${options.tone === 'danger' ? 'danger' : ''}`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const titleEl = document.createElement('h3');
    titleEl.className = 'confirm-title';
    titleEl.textContent = options.title;

    const msgEl = document.createElement('p');
    msgEl.className = 'confirm-message';
    msgEl.textContent = options.message;

    const shouldRequireText = Boolean(options.requireText);
    const requiredText = options.requireText || '';
    let inputEl: HTMLInputElement | null = null;
    let helperEl: HTMLDivElement | null = null;
    let field: HTMLLabelElement | null = null;

    if (shouldRequireText) {
      field = document.createElement('label');
      field.className = 'confirm-input-wrap';

      const fieldLabel = document.createElement('span');
      fieldLabel.className = 'confirm-input-label';
      fieldLabel.textContent = options.inputLabel || `Escribe ${requiredText} para confirmar`;

      inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.className = 'confirm-input';
      inputEl.placeholder = options.inputPlaceholder || requiredText;
      inputEl.setAttribute('autocomplete', 'off');

      helperEl = document.createElement('div');
      helperEl.className = 'confirm-input-hint';
      helperEl.textContent = `Debes escribir exactamente ${requiredText}.`;

      field.append(fieldLabel, inputEl, helperEl);
    }

    const actions = document.createElement('div');
    actions.className = 'confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'topbar-btn';
    cancelBtn.textContent = options.cancelText || 'Cancelar';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'topbar-btn' + (options.tone === 'danger' ? ' danger' : '');
    confirmBtn.textContent = options.confirmText || 'Confirmar';

    const updateConfirmState = () => {
      if (!shouldRequireText || !inputEl) {
        confirmBtn.disabled = false;
        return;
      }
      const isMatch = inputEl.value.trim() === requiredText;
      confirmBtn.disabled = !isMatch;
      if (helperEl) helperEl.classList.toggle('is-ok', isMatch);
    };

    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
      resolve(result);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
    };

    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) finish(false);
    });
    cancelBtn.addEventListener('click', () => finish(false));
    confirmBtn.addEventListener('click', () => finish(true));
    if (inputEl) inputEl.addEventListener('input', updateConfirmState);

    actions.append(cancelBtn, confirmBtn);
    if (field) dialog.append(titleEl, msgEl, field, actions);
    else dialog.append(titleEl, msgEl, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeyDown);

    updateConfirmState();

    if (inputEl) inputEl.focus();
    else confirmBtn.focus();
  });
}

function toText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return `${value}`;
  if (typeof value === 'symbol') return value.description || '';
  try {
    return JSON.stringify(value) || '';
  } catch {
    return '';
  }
}

export function escapeHtml(value: unknown): string {
  return toText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function safeColor(value: string | null | undefined, fallback: string): string {
  const normalized = (value || '').trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized) ? normalized : fallback;
}

export function sanitizeCsvCell(value: unknown): string {
  const text = toText(value);
  const normalized = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function niceDate(d: string): string {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function initials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function statusBadge(lastDate: string): string {
  if (!lastDate) return '<span class="badge badge-inactive">Inactivo</span>';
  const now = new Date();
  const last = new Date(lastDate + 'T00:00:00');
  const days = Math.floor((now.getTime() - last.getTime()) / 86400000);
  if (days <= 3) return '<span class="badge badge-active">Activo</span>';
  if (days <= 7) return '<span class="badge badge-warn">Advertencia</span>';
  return '<span class="badge badge-inactive">Inactivo</span>';
}

export function muscleGroup(name: string): string {
  const n = (name || '').toLowerCase();
  if (/squat|leg press|lungi|sentadi|cuadricep|isquio|gemelo|calf|hip thrust|prensa|pierna|glute/.test(n)) return 'Piernas';
  if (/pull.up|lat|row|remo|espalda|deadlift|peso muerto|t-bar|face pull/.test(n)) return 'Espalda';
  if (/bench|press de banca|chest|pecho|fly|fondos|dip/.test(n)) return 'Pecho';
  if (/shoulder|hombro|press militar|ohp|lateral|deltoide|arnold/.test(n)) return 'Hombros';
  if (/curl|bicep|bicep|martillo|hammer/.test(n)) return 'Biceps';
  if (/tricep|tricep|extensi|skullcrusher/.test(n)) return 'Triceps';
  if (/plank|abs|crunch|core|abdomi|sit.up/.test(n)) return 'Core';
  return 'HIIT';
}

export function colorForMuscle(group: string): string {
  const map: Record<string, string> = {
    Piernas: '#4ab8ff',
    Espalda: '#b8ff4a',
    Pecho: '#ff6b6b',
    Hombros: '#ffb347',
    Biceps: '#c97bff',
    Triceps: '#ff8c42',
    Core: '#4affd4',
    HIIT: '#ff4a8c',
  };
  return map[group] || '#9090b8';
}
