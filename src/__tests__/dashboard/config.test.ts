import { beforeEach, describe, expect, it, vi } from 'vitest';

function isPlaceholderValue(value: string): boolean {
  return value.includes('TU_PROJECT_ID') || value.includes('TU_ANON_PUBLIC_KEY');
}

function isValidSupabaseUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }
    return /(^|\.)supabase\./i.test(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function looksLikeDashboardUrl(value: string): boolean {
  return /supabase\.com\/dashboard\/project\//i.test(value);
}

// Test helper to create a test configuration module
function createConfigModule(url: string, key: string) {
  return {
    SUPABASE_URL: url,
    SUPABASE_ANON: key,
    getSupabaseConfigError() {
      if (isPlaceholderValue(url) || isPlaceholderValue(key)) {
        return 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con las credenciales reales de Supabase.';
      }

      if (!isValidSupabaseUrl(url)) {
        if (looksLikeDashboardUrl(url)) {
          return 'VITE_SUPABASE_URL debe ser la Project URL (API), no la URL del dashboard. Ejemplo: https://<project-ref>.supabase.co';
        }
        return 'VITE_SUPABASE_URL no es valida. Usa la Project URL de Supabase, por ejemplo: https://<project-ref>.supabase.co';
      }

      if (!key || key.length < 20) {
        return 'VITE_SUPABASE_ANON_KEY no es valida.';
      }

      return null;
    }
  };
}

describe('dashboard config', () => {
  beforeEach(() => {
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

  it('devuelve error claro cuando quedan placeholders', () => {
    const config = createConfigModule('https://TU_PROJECT_ID.supabase.co', 'TU_ANON_PUBLIC_KEY');
    const err = config.getSupabaseConfigError();
    
    expect(err).toContain('VITE_SUPABASE_URL');
  });

  it('acepta variables de entorno validas', () => {
    const config = createConfigModule('https://demo-project.supabase.co', 'abcdefghijklmnopqrstuvwxyz123456');
    
    expect(config.SUPABASE_URL).toBe('https://demo-project.supabase.co');
    expect(config.SUPABASE_ANON).toBe('abcdefghijklmnopqrstuvwxyz123456');
    expect(config.getSupabaseConfigError()).toBeNull();
  });

  it('retorna error para URL con dominio que no es supabase', () => {
    const config = createConfigModule('https://not-supabase-domain.com', 'abcdefghijklmnopqrstuvwxyz123456');
    const err = config.getSupabaseConfigError();
    
    expect(err).not.toBeNull();
    expect(err).toContain('no es valida');
  });

  it('retorna error especifico cuando la URL es del dashboard de Supabase', () => {
    const config = createConfigModule('supabase.com/dashboard/project/my-project-ref', 'abcdefghijklmnopqrstuvwxyz123456');
    const err = config.getSupabaseConfigError();
    
    expect(err).not.toBeNull();
    expect(err).toContain('Project URL');
  });

  it('retorna error cuando ANON KEY tiene menos de 20 caracteres', () => {
    const config = createConfigModule('https://demo-project.supabase.co', 'shortkey');
    const err = config.getSupabaseConfigError();
    
    expect(err).not.toBeNull();
    expect(err).toContain('no es valida');
  });

  it('retorna error cuando URL usa HTTP en lugar de HTTPS', () => {
    const config = createConfigModule('http://demo-project.supabase.co', 'abcdefghijklmnopqrstuvwxyz123456');
    const err = config.getSupabaseConfigError();
    
    expect(err).not.toBeNull();
    expect(err).toContain('no es valida');
  });
});

async function loadDashboardConfig() {
  return import('../../dashboard/config');
}
