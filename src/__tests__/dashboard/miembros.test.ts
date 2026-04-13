import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as miembrosPage from '../../dashboard/pages/miembros';

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
    vi.clearAllMocks();

    document.documentElement.dataset.theme = 'dark';
    document.body.innerHTML = `
      <input id="topbar-search" />
      <select id="members-filter-status">
        <option value="all">Todos</option>
        <option value="active">Activos</option>
        <option value="warn">Advertencia</option>
        <option value="inactive">Inactivos</option>
      </select>
      <select id="members-filter-pr">
        <option value="all">Todos</option>
        <option value="with">Con PR</option>
        <option value="without">Sin PR</option>
      </select>
      <select id="members-filter-sessions">
        <option value="0">0+</option>
        <option value="1">1+</option>
        <option value="4">4+</option>
      </select>
      <button id="members-clear-filters"></button>
      <button id="export-csv-btn"></button>
      <button id="detail-close"></button>
      <div id="detail-overlay"></div>
      <aside id="detail-panel"></aside>
      <button class="detail-section-toggle" data-target="detail-activity-body" aria-expanded="true"></button>
      <div id="detail-activity-body"></div>
      <button class="detail-section-toggle" data-target="detail-weight-body" aria-expanded="true"></button>
      <div id="detail-weight-body"></div>
      <button class="detail-section-toggle" data-target="detail-exercise-progress-body" aria-expanded="true"></button>
      <div id="detail-exercise-progress-body"></div>
      <button class="detail-section-toggle" data-target="detail-prs-body" aria-expanded="true"></button>
      <div id="detail-prs-body"></div>
      <table>
        <thead>
          <tr>
            <th><button data-members-sort="name" data-label="Miembro">Miembro</button></th>
            <th><button data-members-sort="lastDate" data-label="Última sesión">Última sesión</button></th>
            <th><button data-members-sort="sesMonth" data-label="Sesiones mes">Sesiones mes</button></th>
            <th><button data-members-sort="activity28" data-label="Actividad 28d">Actividad 28d</button></th>
            <th><button data-members-sort="bestPR" data-label="Mejor PR">Mejor PR</button></th>
            <th><button data-members-sort="status" data-label="Estado">Estado</button></th>
          </tr>
        </thead>
        <tbody id="members-tbody"></tbody>
      </table>
      <div id="detail-name"></div>
      <div id="detail-email"></div>
      <div id="detail-avatar"></div>
      <div id="detail-sessions"></div>
      <div id="detail-streak"></div>
      <div id="detail-prs"></div>
      <div id="detail-heatmap"></div>
      <div id="detail-exercise-progress-title"></div>
      <canvas id="chart-member-weight"></canvas>
      <canvas id="chart-member-exercise"></canvas>
      <div id="detail-prs-list"></div>
      <div id="toast-container"></div>
    `;

    sessionStorage.clear();

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
    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    expect(document.getElementById('members-tbody')?.innerHTML).toContain('Ana');

    const search = document.getElementById('topbar-search') as HTMLInputElement;
    search.value = 'ana';
    search.dispatchEvent(new Event('input'));

    (document.getElementById('export-csv-btn') as HTMLButtonElement).click();
    expect(document.getElementById('toast-container')?.innerHTML).toContain('CSV exportado');
  });

  it('abre panel de detalle al hacer click en fila', async () => {
    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    const row = document.querySelector('#members-tbody tr') as HTMLTableRowElement;
    row.click();
    await vi.waitFor(() => {
      expect(document.getElementById('detail-panel')?.classList.contains('open')).toBe(true);
    });

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

    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    expect(document.querySelector('#members-tbody img')).toBeNull();
    expect(document.getElementById('members-tbody')?.innerHTML).toContain('&lt;img');
    expect(document.getElementById('members-tbody')?.innerHTML).toContain('#4ab8ff');

    (document.getElementById('export-csv-btn') as HTMLButtonElement).click();
    const csv = await createdBlob?.text();

    expect(csv).toContain('"<img src=x onerror=alert(1)>"');
    expect(csv).toContain('"\'=CMD() 100kg"');
  });

  it('restaura secciones colapsadas desde sessionStorage', async () => {
    sessionStorage.setItem('dashboard:miembros:detail-sections:v1', JSON.stringify({
      'detail-weight-body': false,
    }));

    miembrosPage.initMiembrosPage();

    const toggle = document.querySelector('[data-target="detail-weight-body"]') as HTMLButtonElement;
    const body = document.getElementById('detail-weight-body') as HTMLDivElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(body.classList.contains('collapsed')).toBe(true);
  });

  it('muestra error al exportar cuando no hay miembros', async () => {
    fetchProfiles.mockResolvedValue([]);
    fetchGymSessions.mockResolvedValue([]);
    fetchHiitSessions.mockResolvedValue([]);

    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    expect(document.getElementById('members-tbody')?.innerHTML).toContain('Sin miembros');

    (document.getElementById('export-csv-btn') as HTMLButtonElement).click();
    expect(document.getElementById('toast-container')?.innerHTML).toContain('Sin datos para exportar');
  });

  it('tolera estado corrupto en sessionStorage y persiste toggles de secciones', async () => {
    sessionStorage.setItem('dashboard:miembros:detail-sections:v1', '{invalid json');

    miembrosPage.initMiembrosPage();

    const toggle = document.querySelector('[data-target="detail-activity-body"]') as HTMLButtonElement;
    const body = document.getElementById('detail-activity-body') as HTMLDivElement;
    toggle.click();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(body.classList.contains('collapsed')).toBe(true);

    const saved = sessionStorage.getItem('dashboard:miembros:detail-sections:v1') || '{}';
    expect(saved).toContain('detail-activity-body');
  });

  it('detalle sin ejercicios muestra estado vacio y permite cerrar con overlay', async () => {
    fetchProfiles.mockResolvedValue([{ id: 'u1', name: 'Ana', color: '#4ab8ff' }]);
    fetchGymSessions.mockResolvedValue([]);
    fetchHiitSessions.mockResolvedValue([{ id: 'h1', user_id: 'u1', date: '2026-04-09', name: 'AMRAP', rounds: 5, rpe: 8 }]);
    fetchBodyMetrics.mockResolvedValue([]);

    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    const row = document.querySelector('#members-tbody tr') as HTMLTableRowElement;
    row.click();
    await vi.waitFor(() => {
      expect(document.getElementById('detail-panel')?.classList.contains('open')).toBe(true);
    });

    expect(document.getElementById('detail-prs-list')?.innerHTML).toContain('Sin ejercicios');
    expect(document.getElementById('detail-exercise-progress-title')?.textContent).toContain('Evolucion por ejercicio');

    (document.getElementById('detail-overlay') as HTMLDivElement).click();
    expect(document.getElementById('detail-panel')?.classList.contains('open')).toBe(false);
  });

  it('al hacer click en PR abre evolucion y expande seccion colapsada', async () => {
    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    const toggle = document.querySelector('[data-target="detail-exercise-progress-body"]') as HTMLButtonElement;
    const body = document.getElementById('detail-exercise-progress-body') as HTMLDivElement;
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.add('collapsed');

    const row = document.querySelector('#members-tbody tr') as HTMLTableRowElement;
    row.click();
    await vi.waitFor(() => {
      expect(document.querySelector('#detail-prs-list button[data-exercise]')).not.toBeNull();
    });

    (document.querySelector('#detail-prs-list button[data-exercise]') as HTMLButtonElement).click();

    expect(document.getElementById('detail-exercise-progress-title')?.textContent).toContain('Evolucion: Sentadilla');
    expect(body.classList.contains('collapsed')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('si cambia a miembro sin ejercicios destruye grafica previa y deja titulo por defecto', async () => {
    fetchProfiles.mockResolvedValue([
      { id: 'u1', name: 'Ana', color: '#4ab8ff' },
      { id: 'u2', name: 'Luis', color: '#2ecc71' },
    ]);
    fetchGymSessions.mockResolvedValue([
      { id: 'g1', user_id: 'u1', date: '2026-04-10', exercises: [{ name: 'Sentadilla', weight: 100, unit: 'kg' }] },
    ]);
    fetchHiitSessions.mockResolvedValue([{ id: 'h1', user_id: 'u2', date: '2026-04-09', name: 'AMRAP', rounds: 5, rpe: 8 }]);
    fetchBodyMetrics.mockResolvedValue([
      { id: 'b1', user_id: 'u1', date: '2026-04-01', weight: 71 },
      { id: 'b2', user_id: 'u2', date: '2026-04-08', weight: 70 },
    ]);

    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    const rows = document.querySelectorAll('#members-tbody tr');
    (rows[0] as HTMLTableRowElement).click();
    await vi.waitFor(() => {
      expect(document.getElementById('detail-exercise-progress-title')?.textContent).toContain('Evolucion: Sentadilla');
    });

    (rows[1] as HTMLTableRowElement).click();
    await vi.waitFor(() => {
      expect(document.getElementById('detail-exercise-progress-title')?.textContent).toContain('Evolucion por ejercicio');
    });

    const chartMock = (globalThis as typeof globalThis & { Chart: unknown }).Chart as {
      mock: { instances: Array<{ destroy: ReturnType<typeof vi.fn> }> };
    };
    expect(chartMock.mock.instances.length).toBeGreaterThan(0);
    expect(chartMock.mock.instances.some((instance) => instance.destroy.mock.calls.length > 0)).toBe(true);
  });

  it('tolera error al guardar estado de secciones en sessionStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    miembrosPage.initMiembrosPage();

    const toggle = document.querySelector('[data-target="detail-activity-body"]') as HTMLButtonElement;
    expect(() => toggle.click()).not.toThrow();

    setItemSpy.mockRestore();
  });

  it('aplica filtros y ordenamiento en la tabla de miembros', async () => {
    fetchProfiles.mockResolvedValue([
      { id: 'u1', name: 'Ana', color: '#4ab8ff' },
      { id: 'u2', name: 'Luis', color: '#2ecc71' },
    ]);
    fetchGymSessions.mockResolvedValue([
      { id: 'g1', user_id: 'u1', date: '2026-04-10', exercises: [{ name: 'Sentadilla', weight: 100, unit: 'kg' }] },
      { id: 'g2', user_id: 'u1', date: '2026-04-08', exercises: [{ name: 'Peso muerto', weight: 120, unit: 'kg' }] },
      { id: 'g3', user_id: 'u2', date: '2026-03-01', exercises: [] },
    ]);
    fetchHiitSessions.mockResolvedValue([]);

    miembrosPage.initMiembrosPage();
    await miembrosPage.loadMiembros();

    const sessionsFilter = document.getElementById('members-filter-sessions') as HTMLSelectElement;
    sessionsFilter.value = '1';
    sessionsFilter.dispatchEvent(new Event('change'));

    expect(document.getElementById('members-tbody')?.innerHTML).toContain('Ana');
    expect(document.getElementById('members-tbody')?.innerHTML).not.toContain('Luis');

    (document.querySelector('[data-members-sort="name"]') as HTMLButtonElement).click();
    expect((document.querySelector('[data-members-sort="name"]') as HTMLButtonElement).textContent).toContain('↑');
  });
});
