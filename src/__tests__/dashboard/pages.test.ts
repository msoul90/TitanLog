import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadResumen = vi.fn(async () => {});
const loadMiembros = vi.fn(async () => {});
const loadProgreso = vi.fn(async () => {});
const loadEjercicios = vi.fn(async () => {});
const loadActividad = vi.fn(async () => {});
const loadAdmin = vi.fn(async () => {});
const loadConfig = vi.fn(async () => {});
const initMiembrosPage = vi.fn();
const initEjerciciosPage = vi.fn();
const initAdminPage = vi.fn();
const initConfigPage = vi.fn();

vi.mock('../../dashboard/pages/resumen', () => ({ loadResumen }));
vi.mock('../../dashboard/pages/miembros', () => ({ loadMiembros, initMiembrosPage }));
vi.mock('../../dashboard/pages/progreso', () => ({ loadProgreso }));
vi.mock('../../dashboard/pages/ejercicios', () => ({ loadEjercicios, initEjerciciosPage }));
vi.mock('../../dashboard/pages/actividad', () => ({ loadActividad }));
vi.mock('../../dashboard/pages/admin', () => ({ loadAdmin, initAdminPage }));
vi.mock('../../dashboard/pages/config', () => ({ loadConfig, initConfigPage }));

describe('dashboard pages coordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initPages inicializa modulos de miembros, admin y config', async () => {
    const mod = await import('../../dashboard/pages');
    const options = { getCurrentUser: () => null, signOut: async () => {} };

    mod.initPages(options);

    expect(initMiembrosPage).toHaveBeenCalledTimes(1);
    expect(initEjerciciosPage).toHaveBeenCalledTimes(1);
    expect(initAdminPage).toHaveBeenCalledWith(options);
    expect(initConfigPage).toHaveBeenCalledWith(options);
  });

  it('loadPage delega al loader correcto', async () => {
    const mod = await import('../../dashboard/pages');

    await mod.loadPage('resumen');
    await mod.loadPage('miembros');
    await mod.loadPage('progreso');
    await mod.loadPage('ejercicios');
    await mod.loadPage('actividad');
    await mod.loadPage('admin');
    await mod.loadPage('config');

    expect(loadResumen).toHaveBeenCalledTimes(1);
    expect(loadMiembros).toHaveBeenCalledTimes(1);
    expect(loadProgreso).toHaveBeenCalledTimes(1);
    expect(loadEjercicios).toHaveBeenCalledTimes(1);
    expect(loadActividad).toHaveBeenCalledTimes(1);
    expect(loadAdmin).toHaveBeenCalledTimes(1);
    expect(loadConfig).toHaveBeenCalledTimes(1);
  });
});
