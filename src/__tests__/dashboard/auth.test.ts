import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPassword = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const signOutApi = vi.fn();
const fromMock = vi.fn();

vi.mock('../../dashboard/data', () => ({
  sb: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: (...args: unknown[]) => signOutApi(...args),
    },
  },
}));

function authChain(data: unknown) {
  return {
    select: () => ({
      eq: () => ({
        single: async () => ({ data }),
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
      if (table === 'gym_admins') return authChain({ user_id: 'u1' });
      if (table === 'profiles') return authChain({ name: 'Ana', color: '#123456' });
      return authChain(null);
    });

    getSession.mockResolvedValue({ data: { session: null } });
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
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
      if (table === 'gym_admins') return authChain(null);
      if (table === 'profiles') return authChain({ name: 'Ana' });
      return authChain(null);
    });

    getSession.mockResolvedValue({ data: { session: { user: { id: 'u9', email: 'u9@test.com' } } } });

    const mod = await import('../../dashboard/auth');
    await mod.initAuth(async () => {});

    expect(document.getElementById('noaccess-screen')?.style.display).toBe('flex');
  });
});
