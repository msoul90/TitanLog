import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyTheme = vi.fn();
const getTheme = vi.fn(() => 'dark');
const toggleTheme = vi.fn();
const invalidateCache = vi.fn();
const showToast = vi.fn();
const initAuth = vi.fn(async (cb: () => Promise<void>) => {
  await cb();
});
const getCurrentUser = vi.fn(() => ({ id: 'u1' }));
const signOut = vi.fn(async () => {});
const initNavigation = vi.fn();
const applyNavigationState = vi.fn();
const initPages = vi.fn();
const loadPage = vi.fn(async () => {});

vi.mock('../../dashboard/theme', () => ({
  applyTheme,
  getTheme,
  toggleTheme,
}));

vi.mock('../../dashboard/data', () => ({
  invalidateCache,
}));

vi.mock('../../dashboard/helpers', () => ({
  showToast,
}));

vi.mock('../../dashboard/auth', () => ({
  initAuth,
  getCurrentUser,
  signOut,
}));

vi.mock('../../dashboard/navigation', () => ({
  initNavigation,
  applyNavigationState,
}));

vi.mock('../../dashboard/pages', () => ({
  initPages,
  loadPage,
}));

describe('dashboard main bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('bootstrap inicializa tema, pages, nav y auth', async () => {
    await import('../../dashboard/main');

    expect(applyTheme).toHaveBeenCalledWith('dark');
    expect(initPages).toHaveBeenCalledWith({
      getCurrentUser: expect.any(Function),
      signOut: expect.any(Function),
    });
    expect(initNavigation).toHaveBeenCalledTimes(1);
    expect(initAuth).toHaveBeenCalledTimes(1);
    expect(applyNavigationState).toHaveBeenCalledWith('resumen');
    expect(loadPage).toHaveBeenCalledWith('resumen');
  });

  it('callbacks de navigation refrescan y navegan', async () => {
    await import('../../dashboard/main');

    const navArgs = initNavigation.mock.calls[0]?.[0] as {
      onNavigate: (page: 'admin') => void;
      onRefresh: () => void;
      onToggleTheme: () => void;
    };

    navArgs.onRefresh();
    navArgs.onToggleTheme();
    navArgs.onNavigate('admin');

    await Promise.resolve();

    expect(invalidateCache).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Datos actualizados');
    expect(toggleTheme).toHaveBeenCalled();
    expect(applyNavigationState).toHaveBeenCalledWith('admin');
    expect(loadPage).toHaveBeenCalledWith('admin');
  });
});
