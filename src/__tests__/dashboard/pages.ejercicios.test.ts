import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchGymSessions = vi.fn();
const fetchAdminCatalog = vi.fn();
const fetchExerciseRecommendations = vi.fn();
const saveExercise = vi.fn();
const toggleExercise = vi.fn();
const saveRecommendation = vi.fn();
const deleteRecommendation = vi.fn();
const showToast = vi.fn();
const confirmAction = vi.fn(async () => true);
const { ChartCtor } = vi.hoisted(() => ({
  ChartCtor: vi.fn(function ChartCtor(this: { destroy: unknown; update: unknown; options: unknown }) {
    this.destroy = vi.fn();
    this.update = vi.fn();
    this.options = {};
  }),
}));

vi.mock('../../dashboard/data', () => ({
  fetchGymSessions: (...args: unknown[]) => fetchGymSessions(...args),
  fetchAdminCatalog: (...args: unknown[]) => fetchAdminCatalog(...args),
  fetchExerciseRecommendations: (...args: unknown[]) => fetchExerciseRecommendations(...args),
  saveExercise: (...args: unknown[]) => saveExercise(...args),
  toggleExercise: (...args: unknown[]) => toggleExercise(...args),
  saveRecommendation: (...args: unknown[]) => saveRecommendation(...args),
  deleteRecommendation: (...args: unknown[]) => deleteRecommendation(...args),
}));

vi.mock('../../dashboard/theme', () => ({
  baseChartOptions: () => ({}),
  chartColors: () => ({ accent: '#00a', text2: '#333', surface2: '#111', border: '#222' }),
}));

vi.mock('../../dashboard/helpers', () => ({
  colorForMuscle: () => '#0aa',
  confirmAction: (...args: unknown[]) => confirmAction(...args),
  daysAgo: () => '2025-01-01',
  escapeHtml: (text: string) => text,
  muscleGroup: (name: string) => (name.toLowerCase().includes('sentadilla') ? 'Piernas' : 'General'),
  showToast: (...args: unknown[]) => showToast(...args),
}));

vi.mock('chart.js/auto', () => ({
  default: ChartCtor,
}));

function baseCatalog() {
  return [
    {
      id: 'e1',
      slug: 'sentadilla',
      canonical_name: 'Sentadilla',
      muscle_group: 'Piernas',
      is_active: true,
      rec_count: 2,
    },
    {
      id: 'e2',
      slug: 'press-banca',
      canonical_name: 'Press banca',
      muscle_group: 'Pecho',
      is_active: false,
      rec_count: 0,
    },
  ];
}

describe('dashboard ejercicios page', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    globalThis.localStorage?.removeItem('dashboard.catalog.onlyWithoutRecommendations.v1');
    globalThis.localStorage?.removeItem('dashboard.catalog.sort.field.v1');
    globalThis.localStorage?.removeItem('dashboard.catalog.sort.direction.v1');

    document.documentElement.dataset.theme = 'dark';
    fetchGymSessions.mockResolvedValue([]);
    fetchAdminCatalog.mockResolvedValue(baseCatalog());
    fetchExerciseRecommendations.mockResolvedValue([]);
    saveExercise.mockResolvedValue('e3');
    toggleExercise.mockResolvedValue(undefined);
    saveRecommendation.mockResolvedValue(9001);
    deleteRecommendation.mockResolvedValue(undefined);
    (globalThis as unknown as { confirm: (message?: string) => boolean }).confirm = vi.fn(() => true);

    document.body.innerHTML = `
      <button id="tab-stats"></button>
      <button id="tab-catalog"></button>
      <div id="panel-stats"></div>
      <div id="panel-catalog"></div>
      <input id="catalog-search" />
      <input id="catalog-only-without-recs" type="checkbox" />
      <button id="catalog-sort-name" data-label="Nombre"></button>
      <button id="catalog-sort-muscle" data-label="Grupo muscular"></button>
      <button id="catalog-sort-recommendations" data-label="Recomendaciones"></button>
      <button id="catalog-sort-status" data-label="Estado"></button>
      <button id="catalog-reset-filters"></button>
      <button id="btn-add-exercise"></button>
      <form id="exercise-form"></form>
      <button id="exercise-modal-close"></button>
      <button id="exercise-modal-backdrop"></button>
      <button id="rec-modal-close"></button>
      <button id="rec-modal-backdrop"></button>
      <form id="rec-form"></form>
      <button id="btn-add-rec"></button>
      <button id="btn-back-catalog"></button>

      <canvas id="chart-top-exercises"></canvas>
      <canvas id="chart-muscle-group"></canvas>
      <table><tbody id="exercises-tbody"></tbody></table>
      <table><tbody id="catalog-tbody"></tbody></table>

      <div id="ex-catalog-panel"></div>
      <div id="ex-detail-panel" class="is-hidden"></div>
      <div id="detail-exercise-name"></div>
      <div id="detail-exercise-group"></div>
      <div id="recs-list"></div>
      <div id="recs-loading" class="is-hidden"></div>

      <div id="exercise-modal" class="is-hidden"></div>
      <div id="exercise-modal-title"></div>
      <input id="ex-id" />
      <input id="ex-name" />
      <input id="ex-muscle-group" />
      <input id="ex-slug" />
      <button id="ex-submit"></button>

      <div id="rec-modal" class="is-hidden"></div>
      <div id="rec-modal-title"></div>
      <input id="rec-id" />
      <select id="rec-section">
        <option value="step">step</option>
        <option value="error">error</option>
        <option value="tip">tip</option>
        <option value="link">link</option>
      </select>
      <input id="rec-order" />
      <textarea id="rec-content"></textarea>
      <button id="rec-submit"></button>
    `;

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
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    expect(fetchGymSessions).toHaveBeenCalled();
    expect(fetchAdminCatalog).toHaveBeenCalled();
    expect(ChartCtor).toHaveBeenCalledTimes(2);
    expect(document.getElementById('exercises-tbody')?.innerHTML).toContain('Sentadilla');
    expect(document.getElementById('exercises-tbody')?.innerHTML).toContain('Bench press');

    (document.getElementById('tab-catalog') as HTMLButtonElement).click();
    expect(document.getElementById('panel-stats')?.classList.contains('is-hidden')).toBe(true);
    expect(document.getElementById('panel-catalog')?.classList.contains('is-hidden')).toBe(false);

    const search = document.getElementById('catalog-search') as HTMLInputElement;
    search.value = 'press';
    search.dispatchEvent(new Event('input'));
    expect(document.getElementById('catalog-tbody')?.innerHTML).toContain('Press banca');
    expect(document.getElementById('catalog-tbody')?.innerHTML).not.toContain('Sentadilla');
    expect(document.getElementById('catalog-tbody')?.innerHTML).toContain('Sin recomendaciones');

    search.value = '';
    search.dispatchEvent(new Event('input'));
    expect(document.getElementById('catalog-tbody')?.innerHTML).toContain('2 recomendaciones');

    const onlyWithoutRecs = document.getElementById('catalog-only-without-recs') as HTMLInputElement;
    onlyWithoutRecs.checked = true;
    onlyWithoutRecs.dispatchEvent(new Event('change'));
    expect(document.getElementById('catalog-tbody')?.innerHTML).toContain('Press banca');
    expect(document.getElementById('catalog-tbody')?.innerHTML).not.toContain('Sentadilla');

    onlyWithoutRecs.checked = false;
    onlyWithoutRecs.dispatchEvent(new Event('change'));

    (document.getElementById('catalog-sort-recommendations') as HTMLButtonElement).click();
    const rowsAsc = [...document.querySelectorAll('#catalog-tbody tr')].map((row) => row.textContent || '');
    expect(rowsAsc[0]).toContain('Press banca');

    (document.getElementById('catalog-sort-recommendations') as HTMLButtonElement).click();
    const rowsDesc = [...document.querySelectorAll('#catalog-tbody tr')].map((row) => row.textContent || '');
    expect(rowsDesc[0]).toContain('Sentadilla');

    const searchAgain = document.getElementById('catalog-search') as HTMLInputElement;
    searchAgain.value = 'press';
    searchAgain.dispatchEvent(new Event('input'));

    (document.getElementById('catalog-reset-filters') as HTMLButtonElement).click();
    const rowsReset = [...document.querySelectorAll('#catalog-tbody tr')].map((row) => row.textContent || '');
    expect(searchAgain.value).toBe('');
    expect((document.getElementById('catalog-only-without-recs') as HTMLInputElement).checked).toBe(false);
    expect(rowsReset[0]).toContain('Press banca');
  });

  it('loadEjercicios muestra estado vacio sin datos', async () => {
    fetchGymSessions.mockResolvedValue([]);

    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    expect(document.getElementById('exercises-tbody')?.innerHTML).toContain('Sin datos');
  });

  it('permite crear ejercicio desde modal, autogenera slug y abre detalle', async () => {
    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    fetchAdminCatalog.mockResolvedValueOnce([
      ...baseCatalog(),
      {
        id: 'e3',
        slug: 'remo-con-barra',
        canonical_name: 'Remo con barra',
        muscle_group: 'Espalda',
        is_active: true,
        rec_count: 0,
      },
    ]);

    (document.getElementById('btn-add-exercise') as HTMLButtonElement).click();
    const nameInput = document.getElementById('ex-name') as HTMLInputElement;
    const groupInput = document.getElementById('ex-muscle-group') as HTMLInputElement;
    const slugInput = document.getElementById('ex-slug') as HTMLInputElement;

    nameInput.value = 'Remo con barra';
    nameInput.dispatchEvent(new Event('input'));
    groupInput.value = 'Espalda';

    expect(slugInput.value).toBe('remo-con-barra');

    document.getElementById('exercise-form')?.dispatchEvent(new Event('submit'));
    await Promise.resolve();
    await Promise.resolve();

    expect(saveExercise).toHaveBeenCalledWith('Remo con barra', 'Espalda', 'remo-con-barra', undefined);
    expect(fetchExerciseRecommendations).toHaveBeenCalledWith('e3');
    expect(showToast).toHaveBeenCalledWith('Ejercicio agregado', 'success');
    expect(document.getElementById('ex-detail-panel')?.classList.contains('is-hidden')).toBe(false);
  });

  it('maneja toggle activo con rollback visual cuando falla', async () => {
    toggleExercise.mockRejectedValueOnce(new Error('toggle failed'));

    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    const toggle = document.querySelector('.catalog-active-toggle[data-id="e1"]') as HTMLInputElement;
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(toggleExercise).toHaveBeenCalledWith('e1', false);
    expect(toggle.checked).toBe(true);
    expect(showToast).toHaveBeenCalledWith('Error: toggle failed', 'error');
  });

  it('permite agregar y eliminar recomendaciones desde panel detalle', async () => {
    fetchExerciseRecommendations.mockResolvedValueOnce([
      { id: 1, exercise_id: 'e1', section: 'step', order_index: 1, content: 'Paso inicial' },
    ]);
    fetchExerciseRecommendations.mockResolvedValueOnce([
      { id: 1, exercise_id: 'e1', section: 'step', order_index: 1, content: 'Paso inicial' },
      { id: 9001, exercise_id: 'e1', section: 'step', order_index: 2, content: 'Segundo paso' },
    ]);
    fetchExerciseRecommendations.mockResolvedValueOnce([
      { id: 1, exercise_id: 'e1', section: 'step', order_index: 1, content: 'Paso inicial' },
    ]);

    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    (document.querySelector('.btn-recs[data-id="e1"]') as HTMLButtonElement).click();
    await Promise.resolve();

    (document.getElementById('btn-add-rec') as HTMLButtonElement).click();
    (document.getElementById('rec-section') as HTMLSelectElement).value = 'step';
    (document.getElementById('rec-order') as HTMLInputElement).value = '2';
    (document.getElementById('rec-content') as HTMLTextAreaElement).value = 'Segundo paso';
    document.getElementById('rec-form')?.dispatchEvent(new Event('submit'));
    await Promise.resolve();
    await Promise.resolve();

    expect(saveRecommendation).toHaveBeenCalledWith('e1', 'step', 2, 'Segundo paso', undefined);
    expect(showToast).toHaveBeenCalledWith('Recomendación agregada', 'success');

    const deleteButton = document.querySelector('.btn-delete-rec') as HTMLButtonElement;
    deleteButton.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(deleteRecommendation).toHaveBeenCalled();
  });

  it('permite editar recomendacion existente en modal y actualizarla', async () => {
    fetchExerciseRecommendations.mockResolvedValueOnce([
      { id: 11, exercise_id: 'e1', section: 'tip', order_index: 3, content: 'Consejo inicial' },
    ]);
    fetchExerciseRecommendations.mockResolvedValueOnce([
      { id: 11, exercise_id: 'e1', section: 'tip', order_index: 4, content: 'Consejo actualizado' },
    ]);

    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    (document.querySelector('.btn-recs[data-id="e1"]') as HTMLButtonElement).click();
    await Promise.resolve();

    (document.querySelector('.btn-edit-rec') as HTMLButtonElement).click();
    expect(document.getElementById('rec-modal-title')?.textContent).toContain('Editar recomendación');

    (document.getElementById('rec-order') as HTMLInputElement).value = '4';
    (document.getElementById('rec-content') as HTMLTextAreaElement).value = 'Consejo actualizado';
    document.getElementById('rec-form')?.dispatchEvent(new Event('submit'));
    await Promise.resolve();
    await Promise.resolve();

    expect(saveRecommendation).toHaveBeenCalledWith('e1', 'tip', 4, 'Consejo actualizado', 11);
    expect(showToast).toHaveBeenCalledWith('Recomendación actualizada', 'success');
    expect(document.getElementById('recs-list')?.innerHTML).toContain('Consejo actualizado');
  });

  it('renderiza recomendaciones de links externos como enlaces clicables', async () => {
    fetchExerciseRecommendations.mockResolvedValueOnce([
      { id: 31, exercise_id: 'e1', section: 'link', order_index: 1, content: 'https://example.com/video' },
    ]);

    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    (document.querySelector('.btn-recs[data-id="e1"]') as HTMLButtonElement).click();
    await Promise.resolve();

    const link = document.querySelector('#recs-list a.rec-link') as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('https://example.com/video');
  });

  it('muestra error cuando guardar recomendacion falla y restablece boton', async () => {
    saveRecommendation.mockRejectedValueOnce(new Error('save rec failed'));

    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    (document.querySelector('.btn-recs[data-id="e1"]') as HTMLButtonElement).click();
    await Promise.resolve();

    (document.getElementById('btn-add-rec') as HTMLButtonElement).click();
    (document.getElementById('rec-section') as HTMLSelectElement).value = 'error';
    (document.getElementById('rec-order') as HTMLInputElement).value = '1';
    (document.getElementById('rec-content') as HTMLTextAreaElement).value = 'No bloquear rodillas';

    const submitBtn = document.getElementById('rec-submit') as HTMLButtonElement;
    document.getElementById('rec-form')?.dispatchEvent(new Event('submit'));
    await Promise.resolve();

    expect(showToast).toHaveBeenCalledWith('Error: save rec failed', 'error');
    expect(submitBtn.disabled).toBe(false);
  });

  it('vuelve al catalogo desde detalle y maneja error al cargar catalogo', async () => {
    fetchAdminCatalog.mockRejectedValueOnce(new Error('catalog fail'));

    const mod = await import('../../dashboard/pages/ejercicios');
    mod.initEjerciciosPage();
    await mod.loadEjercicios();

    expect(showToast).toHaveBeenCalledWith('Error al cargar catálogo: catalog fail', 'error');

    fetchAdminCatalog.mockResolvedValueOnce(baseCatalog());
    await mod.loadEjercicios();

    (document.querySelector('.btn-recs[data-id="e1"]') as HTMLButtonElement).click();
    await Promise.resolve();
    expect(document.getElementById('ex-detail-panel')?.classList.contains('is-hidden')).toBe(false);

    (document.getElementById('btn-back-catalog') as HTMLButtonElement).click();
    expect(document.getElementById('ex-detail-panel')?.classList.contains('is-hidden')).toBe(true);
    expect(document.getElementById('ex-catalog-panel')?.classList.contains('is-hidden')).toBe(false);
  });
});
