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
      'config',
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

  it('retorna error para URL con dominio que no es supabase', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://not-supabase-domain.com');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'abcdefghijklmnopqrstuvwxyz123456');

    const { getSupabaseConfigError } = await loadDashboardConfig();

    const err = getSupabaseConfigError();
    expect(err).not.toBeNull();
    expect(err).toContain('no es valida');
  });

  it('retorna error especifico cuando la URL es del dashboard de Supabase', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'supabase.com/dashboard/project/my-project-ref');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'abcdefghijklmnopqrstuvwxyz123456');

    const { getSupabaseConfigError } = await loadDashboardConfig();

    const err = getSupabaseConfigError();
    expect(err).not.toBeNull();
    expect(err).toContain('Project URL');
  });

  it('retorna error cuando ANON KEY tiene menos de 20 caracteres', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'shortkey');

    const { getSupabaseConfigError } = await loadDashboardConfig();

    const err = getSupabaseConfigError();
    expect(err).not.toBeNull();
    expect(err).toContain('no es valida');
  });

  it('retorna error cuando URL usa HTTP en lugar de HTTPS', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://demo-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'abcdefghijklmnopqrstuvwxyz123456');

    const { getSupabaseConfigError } = await loadDashboardConfig();

    const err = getSupabaseConfigError();
    expect(err).not.toBeNull();
    expect(err).toContain('no es valida');
  });
});

async function loadDashboardConfig() {
  return import('../../dashboard/config');
}
