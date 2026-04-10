import { fetchBodyMetrics, fetchGymSessions, fetchHiitSessions, fetchProfiles } from '../data';
import { baseChartOptions, chartColors } from '../theme';
import { daysAgo, initials, niceDate, showToast, statusBadge, today } from '../helpers';
import { ChartCtor, ChartLike, GymSession, MemberBestPR, MemberData } from '../types';

declare const Chart: ChartCtor;

let membersData: MemberData[] = [];
let memberWeightChart: ChartLike | null = null;

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
      return [m.name || '', m.lastDate || '', m.sesMonth, pr, status].join(',');
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
      const heatCells = m.heatmap
        .map((v: number) => `<div class="heatmap-cell ${v ? 'h4' : ''}" style="width:9px;height:9px"></div>`)
        .join('');
      const pr = m.bestPR ? `${m.bestPR.name} ${m.bestPR.w}${m.bestPR.unit}` : '—';
      return `<tr data-uid="${m.id}">
      <td><div class="avatar-cell">
        <div class="avatar" style="background:${(m.color || '#4ab8ff') + '33'};color:${m.color || '#4ab8ff'}">${initials(m.name)}</div>
        <span class="avatar-name">${m.name || '—'}</span>
      </div></td>
      <td>${niceDate(m.lastDate)}</td>
      <td class="text-mono">${m.sesMonth}</td>
      <td><div class="heatmap" style="grid-template-columns:repeat(28,1fr);gap:2px;width:140px">${heatCells}</div></td>
      <td class="text-sm text2">${pr}</td>
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
    detailAvatar.style.background = (member.color || '#4ab8ff') + '33';
    detailAvatar.style.color = member.color || '#4ab8ff';
  }
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
    <div class="pr-row">
      <span class="pr-name">${name}</span>
      <span class="pr-value">${d.w} ${d.unit}${d.isPR ? '<span class="pr-badge">PR</span>' : ''}</span>
    </div>`,
          )
          .join('')
      : '<div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-text">Sin ejercicios</div></div>';
  }

  document.getElementById('detail-overlay')?.classList.add('open');
  document.getElementById('detail-panel')?.classList.add('open');
}

function closePanel(): void {
  document.getElementById('detail-overlay')?.classList.remove('open');
  document.getElementById('detail-panel')?.classList.remove('open');
}
