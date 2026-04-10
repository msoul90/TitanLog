import { fetchGymSessions } from '../data';
import { baseChartOptions, chartColors } from '../theme';
import { colorForMuscle, daysAgo, escapeHtml, muscleGroup } from '../helpers';
import { ChartCtor, ChartLike } from '../types';

declare const Chart: ChartCtor;

let chartTopEx: ChartLike | null = null;
let chartMuscle: ChartLike | null = null;

export async function loadEjercicios(): Promise<void> {
  const gymSessions = await fetchGymSessions(daysAgo(365));

  const exStats: Record<string, { count: number; users: Set<string> }> = {};
  gymSessions.forEach((s) => {
    (s.exercises || []).forEach((ex) => {
      if (!ex.name) return;
      exStats[ex.name] ??= { count: 0, users: new Set() };
      const stats = exStats[ex.name];
      if (!stats) return;
      stats.count++;
      stats.users.add(s.user_id);
    });
  });

  const sorted = Object.entries(exStats).sort((a, b) => b[1].count - a[1].count);
  const top12 = sorted.slice(0, 12);
  const c = chartColors();

  if (chartTopEx) chartTopEx.destroy();
  chartTopEx = new Chart(document.getElementById('chart-top-exercises'), {
    type: 'bar',
    data: {
      labels: top12.map(([n]) => n),
      datasets: [
        {
          data: top12.map(([, d]) => d.count),
          backgroundColor: c.accent + 'bb',
          borderColor: c.accent,
          borderWidth: 1,
          borderRadius: 4,
          _colorKey: 'accent',
        },
      ],
    },
    options: {
      indexAxis: 'y',
      ...baseChartOptions(),
      maintainAspectRatio: false,
      responsive: true,
    },
  });

  const groupCounts: Record<string, number> = {};
  Object.entries(exStats).forEach(([name, d]) => {
    const g = muscleGroup(name);
    groupCounts[g] = (groupCounts[g] || 0) + d.count;
  });
  const groupEntries = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);

  if (chartMuscle) chartMuscle.destroy();
  chartMuscle = new Chart(document.getElementById('chart-muscle-group'), {
    type: 'doughnut',
    data: {
      labels: groupEntries.map(([g]) => g),
      datasets: [
        {
          data: groupEntries.map(([, n]) => n),
          backgroundColor: groupEntries.map(([g]) => colorForMuscle(g) + 'cc'),
          borderColor: groupEntries.map(([g]) => colorForMuscle(g)),
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: { color: c.text2, font: { family: "'DM Sans'", size: 11 }, boxWidth: 12, padding: 10 },
        },
        tooltip: {
          backgroundColor: c.surface2,
          borderColor: c.border,
          borderWidth: 1,
          titleColor: c.text2,
          bodyColor: c.text2,
          padding: 10,
        },
      },
    },
  });

  const tbody = document.getElementById('exercises-tbody');
  if (!tbody) return;
  tbody.innerHTML = sorted.length
    ? sorted
        .map(
          ([name, d]) => `<tr>
    <td>${escapeHtml(name)}</td>
    <td class="text-mono">${d.count}</td>
    <td class="text-mono">${d.users.size}</td>
    <td><span class="badge badge-member">${escapeHtml(muscleGroup(name))}</span></td>
  </tr>`,
        )
        .join('')
    : '<tr><td colspan="4"><div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-text">Sin datos</div></div></td></tr>';
}
