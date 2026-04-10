import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchGymSessions = vi.fn();
const fetchHiitSessions = vi.fn();
const fetchProfiles = vi.fn();
const fetchBodyMetrics = vi.fn();

vi.mock('../../dashboard/data', () => ({
  fetchGymSessions: (...args: unknown[]) => fetchGymSessions(...args),
  fetchHiitSessions: (...args: unknown[]) => fetchHiitSessions(...args),
  fetchProfiles: (...args: unknown[]) => fetchProfiles(...args),
  fetchBodyMetrics: (...args: unknown[]) => fetchBodyMetrics(...args),
}));

describe('dashboard miembros page', () => {
  let createdBlob: Blob | null = null;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    document.documentElement.dataset.theme = 'dark';
    document.body.innerHTML = `
      <input id="topbar-search" />
      <button id="export-csv-btn"></button>
      <button id="detail-close"></button>
      <div id="detail-overlay"></div>
      <aside id="detail-panel"></aside>
      <table><tbody id="members-tbody"></tbody></table>
      <div id="detail-name"></div>
      <div id="detail-email"></div>
      <div id="detail-avatar"></div>
      <div id="detail-sessions"></div>
      <div id="detail-streak"></div>
      <div id="detail-prs"></div>
      <div id="detail-heatmap"></div>
      <canvas id="chart-member-weight"></canvas>
      <div id="detail-prs-list"></div>
      <div id="toast-container"></div>
    `;

    const ChartCtor = vi.fn(function ChartCtor(this: { destroy: unknown; update: unknown; options: unknown }) {
      this.destroy = vi.fn();
      this.update = vi.fn();
      this.options = {};
    });
    (globalThis as unknown as { Chart: unknown }).Chart = ChartCtor;

    const urlApi = globalThis.URL as unknown as {
      createObjectURL?: (obj: Blob) => string;
      revokeObjectURL?: (url: string) => void;
    };
    createdBlob = null;
    urlApi.createObjectURL = vi.fn((obj: Blob) => {
      createdBlob = obj;
      return 'blob:mock';
    });
    urlApi.revokeObjectURL = vi.fn();

    fetchProfiles.mockResolvedValue([{ id: 'u1', name: 'Ana', color: '#4ab8ff' }]);
    fetchGymSessions.mockResolvedValue([
      { id: 'g1', user_id: 'u1', date: '2026-04-10', exercises: [{ name: 'Sentadilla', weight: 100, unit: 'kg' }] },
      { id: 'g2', user_id: 'u1', date: '2026-04-02', exercises: [{ name: 'Sentadilla', weight: 90, unit: 'kg' }] },
    ]);
    fetchHiitSessions.mockResolvedValue([{ id: 'h1', user_id: 'u1', date: '2026-04-09', name: 'AMRAP', rounds: 5, rpe: 8 }]);
    fetchBodyMetrics.mockResolvedValue([
      { id: 'b1', user_id: 'u1', date: '2026-04-01', weight: 71 },
      { id: 'b2', user_id: 'u1', date: '2026-04-08', weight: 70 },
    ]);
  });

  it('renderiza tabla, filtra y exporta csv', async () => {
    const mod = await import('../../dashboard/pages/miembros');
    mod.initMiembrosPage();
    await mod.loadMiembros();

    expect(document.getElementById('members-tbody')?.innerHTML).toContain('Ana');

    const search = document.getElementById('topbar-search') as HTMLInputElement;
    search.value = 'ana';
    search.dispatchEvent(new Event('input'));

    (document.getElementById('export-csv-btn') as HTMLButtonElement).click();
    expect(document.getElementById('toast-container')?.innerHTML).toContain('CSV exportado');
  });

  it('abre panel de detalle al hacer click en fila', async () => {
    const mod = await import('../../dashboard/pages/miembros');
    mod.initMiembrosPage();
    await mod.loadMiembros();

    const row = document.querySelector('#members-tbody tr') as HTMLTableRowElement;
    row.click();
    await Promise.resolve();

    expect(document.getElementById('detail-panel')?.classList.contains('open')).toBe(true);
    expect(document.getElementById('detail-name')?.textContent).toContain('Ana');

    (document.getElementById('detail-close') as HTMLButtonElement).click();
    expect(document.getElementById('detail-panel')?.classList.contains('open')).toBe(false);
  });

  it('escapa html en tabla y neutraliza formulas en csv', async () => {
    fetchProfiles.mockResolvedValue([{ id: 'u1', name: '<img src=x onerror=alert(1)>', color: 'url(javascript:alert(1))' }]);
    fetchGymSessions.mockResolvedValue([
      { id: 'g1', user_id: 'u1', date: '2026-04-10', exercises: [{ name: '=CMD()', weight: 100, unit: 'kg' }] },
    ]);
    fetchHiitSessions.mockResolvedValue([]);

    const mod = await import('../../dashboard/pages/miembros');
    mod.initMiembrosPage();
    await mod.loadMiembros();

    expect(document.querySelector('#members-tbody img')).toBeNull();
    expect(document.getElementById('members-tbody')?.innerHTML).toContain('&lt;img');
    expect(document.getElementById('members-tbody')?.innerHTML).toContain('#4ab8ff');

    (document.getElementById('export-csv-btn') as HTMLButtonElement).click();
    const csv = await createdBlob?.text();

    expect(csv).toContain('"<img src=x onerror=alert(1)>"');
    expect(csv).toContain('"\'=CMD() 100kg"');
  });
});
