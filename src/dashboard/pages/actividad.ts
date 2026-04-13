import { fetchGymSessions, fetchHiitSessions, fetchProfiles } from '../data';
import { daysAgo, escapeHtml, niceDate } from '../helpers';
import { DashboardSession, Profile } from '../types';

function renderActivityLog(sessions: DashboardSession[], profileMap: Record<string, Profile>): string {
  if (!sessions.length) {
    return '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Sin sesiones</div></div>';
  }
  return sessions
    .map((s) => {
      const p = profileMap[s.user_id] || { name: 'Miembro' };
      const isHiit = 'name' in s && Boolean(s.name);
      const type = isHiit ? 'HIIT' : 'Gym';
      const dotColor = type === 'HIIT' ? 'var(--accent2)' : 'var(--accent)';
      const sub = isHiit ? `${escapeHtml(s.name || '')} · ${s.rounds || '?'} rondas · RPE ${s.rpe || '?'}` : '';
      const meta = sub ? `${niceDate(s.date)} · ${sub}` : niceDate(s.date);
      return `<div class="feed-item" style="cursor:pointer">
      <div class="feed-dot" style="background:${dotColor}"></div>
      <div class="feed-content">
        <div class="feed-title">${escapeHtml(p.name || 'Miembro')} — ${type}</div>
        <div class="feed-meta">${meta}</div>
      </div>
    </div>`;
    })
    .join('');
}

function heatIntensityClass(v: number, maxVal: number): string {
  if (v <= 0) return 'heatmap-cell';
  if (v <= maxVal * 0.33) return 'heatmap-cell h2';
  if (v <= maxVal * 0.66) return 'heatmap-cell h3';
  return 'heatmap-cell h4';
}

function renderHeatmap12w(container: HTMLElement, sessionCounts: Record<string, number>): void {
  container.innerHTML = '';
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 83);
  const dayOfWeek = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const cells: number[][] = [];
  for (let week = 0; week < 12; week++) cells.push(new Array(7).fill(0));

  const cur = new Date(startDate);
  for (let week = 0; week < 12; week++) {
    const weekCells = cells[week]!;
    for (let dow = 0; dow < 7; dow++) {
      weekCells[dow] = sessionCounts[cur.toISOString().slice(0, 10)] || 0;
      cur.setDate(cur.getDate() + 1);
    }
  }

  const maxVal = Math.max(1, ...cells.flat());
  for (let dow = 0; dow < 7; dow++) {
    for (let week = 0; week < 12; week++) {
      const v = cells[week]?.[dow] || 0;
      const cell = document.createElement('div');
      cell.className = heatIntensityClass(v, maxVal);
      if (v > 0) cell.title = v === 1 ? `${v} sesión` : `${v} sesiones`;
      container.appendChild(cell);
    }
  }
}

export async function loadActividad(): Promise<void> {
  const since12w = daysAgo(84);
  const [gymSessions, hiitSessions, profiles] = await Promise.all([
    fetchGymSessions(since12w),
    fetchHiitSessions(since12w),
    fetchProfiles(),
  ]);

  const profileMap: Record<string, Profile> = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const allSessions = [...gymSessions, ...hiitSessions].sort((a, b) => b.date.localeCompare(a.date));

  const log = document.getElementById('activity-log');
  if (log) log.innerHTML = renderActivityLog(allSessions.slice(0, 30), profileMap);

  const sessionCounts: Record<string, number> = {};
  allSessions.forEach((s) => {
    sessionCounts[s.date] = (sessionCounts[s.date] || 0) + 1;
  });

  const heat = document.getElementById('heatmap-12w');
  if (heat) renderHeatmap12w(heat, sessionCounts);
}
