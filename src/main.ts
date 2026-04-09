// ============================================================
// main.ts — Entry point de la aplicación
// Importa todos los módulos para que registren sus funciones
// en window, luego inicializa la app.
// ============================================================

// toast — notificación temporal en pantalla
function toast(msg: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}
(globalThis as any).toast = toast;

import './db.js'
import './app.js'
import './gym.js'
import './calendar.js'
import './progress.js'
import './guides.js'
import './hiit.js'

type MainAppState = {
  viewDate: Date;
  editExerciseId: string | null;
};

function getAppState(): MainAppState {
  const state = (globalThis as any).appState as Partial<MainAppState> | undefined;

  if (state) {
    if (!(state.viewDate instanceof Date)) {
      state.viewDate = (globalThis as any).viewDate instanceof Date ? (globalThis as any).viewDate : new Date();
    }
    if (!('editExerciseId' in state)) {
      state.editExerciseId = null;
    }
    return state as MainAppState;
  }

  return {
    viewDate: (globalThis as any).viewDate instanceof Date ? (globalThis as any).viewDate : new Date(),
    editExerciseId: null,
  };
}

// openAdd — abre el modal de ejercicio en modo "agregar"
function openAdd(): void {
  const state = getAppState();
  state.editExerciseId = null;
  const exModTtl = document.getElementById('exModTtl');
  if (exModTtl) exModTtl.textContent = 'Agregar ejercicio';

  // Limpia el formulario
  (['fName', 'fW', 'fS', 'fR', 'fN'] as const).forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = '';
  });

  // Cierra el autocomplete si estaba abierto
  const drop = document.getElementById('acDrop');
  if (drop) drop.style.display = 'none';

  (globalThis as any).openM('exMod');
}
(globalThis as any).openAdd = openAdd;

function parseEditId(editId: string): { key: string; ts: number } | null {
  const separatorIndex = editId.lastIndexOf('::');
  if (separatorIndex <= 0) return null;

  const key = editId.slice(0, separatorIndex);
  const ts = Number.parseInt(editId.slice(separatorIndex + 2), 10);
  if (Number.isNaN(ts)) return null;

  return { key, ts };
}

function openEditModal(exercise: any): void {
  const exModTtl = document.getElementById('exModTtl');
  if (exModTtl) exModTtl.textContent = 'Editar ejercicio';

  const nameInput = document.getElementById('fName') as HTMLInputElement | null;
  if (nameInput) nameInput.value = exercise.name || '';

  const weightInput = document.getElementById('fW') as HTMLInputElement | null;
  if (weightInput) weightInput.value = exercise.weight == null ? '' : String(exercise.weight);

  const setsInput = document.getElementById('fS') as HTMLInputElement | null;
  if (setsInput) setsInput.value = exercise.sets == null ? '' : String(exercise.sets);

  const repsInput = document.getElementById('fR') as HTMLInputElement | null;
  if (repsInput) repsInput.value = exercise.reps || '';

  const notesInput = document.getElementById('fN') as HTMLInputElement | null;
  if (notesInput) notesInput.value = exercise.notes || '';

  const unitInput = document.getElementById('fU') as HTMLSelectElement | null;
  if (unitInput) unitInput.value = exercise.unit || 'lb';

  (globalThis as any).openM?.('exMod');
}

function editEx(key: string, ts: number): void {
  const state = getAppState();
  const data = ((globalThis as any).gD?.() as Record<string, any[]> | undefined) ?? {};
  const daily = Array.isArray(data[key]) ? data[key] : [];
  const exercise = daily.find(ex => ex?.ts === ts);

  if (!exercise) {
    toast('No se encontró el ejercicio a editar');
    return;
  }

  state.editExerciseId = `${key}::${ts}`;
  openEditModal(exercise);
}

async function delEx(key: string, ts: number): Promise<void> {
  if (!globalThis.confirm('¿Eliminar este ejercicio?')) return;

  const data = ((globalThis as any).gD?.() as Record<string, any[]> | undefined) ?? {};
  const daily = Array.isArray(data[key]) ? data[key] : [];
  const updated = daily.filter(ex => ex?.ts !== ts);

  if ((globalThis as any).saveGymDay) {
    await (globalThis as any).saveGymDay(key, updated);
  } else if ((globalThis as any).sD) {
    data[key] = updated;
    (globalThis as any).sD(data);
  }

  (globalThis as any).renderToday?.();
  toast('Ejercicio eliminado ✓');
}

(globalThis as any).editEx = editEx;
(globalThis as any).delEx = delEx;

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getCurrentViewDate(): Date {
  const state = getAppState();
  if (state.viewDate instanceof Date) return state.viewDate;

  const legacyViewDate = (globalThis as any).viewDate;
  return legacyViewDate instanceof Date ? legacyViewDate : new Date();
}

function buildExercisePayload(): {
  name: string;
  reps: string;
  weight: string | null;
  unit: string;
  sets: string | undefined;
  notes: string | undefined;
  ts: number;
} | null {
  const name = (document.getElementById('fName') as HTMLInputElement | null)?.value.trim() || '';
  const reps = (document.getElementById('fR') as HTMLInputElement | null)?.value.trim() || '';

  if (!name) {
    toast('Escribe el nombre del ejercicio');
    return null;
  }
  if (!reps) {
    toast('Escribe las repeticiones');
    return null;
  }

  const weightValue = (document.getElementById('fW') as HTMLInputElement | null)?.value.trim() || '';
  const setsValue = (document.getElementById('fS') as HTMLInputElement | null)?.value.trim() || '';
  const noteValue = (document.getElementById('fN') as HTMLInputElement | null)?.value.trim() || '';
  const unitValue = (document.getElementById('fU') as HTMLSelectElement | null)?.value || 'lb';

  return {
    name,
    weight: weightValue === '' ? null : weightValue,
    unit: unitValue,
    sets: setsValue === '' ? undefined : setsValue,
    reps,
    notes: noteValue === '' ? undefined : noteValue,
    ts: Date.now(),
  };
}

function buildDailyExercises(
  daily: any[],
  key: string,
  editId: string | null,
  exercisePayload: any
): { list: any[]; isEdit: boolean } {
  const parsedEditId = editId ? parseEditId(editId) : null;

  if (parsedEditId?.key !== key) {
    return { list: [...daily, exercisePayload], isEdit: false };
  }

  const nextDaily = [...daily];
  const editIndex = nextDaily.findIndex(ex => ex?.ts === parsedEditId.ts);
  if (editIndex >= 0) {
    nextDaily[editIndex] = { ...exercisePayload, ts: parsedEditId.ts };
    return { list: nextDaily, isEdit: true };
  }

  nextDaily.push(exercisePayload);
  return { list: nextDaily, isEdit: false };
}

async function persistDailyExercises(key: string, nextDaily: any[], data: Record<string, any[]>): Promise<void> {
  if ((globalThis as any).saveGymDay) {
    await (globalThis as any).saveGymDay(key, nextDaily);
    return;
  }

  if ((globalThis as any).sD) {
    data[key] = nextDaily;
    (globalThis as any).sD(data);
  }
}

async function saveEx(): Promise<void> {
  const state = getAppState();
  const exercisePayload = buildExercisePayload();
  if (!exercisePayload) return;

  const currentViewDate = getCurrentViewDate();
  const key = dateKey(currentViewDate);
  const data = ((globalThis as any).gD?.() as Record<string, any[]> | undefined) ?? {};
  const daily = Array.isArray(data[key]) ? data[key] : [];

  const { list: nextDaily, isEdit } = buildDailyExercises(daily, key, state.editExerciseId, exercisePayload);
  await persistDailyExercises(key, nextDaily, data);

  state.editExerciseId = null;
  (globalThis as any).closeM?.('exMod');
  (globalThis as any).renderToday?.();
  toast(isEdit ? 'Ejercicio actualizado ✓' : 'Ejercicio guardado ✓');
}
(globalThis as any).saveEx = saveEx;

// Backward compatibility aliases for legacy HTML handlers
(globalThis as any).openHiitMod = () => (globalThis as any).openHiitModal?.();
(globalThis as any).adjustHiitTimer = () => toast('Temporizador HIIT disponible pronto');
(globalThis as any).toggleHiitTimer = () => toast('Temporizador HIIT disponible pronto');
(globalThis as any).resetHiitTimer = () => toast('Temporizador HIIT disponible pronto');

document.addEventListener('DOMContentLoaded', async () => {
  (globalThis as any).viewDate = new Date();
  (globalThis as any).calDate  = new Date();
  (globalThis as any).hiitDate = new Date();

  await (globalThis as any).initLogin();

  const initialScreen = globalThis.location.hash.replace('#', '') || 'today';
  const initialNavButton = document.querySelector(`.nav-btn[onclick*="showS('${initialScreen}'"]`) as HTMLElement | null;
  if (initialNavButton && typeof (globalThis as any).showS === 'function') {
    (globalThis as any).showS(initialScreen, initialNavButton);
  }

  // Cierra modales al hacer click en el backdrop
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', function(this: HTMLDialogElement, e: Event) {
      if (e.target === this && this.id) {
        (globalThis as any).closeM?.(this.id);
      }
    });
  });
});

