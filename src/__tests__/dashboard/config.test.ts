import { afterEach, describe, expect, it, vi } from 'vitest';

describe('dashboard config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('incluye todas las paginas esperadas', async () => {
    const { PAGE_TITLES } = await loadDashboardConfig();

    expect(Object.keys(PAGE_TITLES).sort((left, right) => left.localeCompare(right))).toEqual([
      'actividad',
      'admin',
      'ejercicios',
      'miembros',
      'progreso',
      'resumen',
    ]);
  });

  it('define titulo para administracion', async () => {
    const { PAGE_TITLES } = await loadDashboardConfig();

    expect(PAGE_TITLES.admin).toBe('Administracion de acceso');
  });

  it('devuelve error claro cuando quedan placeholders', async () => {
    const { getSupabaseConfigError } = await loadDashboardConfig();

    expect(getSupabaseConfigError()).toContain('VITE_SUPABASE_URL');
  });

  it('acepta variables de entorno validas', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'abcdefghijklmnopqrstuvwxyz123456');

    const { SUPABASE_URL, SUPABASE_ANON, getSupabaseConfigError } = await loadDashboardConfig();

    expect(SUPABASE_URL).toBe('https://demo-project.supabase.co');
    expect(SUPABASE_ANON).toBe('abcdefghijklmnopqrstuvwxyz123456');
    expect(getSupabaseConfigError()).toBeNull();
  });
});

async function loadDashboardConfig() {
  return import('../../dashboard/config');
}
