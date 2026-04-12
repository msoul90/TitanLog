import { describe, expect, it } from 'vitest';

import { validateSupabaseConfig } from '../supabase-config';

describe('supabase-config.ts', () => {
  it('acepta una Project URL valida y anon key larga', async () => {
    expect(validateSupabaseConfig('https://demo-project.supabase.co', 'abcdefghijklmnopqrstuvwxyz123456')).toBeNull();
  });

  it('reporta placeholders en URL o key', async () => {
    expect(validateSupabaseConfig('https://TU_PROJECT_ID.supabase.co', 'abcdefghijklmnopqrstuvwxyz123456')).toContain('credenciales reales de Supabase');
    expect(validateSupabaseConfig('https://demo-project.supabase.co', 'TU_ANON_PUBLIC_KEY')).toContain('credenciales reales de Supabase');
  });

  it('detecta cuando la URL del dashboard se usa como VITE_SUPABASE_URL', async () => {
    expect(validateSupabaseConfig('supabase.com/dashboard/project/demo-project', 'abcdefghijklmnopqrstuvwxyz123456')).toContain(
      'Project URL (API), no la URL del dashboard',
    );
  });

  it('rechaza dominios no supabase, protocolo http y URL malformada', async () => {
    expect(validateSupabaseConfig('https://example.com', 'abcdefghijklmnopqrstuvwxyz123456')).toContain('VITE_SUPABASE_URL no es valida');
    expect(validateSupabaseConfig('http://demo-project.supabase.co', 'abcdefghijklmnopqrstuvwxyz123456')).toContain('VITE_SUPABASE_URL no es valida');
    expect(validateSupabaseConfig('://not-a-url', 'abcdefghijklmnopqrstuvwxyz123456')).toContain('VITE_SUPABASE_URL no es valida');
  });

  it('rechaza anon key demasiado corta', async () => {
    expect(validateSupabaseConfig('https://demo-project.supabase.co', 'short')).toContain('VITE_SUPABASE_ANON_KEY no es valida');
  });
});