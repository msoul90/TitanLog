import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockState = {
  sessionUser: { id: string; email?: string } | null;
  sessionError: boolean;
  signInThrow: boolean;
  signInError: { message: string } | null;
  resetThrow: boolean;
  resetError: { message: string } | null;
  profileExists: boolean;
  profileInsertError: boolean;
  updateProfileError: boolean;
  updateProfileThrow: boolean;
  gymUpdateError: boolean;
  gymInsertError: boolean;
  gymMonthError: boolean;
  gymMonthNullData: boolean;
  bwUpdateError: boolean;
  bwInsertError: boolean;
  bwMonthError: boolean;
  bwMonthNullData: boolean;
  hiitUpdateError: boolean;
  hiitInsertError: boolean;
  hiitInsertNoData: boolean;
  hiitMonthError: boolean;
  hiitMonthNullData: boolean;
  gymMonthData: Array<{ date: string; exercises: any[]; id: string }>;
  bwMonthData: Array<{ date: string; weight: number; weight_unit: string; fat_pct?: number; muscle_pct?: number; id: string }>;
  hiitMonthData: Array<{ date: string; name: string; id: string; exercises: any[] }>;
};

const { mockState, resetPasswordArgs, fromCalls, signOutCalls } = vi.hoisted(() => {
  const state: MockState = {
    sessionUser: null,
    sessionError: false,
    signInThrow: false,
    signInError: null,
    resetThrow: false,
    resetError: null,
    profileExists: true,
    profileInsertError: false,
    updateProfileError: false,
    updateProfileThrow: false,
    gymUpdateError: false,
    gymInsertError: false,
    gymMonthError: false,
    gymMonthNullData: false,
    bwUpdateError: false,
    bwInsertError: false,
    bwMonthError: false,
    bwMonthNullData: false,
    hiitUpdateError: false,
    hiitInsertError: false,
    hiitInsertNoData: false,
    hiitMonthError: false,
    hiitMonthNullData: false,
    gymMonthData: [],
    bwMonthData: [],
    hiitMonthData: [],
  };

  return {
    mockState: state,
    resetPasswordArgs: [] as Array<{ email: string; options?: { redirectTo?: string } }>,
    fromCalls: [] as Array<{ table: string; op: string; payload?: unknown; eq?: Array<{ field: string; value: unknown }> }>,
    signOutCalls: { count: 0 },
  };
});

vi.mock('@supabase/supabase-js', () => {
  function createBuilder(table: string) {
    let lastOp: string = '';
    let payload: unknown;
    const eqFilters: Array<{ field: string; value: unknown }> = [];

    const builder: any = {
      select: vi.fn(() => {
        if (lastOp === 'insert') {
          lastOp = 'insert_select';
        } else {
          lastOp = 'select';
        }
        return builder;
      }),
      eq: vi.fn((field: string, value: unknown) => {
        eqFilters.push({ field, value });
        if (lastOp === 'update' || lastOp === 'delete') {
          if (table === 'profiles' && lastOp === 'update' && mockState.updateProfileThrow) {
            throw new Error('profile update throw');
          }
          if (table === 'profiles' && lastOp === 'update' && mockState.updateProfileError) {
            return Promise.resolve({ error: { message: 'profile update error' } });
          }
          if (table === 'gym_sessions' && lastOp === 'update' && mockState.gymUpdateError) {
            return Promise.resolve({ error: { message: 'gym update error' } });
          }
          if (table === 'body_metrics' && lastOp === 'update' && mockState.bwUpdateError) {
            return Promise.resolve({ error: { message: 'bw update error' } });
          }
          if (table === 'hiit_sessions' && lastOp === 'update' && mockState.hiitUpdateError) {
            return Promise.resolve({ error: { message: 'hiit update error' } });
          }
          fromCalls.push({ table, op: lastOp, payload, eq: eqFilters });
          return Promise.resolve({ error: null });
        }
        return builder;
      }),
      gte: vi.fn(() => builder),
      lte: vi.fn(async () => {
        if (table === 'gym_sessions' && mockState.gymMonthError) return { data: null, error: { message: 'gym error' } };
        if (table === 'hiit_sessions' && mockState.hiitMonthError) return { data: null, error: { message: 'hiit error' } };
        if (table === 'gym_sessions' && mockState.gymMonthNullData) return { data: null, error: null };
        if (table === 'hiit_sessions' && mockState.hiitMonthNullData) return { data: null, error: null };
        if (table === 'gym_sessions') return { data: mockState.gymMonthData, error: null };
        if (table === 'hiit_sessions') return { data: mockState.hiitMonthData, error: null };
        return { data: [], error: null };
      }),
      order: vi.fn(async () => {
        if (table === 'body_metrics' && mockState.bwMonthError) return { data: null, error: { message: 'bw error' } };
        if (table === 'body_metrics' && mockState.bwMonthNullData) return { data: null, error: null };
        return { data: mockState.bwMonthData, error: null };
      }),
      update: vi.fn((nextPayload: unknown) => {
        lastOp = 'update';
        payload = nextPayload;
        return builder;
      }),
      insert: vi.fn((nextPayload: unknown) => {
        lastOp = 'insert';
        payload = nextPayload;
        fromCalls.push({ table, op: lastOp, payload });
        return builder;
      }),
      delete: vi.fn(() => {
        lastOp = 'delete';
        return builder;
      }),
      single: vi.fn(async () => {
        if (table === 'profiles' && lastOp === 'select') {
          if (mockState.profileExists) {
            return { data: { id: 'u1', name: 'Mario', color: '#aaff45' }, error: null };
          }
          return { data: null, error: { message: 'not found' } };
        }

        if (table === 'profiles' && (lastOp === 'insert' || lastOp === 'insert_select')) {
          if (mockState.profileInsertError) {
            return { data: null, error: { message: 'profile insert error' } };
          }
          return { data: { id: 'u1', name: 'Mario', color: '#aaff45' }, error: null };
        }

        if (table === 'gym_sessions' && (lastOp === 'insert' || lastOp === 'insert_select')) {
          if (mockState.gymInsertError) {
            return { data: null, error: { message: 'gym insert error' } };
          }
        }

        if (table === 'body_metrics' && (lastOp === 'insert' || lastOp === 'insert_select')) {
          if (mockState.bwInsertError) {
            return { data: null, error: { message: 'bw insert error' } };
          }
        }

        if (table === 'hiit_sessions' && (lastOp === 'insert' || lastOp === 'insert_select')) {
          if (mockState.hiitInsertError) {
            return { data: null, error: { message: 'hiit insert error' } };
          }
          if (mockState.hiitInsertNoData) {
            return { data: null, error: null };
          }
        }

        if (lastOp === 'insert' || lastOp === 'insert_select') {
          return { data: { id: `id-${table}` }, error: null };
        }

        return { data: null, error: null };
      }),
    };

    return builder;
  }

  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table: string) => createBuilder(table)),
      auth: {
        getSession: vi.fn(async () => ({
          ...(mockState.sessionError
            ? (() => {
              throw new Error('session failed');
            })()
            : {
              data: {
                session: mockState.sessionUser ? { user: mockState.sessionUser } : null,
              },
            }),
        })),
        signInWithPassword: vi.fn(async () => {
          if (mockState.signInThrow) {
            throw new Error('auth exploded');
          }
          if (mockState.signInError) {
            return { data: null, error: mockState.signInError };
          }
          return { data: { user: { id: 'u1', email: 'mario@mail.com' } }, error: null };
        }),
        resetPasswordForEmail: vi.fn(async (email: string, options?: { redirectTo?: string }) => {
          if (mockState.resetThrow) {
            throw new Error('reset throw');
          }
          resetPasswordArgs.push({ email, options });
          return { error: mockState.resetError };
        }),
        signOut: vi.fn(async () => {
          signOutCalls.count += 1;
          return { error: null };
        }),
      },
    })),
  };
});

describe('db.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'abcdefghijklmnopqrstuvwxyz123456');

    mockState.sessionUser = null;
    mockState.sessionError = false;
    mockState.signInThrow = false;
    mockState.signInError = null;
    mockState.resetThrow = false;
    mockState.resetError = null;
    mockState.profileExists = true;
    mockState.profileInsertError = false;
    mockState.updateProfileError = false;
    mockState.updateProfileThrow = false;
    mockState.gymUpdateError = false;
    mockState.gymInsertError = false;
    mockState.gymMonthError = false;
    mockState.gymMonthNullData = false;
    mockState.bwUpdateError = false;
    mockState.bwInsertError = false;
    mockState.bwMonthError = false;
    mockState.bwMonthNullData = false;
    mockState.hiitUpdateError = false;
    mockState.hiitInsertError = false;
    mockState.hiitInsertNoData = false;
    mockState.hiitMonthError = false;
    mockState.hiitMonthNullData = false;
    mockState.gymMonthData = [];
    mockState.bwMonthData = [];
    mockState.hiitMonthData = [];
    resetPasswordArgs.length = 0;
    fromCalls.length = 0;
    signOutCalls.count = 0;

    document.body.innerHTML = `
      <div id="loginScreen" style="display:none"></div>
      <div id="loginLoading" style="display:none"></div>
      <div id="loginStep1" style="display:block"></div>
      <div id="authTitle"></div>
      <div id="authSub"></div>
      <button id="authBtn"></button>
      <div id="authNameGroup"></div>
      <input id="authEmail" />
      <input id="authPw" />
      <div id="authErr"></div>
      <div id="authToggleText"></div>
      <div id="authToggleLink"></div>
      <div id="forgotPwHint"></div>
      <div id="uName"></div>
      <div id="uDot"></div>
      <div id="profName0"></div>
      <div id="profIc0"></div>
      <input id="epName" />
      <div id="epColors"></div>
      <div id="epTitle"></div>
    `;

    (globalThis as any).toast = vi.fn();
    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();
    (globalThis as any).initTheme = vi.fn();
    (globalThis as any).renderToday = vi.fn();
    (globalThis as any).renderHiitProgress = vi.fn();
    (globalThis as any).confirm = vi.fn(() => true);
  });

  it('dk formatea fecha YYYY-MM-DD', async () => {
    const { dk } = await import('../db.js');
    expect(dk(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('initLogin muestra pantalla de login sin sesion', async () => {
    const { initLogin } = await import('../db.js');

    await initLogin();

    expect((document.getElementById('loginScreen') as HTMLElement).style.display).toBe('flex');
    expect(document.getElementById('authTitle')?.textContent).toContain('Iniciar sesión');
  });

  it('initLogin con sesion activa entra a la app', async () => {
    mockState.sessionUser = { id: 'u1', email: 'mario@mail.com' };
    const { initLogin } = await import('../db.js');

    await initLogin();

    expect((globalThis as any).renderToday).toHaveBeenCalled();
  });

  it('initLogin crea perfil por defecto si no existe', async () => {
    mockState.sessionUser = { id: 'u1', email: 'nuevo@mail.com' };
    mockState.profileExists = false;
    const { initLogin } = await import('../db.js');

    await initLogin();

    expect(document.getElementById('uName')?.textContent).toBeTruthy();
  });

  it('initLogin usa fallback si falla inserción de perfil', async () => {
    mockState.sessionUser = { id: 'u1', email: 'nuevo@mail.com' };
    mockState.profileExists = false;
    mockState.profileInsertError = true;
    const { initLogin } = await import('../db.js');

    await initLogin();

    expect(document.getElementById('uName')?.textContent).toBeTruthy();
  });

  it('initLogin maneja error de sesion y muestra login', async () => {
    mockState.sessionError = true;
    const { initLogin } = await import('../db.js');

    await initLogin();

    expect((document.getElementById('loginScreen') as HTMLElement).style.display).toBe('flex');
  });

  it('sendResetEmail valida email requerido', async () => {
    const { sendResetEmail } = await import('../db.js');

    await sendResetEmail();

    expect(document.getElementById('authErr')?.textContent).toContain('Escribe tu email');
  });

  it('sendResetEmail envia redirectTo cuando hay email', async () => {
    const { sendResetEmail } = await import('../db.js');
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';

    await sendResetEmail();

    expect(resetPasswordArgs.length).toBe(1);
    expect(resetPasswordArgs[0]?.options?.redirectTo).toContain('http');
  });

  it('sendResetEmail muestra mensaje cuando reset falla', async () => {
    mockState.resetError = { message: 'reset failed' };
    const { sendResetEmail } = await import('../db.js');
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';

    await sendResetEmail();

    expect(document.getElementById('authErr')?.textContent).toContain('reset failed');
  });

  it('sendResetEmail maneja excepción inesperada', async () => {
    mockState.resetThrow = true;
    const { sendResetEmail } = await import('../db.js');
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';

    await sendResetEmail();

    expect(document.getElementById('authErr')?.textContent).toContain('Error enviando email');
  });

  it('doAuthAction muestra error cuando faltan credenciales', async () => {
    const { doAuthAction } = await import('../db.js');

    await doAuthAction();

    expect(document.getElementById('authErr')?.textContent).toContain('Completa email y contraseña');
  });

  it('doAuthAction autentica y entra a la app', async () => {
    const { doAuthAction } = await import('../db.js');
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';
    (document.getElementById('authPw') as HTMLInputElement).value = 'secret';

    await doAuthAction();

    expect((globalThis as any).renderToday).toHaveBeenCalled();
    expect(document.getElementById('uName')?.textContent).toBe('Mario');
  });

  it('doAuthAction muestra credenciales incorrectas', async () => {
    mockState.signInError = { message: 'bad credentials' };
    const { doAuthAction } = await import('../db.js');
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';
    (document.getElementById('authPw') as HTMLInputElement).value = 'wrong';

    await doAuthAction();

    expect(document.getElementById('authErr')?.textContent).toContain('incorrectos');
  });

  it('doAuthAction maneja excepcion inesperada', async () => {
    mockState.signInThrow = true;
    const { doAuthAction } = await import('../db.js');
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';
    (document.getElementById('authPw') as HTMLInputElement).value = 'x';

    await doAuthAction();

    expect(document.getElementById('authErr')?.textContent).toContain('Error de conexión');
  });

  it('initLogin muestra error de configuracion si faltan variables de entorno', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    const { initLogin } = await import('../db.js');

    await initLogin();

    expect(document.getElementById('loginScreen')?.style.display).toBe('flex');
    expect(document.getElementById('authErr')?.textContent).toContain('VITE_SUPABASE_URL');
  });

  it('toggleAuthMode mantiene signin-only', async () => {
    const { toggleAuthMode } = await import('../db.js');

    toggleAuthMode();

    expect(document.getElementById('authTitle')?.textContent).toContain('Iniciar sesión');
    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('toggleAuthMode no falla si faltan elementos del auth DOM', async () => {
    const { toggleAuthMode } = await import('../db.js');
    document.body.innerHTML = '<div></div>';

    expect(toggleAuthMode).not.toThrow();
  });

  it('saveGymDay/gD y deleteGymDay actualizan cache local', async () => {
    const { enterApp, saveGymDay, gD, deleteGymDay } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveGymDay('2026-04-09', [{ name: 'Press', reps: '8', ts: 1 } as any]);

    expect(gD()['2026-04-09']).toHaveLength(1);

    await deleteGymDay('2026-04-09');
    expect(gD()['2026-04-09']).toBeUndefined();
  });

  it('saveGymDay y deleteGymDay cubren errores y dia inexistente', async () => {
    const { enterApp, saveGymDay, gD, deleteGymDay } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveGymDay('2026-04-09', [{ name: 'Press', reps: '8', ts: 1 } as any]);

    mockState.gymUpdateError = true;
    await saveGymDay('2026-04-09', [{ name: 'Row', reps: '10', ts: 2 } as any]);
    expect(gD()['2026-04-09']?.[0]?.name).toBe('Press');

    mockState.gymUpdateError = false;
    mockState.gymInsertError = true;
    await saveGymDay('2026-04-10', [{ name: 'Curl', reps: '12', ts: 3 } as any]);
    expect(gD()['2026-04-10']).toBeUndefined();

    await deleteGymDay('2099-01-01');
    expect(gD()['2026-04-09']).toHaveLength(1);
  });

  it('loadGymMonth muestra error cuando la consulta falla', async () => {
    mockState.gymMonthError = true;
    const { enterApp, loadGymMonth } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadGymMonth(2026, 3);

    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('loadGymMonth tolera data nula sin error', async () => {
    mockState.gymMonthNullData = true;
    const { enterApp, loadGymMonth, gD } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadGymMonth(2026, 3);

    expect(Object.keys(gD())).toHaveLength(0);
  });

  it('saveBWDay/gBW guardan metrica corporal', async () => {
    const { enterApp, saveBWDay, gBW } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveBWDay('2026-04-09', { v: 80, u: 'kg', fat: 19, mmc: 35, ts: 1 });

    expect(gBW()['2026-04-09']?.v).toBe(80);
  });

  it('saveBWDay cubre errores de update e insert', async () => {
    const { enterApp, saveBWDay, gBW } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveBWDay('2026-04-09', { v: 80, u: 'kg', fat: 19, mmc: 35, ts: 1 });

    mockState.bwUpdateError = true;
    await saveBWDay('2026-04-09', { v: 81, u: 'kg', fat: 18, mmc: 36, ts: 2 });
    expect(gBW()['2026-04-09']?.v).toBe(80);

    mockState.bwUpdateError = false;
    mockState.bwInsertError = true;
    await saveBWDay('2026-04-10', { v: 82, u: 'kg', fat: 17, mmc: 37, ts: 3 });
    expect(gBW()['2026-04-10']).toBeUndefined();
  });

  it('loadBWAll muestra error cuando la consulta falla', async () => {
    mockState.bwMonthError = true;
    const { enterApp, loadBWAll } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadBWAll();

    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('loadBWAll tolera data nula sin error', async () => {
    mockState.bwMonthNullData = true;
    const { enterApp, loadBWAll, gBW } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadBWAll();

    expect(Object.keys(gBW())).toHaveLength(0);
  });

  it('saveHiitSession/gHiit/deleteHiitSession gestionan sesiones HIIT', async () => {
    const { enterApp, saveHiitSession, gHiit, deleteHiitSession } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });

    const createdId = await saveHiitSession('2026-04-09', {
      name: 'Tabata',
      rounds: 8,
      duration: '20:00',
      notes: '',
      exercises: [{ name: 'Burpees' }],
    } as any);

    expect(createdId).toBeTruthy();
    expect(gHiit()['2026-04-09']).toHaveLength(1);

    await deleteHiitSession(String(createdId));
    expect(gHiit()['2026-04-09']).toBeUndefined();
  });

  it('saveHiitSession cubre update fallido, insert fallido y update sin indice', async () => {
    const { enterApp, saveHiitSession, gHiit } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });

    const pushedId = await saveHiitSession('2026-04-09', {
      name: 'EMOM',
      exercises: [{ name: 'Burpees' }],
    } as any, 'missing-id');
    expect(pushedId).toBe('missing-id');
    expect(gHiit()['2026-04-09']?.some(session => session.id === 'missing-id')).toBe(true);

    mockState.hiitUpdateError = true;
    const updateFailed = await saveHiitSession('2026-04-09', {
      name: 'EMOM 2',
      exercises: [{ name: 'Sprint' }],
    } as any, 'missing-id');
    expect(updateFailed).toBe(false);

    mockState.hiitUpdateError = false;
    mockState.hiitInsertError = true;
    const insertFailed = await saveHiitSession('2026-04-10', {
      name: 'Tabata',
      exercises: [{ name: 'Jump' }],
    } as any);
    expect(insertFailed).toBe(false);

    mockState.hiitInsertError = false;
    mockState.hiitInsertNoData = true;
    const noDataInsert = await saveHiitSession('2026-04-11', {
      name: 'Circuito',
      exercises: [{ name: 'Row' }],
    } as any);
    expect(noDataInsert).toBe(false);
  });

  it('deleteHiitSession conserva fechas con otras sesiones', async () => {
    const { enterApp, saveHiitSession, deleteHiitSession, gHiit } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    const firstId = await saveHiitSession('2026-04-09', { name: 'A', exercises: [{ name: 'Burpees' }] } as any, 'first-id');
    const secondId = await saveHiitSession('2026-04-09', { name: 'B', exercises: [{ name: 'Sprint' }] } as any, 'second-id');

    await deleteHiitSession(String(firstId));

    expect(gHiit()['2026-04-09']).toHaveLength(1);
    expect(gHiit()['2026-04-09']?.[0]?.id).toBe(secondId);
  });

  it('loadHiitMonth muestra error cuando la consulta falla', async () => {
    mockState.hiitMonthError = true;
    const { enterApp, loadHiitMonth } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadHiitMonth(2026, 3);

    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('loadHiitMonth tolera data nula sin error', async () => {
    mockState.hiitMonthNullData = true;
    const { enterApp, loadHiitMonth, gHiit } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadHiitMonth(2026, 3);

    expect(Object.keys(gHiit())).toHaveLength(0);
  });

  it('openEditProfile + saveProfile actualizan nombre y color', async () => {
    const { enterApp, openEditProfile, selectColor, saveProfile } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    openEditProfile();
    selectColor('#ff9f43');
    (document.getElementById('epName') as HTMLInputElement).value = 'Nuevo';

    await saveProfile();

    expect(document.getElementById('uName')?.textContent).toBe('Nuevo');
    expect((globalThis as any).closeM).toHaveBeenCalledWith('editProfMod');
  });

  it('openEditProfile usa fallback si no hay perfil cargado', async () => {
    const { openEditProfile, renderColorPicker } = await import('../db.js');

    renderColorPicker();
    openEditProfile();

    expect(document.getElementById('epTitle')?.textContent).toContain('Editar mi perfil');
    expect((document.getElementById('epName') as HTMLInputElement).value).toBe('');
    expect(document.querySelectorAll('#epColors .ep-col').length).toBeGreaterThan(0);
  });

  it('saveProfile valida nombre vacio y maneja error de update', async () => {
    const { enterApp, saveProfile } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    (document.getElementById('epName') as HTMLInputElement).value = '';
    await saveProfile();
    expect((globalThis as any).toast).toHaveBeenCalled();

    mockState.updateProfileError = true;
    (document.getElementById('epName') as HTMLInputElement).value = 'Mario';
    await saveProfile();
    expect((globalThis as any).toast).toHaveBeenCalled();

    mockState.updateProfileError = false;
    mockState.updateProfileThrow = true;
    await saveProfile();
    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('sendResetEmail muestra confirmacion en éxito', async () => {
    const { sendResetEmail } = await import('../db.js');
    const authErr = document.getElementById('authErr') as HTMLElement;
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';

    await sendResetEmail();

    expect(authErr.textContent).toContain('Email de recuperación enviado');
    expect(authErr.style.color).toContain('var(--accent)');
  });

  it('sendResetEmail omite redirectTo si location no es usable y tolera falta de authErr', async () => {
    const { sendResetEmail } = await import('../db.js');
    const originalLocation = globalThis.location;
    document.body.innerHTML = '<input id="authEmail" />';
    (document.getElementById('authEmail') as HTMLInputElement).value = 'mail@test.com';

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { origin: '', pathname: '' },
    });

    await sendResetEmail();

    expect(resetPasswordArgs.at(-1)?.options).toBeUndefined();

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('showLoading alterna visibilidad de login y formulario', async () => {
    const { showLoading } = await import('../db.js');

    showLoading(true);
    expect((document.getElementById('loginLoading') as HTMLElement).style.display).toBe('block');
    expect((document.getElementById('loginStep1') as HTMLElement).style.display).toBe('none');

    showLoading(false);
    expect((document.getElementById('loginLoading') as HTMLElement).style.display).toBe('none');
    expect((document.getElementById('loginStep1') as HTMLElement).style.display).toBe('block');
  });

  it('showLoading e initLogin toleran ausencia de nodos de login', async () => {
    const { showLoading, initLogin } = await import('../db.js');
    document.body.innerHTML = '';
    mockState.sessionError = true;

    expect(() => showLoading(true)).not.toThrow();
    await initLogin();
  });

  it('clearCache limpia datos expuestos en gD/gBW/gHiit', async () => {
    const { enterApp, saveGymDay, saveBWDay, saveHiitSession, clearCache, gD, gBW, gHiit } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveGymDay('2026-04-09', [{ name: 'Press', reps: '8', ts: 1 } as any]);
    await saveBWDay('2026-04-09', { v: 80, u: 'kg' } as any);
    await saveHiitSession('2026-04-09', { name: 'EMOM', exercises: [] } as any);

    clearCache();

    expect(Object.keys(gD())).toHaveLength(0);
    expect(Object.keys(gBW())).toHaveLength(0);
    expect(Object.keys(gHiit())).toHaveLength(0);
  });

  it('doLogout corta cuando el usuario cancela', async () => {
    const { doLogout } = await import('../db.js');
    (globalThis as any).confirm = vi.fn(() => false);

    await doLogout();

    expect(signOutCalls.count).toBe(0);
  });

  it('doLogout limpia cache y llama signOut cuando confirma', async () => {
    const { enterApp, saveGymDay, doLogout, gD } = await import('../db.js');
    (globalThis as any).confirm = vi.fn(() => true);
    const reloadSpy = vi.spyOn(globalThis.location, 'reload').mockImplementation(() => {});

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveGymDay('2026-04-09', [{ name: 'Press', reps: '8', ts: 1 } as any]);

    await doLogout();

    expect(signOutCalls.count).toBe(1);
    expect(Object.keys(gD())).toHaveLength(0);
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('enterApp maneja error en render final', async () => {
    const { enterApp } = await import('../db.js');
    (globalThis as any).renderHiitProgress = vi.fn(() => {
      throw new Error('render fail');
    });

    await enterApp({ id: 'u1', email: 'mail@test.com' });

    expect((globalThis as any).toast).toHaveBeenCalled();
  });
});
