import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchGymSessions = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchGymSessions: (...args: unknown[]) => fetchGymSessions(...args),
}));

describe('dashboard ejercicios page', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    document.documentElement.dataset.theme = 'dark';
    document.body.innerHTML = `
      <canvas id="chart-top-exercises"></canvas>
      <canvas id="chart-muscle-group"></canvas>
      <table><tbody id="exercises-tbody"></tbody></table>
    `;

    const ChartCtor = vi.fn(function ChartCtor(this: { destroy: unknown; update: unknown; options: unknown }) {
      this.destroy = vi.fn();
      this.update = vi.fn();
      this.options = {};
    });

    (globalThis as unknown as { Chart: unknown }).Chart = ChartCtor;
  });

  it('loadEjercicios renderiza graficos y tabla', async () => {
    fetchGymSessions.mockResolvedValue([
      {
        id: 'g1',
        user_id: 'u1',
        date: '2026-04-01',
        exercises: [{ name: 'Sentadilla', weight: 100, unit: 'kg' }],
      },
      {
        id: 'g2',
        user_id: 'u2',
        date: '2026-04-02',
        exercises: [
          { name: 'Sentadilla', weight: 90, unit: 'kg' },
          { name: 'Bench press', weight: 80, unit: 'kg' },
        ],
      },
    ]);

    const mod = await import('../../dashboard/pages/ejercicios');
    await mod.loadEjercicios();

    expect(fetchGymSessions).toHaveBeenCalled();
    expect((globalThis as unknown as { Chart: ReturnType<typeof vi.fn> }).Chart).toHaveBeenCalledTimes(2);
    expect(document.getElementById('exercises-tbody')?.innerHTML).toContain('Sentadilla');
    expect(document.getElementById('exercises-tbody')?.innerHTML).toContain('Bench press');
  });

  it('loadEjercicios muestra estado vacio sin datos', async () => {
    fetchGymSessions.mockResolvedValue([]);

    const mod = await import('../../dashboard/pages/ejercicios');
    await mod.loadEjercicios();

    expect(document.getElementById('exercises-tbody')?.innerHTML).toContain('Sin datos');
  });
});
