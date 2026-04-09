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
  gymMonthError: boolean;
  bwMonthError: boolean;
  hiitMonthError: boolean;
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
    gymMonthError: false,
    bwMonthError: false,
    hiitMonthError: false,
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
          if (table === 'profiles' && lastOp === 'update' && mockState.updateProfileError) {
            return Promise.resolve({ error: { message: 'profile update error' } });
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
        if (table === 'gym_sessions') return { data: mockState.gymMonthData, error: null };
        if (table === 'hiit_sessions') return { data: mockState.hiitMonthData, error: null };
        return { data: [], error: null };
      }),
      order: vi.fn(async () => {
        if (table === 'body_metrics' && mockState.bwMonthError) return { data: null, error: { message: 'bw error' } };
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

    mockState.sessionUser = null;
    mockState.sessionError = false;
    mockState.signInThrow = false;
    mockState.signInError = null;
    mockState.resetThrow = false;
    mockState.resetError = null;
    mockState.profileExists = true;
    mockState.profileInsertError = false;
    mockState.updateProfileError = false;
    mockState.gymMonthError = false;
    mockState.bwMonthError = false;
    mockState.hiitMonthError = false;
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

  it('toggleAuthMode mantiene signin-only', async () => {
    const { toggleAuthMode } = await import('../db.js');

    toggleAuthMode();

    expect(document.getElementById('authTitle')?.textContent).toContain('Iniciar sesión');
    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('saveGymDay/gD y deleteGymDay actualizan cache local', async () => {
    const { enterApp, saveGymDay, gD, deleteGymDay } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveGymDay('2026-04-09', [{ name: 'Press', reps: '8', ts: 1 } as any]);

    expect(gD()['2026-04-09']).toHaveLength(1);

    await deleteGymDay('2026-04-09');
    expect(gD()['2026-04-09']).toBeUndefined();
  });

  it('loadGymMonth muestra error cuando la consulta falla', async () => {
    mockState.gymMonthError = true;
    const { enterApp, loadGymMonth } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadGymMonth(2026, 3);

    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('saveBWDay/gBW guardan metrica corporal', async () => {
    const { enterApp, saveBWDay, gBW } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await saveBWDay('2026-04-09', { v: 80, u: 'kg', fat: 19, mmc: 35, ts: 1 });

    expect(gBW()['2026-04-09']?.v).toBe(80);
  });

  it('loadBWAll muestra error cuando la consulta falla', async () => {
    mockState.bwMonthError = true;
    const { enterApp, loadBWAll } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadBWAll();

    expect((globalThis as any).toast).toHaveBeenCalled();
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

  it('loadHiitMonth muestra error cuando la consulta falla', async () => {
    mockState.hiitMonthError = true;
    const { enterApp, loadHiitMonth } = await import('../db.js');

    await enterApp({ id: 'u1', email: 'mail@test.com' });
    await loadHiitMonth(2026, 3);

    expect((globalThis as any).toast).toHaveBeenCalled();
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
