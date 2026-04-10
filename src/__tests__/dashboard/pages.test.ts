import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadResumen = vi.fn(async () => {});
const loadMiembros = vi.fn(async () => {});
const loadProgreso = vi.fn(async () => {});
const loadEjercicios = vi.fn(async () => {});
const loadActividad = vi.fn(async () => {});
const loadAdmin = vi.fn(async () => {});
const initMiembrosPage = vi.fn();
const initAdminPage = vi.fn();

vi.mock('../../dashboard/pages/resumen', () => ({ loadResumen }));
vi.mock('../../dashboard/pages/miembros', () => ({ loadMiembros, initMiembrosPage }));
vi.mock('../../dashboard/pages/progreso', () => ({ loadProgreso }));
vi.mock('../../dashboard/pages/ejercicios', () => ({ loadEjercicios }));
vi.mock('../../dashboard/pages/actividad', () => ({ loadActividad }));
vi.mock('../../dashboard/pages/admin', () => ({ loadAdmin, initAdminPage }));

describe('dashboard pages coordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initPages inicializa modulos de miembros y admin', async () => {
    const mod = await import('../../dashboard/pages');
    const options = { getCurrentUser: () => null, signOut: async () => {} };

    mod.initPages(options);

    expect(initMiembrosPage).toHaveBeenCalledTimes(1);
    expect(initAdminPage).toHaveBeenCalledWith(options);
  });

  it('loadPage delega al loader correcto', async () => {
    const mod = await import('../../dashboard/pages');

    await mod.loadPage('resumen');
    await mod.loadPage('miembros');
    await mod.loadPage('progreso');
    await mod.loadPage('ejercicios');
    await mod.loadPage('actividad');
    await mod.loadPage('admin');

    expect(loadResumen).toHaveBeenCalledTimes(1);
    expect(loadMiembros).toHaveBeenCalledTimes(1);
    expect(loadProgreso).toHaveBeenCalledTimes(1);
    expect(loadEjercicios).toHaveBeenCalledTimes(1);
    expect(loadActividad).toHaveBeenCalledTimes(1);
    expect(loadAdmin).toHaveBeenCalledTimes(1);
  });
});
