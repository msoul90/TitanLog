import { beforeEach, describe, expect, it, vi } from 'vitest';

function createFromMock() {
  return vi.fn((table: string) => {
    if (table === 'gym_sessions') {
      return {
        select: createGteSelect([{ id: 'g1', user_id: 'u1', date: '2026-04-01', exercises: [] }]),
      };
    }

    if (table === 'hiit_sessions') {
      return {
        select: createGteSelect([{ id: 'h1', user_id: 'u1', date: '2026-04-02', name: 'EMOM' }]),
      };
    }

    if (table === 'profiles') {
      return {
        select: async () => ({ data: [{ id: 'u1', name: 'Ana', color: '#111' }] }),
      };
    }

    if (table === 'body_metrics') {
      return {
        select: createOrderSelect([{ id: 'b1', user_id: 'u1', date: '2026-04-03', weight: 70 }]),
      };
    }

    if (table === 'gym_admins') {
      return {
        select: async () => ({ data: [{ user_id: 'u1' }, { user_id: 'u2' }] }),
      };
    }

    return { select: async () => ({ data: [] }) };
  });
}

function createRpcMock() {
  return vi.fn(
    (
      fnName: string,
    ): Promise<{ data: unknown; error: { message?: string; code?: string; hint?: string } | null }> => {
    if (fnName === 'list_gym_admins') {
      return Promise.resolve({ data: [{ user_id: 'u1' }, { user_id: 'u2' }], error: null });
    }

    if (fnName === 'admin_list_exercise_catalog') {
      return Promise.resolve({
        data: [{ id: 'e1', canonical_name: 'Sentadilla', muscle_group: 'Piernas', slug: 'sentadilla' }],
        error: null,
      });
    }

    if (fnName === 'list_exercise_catalog_light') {
      return Promise.resolve({
        data: [{ id: 'e1', canonical_name: 'Sentadilla', muscle_group: 'Piernas', slug: 'sentadilla' }],
        error: null,
      });
    }

    if (fnName === 'admin_list_exercise_recommendations') {
      return Promise.resolve({
        data: [{ id: 1, exercise_id: 'e1', section: 'tips', order_index: 1, content: 'Controla la tecnica' }],
        error: null,
      });
    }

    if (fnName === 'admin_save_exercise') {
      return Promise.resolve({ data: 'exercise-id-1', error: null });
    }

    if (fnName === 'admin_toggle_exercise') {
      return Promise.resolve({ data: null, error: null });
    }

    if (fnName === 'admin_save_recommendation') {
      return Promise.resolve({ data: 99, error: null });
    }

    if (fnName === 'admin_delete_recommendation') {
      return Promise.resolve({ data: null, error: null });
    }

    return Promise.resolve({ data: null, error: null });
    },
  );
}

function createGteSelect(data: unknown[]) {
  return () => ({
    gte: () => ({
      order: async () => ({ data }),
    }),
  });
}

function createOrderSelect(data: unknown[]) {
  return () => ({
    order: async () => ({ data }),
  });
}

async function loadDataModule() {
  const fromMock = createFromMock();
  const rpcMock = createRpcMock();

  (globalThis as unknown as { supabase: unknown }).supabase = {
    createClient: vi.fn(() => ({ from: fromMock, rpc: rpcMock })),
  };

  const mod = await import('../../dashboard/data');
  return { mod, fromMock, rpcMock };
}

describe('dashboard data module', () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.localStorage?.removeItem('dashboard.catalog.rpc.preference.v2');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'abcdefghijklmnopqrstuvwxyz123456');
  });

  it('fetchGymSessions usa cache por fecha', async () => {
    const { mod, fromMock } = await loadDataModule();

    const a = await mod.fetchGymSessions('2026-04-01');
    const b = await mod.fetchGymSessions('2026-04-01');

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(fromMock.mock.calls.filter((c) => c[0] === 'gym_sessions')).toHaveLength(1);
  });

  it('invalidateCache limpia cache y fuerza nueva consulta', async () => {
    const { mod, fromMock } = await loadDataModule();

    await mod.fetchProfiles();
    await mod.fetchProfiles();
    expect(fromMock.mock.calls.filter((c) => c[0] === 'profiles')).toHaveLength(1);

    mod.invalidateCache();
    await mod.fetchProfiles();
    expect(fromMock.mock.calls.filter((c) => c[0] === 'profiles')).toHaveLength(2);
  });

  it('fetchHiitSessions y fetchBodyMetrics retornan datos', async () => {
    const { mod } = await loadDataModule();

    const hiit = await mod.fetchHiitSessions('2026-04-01');
    const metrics = await mod.fetchBodyMetrics();

    expect(hiit[0]?.name).toBe('EMOM');
    expect(metrics[0]?.user_id).toBe('u1');
  });

  it('fetchAdmins mapea user_id', async () => {
    const { mod, rpcMock } = await loadDataModule();

    const admins = await mod.fetchAdmins();
    expect(admins).toEqual(['u1', 'u2']);
    expect(rpcMock).toHaveBeenCalledWith('list_gym_admins');
  });

  it('fetchAllUsers reutiliza perfiles cacheados', async () => {
    const { mod, fromMock } = await loadDataModule();

    const users = await mod.fetchAllUsers();
    await mod.fetchAllUsers();

    expect(users[0]?.name).toBe('Ana');
    expect(fromMock.mock.calls.filter((c) => c[0] === 'profiles')).toHaveLength(1);
  });

  it('expone error cuando falta runtime de supabase', async () => {
    vi.resetModules();
    delete (globalThis as typeof globalThis & { supabase?: unknown }).supabase;

    const mod = await import('../../dashboard/data');
    expect(mod.getDashboardSupabaseError()).toContain('No se pudo cargar el cliente de Supabase');
    expect(() => mod.sb.from('profiles')).toThrow(/No se pudo cargar el cliente de Supabase/);
  });

  it('fetchSuperAdmins retorna lista de super admins', async () => {
    const { mod, rpcMock } = await loadDataModule();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'list_super_admins') return Promise.resolve({ data: [{ user_id: 'u1' }, { user_id: 'u2' }], error: null });
      return Promise.resolve({ data: [], error: null });
    });

    const admins = await mod.fetchSuperAdmins();
    expect(admins).toEqual(['u1', 'u2']);
    expect(rpcMock).toHaveBeenCalledWith('list_super_admins');
  });

  it('fetchSuperAdmins devuelve [] para error forbidden', async () => {
    const { mod, rpcMock } = await loadDataModule();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'list_super_admins') return Promise.resolve({ data: null, error: { message: 'forbidden' } });
      return Promise.resolve({ data: [], error: null });
    });

    const admins = await mod.fetchSuperAdmins();
    expect(admins).toEqual([]);
  });

  it('fetchSuperAdmins devuelve [] para error 42501', async () => {
    const { mod, rpcMock } = await loadDataModule();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'list_super_admins') return Promise.resolve({ data: null, error: { message: 'permission denied: 42501' } });
      return Promise.resolve({ data: [], error: null });
    });

    const admins = await mod.fetchSuperAdmins();
    expect(admins).toEqual([]);
  });

  it('fetchSuperAdmins lanza error para errores inesperados', async () => {
    const { mod, rpcMock } = await loadDataModule();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'list_super_admins') return Promise.resolve({ data: null, error: { message: 'unexpected db error' } });
      return Promise.resolve({ data: [], error: null });
    });

    await expect(mod.fetchSuperAdmins()).rejects.toMatchObject({ message: 'unexpected db error' });
  });

  it('fetchAdmins lanza error cuando rpc falla', async () => {
    const { mod, rpcMock } = await loadDataModule();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'list_gym_admins') return Promise.resolve({ data: null, error: { message: 'admins rpc error' } });
      return Promise.resolve({ data: [], error: null });
    });

    await expect(mod.fetchAdmins()).rejects.toMatchObject({ message: 'admins rpc error' });
  });

  it('fetchAdminCatalog y fetchExerciseRecommendations retornan datos del catalogo', async () => {
    const { mod, rpcMock } = await loadDataModule();

    const catalog = await mod.fetchAdminCatalog();
    const recommendations = await mod.fetchExerciseRecommendations('e1');

    expect(catalog[0]?.slug).toBe('sentadilla');
    expect(recommendations[0]?.content).toContain('tecnica');
    expect(rpcMock).toHaveBeenCalledWith('admin_list_exercise_recommendations', { p_exercise_id: 'e1' });
  });

  it('fetchAdminCatalog usa fallback cuando admin_list_exercise_catalog no existe en schema cache', async () => {
    const { mod, rpcMock } = await loadDataModule();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'admin_list_exercise_catalog') {
        return Promise.resolve({
          data: null,
          error: {
            code: 'PGRST202',
            message: 'Could not find the function public.admin_list_exercise_catalog without parameters',
            hint: 'Perhaps you meant to call the function public.list_exercise_catalog_light',
          },
        });
      }
      if (fn === 'list_exercise_catalog_light') {
        return Promise.resolve({
          data: [{ id: 'e2', canonical_name: 'Press militar', muscle_group: 'Hombros', slug: 'press-militar' }],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    });

    const catalog = await mod.fetchAdminCatalog();
    expect(catalog[0]?.slug).toBe('press-militar');
    expect(catalog[0]?.is_active).toBe(true);
    expect(catalog[0]?.rec_count).toBe(0);
    expect(rpcMock).toHaveBeenCalledWith('admin_list_exercise_catalog');
    expect(rpcMock).toHaveBeenCalledWith('list_exercise_catalog_light');
    expect(globalThis.localStorage?.getItem('dashboard.catalog.rpc.preference.v2')).toBe('light');
    expect(mod.getCatalogRpcHealthMode()).toBe('fallback');
  });

  it('fetchAdminCatalog intenta recuperar RPC admin cuando existe preferencia light', async () => {
    globalThis.localStorage?.setItem('dashboard.catalog.rpc.preference.v2', 'light');
    const { mod, rpcMock } = await loadDataModule();

    const catalog = await mod.fetchAdminCatalog();
    expect(catalog[0]?.slug).toBe('sentadilla');
    expect(rpcMock).toHaveBeenCalledWith('admin_list_exercise_catalog');
    expect(rpcMock).not.toHaveBeenCalledWith('list_exercise_catalog_light');
    expect(globalThis.localStorage?.getItem('dashboard.catalog.rpc.preference.v2')).toBe('admin');
    expect(mod.getCatalogRpcHealthMode()).toBe('admin');
  });

  it('saveExercise usa null cuando no recibe exerciseId y devuelve el id guardado', async () => {
    const { mod, rpcMock } = await loadDataModule();

    const exerciseId = await mod.saveExercise('Press banca', 'Pecho', 'press-banca');

    expect(exerciseId).toBe('exercise-id-1');
    expect(rpcMock).toHaveBeenCalledWith('admin_save_exercise', {
      p_canonical_name: 'Press banca',
      p_muscle_group: 'Pecho',
      p_slug: 'press-banca',
      p_exercise_id: null,
    });
  });

  it('saveExercise reusa exerciseId cuando se envia en modo edicion', async () => {
    const { mod, rpcMock } = await loadDataModule();

    await mod.saveExercise('Press banca', 'Pecho', 'press-banca', 'existing-id');

    expect(rpcMock).toHaveBeenCalledWith('admin_save_exercise', {
      p_canonical_name: 'Press banca',
      p_muscle_group: 'Pecho',
      p_slug: 'press-banca',
      p_exercise_id: 'existing-id',
    });
  });

  it('toggleExercise, saveRecommendation y deleteRecommendation ejecutan RPC esperado', async () => {
    const { mod, rpcMock } = await loadDataModule();

    await mod.toggleExercise('e1', true);
    const recId = await mod.saveRecommendation('e1', 'tips', 2, 'Respira y bloquea core');
    await mod.deleteRecommendation(recId);

    expect(recId).toBe(99);
    expect(rpcMock).toHaveBeenCalledWith('admin_toggle_exercise', {
      p_exercise_id: 'e1',
      p_is_active: true,
    });
    expect(rpcMock).toHaveBeenCalledWith('admin_save_recommendation', {
      p_exercise_id: 'e1',
      p_section: 'tips',
      p_order_index: 2,
      p_content: 'Respira y bloquea core',
      p_rec_id: null,
    });
    expect(rpcMock).toHaveBeenCalledWith('admin_delete_recommendation', { p_rec_id: 99 });
  });

  it('lanza errores de RPC para catalogo, recomendaciones y mutaciones admin', async () => {
    const { mod, rpcMock } = await loadDataModule();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'admin_list_exercise_catalog') return Promise.resolve({ data: null, error: { message: 'catalog error' } });
      if (fn === 'list_exercise_catalog_light') return Promise.resolve({ data: [], error: null });
      if (fn === 'admin_list_exercise_recommendations') return Promise.resolve({ data: null, error: { message: 'recommendations error' } });
      if (fn === 'admin_save_exercise') return Promise.resolve({ data: null, error: { message: 'save exercise error' } });
      if (fn === 'admin_toggle_exercise') return Promise.resolve({ data: null, error: { message: 'toggle error' } });
      if (fn === 'admin_save_recommendation') return Promise.resolve({ data: null, error: { message: 'save recommendation error' } });
      if (fn === 'admin_delete_recommendation') return Promise.resolve({ data: null, error: { message: 'delete recommendation error' } });
      return Promise.resolve({ data: [], error: null });
    });

    await expect(mod.fetchAdminCatalog()).rejects.toMatchObject({ message: 'catalog error' });
    await expect(mod.fetchExerciseRecommendations('e1')).rejects.toMatchObject({ message: 'recommendations error' });
    await expect(mod.saveExercise('Press banca', 'Pecho', 'press-banca')).rejects.toMatchObject({ message: 'save exercise error' });
    await expect(mod.toggleExercise('e1', false)).rejects.toMatchObject({ message: 'toggle error' });
    await expect(mod.saveRecommendation('e1', 'tips', 1, 'test')).rejects.toMatchObject({ message: 'save recommendation error' });
    await expect(mod.deleteRecommendation(10)).rejects.toMatchObject({ message: 'delete recommendation error' });
  });

  it('prioriza error de configuracion de Supabase cuando hay placeholders', async () => {
    vi.resetModules();
    vi.doMock('../../dashboard/config', async () => {
      const actual = await vi.importActual<typeof import('../../dashboard/config')>('../../dashboard/config');
      return {
        ...actual,
        getSupabaseConfigError: () => 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con las credenciales reales de Supabase.',
      };
    });

    (globalThis as unknown as { supabase: unknown }).supabase = {
      createClient: vi.fn(() => ({ from: vi.fn(), rpc: vi.fn() })),
    };

    const mod = await import('../../dashboard/data');
    expect(mod.getDashboardSupabaseError()).toContain('Configura VITE_SUPABASE_URL');
    expect(() => mod.sb.from('profiles')).toThrow(/Configura VITE_SUPABASE_URL/);
    vi.doUnmock('../../dashboard/config');
  });
});
