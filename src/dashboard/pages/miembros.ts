import Chart from 'chart.js/auto';
import { fetchBodyMetrics, fetchGymSessions, fetchHiitSessions, fetchProfiles } from '../data';
import { baseChartOptions, chartColors } from '../theme';
import { daysAgo, escapeHtml, initials, niceDate, safeColor, sanitizeCsvCell, showToast, statusBadge, today } from '../helpers';
import { ChartLike, GymSession, MemberBestPR, MemberData } from '../types';

let membersData: MemberData[] = [];
let membersViewData: MemberData[] = [];
let membersById = new Map<string, MemberData>();
let memberWeightChart: ChartLike | null = null;
let memberExerciseChart: ChartLike | null = null;
const DETAIL_SECTIONS_STATE_KEY = 'dashboard:miembros:detail-sections:v1';
const MEMBERS_VIEW_STATE_KEY = 'dashboard:miembros:view:v1';

type MemberStatusFilter = 'all' | 'active' | 'warn' | 'inactive';
type MemberPrFilter = 'all' | 'with' | 'without';
type MemberSortKey = 'name' | 'lastDate' | 'sesMonth' | 'activity28' | 'bestPR' | 'status';
type SortDirection = 'asc' | 'desc';

type MembersViewState = {
  status: MemberStatusFilter;
  pr: MemberPrFilter;
  minSessions: number;
  sortBy: MemberSortKey;
  sortDir: SortDirection;
};

const defaultMembersViewState: MembersViewState = {
  status: 'all',
  pr: 'all',
  minSessions: 0,
  sortBy: 'lastDate',
  sortDir: 'desc',
};

let membersViewState: MembersViewState = loadMembersViewState();

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

function loadMembersViewState(): MembersViewState {
  try {
    const raw = sessionStorage.getItem(MEMBERS_VIEW_STATE_KEY);
    if (!raw) return { ...defaultMembersViewState };
    const parsed = JSON.parse(raw) as Partial<MembersViewState>;
    const status = parsed.status;
    const pr = parsed.pr;
    const sortBy = parsed.sortBy;
    const sortDir = parsed.sortDir;
    const minSessions = Number(parsed.minSessions);

    return {
      status: status === 'active' || status === 'warn' || status === 'inactive' ? status : 'all',
      pr: pr === 'with' || pr === 'without' ? pr : 'all',
      minSessions: Number.isFinite(minSessions) && minSessions >= 0 ? minSessions : 0,
      sortBy: sortBy === 'name' || sortBy === 'sesMonth' || sortBy === 'activity28' || sortBy === 'bestPR' || sortBy === 'status' ? sortBy : 'lastDate',
      sortDir: sortDir === 'asc' ? 'asc' : 'desc',
    };
  } catch {
    return { ...defaultMembersViewState };
  }
}

function saveMembersViewState(): void {
  try {
    sessionStorage.setItem(MEMBERS_VIEW_STATE_KEY, JSON.stringify(membersViewState));
  } catch {
    // Ignore storage errors.
  }
}

function getMemberStatus(member: MemberData): 'active' | 'warn' | 'inactive' {
  if (!member.lastDate) return 'inactive';
  const now = new Date();
  const last = new Date(member.lastDate + 'T00:00:00');
  const days = Math.floor((now.getTime() - last.getTime()) / 86400000);
  if (days <= 3) return 'active';
  if (days <= 7) return 'warn';
  return 'inactive';
}

function statusRank(member: MemberData): number {
  const status = getMemberStatus(member);
  if (status === 'active') return 3;
  if (status === 'warn') return 2;
  return 1;
}

function activity28(member: MemberData): number {
  return member.heatmap.reduce((acc, value) => acc + (value ? 1 : 0), 0);
}

function sortDirectionIndicator(isActive: boolean): string {
  if (!isActive) return '';
  return membersViewState.sortDir === 'asc' ? '↑' : '↓';
}

function memberStatusLabel(status: MemberStatusFilter): string {
  if (status === 'active') return 'Activo';
  if (status === 'warn') return 'Advertencia';
  return 'Inactivo';
}

function compareMembers(a: MemberData, b: MemberData): number {
  const dir = membersViewState.sortDir === 'asc' ? 1 : -1;
  let result = 0;
  switch (membersViewState.sortBy) {
    case 'name':
      result = (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
      break;
    case 'lastDate':
      result = (a.lastDate || '').localeCompare(b.lastDate || '');
      break;
    case 'sesMonth':
      result = a.sesMonth - b.sesMonth;
      break;
    case 'activity28':
      result = activity28(a) - activity28(b);
      break;
    case 'bestPR':
      result = (a.bestPR?.w || 0) - (b.bestPR?.w || 0);
      break;
    case 'status':
      result = statusRank(a) - statusRank(b);
      break;
  }

  if (result !== 0) return result * dir;
  return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
}

function applyMembersFiltersAndSorting(): void {
  const q = ((document.getElementById('topbar-search') as HTMLInputElement | null)?.value || '').trim().toLowerCase();

  const filtered = membersData.filter((member) => {
    if (q && !(member.name || '').toLowerCase().includes(q)) return false;

    if (membersViewState.status !== 'all' && getMemberStatus(member) !== membersViewState.status) return false;

    if (membersViewState.pr === 'with' && !member.bestPR) return false;
    if (membersViewState.pr === 'without' && member.bestPR) return false;

    if (member.sesMonth < membersViewState.minSessions) return false;
    return true;
  });

  membersViewData = [...filtered].sort(compareMembers);
  renderMembersTable(membersViewData);
  updateMembersSortUi();
  saveMembersViewState();
}

function updateMembersSortUi(): void {
  const sortButtons = document.querySelectorAll<HTMLButtonElement>('[data-members-sort]');
  sortButtons.forEach((button) => {
    const key = button.dataset.membersSort as MemberSortKey | undefined;
    if (!key) return;
    const isActive = key === membersViewState.sortBy;
    button.classList.toggle('active-sort', isActive);
    const direction = sortDirectionIndicator(isActive);
    const baseLabel = button.dataset.label || button.textContent || '';
    button.textContent = direction ? `${baseLabel} ${direction}` : baseLabel;
  });
}

function bindMembersControls(): void {
  const statusFilter = document.getElementById('members-filter-status') as HTMLSelectElement | null;
  const prFilter = document.getElementById('members-filter-pr') as HTMLSelectElement | null;
  const sessionsFilter = document.getElementById('members-filter-sessions') as HTMLSelectElement | null;
  const clearFiltersBtn = document.getElementById('members-clear-filters') as HTMLButtonElement | null;

  if (statusFilter) statusFilter.value = membersViewState.status;
  if (prFilter) prFilter.value = membersViewState.pr;
  if (sessionsFilter) sessionsFilter.value = String(membersViewState.minSessions);

  statusFilter?.addEventListener('change', () => {
    const value = statusFilter.value;
    membersViewState.status = value === 'active' || value === 'warn' || value === 'inactive' ? value : 'all';
    applyMembersFiltersAndSorting();
  });

  prFilter?.addEventListener('change', () => {
    const value = prFilter.value;
    membersViewState.pr = value === 'with' || value === 'without' ? value : 'all';
    applyMembersFiltersAndSorting();
  });

  sessionsFilter?.addEventListener('change', () => {
    const parsed = Number(sessionsFilter.value);
    membersViewState.minSessions = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    applyMembersFiltersAndSorting();
  });

  clearFiltersBtn?.addEventListener('click', () => {
    membersViewState = { ...defaultMembersViewState };
    const topSearch = document.getElementById('topbar-search') as HTMLInputElement | null;
    if (topSearch) topSearch.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (prFilter) prFilter.value = 'all';
    if (sessionsFilter) sessionsFilter.value = '0';
    applyMembersFiltersAndSorting();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-members-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.membersSort as MemberSortKey | undefined;
      if (!key) return;
      if (membersViewState.sortBy === key) {
        membersViewState.sortDir = membersViewState.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        membersViewState.sortBy = key;
        membersViewState.sortDir = key === 'name' ? 'asc' : 'desc';
      }
      applyMembersFiltersAndSorting();
    });
  });
}

export function initMiembrosPage(): void {
  const topbarSearch = document.getElementById('topbar-search');
  if (topbarSearch && topbarSearch.dataset.boundMiembros !== '1') {
    topbarSearch.addEventListener('input', (e: Event) => {
      if (!(e.target as HTMLInputElement | null)) return;
      applyMembersFiltersAndSorting();
    });
    topbarSearch.dataset.boundMiembros = '1';
  }

  bindMembersControls();
  updateMembersSortUi();

  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn && exportCsvBtn.dataset.boundMiembros !== '1') {
    exportCsvBtn.addEventListener('click', () => {
      if (!membersViewData.length) {
        showToast('Sin datos para exportar', 'error');
        return;
      }
      const header = ['Nombre', 'Última Sesión', 'Sesiones Mes', 'Mejor PR', 'Estado'];
      const rows = membersViewData.map((m) => {
        const pr = m.bestPR ? `${m.bestPR.name} ${m.bestPR.w}${m.bestPR.unit}` : '';
        const status = getMemberStatus(m);
        const statusText = memberStatusLabel(status);
        return [
          sanitizeCsvCell(m.name || ''),
          sanitizeCsvCell(m.lastDate || ''),
          sanitizeCsvCell(m.sesMonth),
          sanitizeCsvCell(pr),
          sanitizeCsvCell(statusText),
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
    exportCsvBtn.dataset.boundMiembros = '1';
  }

  const detailClose = document.getElementById('detail-close');
  if (detailClose && detailClose.dataset.boundMiembros !== '1') {
    detailClose.addEventListener('click', closePanel);
    detailClose.dataset.boundMiembros = '1';
  }

  const detailOverlay = document.getElementById('detail-overlay');
  if (detailOverlay && detailOverlay.dataset.boundMiembros !== '1') {
    detailOverlay.addEventListener('click', closePanel);
    detailOverlay.dataset.boundMiembros = '1';
  }

  const membersTbody = document.getElementById('members-tbody');
  if (membersTbody && membersTbody.dataset.boundMiembros !== '1') {
    membersTbody.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement | null;
      const row = target?.closest('tr[data-uid]') as HTMLTableRowElement | null;
      const uid = row?.dataset.uid || '';
      if (uid) void openMemberPanel(uid);
    });
    membersTbody.dataset.boundMiembros = '1';
  }

  const sectionsState = loadDetailSectionsState();
  document.querySelectorAll('.detail-section-toggle').forEach((btn) => {
    const trigger = btn as HTMLButtonElement;
    const targetId = trigger.dataset.target || '';
    if (targetId && Object.hasOwn(sectionsState, targetId)) {
      applyDetailSectionState(trigger, sectionsState[targetId] ?? true);
    }

    if (trigger.dataset.boundMiembros === '1') return;

    btn.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') !== 'false';
      const nextExpanded = !expanded;
      applyDetailSectionState(trigger, nextExpanded);
      if (!targetId) return;
      sectionsState[targetId] = nextExpanded;
      saveDetailSectionsState(sectionsState);
    });
    trigger.dataset.boundMiembros = '1';
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
  membersById = new Map(membersData.map((m) => [m.id, m]));

  applyMembersFiltersAndSorting();
}

function getMemberRenderKey(member: MemberData): string {
  const pr = member.bestPR ? `${member.bestPR.name}|${member.bestPR.w}|${member.bestPR.unit}` : 'no-pr';
  return [
    member.id,
    member.name || '',
    member.color || '',
    member.lastDate || '',
    member.sesMonth,
    member.heatmap.join(''),
    pr,
  ].join('::');
}

function buildMemberRowHtml(member: MemberData): string {
  const color = safeColor(member.color, '#4ab8ff');
  const name = escapeHtml(member.name || '—');
  const avatar = escapeHtml(initials(member.name));
  const userId = escapeHtml(member.id);
  const heatCells = member.heatmap
    .map((v: number) => `<div class="heatmap-cell ${v ? 'h4' : ''}"></div>`)
    .join('');
  const pr = member.bestPR ? `${escapeHtml(member.bestPR.name)} ${member.bestPR.w}${escapeHtml(member.bestPR.unit)}` : '—';
  const prTitle = member.bestPR ? `${escapeHtml(member.bestPR.name)} ${member.bestPR.w}${escapeHtml(member.bestPR.unit)}` : 'Sin PR';
  return `<tr data-uid="${userId}">
      <td><div class="avatar-cell">
        <div class="avatar" style="background:${color + '33'};color:${color}">${avatar}</div>
        <span class="avatar-name">${name}</span>
      </div></td>
      <td>${niceDate(member.lastDate)}</td>
      <td class="text-mono">${member.sesMonth}</td>
      <td class="members-activity-cell"><div class="heatmap heatmap-28d">${heatCells}</div></td>
      <td class="text-sm text2 members-pr-cell"><span class="member-pr-text" title="${prTitle}">${pr}</span></td>
      <td>${statusBadge(member.lastDate)}</td>
    </tr>`;
}

function createMemberRowElement(member: MemberData, renderKey: string): HTMLTableRowElement {
  const template = document.createElement('template');
  template.innerHTML = buildMemberRowHtml(member).trim();
  const row = template.content.firstElementChild as HTMLTableRowElement | null;
  if (!row) {
    const fallback = document.createElement('tr');
    fallback.dataset.uid = member.id;
    fallback.innerHTML = '<td colspan="6"></td>';
    fallback.dataset.renderKey = renderKey;
    return fallback;
  }
  row.dataset.renderKey = renderKey;
  return row;
}

function renderMembersTable(data: MemberData[]): void {
  const tbody = document.getElementById('members-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Sin miembros</div></div></td></tr>';
    return;
  }

  const existingRows = new Map<string, HTMLTableRowElement>();
  tbody.querySelectorAll<HTMLTableRowElement>('tr[data-uid]').forEach((row) => {
    const uid = row.dataset.uid || '';
    if (uid) existingRows.set(uid, row);
  });

  const keepUids = new Set<string>();
  data.forEach((member) => {
    const uid = member.id;
    keepUids.add(uid);
    const renderKey = getMemberRenderKey(member);
    const existing = existingRows.get(uid);
    const nextRow = existing?.dataset.renderKey === renderKey
      ? existing
      : createMemberRowElement(member, renderKey);
    tbody.appendChild(nextRow);
  });

  existingRows.forEach((row, uid) => {
    if (!keepUids.has(uid)) row.remove();
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
    data: dates.map((d) => byDate[d] ?? null),
    unit,
  };
}

function renderMemberSummary(member: MemberData): { gymUser: GymSession[]; prSetM: Set<string> } {
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

  return { gymUser, prSetM };
}

async function renderMemberWeightChart(uid: string): Promise<void> {
  const metrics = await fetchBodyMetrics();
  const userMetrics = metrics.filter((m) => m.user_id === uid).sort((a, b) => a.date.localeCompare(b.date));
  const wLabels = userMetrics.map((m) => niceDate(m.date));
  const wData = userMetrics.map((m) => {
    const n = toNumber(m.weight);
    return n > 0 ? n : null;
  });
  const c = chartColors();
  const canvas = document.getElementById('chart-member-weight') as HTMLCanvasElement | null;

  if (!canvas) return;

  if (memberWeightChart) memberWeightChart.destroy();
  memberWeightChart = new Chart(canvas, {
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
}

function computeBestWeights(gymUser: GymSession[], prSetM: Set<string>): Record<string, { w: number; unit: string; isPR: boolean }> {
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
  return bestWeights;
}

function renderMemberExerciseList(gymUser: GymSession[], bestWeights: Record<string, { w: number; unit: string; isPR: boolean }>): string | null {
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

  return entries[0]?.[0] ?? null;
}

function renderExerciseTrend(gymUser: GymSession[], exerciseName: string): void {
  const titleEl = document.getElementById('detail-exercise-progress-title');
  if (titleEl) titleEl.textContent = `Evolucion: ${exerciseName}`;

  const canvas = document.getElementById('chart-member-exercise') as HTMLCanvasElement | null;
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

function renderExerciseHistory(gymUser: GymSession[]): void {
  const historyEl = document.getElementById('detail-history-list');
  if (!historyEl) return;

  const rows = gymUser
    .flatMap((session) => {
      const exercises = session.exercises || [];
      return exercises.map((exercise) => ({ sessionDate: session.date, exercise }));
    })
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

  if (!rows.length) {
    historyEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-text">Sin historial de ejercicios</div></div>';
    return;
  }

  historyEl.innerHTML = rows
    .map(({ sessionDate, exercise }) => {
      const weight = toNumber(exercise.weight);
      const hasWeight = weight > 0;
      const unit = escapeHtml(exercise.unit || 'kg');
      const reps = escapeHtml(exercise.reps || '—');
      const sets = exercise.sets != null && `${exercise.sets}`.trim() !== '' ? escapeHtml(`${exercise.sets}`) : '—';
      const notes = exercise.notes ? `<div class="detail-history-notes">${escapeHtml(exercise.notes)}</div>` : '';

      return `<div class="detail-history-row">
        <div class="detail-history-meta">
          <span class="detail-history-date">${niceDate(sessionDate)}</span>
          <span class="detail-history-name">${escapeHtml(exercise.name || 'Ejercicio')}</span>
        </div>
        <div class="detail-history-stats">
          <span class="detail-history-chip">Peso: ${hasWeight ? `${weight} ${unit}` : '—'}</span>
          <span class="detail-history-chip">Series: ${sets}</span>
          <span class="detail-history-chip">Reps: ${reps}</span>
        </div>
        ${notes}
      </div>`;
    })
    .join('');
}

async function openMemberPanel(uid: string): Promise<void> {
  const member = membersById.get(uid);
  if (!member) return;

  renderMemberHeader(member);

  const { gymUser, prSetM } = renderMemberSummary(member);
  await renderMemberWeightChart(uid);

  const bestWeights = computeBestWeights(gymUser, prSetM);
  const firstExerciseName = renderMemberExerciseList(gymUser, bestWeights);
  renderExerciseHistory(gymUser);

  if (firstExerciseName) {
    renderExerciseTrend(gymUser, firstExerciseName);
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
