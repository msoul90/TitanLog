import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchBodyMetrics = vi.fn();
const fetchProfiles = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchBodyMetrics: (...args: unknown[]) => fetchBodyMetrics(...args),
  fetchProfiles: (...args: unknown[]) => fetchProfiles(...args),
}));

describe('dashboard progreso page', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    document.documentElement.dataset.theme = 'dark';
    document.body.innerHTML = `
      <canvas id="chart-weight-avg"></canvas>
      <canvas id="chart-fat-avg"></canvas>
      <table><tbody id="progress-tbody"></tbody></table>
    `;

    const ChartCtor = vi.fn(function ChartCtor(this: { destroy: unknown; update: unknown; options: unknown }) {
      this.destroy = vi.fn();
      this.update = vi.fn();
      this.options = {};
    });
    (globalThis as unknown as { Chart: unknown }).Chart = ChartCtor;
  });

  it('renderiza graficas y tabla de metricas', async () => {
    fetchProfiles.mockResolvedValue([{ id: 'u1', name: 'Ana', color: '#4ab8ff' }]);
    fetchBodyMetrics.mockResolvedValue([
      { id: 'm1', user_id: 'u1', date: '2026-04-01', weight: 70, weight_unit: 'kg', fat_pct: 20, muscle_pct: 40 },
      { id: 'm2', user_id: 'u1', date: '2026-04-08', weight: 69, weight_unit: 'kg', fat_pct: 19, muscle_pct: 41 },
    ]);

    const mod = await import('../../dashboard/pages/progreso');
    await mod.loadProgreso();

    expect((globalThis as unknown as { Chart: ReturnType<typeof vi.fn> }).Chart).toHaveBeenCalledTimes(2);
    expect(document.getElementById('progress-tbody')?.innerHTML).toContain('Ana');
    expect(document.getElementById('progress-tbody')?.innerHTML).toContain('kg');

    await mod.loadProgreso();
    expect((globalThis as unknown as { Chart: ReturnType<typeof vi.fn> }).Chart).toHaveBeenCalledTimes(4);
  });

  it('muestra estado vacio sin metricas', async () => {
    fetchProfiles.mockResolvedValue([]);
    fetchBodyMetrics.mockResolvedValue([]);

    const mod = await import('../../dashboard/pages/progreso');
    await mod.loadProgreso();

    expect(document.getElementById('progress-tbody')?.innerHTML).toContain('Sin métricas');
  });
});
