import { fetchBodyMetrics, fetchGymSessions, fetchHiitSessions, fetchProfiles } from '../data';
import { baseChartOptions, chartColors } from '../theme';
import { daysAgo, escapeHtml, initials, niceDate, safeColor, sanitizeCsvCell, showToast, statusBadge, today } from '../helpers';
import { ChartCtor, ChartLike, GymSession, MemberBestPR, MemberData } from '../types';

declare const Chart: ChartCtor;

let membersData: MemberData[] = [];
let memberWeightChart: ChartLike | null = null;
let memberExerciseChart: ChartLike | null = null;
const DETAIL_SECTIONS_STATE_KEY = 'dashboard:miembros:detail-sections:v1';

function loadDetailSectionsState(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(DETAIL_SECTIONS_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, boolean> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v === 'boolean') out[k] = v;
    });
    return out;
  } catch {
    return {};
  }
}

function saveDetailSectionsState(state: Record<string, boolean>): void {
  try {
    sessionStorage.setItem(DETAIL_SECTIONS_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (private mode, quota, disabled storage).
  }
}

function applyDetailSectionState(trigger: HTMLButtonElement, expanded: boolean): void {
  const targetId = trigger.dataset.target || '';
  const body = targetId ? document.getElementById(targetId) : null;
  if (!targetId || !body) return;
  trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  body.classList.toggle('collapsed', !expanded);
}

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function initMiembrosPage(): void {
  document.getElementById('topbar-search')?.addEventListener('input', (e: Event) => {
    const q = ((e.target as HTMLInputElement | null)?.value || '').toLowerCase();
    const filtered = membersData.filter((m) => (m.name || '').toLowerCase().includes(q));
    renderMembersTable(filtered);
  });

  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    if (!membersData.length) {
      showToast('Sin datos para exportar', 'error');
      return;
    }
    const header = ['Nombre', 'Última Sesión', 'Sesiones Mes', 'Mejor PR', 'Estado'];
    const rows = membersData.map((m) => {
      const pr = m.bestPR ? `${m.bestPR.name} ${m.bestPR.w}${m.bestPR.unit}` : '';
      const now = new Date();
      const last = m.lastDate ? new Date(m.lastDate + 'T00:00:00') : null;
      const days = last ? Math.floor((now.getTime() - last.getTime()) / 86400000) : 999;
      let status = 'Inactivo';
      if (days <= 3) status = 'Activo';
      else if (days <= 7) status = 'Advertencia';
      return [
        sanitizeCsvCell(m.name || ''),
        sanitizeCsvCell(m.lastDate || ''),
        sanitizeCsvCell(m.sesMonth),
        sanitizeCsvCell(pr),
        sanitizeCsvCell(status),
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'miembros.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado', 'success');
  });

  document.getElementById('detail-close')?.addEventListener('click', closePanel);
  document.getElementById('detail-overlay')?.addEventListener('click', closePanel);

  const sectionsState = loadDetailSectionsState();
  document.querySelectorAll('.detail-section-toggle').forEach((btn) => {
    const trigger = btn as HTMLButtonElement;
    const targetId = trigger.dataset.target || '';
    if (targetId && Object.prototype.hasOwnProperty.call(sectionsState, targetId)) {
      applyDetailSectionState(trigger, sectionsState[targetId]);
    }

    btn.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') !== 'false';
      const nextExpanded = !expanded;
      applyDetailSectionState(trigger, nextExpanded);
      if (!targetId) return;
      sectionsState[targetId] = nextExpanded;
      saveDetailSectionsState(sectionsState);
    });
  });
}

export async function loadMiembros(): Promise<void> {
  const since4w = daysAgo(28);
  const [gymSessions, hiitSessions, profiles] = await Promise.all([
    fetchGymSessions(since4w),
    fetchHiitSessions(since4w),
    fetchProfiles(),
  ]);

  const allSessions = [...gymSessions, ...hiitSessions];
  const startOfMonth = today().slice(0, 7) + '-01';

  membersData = profiles.map((p) => {
    const userSessions = allSessions.filter((s) => s.user_id === p.id);
    const gymUser = gymSessions.filter((s) => s.user_id === p.id);
    const allDates = userSessions.map((s) => s.date).sort((a, b) => a.localeCompare(b));
    const lastDate = allDates.length ? (allDates.at(-1) ?? '') : '';
    const sesMonth = userSessions.filter((s) => s.date >= startOfMonth).length;

    const sessionDates = new Set(userSessions.map((s) => s.date));
    const heatmap: number[] = [];
    for (let i = 27; i >= 0; i--) heatmap.push(sessionDates.has(daysAgo(i)) ? 1 : 0);

    let bestPR: MemberBestPR | null = null;
    gymUser.forEach((s) => {
      (s.exercises || []).forEach((ex) => {
        const w = toNumber(ex.weight);
        if (!bestPR || w > bestPR.w) bestPR = { name: ex.name, w, unit: ex.unit || 'kg' };
      });
    });

    return { ...p, lastDate, sesMonth, heatmap, bestPR, userSessions, gymUser };
  });

  renderMembersTable(membersData);
}

function renderMembersTable(data: MemberData[]): void {
  const tbody = document.getElementById('members-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Sin miembros</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map((m) => {
      const color = safeColor(m.color, '#4ab8ff');
      const name = escapeHtml(m.name || '—');
      const avatar = escapeHtml(initials(m.name));
      const userId = escapeHtml(m.id);
      const heatCells = m.heatmap
        .map((v: number) => `<div class="heatmap-cell ${v ? 'h4' : ''}"></div>`)
        .join('');
      const pr = m.bestPR ? `${escapeHtml(m.bestPR.name)} ${m.bestPR.w}${escapeHtml(m.bestPR.unit)}` : '—';
      const prTitle = m.bestPR ? `${escapeHtml(m.bestPR.name)} ${m.bestPR.w}${escapeHtml(m.bestPR.unit)}` : 'Sin PR';
      return `<tr data-uid="${userId}">
      <td><div class="avatar-cell">
        <div class="avatar" style="background:${color + '33'};color:${color}">${avatar}</div>
        <span class="avatar-name">${name}</span>
      </div></td>
      <td>${niceDate(m.lastDate)}</td>
      <td class="text-mono">${m.sesMonth}</td>
      <td class="members-activity-cell"><div class="heatmap heatmap-28d">${heatCells}</div></td>
      <td class="text-sm text2 members-pr-cell"><span class="member-pr-text" title="${prTitle}">${pr}</span></td>
      <td>${statusBadge(m.lastDate)}</td>
    </tr>`;
    })
    .join('');

  tbody.querySelectorAll('tr').forEach((tr) => {
    tr.addEventListener('click', () => openMemberPanel((tr as HTMLElement).dataset.uid || ''));
  });
}

function computeMemberMonthPrs(gymUser: GymSession[], startOfMonth: string): Set<string> {
  const maxBefore: Record<string, number> = {};
  gymUser
    .filter((s) => s.date < startOfMonth)
    .forEach((s) => {
      (s.exercises || []).forEach((ex) => {
        const key = ex.name;
        const w = toNumber(ex.weight);
        if (!maxBefore[key] || maxBefore[key] < w) maxBefore[key] = w;
      });
    });

  const prSetM = new Set<string>();
  gymUser
    .filter((s) => s.date >= startOfMonth)
    .forEach((s) => {
      (s.exercises || []).forEach((ex) => {
        const w = toNumber(ex.weight);
        if (w > (maxBefore[ex.name] || 0)) prSetM.add(ex.name);
      });
    });

  return prSetM;
}

function renderMemberHeader(member: MemberData): void {
  const detailName = document.getElementById('detail-name');
  const detailEmail = document.getElementById('detail-email');
  const detailAvatar = document.getElementById('detail-avatar');
  if (detailName) detailName.textContent = member.name || '—';
  if (detailEmail) detailEmail.textContent = '—';
  if (detailAvatar) {
    detailAvatar.textContent = initials(member.name);
    const avatarColor = safeColor(member.color, '#4ab8ff');
    detailAvatar.style.background = avatarColor + '33';
    detailAvatar.style.color = avatarColor;
  }
}

function buildExerciseTimeline(gymUser: GymSession[], exerciseName: string): {
  labels: string[];
  data: Array<number | null>;
  unit: string;
} {
  const byDate: Record<string, number> = {};
  let unit = 'kg';

  gymUser.forEach((s) => {
    (s.exercises || []).forEach((ex) => {
      if (ex.name !== exerciseName) return;
      const w = toNumber(ex.weight);
      if (w <= 0) return;
      const date = s.date;
      if (!byDate[date] || w > byDate[date]) byDate[date] = w;
      if (typeof ex.unit === 'string' && ex.unit.trim()) unit = ex.unit;
    });
  });

  const dates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));
  return {
    labels: dates.map((d) => niceDate(d)),
    data: dates.map((d) => byDate[d]),
    unit,
  };
}

function renderExerciseTrend(gymUser: GymSession[], exerciseName: string): void {
  const titleEl = document.getElementById('detail-exercise-progress-title');
  if (titleEl) titleEl.textContent = `Evolucion: ${exerciseName}`;

  const canvas = document.getElementById('chart-member-exercise');
  if (!canvas) return;

  const { labels, data, unit } = buildExerciseTimeline(gymUser, exerciseName);
  const c = chartColors();

  if (memberExerciseChart) memberExerciseChart.destroy();
  memberExerciseChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `${exerciseName} (${unit})`,
          data,
          borderColor: c.accent,
          backgroundColor: c.accent + '22',
          tension: 0.32,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: c.accent,
          spanGaps: true,
        },
      ],
    },
    options: { ...baseChartOptions(), plugins: { legend: { display: false } } },
  });
}

async function openMemberPanel(uid: string): Promise<void> {
  const member = membersData.find((m) => m.id === uid);
  if (!member) return;

  renderMemberHeader(member);

  const startOfMonth = today().slice(0, 7) + '-01';
  const sesMonth = member.userSessions.filter((s) => s.date >= startOfMonth).length;
  const detailSessions = document.getElementById('detail-sessions');
  if (detailSessions) detailSessions.textContent = String(sesMonth);

  let streak = 0;
  const sessionDates = new Set(member.userSessions.map((s) => s.date));
  for (let i = 0; i <= 365; i++) {
    if (sessionDates.has(daysAgo(i))) streak++;
    else if (i > 0) break;
  }
  const detailStreak = document.getElementById('detail-streak');
  if (detailStreak) detailStreak.textContent = String(streak);

  const gymUser = member.gymUser;
  const prSetM = computeMemberMonthPrs(gymUser, startOfMonth);

  const detailPrs = document.getElementById('detail-prs');
  if (detailPrs) detailPrs.textContent = String(prSetM.size);

  const heatEl = document.getElementById('detail-heatmap');
  if (heatEl) heatEl.innerHTML = member.heatmap.map((v: number) => `<div class="heatmap-cell ${v ? 'h4' : ''}"></div>`).join('');

  const metrics = await fetchBodyMetrics();
  const userMetrics = metrics.filter((m) => m.user_id === uid).sort((a, b) => a.date.localeCompare(b.date));
  const wLabels = userMetrics.map((m) => niceDate(m.date));
  const wData = userMetrics.map((m) => {
    const n = toNumber(m.weight);
    return n > 0 ? n : null;
  });
  const c = chartColors();

  if (memberWeightChart) memberWeightChart.destroy();
  memberWeightChart = new Chart(document.getElementById('chart-member-weight'), {
    type: 'line',
    data: {
      labels: wLabels,
      datasets: [
        {
          data: wData,
          borderColor: c.accent2,
          backgroundColor: c.accent2 + '22',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: c.accent2,
          spanGaps: true,
        },
      ],
    },
    options: { ...baseChartOptions(), plugins: { legend: { display: false } } },
  });

  const bestWeights: Record<string, { w: number; unit: string; isPR: boolean }> = {};
  gymUser.forEach((s) => {
    (s.exercises || []).forEach((ex) => {
      const w = toNumber(ex.weight);
      const current = bestWeights[ex.name];
      if (!current || w > current.w) {
        bestWeights[ex.name] = { w, unit: ex.unit || 'kg', isPR: prSetM.has(ex.name) };
      }
    });
  });

  const prListEl = document.getElementById('detail-prs-list');
  const entries = Object.entries(bestWeights)
    .sort((a, b) => b[1].w - a[1].w)
    .slice(0, 15);
  if (prListEl) {
    prListEl.innerHTML = entries.length
      ? entries
          .map(
            ([name, d]) => `
    <button class="pr-row is-button" type="button" data-exercise="${escapeHtml(name)}">
      <span class="pr-name">${escapeHtml(name)}</span>
      <span class="pr-value">${d.w} ${escapeHtml(d.unit)}${d.isPR ? '<span class="pr-badge">PR</span>' : ''}</span>
    </button>`,
          )
          .join('')
      : '<div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-text">Sin ejercicios</div></div>';

    prListEl.querySelectorAll<HTMLButtonElement>('button[data-exercise]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const exerciseName = btn.dataset.exercise || '';
        if (!exerciseName) return;
        renderExerciseTrend(gymUser, exerciseName);
        const body = document.getElementById('detail-exercise-progress-body');
        const toggle = document.querySelector<HTMLButtonElement>('.detail-section-toggle[data-target="detail-exercise-progress-body"]');
        if (body && toggle) {
          body.classList.remove('collapsed');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  if (entries.length) {
    renderExerciseTrend(gymUser, entries[0][0]);
  } else {
    const titleEl = document.getElementById('detail-exercise-progress-title');
    if (titleEl) titleEl.textContent = 'Evolucion por ejercicio';
    if (memberExerciseChart) {
      memberExerciseChart.destroy();
      memberExerciseChart = null;
    }
  }

  document.getElementById('detail-overlay')?.classList.add('open');
  document.getElementById('detail-panel')?.classList.add('open');
}

function closePanel(): void {
  document.getElementById('detail-overlay')?.classList.remove('open');
  document.getElementById('detail-panel')?.classList.remove('open');
}
