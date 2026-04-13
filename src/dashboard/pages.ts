import { PageKey } from './config';
import { loadActividad } from './pages/actividad';
import { initAdminPage, loadAdmin } from './pages/admin';
import { initConfigPage, loadConfig } from './pages/config';
import { initEjerciciosPage, loadEjercicios } from './pages/ejercicios';
import { initMiembrosPage, loadMiembros } from './pages/miembros';
import { loadProgreso } from './pages/progreso';
import { loadResumen } from './pages/resumen';
import type { AuthUser } from './types';

export function initPages(options: { getCurrentUser: () => AuthUser | null; signOut: () => Promise<void> }): void {
  initMiembrosPage();
  initEjerciciosPage();
  initAdminPage(options);
  initConfigPage(options);
}

export async function loadPage(page: PageKey): Promise<void> {
  switch (page) {
    case 'resumen':
      await loadResumen();
      break;
    case 'miembros':
      await loadMiembros();
      break;
    case 'progreso':
      await loadProgreso();
      break;
    case 'ejercicios':
      await loadEjercicios();
      break;
    case 'actividad':
      await loadActividad();
      break;
    case 'admin':
      await loadAdmin();
      break;
    case 'config':
      await loadConfig();
      break;
  }
}
