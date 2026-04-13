import Chart from 'chart.js/auto';
import { fetchBodyMetrics, fetchProfiles } from '../data';
import { baseChartOptions, chartColors } from '../theme';
import { escapeHtml, initials, niceDate, safeColor } from '../helpers';
import { BodyMetric, ChartLike, Profile } from '../types';

let chartWeightAvg: ChartLike | null = null;
let chartFatAvg: ChartLike | null = null;

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatBodyMass(weightKg: number, percent: number | null): string {
  if (percent == null || weightKg <= 0) return '—';
  return `${(weightKg * percent / 100).toFixed(1)} kg`;
}

function renderProgressRow(metric: BodyMetric, profileMap: Record<string, Profile>): string {
  const p: Profile = profileMap[metric.user_id] || { id: metric.user_id, name: 'Miembro', color: '#4ab8ff' };
  const color = safeColor(p.color, '#4ab8ff');
  const name = escapeHtml(p.name || '—');
  const avatar = escapeHtml(initials(p.name));

  const rawWeight = toNumber(metric.weight);
  const weightKg = metric.weight_unit === 'lb' ? rawWeight * 0.453592 : rawWeight;
  const fatVal = metric.fat_pct == null ? null : toNumber(metric.fat_pct);
  const muscVal = metric.muscle_pct == null ? null : toNumber(metric.muscle_pct);
  const fat = fatVal != null && fatVal > 0 ? fatVal : null;
  const musc = muscVal != null && muscVal > 0 ? muscVal : null;

  const fatMass = formatBodyMass(weightKg, fat);
  const muscMass = formatBodyMass(weightKg, musc);

  return `<tr>
      <td><div class="avatar-cell">
        <div class="avatar" style="background:${color + '33'};color:${color}">${avatar}</div>
        <span class="avatar-name">${name}</span>
      </div></td>
      <td>${niceDate(metric.date)}</td>
      <td class="text-mono">${weightKg > 0 ? weightKg.toFixed(1) + ' kg' : '—'}</td>
      <td class="text-mono">${fat == null ? '—' : fat + '%'}</td>
      <td class="text-mono">${musc == null ? '—' : musc + '%'}</td>
      <td class="text-mono">${fatMass}</td>
      <td class="text-mono">${muscMass}</td>
    </tr>`;
}

export async function loadProgreso(): Promise<void> {
  const [metrics, profiles] = await Promise.all([fetchBodyMetrics(), fetchProfiles()]);
  const profileMap: Record<string, Profile> = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const byDate: Record<string, { weights: number[]; fats: number[] }> = {};
  metrics.forEach((m) => {
    const bucket = byDate[m.date] ?? { weights: [], fats: [] };
    byDate[m.date] = bucket;
    const rawWeight = toNumber(m.weight);
    const wKg = m.weight_unit === 'lb' ? rawWeight * 0.453592 : rawWeight;
    if (wKg > 0) bucket.weights.push(wKg);
    if (m.fat_pct != null) bucket.fats.push(toNumber(m.fat_pct));
  });

  const dates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));
  const avgWeight = dates.map((d) => {
    const ws = byDate[d]?.weights || [];
    return ws.length ? +(ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(1) : null;
  });
  const avgFat = dates.map((d) => {
    const fs = byDate[d]?.fats || [];
    return fs.length ? +(fs.reduce((a, b) => a + b, 0) / fs.length).toFixed(1) : null;
  });

  const labels = dates.map(niceDate);
  const c = chartColors();
  const weightCanvas = document.getElementById('chart-weight-avg') as HTMLCanvasElement | null;
  const fatCanvas = document.getElementById('chart-fat-avg') as HTMLCanvasElement | null;

  if (chartWeightAvg) chartWeightAvg.destroy();
  if (weightCanvas) {
    chartWeightAvg = new Chart(weightCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: avgWeight,
            borderColor: c.accent,
            backgroundColor: c.accent + '22',
            tension: 0.4,
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

  if (chartFatAvg) chartFatAvg.destroy();
  if (fatCanvas) {
    chartFatAvg = new Chart(fatCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: avgFat,
            borderColor: c.accent3,
            backgroundColor: c.accent3 + '22',
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: c.accent3,
            spanGaps: true,
          },
        ],
      },
      options: { ...baseChartOptions(), plugins: { legend: { display: false } } },
    });
  }

  const latest: Record<string, BodyMetric> = {};
  metrics.forEach((m) => {
    const current = latest[m.user_id];
    if (!current || m.date > current.date) latest[m.user_id] = m;
  });

  const rows = Object.values(latest).sort((a, b) => b.date.localeCompare(a.date));
  const tbody = document.getElementById('progress-tbody');
  if (!tbody) return;

  tbody.innerHTML = rows.length
    ? rows
        .map((m) => renderProgressRow(m, profileMap))
        .join('')
    : '<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">Sin métricas</div></div></td></tr>';
}
