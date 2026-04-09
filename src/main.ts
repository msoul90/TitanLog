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

// openAdd — abre el modal de ejercicio en modo "agregar"
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

document.addEventListener('DOMContentLoaded', async () => {
  (globalThis as any).viewDate = new Date();
  (globalThis as any).calDate  = new Date();
  (globalThis as any).hiitDate = new Date();

  await (globalThis as any).initLogin();

  // Cierra modales al hacer click en el backdrop
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', function(this: HTMLDialogElement, e: Event) {
      if (e.target === this) this.close();
    });
  });
});
