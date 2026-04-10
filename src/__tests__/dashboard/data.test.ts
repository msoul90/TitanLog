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
  return vi.fn((fnName: string) => {
    if (fnName === 'list_gym_admins') {
      return Promise.resolve({ data: [{ user_id: 'u1' }, { user_id: 'u2' }], error: null });
    }

    return Promise.resolve({ data: null, error: null });
  });
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
});
