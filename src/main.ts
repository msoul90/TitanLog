// ============================================================
// main.ts â€” Entry point de la aplicaciÃ³n
// Importa todos los mÃ³dulos para que registren sus funciones
// en window, luego inicializa la app.
// ============================================================

// toast â€” notificaciÃ³n temporal en pantalla
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

// openAdd â€” abre el modal de ejercicio en modo "agregar"
function openAdd(): void {
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

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function saveEx(): Promise<void> {
  const name = (document.getElementById('fName') as HTMLInputElement | null)?.value.trim() || '';
  const reps = (document.getElementById('fR') as HTMLInputElement | null)?.value.trim() || '';

  if (!name) {
    toast('Escribe el nombre del ejercicio');
    return;
  }
  if (!reps) {
    toast('Escribe las repeticiones');
    return;
  }

  const weightValue = (document.getElementById('fW') as HTMLInputElement | null)?.value.trim() || '';
  const setsValue = (document.getElementById('fS') as HTMLInputElement | null)?.value.trim() || '';
  const noteValue = (document.getElementById('fN') as HTMLInputElement | null)?.value.trim() || '';
  const unitValue = (document.getElementById('fU') as HTMLSelectElement | null)?.value || 'lb';

  const currentViewDate = ((globalThis as any).viewDate as Date | undefined) ?? new Date();
  const key = dateKey(currentViewDate);
  const data = ((globalThis as any).gD?.() as Record<string, any[]> | undefined) ?? {};
  const daily = Array.isArray(data[key]) ? data[key] : [];

  daily.push({
    name,
    weight: weightValue === '' ? null : weightValue,
    unit: unitValue,
    sets: setsValue === '' ? undefined : setsValue,
    reps,
    notes: noteValue === '' ? undefined : noteValue,
    ts: Date.now()
  });

  if ((globalThis as any).saveGymDay) {
    await (globalThis as any).saveGymDay(key, daily);
  } else if ((globalThis as any).sD) {
    data[key] = daily;
    (globalThis as any).sD(data);
  }

  (globalThis as any).closeM?.('exMod');
  (globalThis as any).renderToday?.();
  toast('Ejercicio guardado âœ“');
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

