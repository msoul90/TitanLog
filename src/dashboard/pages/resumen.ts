import Chart from 'chart.js/auto';
import { fetchGymSessions, fetchHiitSessions, fetchProfiles } from '../data';
import { baseChartOptions, chartColors, setActiveChart } from '../theme';
import { daysAgo, escapeHtml, niceDate, today } from '../helpers';
import { ChartLike, DashboardSession, ExerciseEntry, GymSession, Profile } from '../types';

let chartSessions: ChartLike | null = null;

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function loadResumen(): Promise<void> {
  const since4w = daysAgo(28);
  const since7d = daysAgo(7);
  const t = today();
  const [gymSessions, hiitSessions, profiles] = await Promise.all([
    fetchGymSessions(since4w),
    fetchHiitSessions(since4w),
    fetchProfiles(),
  ]);

  const allSessions: DashboardSession[] = [...gymSessions, ...hiitSessions];
  const userLastDate: Record<string, string> = {};
  allSessions.forEach((s) => {
    const last = userLastDate[s.user_id];
    if (!last || s.date > last) userLastDate[s.user_id] = s.date;
  });

  const activeUsers = Object.values(userLastDate).filter((d) => d >= since7d).length;
  const todaySessions = allSessions.filter((s: any) => s.date === t).length;

  const elActive = document.getElementById('kpi-activos-val');
  const elToday = document.getElementById('kpi-hoy-val');
  const elTodayDate = document.getElementById('kpi-hoy-date');
  if (elActive) elActive.textContent = String(activeUsers);
  if (elToday) elToday.textContent = String(todaySessions);
  if (elTodayDate) elTodayDate.textContent = niceDate(t);

  const startOfMonth = t.slice(0, 7) + '-01';
  const monthGymSessions = gymSessions.filter((s: GymSession) => s.date >= startOfMonth);

  const userExMaxBefore: Record<string, number> = {};
  gymSessions
    .filter((s: GymSession) => s.date < startOfMonth)
    .forEach((s: GymSession) => {
      (s.exercises || []).forEach((ex: ExerciseEntry) => {
        const key = s.user_id + '|' + ex.name;
        const w = toNumber(ex.weight);
        if (!userExMaxBefore[key] || userExMaxBefore[key] < w) userExMaxBefore[key] = w;
      });
    });

  const prSet = new Set<string>();
  monthGymSessions.forEach((s: GymSession) => {
    (s.exercises || []).forEach((ex: ExerciseEntry) => {
      const key = s.user_id + '|' + ex.name;
      const w = toNumber(ex.weight);
      if (w > 0 && w > (userExMaxBefore[key] || 0)) {
        prSet.add(key + '|' + s.date);
        userExMaxBefore[key] = Math.max(userExMaxBefore[key] || 0, w);
      }
    });
  });

  const elPrs = document.getElementById('kpi-prs-val');
  if (elPrs) elPrs.textContent = String(prSet.size);

  const inactiveUsers = profiles.filter((p) => {
    const last = userLastDate[p.id];
    if (!last) return true;
    return last < since7d;
  }).length;
  const elInactive = document.getElementById('kpi-inactivos-val');
  if (elInactive) elInactive.textContent = String(inactiveUsers);

  const sessionsByDay: Record<string, number> = {};
  for (let i = 27; i >= 0; i--) sessionsByDay[daysAgo(i)] = 0;
  allSessions.forEach((s) => {
    if (sessionsByDay[s.date] !== undefined) {
      sessionsByDay[s.date] = (sessionsByDay[s.date] || 0) + 1;
    }
  });

  const labels = Object.keys(sessionsByDay).map((d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.getDate() + '/' + (dt.getMonth() + 1);
  });
  const values = Object.values(sessionsByDay);
  const c = chartColors();
  const sessionsCanvas = document.querySelector<HTMLCanvasElement>('#chart-sessions');

  if (chartSessions) chartSessions.destroy();
  if (sessionsCanvas) {
    chartSessions = new Chart(sessionsCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: c.accent + 'bb',
            borderColor: c.accent,
            borderWidth: 1,
            borderRadius: 4,
            _colorKey: 'accent',
          } as any,
        ],
      },
      options: baseChartOptions(),
    });
    setActiveChart(chartSessions);
  }

  const exCounts: Record<string, number> = {};
  gymSessions.forEach((s: GymSession) => {
    (s.exercises || []).forEach((ex: ExerciseEntry) => {
      if (ex.name) exCounts[ex.name] = (exCounts[ex.name] || 0) + 1;
    });
  });

  const top8 = Object.entries(exCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxEx = top8[0]?.[1] || 1;
  const exHTML = top8.length
    ? top8
        .map(
          ([name, cnt]) => `
    <div class="progress-bar-wrap" style="margin-bottom:9px">
      <div style="font-size:0.83rem;color:var(--text2);width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(name)}</div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${Math.round((cnt / maxEx) * 100)}%"></div></div>
      <div class="progress-count">${cnt}</div>
    </div>`,
        )
        .join('')
    : '<div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-text">Sin datos</div></div>';
  const topExList = document.getElementById('top-exercises-list');
  if (topExList) topExList.innerHTML = exHTML;

  const profileMap: Record<string, Profile> = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const recentSessions = allSessions.slice(0, 12);
  const feedHTML = recentSessions.length
    ? recentSessions
        .map((s) => {
          const p = profileMap[s.user_id] || { name: 'Miembro' };
          const type = 'name' in s && s.name ? 'HIIT' : 'Gym';
          return `<div class="feed-item">
      <div class="feed-dot" style="background:${type === 'HIIT' ? 'var(--accent2)' : 'var(--accent)'}"></div>
      <div class="feed-content">
        <div class="feed-title">${escapeHtml(p.name || 'Miembro')} — ${type}</div>
        <div class="feed-meta">${niceDate(s.date)}</div>
      </div>
    </div>`;
        })
        .join('')
    : '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Sin actividad reciente</div></div>';
  const activityFeed = document.getElementById('activity-feed');
  if (activityFeed) activityFeed.innerHTML = feedHTML;

  const prList: Array<{ name: string; ex: string; weight: number; unit: string; date: string }> = [];
  const maxBefore: Record<string, number> = {};
  gymSessions
    .filter((s: GymSession) => s.date < startOfMonth)
    .forEach((s: GymSession) => {
      (s.exercises || []).forEach((ex: ExerciseEntry) => {
        const key = s.user_id + '|' + ex.name;
        const w = toNumber(ex.weight);
        if (!maxBefore[key] || maxBefore[key] < w) maxBefore[key] = w;
      });
    });

  const seenPR = new Set<string>();
  monthGymSessions.forEach((s: GymSession) => {
    (s.exercises || []).forEach((ex: ExerciseEntry) => {
      const key = s.user_id + '|' + ex.name;
      const w = toNumber(ex.weight);
      if (w > 0 && w > (maxBefore[key] || 0) && !seenPR.has(key)) {
        seenPR.add(key);
        maxBefore[key] = Math.max(maxBefore[key] || 0, w);
        const p = profileMap[s.user_id] || { name: 'Miembro' };
        prList.push({ name: p.name, ex: ex.name, weight: w, unit: ex.unit || 'kg', date: s.date });
      }
    });
  });

  const prFeedHTML = prList.length
    ? prList
        .slice(0, 10)
        .map(
          (pr) => `
    <div class="feed-item feed-pr">
      <div class="feed-dot"></div>
      <div class="feed-content">
        <div class="feed-title">${escapeHtml(pr.name)} — <strong>${escapeHtml(pr.ex)}</strong> <span class="pr-badge">PR</span></div>
        <div class="feed-meta">${pr.weight} ${escapeHtml(pr.unit)} · ${niceDate(pr.date)}</div>
      </div>
    </div>`,
        )
        .join('')
    : '<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">Sin PRs este mes</div></div>';
  const prFeed = document.getElementById('pr-feed');
  if (prFeed) prFeed.innerHTML = prFeedHTML;
}
