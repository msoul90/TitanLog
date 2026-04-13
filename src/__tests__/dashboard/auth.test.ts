import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPassword = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const signOutApi = vi.fn();
const updateUser = vi.fn();
const fromMock = vi.fn();
const rpcMock = vi.fn();
const getDashboardSupabaseErrorMock = vi.fn<() => string | null>(() => null);

vi.mock('../../dashboard/data', () => ({
  getDashboardSupabaseError: () => getDashboardSupabaseErrorMock(),
  sb: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: (...args: unknown[]) => signOutApi(...args),
      updateUser: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

function authChain(data: unknown) {
  return {
    select: () => ({
      eq: () => ({
        single: async () => ({ data }),
        maybeSingle: async () => ({ data, error: null }),
      }),
    }),
  };
}

describe('dashboard auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    document.body.innerHTML = `
      <div id="auth-screen"></div>
      <div id="set-password-screen">
        <input id="set-password-new" type="password" />
        <input id="set-password-confirm" type="password" />
        <button id="set-password-submit">Activar cuenta</button>
        <div id="set-password-error"></div>
        <div id="pw-strength-fill"></div>
        <div id="pw-strength-label"></div>
      </div>
      <div id="noaccess-screen"></div>
      <div id="app"></div>
      <input id="auth-email" />
      <input id="auth-password" />
      <div id="auth-error"></div>
      <button id="auth-submit">Iniciar sesion</button>
      <button id="noaccess-signout"></button>
      <button id="signout-btn"></button>
      <div id="sidebar-name"></div>
      <div id="sidebar-avatar"></div>
    `;

    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return authChain({ name: 'Ana', color: '#123456' });
      return authChain(null);
    });
    rpcMock.mockResolvedValue({ data: true, error: null });

    getDashboardSupabaseErrorMock.mockReturnValue(null);
    getSession.mockResolvedValue({ data: { session: null } });
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    updateUser.mockResolvedValue({ error: null });
    signOutApi.mockResolvedValue({});
    signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1', email: 'ana@test.com' } },
      error: null,
    });
  });

  it('initAuth maneja login exitoso y ejecuta callback', async () => {
    const mod = await import('../../dashboard/auth');
    const onAuthorized = vi.fn(async () => {});

    await mod.initAuth(onAuthorized);

    (document.getElementById('auth-email') as HTMLInputElement).value = 'ana@test.com';
    (document.getElementById('auth-password') as HTMLInputElement).value = '123456';
    (document.getElementById('auth-submit') as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(signInWithPassword).toHaveBeenCalled();
    expect(document.getElementById('auth-error')?.textContent).toBe('');
    expect(mod.getCurrentUser()?.id).toBe('u1');
  });

  it('signIn muestra error cuando faltan campos', async () => {
    const mod = await import('../../dashboard/auth');

    await mod.initAuth(async () => {});
    (document.getElementById('auth-submit') as HTMLButtonElement).click();

    expect(document.getElementById('auth-error')?.textContent).toContain('Completa');
  });

  it('signOut limpia usuario y vuelve a auth-screen', async () => {
    const mod = await import('../../dashboard/auth');

    await mod.signOut();

    expect(signOutApi).toHaveBeenCalled();
    expect(mod.getCurrentUser()).toBeNull();
    expect(document.getElementById('auth-screen')?.style.display).toBe('flex');
  });

  it('initAuth muestra noaccess para usuario sin admin', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return authChain({ name: 'Ana' });
      return authChain(null);
    });
    rpcMock.mockResolvedValueOnce({ data: false, error: null });

    getSession.mockResolvedValue({ data: { session: { user: { id: 'u9', email: 'u9@test.com' } } } });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(document.getElementById('noaccess-screen')?.style.display).toBe('flex');
  });

  it('initAuth cierra sesion si el perfil está deshabilitado', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return authChain({ name: 'Ana', color: '#123456', is_disabled: true });
      return authChain(null);
    });
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u10', email: 'u10@test.com' } } } });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(signOutApi).toHaveBeenCalled();
    expect(document.getElementById('auth-error')?.textContent).toContain('deshabilitada');
    expect(document.getElementById('auth-screen')?.style.display).toBe('flex');
    expect(mod.getCurrentUser()).toBeNull();
  });

  it('signIn muestra errores inesperados de configuracion', async () => {
    signInWithPassword.mockRejectedValue(new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con las credenciales reales de Supabase.'));

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('auth-email') as HTMLInputElement).value = 'ana@test.com';
    (document.getElementById('auth-password') as HTMLInputElement).value = '123456';
    (document.getElementById('auth-submit') as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('auth-error')?.textContent).toContain('VITE_SUPABASE_URL');
    expect((document.getElementById('auth-submit') as HTMLButtonElement).disabled).toBe(false);
  });

  it('validatePassword rechaza contraseñas débiles', async () => {
    const mod = await import('../../dashboard/auth');
    expect(mod.validatePassword('abc')).toContain('8');
    expect(mod.validatePassword('abcdefgh')).toContain('mayúscula');
    expect(mod.validatePassword('ABCDEFGH')).toContain('minúscula');
    expect(mod.validatePassword('Abcdefgh')).toContain('número');
    expect(mod.validatePassword('Abcdefg1')).toContain('símbolo');
    expect(mod.validatePassword('Abcdef1!')).toBeNull();
  });

  it('detecta flujo de invitación y muestra pantalla set-password', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u2', email: 'nuevo@test.com' } } },
    });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(document.getElementById('set-password-screen')?.style.display).toBe('flex');
    expect(document.getElementById('auth-screen')?.style.display).toBe('none');

    // Reset hash for other tests
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('activa cuenta exitosamente y avanza al app', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u3', email: 'nuevo2@test.com' } } },
    });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('set-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('set-password-confirm') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('set-password-submit') as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(updateUser).toHaveBeenCalledWith({ password: 'Segura1!' });

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('set-password muestra error si contraseñas no coinciden', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u4', email: 'nuevo3@test.com' } } },
    });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('set-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('set-password-confirm') as HTMLInputElement).value = 'Distinta1!';
    (document.getElementById('set-password-submit') as HTMLButtonElement).click();

    await Promise.resolve();

    expect(document.getElementById('set-password-error')?.textContent).toContain('no coinciden');
    expect(updateUser).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('detecta flujo de recovery (type=recovery) y muestra pantalla set-password', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=recovery&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u5', email: 'reset@test.com' } } },
    });

    document.body.innerHTML += '<div id="set-password-sub"></div>';

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(document.getElementById('set-password-screen')?.style.display).toBe('flex');
    expect(document.getElementById('set-password-submit')?.textContent).toContain('Restablecer');

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('PASSWORD_RECOVERY event muestra pantalla set-password con modo recovery', async () => {
    let capturedCallback: ((event: string) => Promise<void>) | null = null;
    onAuthStateChange.mockImplementation((cb: (event: string) => Promise<void>) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    getSession
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValueOnce({ data: { session: { user: { id: 'u6', email: 'r2@test.com' } } } });

    document.body.innerHTML += '<div id="set-password-sub"></div>';

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    await capturedCallback!('PASSWORD_RECOVERY');
    await Promise.resolve();

    expect(document.getElementById('set-password-screen')?.style.display).toBe('flex');
    expect(document.getElementById('set-password-submit')?.textContent).toContain('Restablecer');
  });

  it('handleUser muestra auth-screen cuando usuario es nulo', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: null });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('auth-email') as HTMLInputElement).value = 'test@test.com';
    (document.getElementById('auth-password') as HTMLInputElement).value = 'Password1!';
    (document.getElementById('auth-submit') as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('auth-screen')?.style.display).toBe('flex');
    expect(mod.getCurrentUser()).toBeNull();
  });

  it('handleUser muestra error y pantalla auth cuando checkAdmin falla con error de BD', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u99', email: 'x@test.com' } } } });
    rpcMock.mockResolvedValue({ data: null, error: { message: 'rpc db error' } });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(document.getElementById('auth-error')?.textContent).toContain('No se pudo validar');
    expect(document.getElementById('auth-screen')?.style.display).toBe('flex');
  });

  it('signIn muestra error cuando la API devuelve error de credenciales', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Email o contraseña incorrectos' } });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('auth-email') as HTMLInputElement).value = 'wrong@test.com';
    (document.getElementById('auth-password') as HTMLInputElement).value = 'WrongPass1!';
    (document.getElementById('auth-submit') as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('auth-error')?.textContent).toBe('Email o contraseña incorrectos');
    expect((document.getElementById('auth-submit') as HTMLButtonElement).disabled).toBe(false);
  });

  it('signOut muestra error en UI cuando el servidor falla pero cierra sesion localmente', async () => {
    signOutApi.mockRejectedValue(new Error('network timeout'));

    const mod = await import('../../dashboard/auth');
    await mod.signOut();

    expect(mod.getCurrentUser()).toBeNull();
    expect(document.getElementById('auth-screen')?.style.display).toBe('flex');
    expect(document.getElementById('auth-error')?.textContent).toContain('saliste localmente');
  });

  it('initAuth muestra error de configuracion de supabase en pantalla de login', async () => {
    getDashboardSupabaseErrorMock.mockReturnValue('Error de configuracion de Supabase');

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(document.getElementById('auth-error')?.textContent).toContain('Error de configuracion de Supabase');
  });

  it('tecla Enter en campo contraseña inicia sesion', async () => {
    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('auth-email') as HTMLInputElement).value = 'ana@test.com';
    (document.getElementById('auth-password') as HTMLInputElement).value = 'Segura1!';

    const pwInput = document.getElementById('auth-password') as HTMLInputElement;
    pwInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(signInWithPassword).toHaveBeenCalled();
  });

  it('evento SIGNED_OUT vuelve a mostrar pantalla de autenticacion', async () => {
    let capturedSignedOutCb: ((event: string) => void) | null = null;
    onAuthStateChange.mockImplementation((cb: (event: string) => void) => {
      capturedSignedOutCb = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    document.getElementById('app')!.style.display = 'block';
    capturedSignedOutCb!('SIGNED_OUT');

    expect(document.getElementById('auth-screen')?.style.display).toBe('flex');
    expect(document.getElementById('app')?.style.display).toBe('none');
  });

  it('initAuth muestra error cuando getSession lanza excepcion', async () => {
    getSession.mockRejectedValue(new Error('network failure during session check'));

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(document.getElementById('auth-error')?.textContent).toContain('network failure during session check');
  });

  it('set-password muestra error cuando la API de updateUser devuelve error', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u10', email: 'new10@test.com' } } },
    });
    updateUser.mockResolvedValue({ error: { message: 'La nueva contraseña es igual a la anterior' } });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('set-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('set-password-confirm') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('set-password-submit') as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('set-password-error')?.textContent).toContain('La nueva contraseña es igual');

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('set-password muestra error cuando updateUser lanza excepcion inesperada', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u11', email: 'new11@test.com' } } },
    });
    updateUser.mockRejectedValue(new Error('unexpected server error'));

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('set-password-new') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('set-password-confirm') as HTMLInputElement).value = 'Segura1!';
    (document.getElementById('set-password-submit') as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('set-password-error')?.textContent).toContain('unexpected server error');

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('set-password muestra error de validacion cuando contraseña no cumple requisitos', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u12', email: 'new12@test.com' } } },
    });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('set-password-new') as HTMLInputElement).value = 'debil';
    (document.getElementById('set-password-confirm') as HTMLInputElement).value = 'debil';
    (document.getElementById('set-password-submit') as HTMLButtonElement).click();

    await Promise.resolve();

    expect(document.getElementById('set-password-error')?.textContent).toBeTruthy();
    expect(updateUser).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('set-password actualiza indicador de fortaleza al escribir', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u13', email: 'new13@test.com' } } },
    });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    const newPwEl = document.getElementById('set-password-new') as HTMLInputElement;
    newPwEl.value = 'Segura1!';
    newPwEl.dispatchEvent(new Event('input'));

    const strengthFill = document.getElementById('pw-strength-fill');
    expect(strengthFill?.style.width).not.toBe('0%');

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });

  it('confirmEl Enter en set-password activa envio del formulario', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '#type=invite&access_token=tok' },
      writable: true,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u14', email: 'new14@test.com' } } },
    });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    (document.getElementById('set-password-new') as HTMLInputElement).value = 'Segura1!';
    const confirmEl = document.getElementById('set-password-confirm') as HTMLInputElement;
    confirmEl.value = 'Segura1!';
    confirmEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(updateUser).toHaveBeenCalledWith({ password: 'Segura1!' });

    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, hash: '' },
      writable: true,
    });
  });
});
