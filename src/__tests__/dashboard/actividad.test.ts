import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchGymSessions = vi.fn();
const fetchHiitSessions = vi.fn();
const fetchProfiles = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchGymSessions: (...args: unknown[]) => fetchGymSessions(...args),
  fetchHiitSessions: (...args: unknown[]) => fetchHiitSessions(...args),
  fetchProfiles: (...args: unknown[]) => fetchProfiles(...args),
}));

describe('dashboard actividad page', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="activity-log"></div><div id="heatmap-12w"></div>';
  });

  it('renderiza actividad y heatmap con sesiones', async () => {
    fetchProfiles.mockResolvedValue([{ id: 'u1', name: 'Ana', color: '#111' }]);
    fetchGymSessions.mockResolvedValue([{ id: 'g1', user_id: 'u1', date: '2026-04-08', exercises: [] }]);
    fetchHiitSessions.mockResolvedValue([{ id: 'h1', user_id: 'u1', date: '2026-04-09', name: 'AMRAP', rounds: 6, rpe: 8 }]);

    const mod = await import('../../dashboard/pages/actividad');
    await mod.loadActividad();

    expect(document.getElementById('activity-log')?.innerHTML).toContain('Ana');
    expect(document.getElementById('activity-log')?.innerHTML).toContain('HIIT');
    expect((document.getElementById('heatmap-12w')?.children.length || 0) > 0).toBe(true);
  });

  it('muestra estado vacio sin sesiones', async () => {
    fetchProfiles.mockResolvedValue([]);
    fetchGymSessions.mockResolvedValue([]);
    fetchHiitSessions.mockResolvedValue([]);

    const mod = await import('../../dashboard/pages/actividad');
    await mod.loadActividad();

    expect(document.getElementById('activity-log')?.innerHTML).toContain('Sin sesiones');
  });
});
