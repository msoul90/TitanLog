import Chart from 'chart.js/auto';
import {
  deleteRecommendation,
  fetchAdminCatalog,
  fetchExerciseRecommendations,
  fetchGymSessions,
  getCatalogRpcHealthMode,
  saveExercise,
  saveRecommendation,
  toggleExercise,
} from '../data';
import { baseChartOptions, chartColors } from '../theme';
import { colorForMuscle, confirmAction, daysAgo, escapeHtml, muscleGroup, showToast } from '../helpers';
import { ChartLike, ExerciseCatalogEntry, ExerciseRecommendation } from '../types';

// ── state ──────────────────────────────────────────────────
let chartTopEx: ChartLike | null = null;
let chartMuscle: ChartLike | null = null;
let catalogData: ExerciseCatalogEntry[] = [];
let selectedExercise: ExerciseCatalogEntry | null = null;
let recommendations: ExerciseRecommendation[] = [];
let catalogSearchQuery = '';
type CatalogSortField = 'name' | 'muscle' | 'recommendations' | 'status';
type CatalogSortDirection = 'asc' | 'desc';
type CatalogDensityMode = 'comfortable' | 'compact';

const CATALOG_FILTER_KEY = 'dashboard.catalog.onlyWithoutRecommendations.v1';
const CATALOG_SORT_FIELD_KEY = 'dashboard.catalog.sort.field.v1';
const CATALOG_SORT_DIR_KEY = 'dashboard.catalog.sort.direction.v1';
const CATALOG_DENSITY_KEY = 'dashboard.catalog.density.v1';
const DEFAULT_CATALOG_SORT_FIELD: CatalogSortField = 'name';
const DEFAULT_CATALOG_SORT_DIRECTION: CatalogSortDirection = 'asc';
const DEFAULT_CATALOG_DENSITY: CatalogDensityMode = 'comfortable';

let catalogOnlyWithoutRecommendations = readCatalogOnlyWithoutRecommendations();
let catalogSortField: CatalogSortField = readCatalogSortField();
let catalogSortDirection: CatalogSortDirection = readCatalogSortDirection();
let catalogDensityMode: CatalogDensityMode = readCatalogDensityMode();

function readCatalogOnlyWithoutRecommendations(): boolean {
  try {
    return globalThis.localStorage?.getItem(CATALOG_FILTER_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistCatalogOnlyWithoutRecommendations(value: boolean): void {
  try {
    globalThis.localStorage?.setItem(CATALOG_FILTER_KEY, String(value));
  } catch {
    // Ignore localStorage errors
  }
}

function readCatalogSortField(): CatalogSortField {
  try {
    const value = globalThis.localStorage?.getItem(CATALOG_SORT_FIELD_KEY);
    if (value === 'name' || value === 'muscle' || value === 'recommendations' || value === 'status') return value;
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_CATALOG_SORT_FIELD;
}

function readCatalogSortDirection(): CatalogSortDirection {
  try {
    return globalThis.localStorage?.getItem(CATALOG_SORT_DIR_KEY) === 'desc' ? 'desc' : DEFAULT_CATALOG_SORT_DIRECTION;
  } catch {
    return DEFAULT_CATALOG_SORT_DIRECTION;
  }
}

function persistCatalogSortState(): void {
  try {
    globalThis.localStorage?.setItem(CATALOG_SORT_FIELD_KEY, catalogSortField);
    globalThis.localStorage?.setItem(CATALOG_SORT_DIR_KEY, catalogSortDirection);
  } catch {
    // Ignore localStorage errors
  }
}

function readCatalogDensityMode(): CatalogDensityMode {
  try {
    return globalThis.localStorage?.getItem(CATALOG_DENSITY_KEY) === 'compact' ? 'compact' : DEFAULT_CATALOG_DENSITY;
  } catch {
    return DEFAULT_CATALOG_DENSITY;
  }
}

function persistCatalogDensityMode(): void {
  try {
    globalThis.localStorage?.setItem(CATALOG_DENSITY_KEY, catalogDensityMode);
  } catch {
    // Ignore localStorage errors
  }
}

function applyCatalogDensityMode(): void {
  const page = document.getElementById('page-ejercicios');
  if (page) {
    page.classList.toggle('density-compact', catalogDensityMode === 'compact');
    page.classList.toggle('density-comfortable', catalogDensityMode !== 'compact');
  }

  const densityButton = document.getElementById('catalog-density-toggle');
  if (densityButton) {
    densityButton.textContent = catalogDensityMode === 'compact' ? 'Densidad: Compacto' : 'Densidad: Cómodo';
  }
}

function setModalVisibility(modalId: string, backdropId: string, visible: boolean): void {
  document.getElementById(modalId)?.classList.toggle('is-hidden', !visible);
  document.getElementById(backdropId)?.classList.toggle('is-hidden', !visible);
}

// ── helpers ────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .trim()
    .replaceAll(/\s+/g, '-');
}

// ── init ───────────────────────────────────────────────────
export function initEjerciciosPage(): void {
  switchTab('stats');
  applyCatalogDensityMode();

  // Tab switching
  document.getElementById('tab-stats')?.addEventListener('click', () => switchTab('stats'));
  document.getElementById('tab-catalog')?.addEventListener('click', () => switchTab('catalog'));

  // Catalog search
  document.getElementById('catalog-search')?.addEventListener('input', (e: Event) => {
    catalogSearchQuery = ((e.target as HTMLInputElement | null)?.value || '').toLowerCase();
    renderCatalogView();
  });

  const withoutRecsInput = document.getElementById('catalog-only-without-recs') as HTMLInputElement | null;
  if (withoutRecsInput) withoutRecsInput.checked = catalogOnlyWithoutRecommendations;
  document.getElementById('catalog-only-without-recs')?.addEventListener('change', (e: Event) => {
    catalogOnlyWithoutRecommendations = Boolean((e.target as HTMLInputElement | null)?.checked);
    persistCatalogOnlyWithoutRecommendations(catalogOnlyWithoutRecommendations);
    renderCatalogView();
  });

  document.getElementById('catalog-reset-filters')?.addEventListener('click', resetCatalogFiltersAndSort);
  document.getElementById('catalog-density-toggle')?.addEventListener('click', () => {
    catalogDensityMode = catalogDensityMode === 'compact' ? 'comfortable' : 'compact';
    persistCatalogDensityMode();
    applyCatalogDensityMode();
  });

  bindCatalogSortControls();

  // Add exercise button
  document.getElementById('btn-add-exercise')?.addEventListener('click', () => openExerciseModal());

  // Exercise form submit
  document.getElementById('exercise-form')?.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    void submitExerciseForm();
  });

  // Modal close buttons
  document.getElementById('exercise-modal-close')?.addEventListener('click', closeExerciseModal);
  document.getElementById('exercise-modal-backdrop')?.addEventListener('click', closeExerciseModal);
  document.getElementById('rec-modal-close')?.addEventListener('click', closeRecModal);
  document.getElementById('rec-modal-backdrop')?.addEventListener('click', closeRecModal);

  // Rec form submit
  document.getElementById('rec-form')?.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    void submitRecForm();
  });

  // Add rec button
  document.getElementById('btn-add-rec')?.addEventListener('click', () => openRecModal());

  // Back to catalog
  document.getElementById('btn-back-catalog')?.addEventListener('click', () => {
    showPanel('ex-catalog-panel');
    selectedExercise = null;
    recommendations = [];
  });
}

function resetCatalogFiltersAndSort(): void {
  catalogSearchQuery = '';
  catalogOnlyWithoutRecommendations = false;
  catalogSortField = DEFAULT_CATALOG_SORT_FIELD;
  catalogSortDirection = DEFAULT_CATALOG_SORT_DIRECTION;
  catalogDensityMode = DEFAULT_CATALOG_DENSITY;

  const searchInput = document.getElementById('catalog-search') as HTMLInputElement | null;
  if (searchInput) searchInput.value = '';

  const withoutRecsInput = document.getElementById('catalog-only-without-recs') as HTMLInputElement | null;
  if (withoutRecsInput) withoutRecsInput.checked = false;

  persistCatalogOnlyWithoutRecommendations(catalogOnlyWithoutRecommendations);
  persistCatalogSortState();
  persistCatalogDensityMode();
  applyCatalogDensityMode();
  renderCatalogView();
}

// ── tab switch ─────────────────────────────────────────────
function switchTab(tab: 'stats' | 'catalog'): void {
  document.getElementById('tab-stats')?.classList.toggle('active', tab === 'stats');
  document.getElementById('tab-catalog')?.classList.toggle('active', tab === 'catalog');
  document.getElementById('panel-stats')?.classList.toggle('is-hidden', tab !== 'stats');
  document.getElementById('panel-catalog')?.classList.toggle('is-hidden', tab !== 'catalog');
}

function showPanel(panel: 'ex-catalog-panel' | 'ex-detail-panel'): void {
  document.getElementById('ex-catalog-panel')?.classList.toggle('is-hidden', panel !== 'ex-catalog-panel');
  document.getElementById('ex-detail-panel')?.classList.toggle('is-hidden', panel !== 'ex-detail-panel');
}

// ── load ───────────────────────────────────────────────────
export async function loadEjercicios(): Promise<void> {
  await Promise.all([loadStats(), loadCatalog()]);
}

async function loadStats(): Promise<void> {
  const gymSessions = await fetchGymSessions(daysAgo(365));

  const exStats: Record<string, { count: number; users: Set<string> }> = {};
  gymSessions.forEach((s) => {
    (s.exercises || []).forEach((ex) => {
      if (!ex.name) return;
      exStats[ex.name] ??= { count: 0, users: new Set() };
      const stats = exStats[ex.name];
      if (!stats) return;
      stats.count++;
      stats.users.add(s.user_id);
    });
  });

  const sorted = Object.entries(exStats).sort((a, b) => b[1].count - a[1].count);
  const top12 = sorted.slice(0, 12);
  const c = chartColors();

  if (chartTopEx) chartTopEx.destroy();
  chartTopEx = new Chart(document.getElementById('chart-top-exercises'), {
    type: 'bar',
    data: {
      labels: top12.map(([n]) => n),
      datasets: [
        {
          data: top12.map(([, d]) => d.count),
          backgroundColor: c.accent + 'bb',
          borderColor: c.accent,
          borderWidth: 1,
          borderRadius: 4,
          _colorKey: 'accent',
        },
      ],
    },
    options: {
      indexAxis: 'y',
      ...baseChartOptions(),
      maintainAspectRatio: false,
      responsive: true,
    },
  });

  const groupCounts: Record<string, number> = {};
  Object.entries(exStats).forEach(([name, d]) => {
    const g = muscleGroup(name);
    groupCounts[g] = (groupCounts[g] || 0) + d.count;
  });
  const groupEntries = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);

  if (chartMuscle) chartMuscle.destroy();
  chartMuscle = new Chart(document.getElementById('chart-muscle-group'), {
    type: 'doughnut',
    data: {
      labels: groupEntries.map(([g]) => g),
      datasets: [
        {
          data: groupEntries.map(([, n]) => n),
          backgroundColor: groupEntries.map(([g]) => colorForMuscle(g) + 'cc'),
          borderColor: groupEntries.map(([g]) => colorForMuscle(g)),
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: { color: c.text2, font: { family: "'DM Sans'", size: 11 }, boxWidth: 12, padding: 10 },
        },
        tooltip: {
          backgroundColor: c.surface2,
          borderColor: c.border,
          borderWidth: 1,
          titleColor: c.text2,
          bodyColor: c.text2,
          padding: 10,
        },
      },
    },
  });

  const tbody = document.getElementById('exercises-tbody');
  if (!tbody) return;
  tbody.innerHTML = sorted.length
    ? sorted
        .map(
          ([name, d]) => `<tr>
    <td>${escapeHtml(name)}</td>
    <td class="text-mono">${d.count}</td>
    <td class="text-mono">${d.users.size}</td>
    <td><span class="badge badge-member">${escapeHtml(muscleGroup(name))}</span></td>
  </tr>`,
        )
        .join('')
    : '<tr><td colspan="4"><div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-text">Sin datos</div></div></td></tr>';
}

async function loadCatalog(): Promise<void> {
  try {
    catalogData = await fetchAdminCatalog();
    renderCatalogHealth();
    renderCatalogView();
  } catch (err) {
    renderCatalogHealth();
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error al cargar catálogo: ' + msg, 'error');
  }
}

function renderCatalogHealth(): void {
  const health = document.getElementById('catalog-rpc-health');
  if (!health) return;

  const mode = getCatalogRpcHealthMode();
  health.textContent = mode === 'admin' ? 'RPC: admin' : 'RPC: fallback';
  health.classList.remove('badge-active', 'badge-warn');
  health.classList.add(mode === 'admin' ? 'badge-active' : 'badge-warn');
}

// ── catalog table ──────────────────────────────────────────
function filterCatalog(): ExerciseCatalogEntry[] {
  return catalogData.filter((e) => {
    const matchesSearch =
      !catalogSearchQuery ||
      e.canonical_name.toLowerCase().includes(catalogSearchQuery) ||
      e.muscle_group.toLowerCase().includes(catalogSearchQuery);

    const matchesWithoutRecsFilter = !catalogOnlyWithoutRecommendations || e.rec_count === 0;
    return matchesSearch && matchesWithoutRecsFilter;
  });
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

function sortCatalog(entries: ExerciseCatalogEntry[]): ExerciseCatalogEntry[] {
  const sorted = [...entries].sort((a, b) => {
    let result = 0;
    if (catalogSortField === 'name') {
      result = compareText(a.canonical_name, b.canonical_name);
    } else if (catalogSortField === 'muscle') {
      result = compareText(a.muscle_group, b.muscle_group);
    } else if (catalogSortField === 'recommendations') {
      result = a.rec_count - b.rec_count;
    } else {
      result = Number(a.is_active) - Number(b.is_active);
    }

    if (result === 0) {
      result = compareText(a.canonical_name, b.canonical_name);
    }

    return catalogSortDirection === 'asc' ? result : -result;
  });

  return sorted;
}

function renderCatalogSortIndicators(): void {
  const sortConfig: Array<{ field: CatalogSortField; buttonId: string }> = [
    { field: 'name', buttonId: 'catalog-sort-name' },
    { field: 'muscle', buttonId: 'catalog-sort-muscle' },
    { field: 'recommendations', buttonId: 'catalog-sort-recommendations' },
    { field: 'status', buttonId: 'catalog-sort-status' },
  ];

  sortConfig.forEach(({ field, buttonId }) => {
    const button = document.getElementById(buttonId);
    if (!button) return;
    const isActive = catalogSortField === field;
    button.classList.toggle('active-sort', isActive);
    let arrow = '';
    if (isActive) {
      arrow = catalogSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
    const baseLabel = button.dataset.label || button.textContent || '';
    button.textContent = baseLabel + arrow;
  });
}

function bindCatalogSortControls(): void {
  const sortConfig: Array<{ field: CatalogSortField; buttonId: string }> = [
    { field: 'name', buttonId: 'catalog-sort-name' },
    { field: 'muscle', buttonId: 'catalog-sort-muscle' },
    { field: 'recommendations', buttonId: 'catalog-sort-recommendations' },
    { field: 'status', buttonId: 'catalog-sort-status' },
  ];

  sortConfig.forEach(({ field, buttonId }) => {
    document.getElementById(buttonId)?.addEventListener('click', () => {
      if (catalogSortField === field) {
        catalogSortDirection = catalogSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        catalogSortField = field;
        catalogSortDirection = 'asc';
      }
      persistCatalogSortState();
      renderCatalogView();
    });
  });
}

function renderCatalogView(): void {
  renderCatalogSortIndicators();
  renderCatalogTable(sortCatalog(filterCatalog()));
}

function renderCatalogTable(entries: ExerciseCatalogEntry[]): void {
  const tbody = document.getElementById('catalog-tbody');
  if (!tbody) return;

  tbody.innerHTML = entries.length
    ? entries
        .map((e) => {
          const id = escapeHtml(e.id);
          const name = escapeHtml(e.canonical_name);
          const group = escapeHtml(e.muscle_group);
          const activeLabel = e.is_active ? 'Activo' : 'Inactivo';
          const activeBadge = e.is_active
            ? '<span class="badge badge-active">Activo</span>'
            : '<span class="badge badge-inactive">Inactivo</span>';
          const recommendationsLabel = e.rec_count === 1 ? 'recomendación' : 'recomendaciones';
          const recommendationsBadge =
            e.rec_count > 0
              ? `<span class="badge badge-active">${e.rec_count} ${recommendationsLabel}</span>`
              : '<span class="badge badge-warn">Sin recomendaciones</span>';
          return `<tr>
  <td>${name}</td>
  <td><span class="badge badge-member">${group}</span></td>
  <td>${recommendationsBadge}</td>
  <td>${activeBadge}</td>
  <td>
    <div class="flex-ac gap-8">
      <button class="topbar-btn btn-recs" data-id="${id}" title="Ver recomendaciones">Recomendaciones</button>
      <button class="topbar-btn btn-edit-ex" data-id="${id}" title="Editar ejercicio">Editar</button>
      <label class="toggle" title="${e.is_active ? 'Desactivar' : 'Activar'}">
        <input type="checkbox" class="catalog-active-toggle" data-id="${id}" ${e.is_active ? 'checked' : ''} aria-label="${activeLabel}">
        <span class="toggle-slider"></span>
      </label>
    </div>
  </td>
</tr>`;
        })
        .join('')
    : '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Sin ejercicios</div></div></td></tr>';

  tbody.querySelectorAll('.catalog-active-toggle').forEach((el) => {
    el.addEventListener('change', (ev: Event) => {
      const input = ev.target as HTMLInputElement | null;
      if (!input?.dataset.id) return;
      void handleToggleActive(input.dataset.id, input.checked, input);
    });
  });

  tbody.querySelectorAll('.btn-edit-ex').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.id || '';
      const entry = catalogData.find((e) => e.id === id);
      if (entry) openExerciseModal(entry);
    });
  });

  tbody.querySelectorAll('.btn-recs').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.id || '';
      const entry = catalogData.find((e) => e.id === id);
      if (entry) void openDetailPanel(entry);
    });
  });
}

async function handleToggleActive(id: string, active: boolean, inputEl: HTMLInputElement): Promise<void> {
  try {
    await toggleExercise(id, active);
    const entry = catalogData.find((e) => e.id === id);
    if (entry) entry.is_active = active;
    showToast(active ? 'Ejercicio activado' : 'Ejercicio desactivado', active ? 'success' : undefined);
    renderCatalogView();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error: ' + msg, 'error');
    inputEl.checked = !active;
  }
}

// ── exercise modal ─────────────────────────────────────────
function openExerciseModal(entry?: ExerciseCatalogEntry): void {
  const modal = document.getElementById('exercise-modal');
  const title = document.getElementById('exercise-modal-title');
  const idInput = document.getElementById('ex-id') as HTMLInputElement | null;
  const nameInput = document.getElementById('ex-name') as HTMLInputElement | null;
  const groupInput = document.getElementById('ex-muscle-group') as HTMLInputElement | null;
  const slugInput = document.getElementById('ex-slug') as HTMLInputElement | null;

  if (!modal) return;

  if (title) title.textContent = entry ? 'Editar ejercicio' : 'Agregar ejercicio';
  if (idInput) idInput.value = entry?.id ?? '';
  if (nameInput) nameInput.value = entry?.canonical_name ?? '';
  if (groupInput) groupInput.value = entry?.muscle_group ?? '';
  if (slugInput) slugInput.value = entry?.slug ?? '';

  // Auto-generate slug on name input (only for new entries)
  if (!entry && nameInput && slugInput) {
    nameInput.oninput = () => {
      slugInput.value = toSlug(nameInput.value);
    };
  } else if (nameInput) {
    nameInput.oninput = null;
  }

  modal.classList.remove('is-hidden');
  setModalVisibility('exercise-modal', 'exercise-modal-backdrop', true);
}

function closeExerciseModal(): void {
  setModalVisibility('exercise-modal', 'exercise-modal-backdrop', false);
  const nameInput = document.getElementById('ex-name') as HTMLInputElement | null;
  if (nameInput) nameInput.oninput = null;
}

async function submitExerciseForm(): Promise<void> {
  const idInput = document.getElementById('ex-id') as HTMLInputElement | null;
  const nameInput = document.getElementById('ex-name') as HTMLInputElement | null;
  const groupInput = document.getElementById('ex-muscle-group') as HTMLInputElement | null;
  const slugInput = document.getElementById('ex-slug') as HTMLInputElement | null;
  const submitBtn = document.getElementById('ex-submit') as HTMLButtonElement | null;

  const name = nameInput?.value.trim() ?? '';
  const group = groupInput?.value.trim() ?? '';
  const slug = slugInput?.value.trim() ?? '';
  const id = idInput?.value.trim() || undefined;

  if (!name || !group || !slug) {
    showToast('Todos los campos son requeridos', 'error');
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  try {
    const newId = await saveExercise(name, group, slug, id);
    closeExerciseModal();
    showToast(id ? 'Ejercicio actualizado' : 'Ejercicio agregado', 'success');
    // Refresh catalog
    catalogData = await fetchAdminCatalog();
    renderCatalogView();
    // If we were in detail panel, update selected exercise
    if (selectedExercise && id && selectedExercise.id === id) {
      selectedExercise = catalogData.find((e) => e.id === id) ?? null;
      if (selectedExercise) updateDetailPanelHeader(selectedExercise);
    }
    if (!id) {
      // New exercise — open its detail panel
      const created = catalogData.find((e) => e.id === newId);
      if (created) void openDetailPanel(created);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error: ' + msg, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ── detail panel (recommendations) ────────────────────────
async function openDetailPanel(entry: ExerciseCatalogEntry): Promise<void> {
  selectedExercise = entry;
  updateDetailPanelHeader(entry);
  showPanel('ex-detail-panel');
  recommendations = [];
  renderRecsTable([]);
  const loading = document.getElementById('recs-loading');
  if (loading) loading.classList.remove('is-hidden');
  try {
    await reloadRecommendations(entry.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error al cargar recomendaciones: ' + msg, 'error');
  } finally {
    if (loading) loading.classList.add('is-hidden');
  }
}

async function reloadRecommendations(exerciseId: string): Promise<void> {
  recommendations = await fetchExerciseRecommendations(exerciseId);
  renderRecsTable(recommendations);

  const entry = catalogData.find((e) => e.id === exerciseId);
  if (entry) entry.rec_count = recommendations.length;
}

function updateDetailPanelHeader(entry: ExerciseCatalogEntry): void {
  const nameEl = document.getElementById('detail-exercise-name');
  const groupEl = document.getElementById('detail-exercise-group');
  if (nameEl) nameEl.textContent = entry.canonical_name;
  if (groupEl) groupEl.textContent = entry.muscle_group;
}

function renderRecsTable(recs: ExerciseRecommendation[]): void {
  const container = document.getElementById('recs-list');
  if (!container) return;

  type RecSection = { key: ExerciseRecommendation['section']; label: string; emoji: string };
  const sections: RecSection[] = [
    { key: 'step', label: 'Pasos', emoji: '📋' },
    { key: 'error', label: 'Errores comunes', emoji: '⚠️' },
    { key: 'tip', label: 'Consejos', emoji: '💡' },
    { key: 'link', label: 'Links externos', emoji: '🔗' },
  ];

  if (!recs.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">Sin recomendaciones todavía</div></div>';
    return;
  }

  container.innerHTML = sections
    .map(({ key, label, emoji }) => {
      const items = recs.filter((r) => r.section === key).sort((a, b) => a.order_index - b.order_index);
      if (!items.length) return '';
      return `<div class="rec-section mb-16">
  <div class="rec-section-title">${emoji} ${label}</div>
  ${items
    .map(
      (r) => `<div class="rec-item flex-ac justify-between gap-8">
    <span class="rec-index text-mono">${r.order_index}</span>
    ${renderRecommendationContent(r)}
    <div class="flex-ac gap-8 rec-actions">
      <button class="topbar-btn btn-edit-rec" data-id="${r.id}" title="Editar">Editar</button>
      <button class="topbar-btn btn-delete-rec" data-id="${r.id}" title="Eliminar">✕</button>
    </div>
  </div>`,
    )
    .join('')}
</div>`;
    })
    .join('');

  container.querySelectorAll('.btn-edit-rec').forEach((el) => {
    el.addEventListener('click', () => {
      const id = Number((el as HTMLElement).dataset.id);
      const rec = recs.find((r) => r.id === id);
      if (rec) openRecModal(rec);
    });
  });

  container.querySelectorAll('.btn-delete-rec').forEach((el) => {
    el.addEventListener('click', () => {
      const id = Number((el as HTMLElement).dataset.id);
      void handleDeleteRec(id);
    });
  });
}

function renderRecommendationContent(rec: ExerciseRecommendation): string {
  const text = rec.content.trim();
  if (rec.section !== 'link') {
    return `<span class="rec-content">${escapeHtml(text)}</span>`;
  }

  const maybeUrl = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  const isHttpUrl = /^https?:\/\/[^\s]+$/i.test(maybeUrl);
  if (!isHttpUrl) {
    return `<span class="rec-content">${escapeHtml(text)}</span>`;
  }

  return `<a class="rec-content rec-link" href="${escapeHtml(maybeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
}

async function handleDeleteRec(recId: number): Promise<void> {
  const confirmed = await confirmAction({
    title: 'Eliminar recomendación',
    message: 'Esta recomendación se eliminará del catálogo.',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    tone: 'danger',
  });
  if (!confirmed) return;
  if (!selectedExercise) return;

  try {
    await deleteRecommendation(recId);
    await reloadRecommendations(selectedExercise.id);
    showToast('Recomendación eliminada');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error: ' + msg, 'error');
  }
}

// ── recommendation modal ───────────────────────────────────
function nextOrderIndex(section: string): number {
  return recommendations.filter((r) => r.section === section).reduce((m, r) => Math.max(m, r.order_index), 0) + 1;
}

function populateRecModal(
  rec: ExerciseRecommendation | undefined,
  fields: {
    title: Element | null;
    idInput: HTMLInputElement | null;
    sectionInput: HTMLSelectElement | null;
    orderInput: HTMLInputElement | null;
    contentInput: HTMLTextAreaElement | null;
  },
): void {
  const { title, idInput, sectionInput, orderInput, contentInput } = fields;
  if (title) title.textContent = rec ? 'Editar recomendación' : 'Nueva recomendación';
  if (idInput) idInput.value = rec ? String(rec.id) : '';
  if (sectionInput) sectionInput.value = rec?.section ?? 'step';
  if (contentInput) contentInput.value = rec?.content ?? '';
  if (orderInput) {
    orderInput.value = rec ? String(rec.order_index) : String(nextOrderIndex(sectionInput?.value ?? 'step'));
  }
  if (sectionInput) {
    sectionInput.onchange = !rec && orderInput
      ? () => { orderInput.value = String(nextOrderIndex(sectionInput.value)); }
      : null;
  }
}

function openRecModal(rec?: ExerciseRecommendation): void {
  const modal = document.getElementById('rec-modal');
  if (!modal) return;

  populateRecModal(rec, {
    title: document.getElementById('rec-modal-title'),
    idInput: document.getElementById('rec-id') as HTMLInputElement | null,
    sectionInput: document.getElementById('rec-section') as HTMLSelectElement | null,
    orderInput: document.getElementById('rec-order') as HTMLInputElement | null,
    contentInput: document.getElementById('rec-content') as HTMLTextAreaElement | null,
  });

  setModalVisibility('rec-modal', 'rec-modal-backdrop', true);
}

function closeRecModal(): void {
  setModalVisibility('rec-modal', 'rec-modal-backdrop', false);
  const sectionInput = document.getElementById('rec-section') as HTMLSelectElement | null;
  if (sectionInput) sectionInput.onchange = null;
}

async function submitRecForm(): Promise<void> {
  if (!selectedExercise) return;

  const idInput = document.getElementById('rec-id') as HTMLInputElement | null;
  const sectionInput = document.getElementById('rec-section') as HTMLSelectElement | null;
  const orderInput = document.getElementById('rec-order') as HTMLInputElement | null;
  const contentInput = document.getElementById('rec-content') as HTMLTextAreaElement | null;
  const submitBtn = document.getElementById('rec-submit') as HTMLButtonElement | null;

  const section = (sectionInput?.value ?? 'step') as ExerciseRecommendation['section'];
  const orderIndex = Number.parseInt(orderInput?.value ?? '1', 10);
  const content = contentInput?.value.trim() ?? '';
  const idRaw = idInput?.value.trim();
  const recId = idRaw ? Number(idRaw) : undefined;

  if (!content) {
    showToast('El contenido es requerido', 'error');
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  try {
    await saveRecommendation(selectedExercise.id, section, orderIndex, content, recId);
    closeRecModal();
    showToast(recId ? 'Recomendación actualizada' : 'Recomendación agregada', 'success');

    // Keep UI in sync with DB (handles upserts/order collisions safely)
    await reloadRecommendations(selectedExercise.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error: ' + msg, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}
