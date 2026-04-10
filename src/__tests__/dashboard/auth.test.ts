import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPassword = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const signOutApi = vi.fn();
const updateUser = vi.fn();
const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('../../dashboard/data', () => ({
  getDashboardSupabaseError: () => null,
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
});
