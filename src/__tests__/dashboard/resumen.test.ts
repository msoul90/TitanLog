import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchGymSessions = vi.fn();
const fetchHiitSessions = vi.fn();
const fetchProfiles = vi.fn();
const setActiveChart = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchGymSessions: (...args: unknown[]) => fetchGymSessions(...args),
  fetchHiitSessions: (...args: unknown[]) => fetchHiitSessions(...args),
  fetchProfiles: (...args: unknown[]) => fetchProfiles(...args),
}));

vi.mock('../../dashboard/theme', async () => {
  const actual = await vi.importActual('../../dashboard/theme');
  return {
    ...(actual as object),
    setActiveChart: (...args: unknown[]) => setActiveChart(...args),
  };
});

describe('dashboard resumen page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
    vi.resetModules();
    vi.clearAllMocks();

    document.documentElement.dataset.theme = 'dark';
    document.body.innerHTML = `
      <div id="kpi-activos-val"></div>
      <div id="kpi-hoy-val"></div>
      <div id="kpi-hoy-date"></div>
      <div id="kpi-prs-val"></div>
      <div id="kpi-inactivos-val"></div>
      <canvas id="chart-sessions"></canvas>
      <div id="top-exercises-list"></div>
      <div id="activity-feed"></div>
      <div id="pr-feed"></div>
    `;

    const ChartCtor = vi.fn(function ChartCtor(this: { destroy: unknown; update: unknown; options: unknown }) {
      this.destroy = vi.fn();
      this.update = vi.fn();
      this.options = {};
    });
    (globalThis as unknown as { Chart: unknown }).Chart = ChartCtor;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calcula KPIs y renderiza listas', async () => {
    fetchProfiles.mockResolvedValue([
      { id: 'u1', name: 'Ana', color: '#4ab8ff' },
      { id: 'u2', name: 'Luis', color: '#ff6b6b' },
    ]);

    fetchGymSessions.mockResolvedValue([
      { id: 'g1', user_id: 'u1', date: '2026-04-10', exercises: [{ name: 'Sentadilla', weight: 100, unit: 'kg' }] },
      { id: 'g2', user_id: 'u2', date: '2026-04-05', exercises: [{ name: 'Bench press', weight: 80, unit: 'kg' }] },
    ]);

    fetchHiitSessions.mockResolvedValue([
      { id: 'h1', user_id: 'u1', date: '2026-04-10', name: 'EMOM', rounds: 5, rpe: 8 },
    ]);

    const mod = await import('../../dashboard/pages/resumen');
    await mod.loadResumen();

    expect(document.getElementById('kpi-hoy-val')?.textContent).toBe('2');
    expect(document.getElementById('top-exercises-list')?.innerHTML.length).toBeGreaterThan(0);
    expect(document.getElementById('activity-feed')?.innerHTML).toContain('Ana');
    expect(setActiveChart).toHaveBeenCalled();
  });

  it('renderiza estados vacios en ausencia de datos', async () => {
    fetchProfiles.mockResolvedValue([]);
    fetchGymSessions.mockResolvedValue([]);
    fetchHiitSessions.mockResolvedValue([]);

    const mod = await import('../../dashboard/pages/resumen');
    await mod.loadResumen();

    expect(document.getElementById('top-exercises-list')?.innerHTML).toContain('Sin datos');
    expect(document.getElementById('activity-feed')?.innerHTML).toContain('Sin actividad reciente');
  });

  it('escapa nombres y ejercicios en feeds', async () => {
    fetchProfiles.mockResolvedValue([{ id: 'u1', name: '<img src=x onerror=alert(1)>', color: '#4ab8ff' }]);
    fetchGymSessions.mockResolvedValue([
      { id: 'g1', user_id: 'u1', date: '2026-04-10', exercises: [{ name: '<svg onload=alert(1)>', weight: 100, unit: 'kg' }] },
    ]);
    fetchHiitSessions.mockResolvedValue([]);

    const mod = await import('../../dashboard/pages/resumen');
    await mod.loadResumen();

    expect(document.querySelector('#activity-feed img')).toBeNull();
    expect(document.getElementById('activity-feed')?.innerHTML).toContain('&lt;img');
    expect(document.getElementById('pr-feed')?.innerHTML).toContain('&lt;svg');
  });
});
