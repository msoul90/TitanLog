import { describe, expect, it, vi } from 'vitest';

import {
  applyTheme,
  baseChartOptions,
  chartColors,
  getTheme,
  setActiveChart,
  toggleTheme,
  updateChartTheme,
} from '../../dashboard/theme';

describe('dashboard theme', () => {
  it('getTheme prioriza localStorage', () => {
    localStorage.setItem('tl-theme', 'light');
    expect(getTheme()).toBe('light');
  });

  it('getTheme usa matchMedia cuando no hay valor guardado', () => {
    localStorage.removeItem('tl-theme');
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    expect(getTheme()).toBe('dark');
  });

  it('applyTheme actualiza dataset e iconos si existen', () => {
    document.body.innerHTML = '<span id="theme-icon"></span><span id="theme-tooltip"></span>';
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.getElementById('theme-icon')?.textContent).toBe('☀️');
    applyTheme('light');
    expect(document.getElementById('theme-icon')?.textContent).toBe('🌙');
  });

  it('baseChartOptions sin grid deja scales vacio', () => {
    document.documentElement.dataset.theme = 'dark';
    const opts = baseChartOptions(false) as { scales: Record<string, unknown> };
    expect(opts.scales).toEqual({});
  });

  it('toggleTheme actualiza chart activo', () => {
    document.body.innerHTML = '<span id="theme-icon"></span><span id="theme-tooltip"></span>';
    document.documentElement.dataset.theme = 'dark';

    const chart = {
      options: {
        plugins: { tooltip: {} },
        scales: { x: { ticks: {}, grid: {} }, y: { ticks: {}, grid: {} } },
      },
      data: { datasets: [{ _colorKey: 'accent', _borderColorKey: 'accent2' }] },
      update: vi.fn(),
      destroy: vi.fn(),
    };

    setActiveChart(chart);
    toggleTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(chart.update).toHaveBeenCalled();
  });

  it('updateChartTheme soporta chart null', () => {
    expect(() => updateChartTheme(null)).not.toThrow();
  });

  it('chartColors cambia por tema', () => {
    document.documentElement.dataset.theme = 'dark';
    const dark = chartColors();
    document.documentElement.dataset.theme = 'light';
    const light = chartColors();
    expect(dark.accent).not.toBe(light.accent);
  });
});
