import {
  deleteRecommendation,
  fetchAdminCatalog,
  fetchExerciseRecommendations,
  fetchGymSessions,
  saveExercise,
  saveRecommendation,
  toggleExercise,
} from '../data';
import { baseChartOptions, chartColors } from '../theme';
import { colorForMuscle, daysAgo, escapeHtml, muscleGroup, showToast } from '../helpers';
import { ChartCtor, ChartLike, ExerciseCatalogEntry, ExerciseRecommendation } from '../types';

declare const Chart: ChartCtor;

// ── state ──────────────────────────────────────────────────
let chartTopEx: ChartLike | null = null;
let chartMuscle: ChartLike | null = null;
let catalogData: ExerciseCatalogEntry[] = [];
let activeTab: 'stats' | 'catalog' = 'stats';
let selectedExercise: ExerciseCatalogEntry | null = null;
let recommendations: ExerciseRecommendation[] = [];
let catalogSearchQuery = '';

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
  // Tab switching
  document.getElementById('tab-stats')?.addEventListener('click', () => switchTab('stats'));
  document.getElementById('tab-catalog')?.addEventListener('click', () => switchTab('catalog'));

  // Catalog search
  document.getElementById('catalog-search')?.addEventListener('input', (e: Event) => {
    catalogSearchQuery = ((e.target as HTMLInputElement | null)?.value || '').toLowerCase();
    renderCatalogTable(filterCatalog());
  });

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
    showPanel('catalog-panel');
    selectedExercise = null;
    recommendations = [];
  });
}

// ── tab switch ─────────────────────────────────────────────
function switchTab(tab: 'stats' | 'catalog'): void {
  activeTab = tab;
  document.getElementById('tab-stats')?.classList.toggle('active', tab === 'stats');
  document.getElementById('tab-catalog')?.classList.toggle('active', tab === 'catalog');
  document.getElementById('panel-stats')?.classList.toggle('is-hidden', tab !== 'stats');
  document.getElementById('panel-catalog')?.classList.toggle('is-hidden', tab !== 'catalog');
}

function showPanel(panel: 'catalog-panel' | 'detail-panel'): void {
  document.getElementById('catalog-panel')?.classList.toggle('is-hidden', panel !== 'catalog-panel');
  document.getElementById('detail-panel')?.classList.toggle('is-hidden', panel !== 'detail-panel');
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
    renderCatalogTable(filterCatalog());
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error al cargar catálogo: ' + msg, 'error');
  }
}

// ── catalog table ──────────────────────────────────────────
function filterCatalog(): ExerciseCatalogEntry[] {
  if (!catalogSearchQuery) return catalogData;
  return catalogData.filter(
    (e) =>
      e.canonical_name.toLowerCase().includes(catalogSearchQuery) ||
      e.muscle_group.toLowerCase().includes(catalogSearchQuery),
  );
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
          return `<tr>
  <td>${name}</td>
  <td><span class="badge badge-member">${group}</span></td>
  <td class="text-mono">${e.rec_count}</td>
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
    renderCatalogTable(filterCatalog());
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
}

function closeExerciseModal(): void {
  document.getElementById('exercise-modal')?.classList.add('is-hidden');
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
    renderCatalogTable(filterCatalog());
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
  showPanel('detail-panel');
  recommendations = [];
  renderRecsTable([]);
  const loading = document.getElementById('recs-loading');
  if (loading) loading.classList.remove('is-hidden');
  try {
    recommendations = await fetchExerciseRecommendations(entry.id);
    renderRecsTable(recommendations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error al cargar recomendaciones: ' + msg, 'error');
  } finally {
    if (loading) loading.classList.add('is-hidden');
  }
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
    <span class="rec-content">${escapeHtml(r.content)}</span>
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

async function handleDeleteRec(recId: number): Promise<void> {
  if (!globalThis.confirm('¿Eliminar esta recomendación?')) return;
  try {
    await deleteRecommendation(recId);
    recommendations = recommendations.filter((r) => r.id !== recId);
    renderRecsTable(recommendations);
    showToast('Recomendación eliminada');
    // Update rec_count in catalog
    if (selectedExercise) {
      const entry = catalogData.find((e) => e.id === selectedExercise!.id);
      if (entry) entry.rec_count = Math.max(0, entry.rec_count - 1);
    }
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

  modal.classList.remove('is-hidden');
}

function closeRecModal(): void {
  document.getElementById('rec-modal')?.classList.add('is-hidden');
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

  const section = sectionInput?.value ?? 'step';
  const orderIndex = parseInt(orderInput?.value ?? '1', 10);
  const content = contentInput?.value.trim() ?? '';
  const idRaw = idInput?.value.trim();
  const recId = idRaw ? Number(idRaw) : undefined;

  if (!content) {
    showToast('El contenido es requerido', 'error');
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  try {
    const newId = await saveRecommendation(selectedExercise.id, section, orderIndex, content, recId);
    closeRecModal();
    showToast(recId ? 'Recomendación actualizada' : 'Recomendación agregada', 'success');

    if (recId) {
      const idx = recommendations.findIndex((r) => r.id === recId);
      if (idx >= 0) {
        recommendations[idx] = { id: recId, exercise_id: selectedExercise.id, section: section as 'step' | 'error' | 'tip', order_index: orderIndex, content };
      }
    } else {
      recommendations.push({
        id: newId,
        exercise_id: selectedExercise.id,
        section: section as 'step' | 'error' | 'tip',
        order_index: orderIndex,
        content,
      });
      // Update rec_count
      const entry = catalogData.find((e) => e.id === selectedExercise!.id);
      if (entry) entry.rec_count += 1;
    }
    renderRecsTable(recommendations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    showToast('Error: ' + msg, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}
