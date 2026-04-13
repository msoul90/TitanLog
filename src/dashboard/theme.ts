let activeChart: any = null;

export function setActiveChart(chart: any): void {
  activeChart = chart;
}

export function getTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem('tl-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

export function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('tl-theme', theme);
  const icon = document.getElementById('theme-icon');
  const tip = document.getElementById('theme-tooltip');
  if (!icon || !tip) return;
  if (theme === 'dark') {
    icon.textContent = '☀️';
    tip.textContent = 'Cambiar a modo claro';
  } else {
    icon.textContent = '🌙';
    tip.textContent = 'Cambiar a modo oscuro';
  }
}

export function toggleTheme(): void {
  const current = (document.documentElement.dataset.theme || 'light') as 'dark' | 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  if (activeChart) updateChartTheme(activeChart);
}

export function chartColors() {
  const theme = document.documentElement.dataset.theme;
  return {
    accent: theme === 'dark' ? '#b8ff4a' : '#5a9900',
    accent2: '#4ab8ff',
    accent3: '#ff6b6b',
    warn: '#ffb347',
    text2: theme === 'dark' ? '#9090b8' : '#5a5a7a',
    text3: theme === 'dark' ? '#50507a' : '#9090aa',
    border: theme === 'dark' ? '#252534' : '#e0e0ea',
    surface2: theme === 'dark' ? '#1d1d28' : '#f0f0f6',
    gridColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
  };
}

export function baseChartOptions(withGrid = true) {
  const c = chartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.surface2,
        borderColor: c.border,
        borderWidth: 1,
        titleColor: c.text2,
        bodyColor: c.text2,
        padding: 10,
      },
    },
    scales: withGrid
      ? {
          x: {
            ticks: { color: c.text3, font: { family: "'DM Sans'", size: 11 } },
            grid: { color: c.gridColor },
            border: { color: c.border },
          },
          y: {
            ticks: { color: c.text3, font: { family: "'DM Sans'", size: 11 } },
            grid: { color: c.gridColor },
            border: { color: c.border },
          },
        }
      : {},
  };
}

export function updateChartTheme(chart: any): void {
  if (!chart) return;
  const c = chartColors();
  const opts = chart.options;

  if (opts.plugins?.tooltip) {
    opts.plugins.tooltip.backgroundColor = c.surface2;
    opts.plugins.tooltip.borderColor = c.border;
    opts.plugins.tooltip.titleColor = c.text2;
    opts.plugins.tooltip.bodyColor = c.text2;
  }
  if (opts.scales?.x) {
    opts.scales.x.ticks.color = c.text3;
    opts.scales.x.grid.color = c.gridColor;
  }
  if (opts.scales?.y) {
    opts.scales.y.ticks.color = c.text3;
    opts.scales.y.grid.color = c.gridColor;
  }
  if (chart.data?.datasets) {
    chart.data.datasets.forEach((ds: any) => {
      if (ds._colorKey) ds.backgroundColor = (c as any)[ds._colorKey];
      if (ds._borderColorKey) ds.borderColor = (c as any)[ds._borderColorKey];
    });
  }
  chart.update();
}
