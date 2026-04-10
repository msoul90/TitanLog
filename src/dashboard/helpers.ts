export function showToast(msg: string, type = ''): void {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2400);
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
