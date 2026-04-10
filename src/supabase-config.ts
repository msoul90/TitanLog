type SupabaseImportMetaEnv = {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
};

type SupabaseImportMeta = {
  readonly env?: SupabaseImportMetaEnv;
};

const env = (import.meta as unknown as SupabaseImportMeta).env;
const processEnv = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

export const SUPABASE_URL = env?.VITE_SUPABASE_URL?.trim() || processEnv?.VITE_SUPABASE_URL?.trim() || 'https://TU_PROJECT_ID.supabase.co';
export const SUPABASE_ANON = env?.VITE_SUPABASE_ANON_KEY?.trim() || processEnv?.VITE_SUPABASE_ANON_KEY?.trim() || 'TU_ANON_PUBLIC_KEY';

function isPlaceholderValue(value: string): boolean {
  return value.includes('TU_PROJECT_ID') || value.includes('TU_ANON_PUBLIC_KEY');
}

function isValidSupabaseUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'https:' && parsedUrl.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function getSupabaseConfigError(): string | null {
  if (isPlaceholderValue(SUPABASE_URL) || isPlaceholderValue(SUPABASE_ANON)) {
    return 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con las credenciales reales de Supabase.';
  }

  if (!isValidSupabaseUrl(SUPABASE_URL)) {
    return 'VITE_SUPABASE_URL no es una URL valida de Supabase.';
  }

  if (!SUPABASE_ANON || SUPABASE_ANON.length < 20) {
    return 'VITE_SUPABASE_ANON_KEY no es valida.';
  }

  return null;
}