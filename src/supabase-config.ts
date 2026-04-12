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
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Accept Supabase project hosts and regional/custom Supabase host patterns.
    return /(^|\.)supabase\./i.test(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function looksLikeDashboardUrl(value: string): boolean {
  return /supabase\.com\/dashboard\/project\//i.test(value);
}

export function validateSupabaseConfig(url: string, anonKey: string): string | null {
  if (isPlaceholderValue(url) || isPlaceholderValue(anonKey)) {
    return 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con las credenciales reales de Supabase.';
  }

  if (!isValidSupabaseUrl(url)) {
    if (looksLikeDashboardUrl(url)) {
      return 'VITE_SUPABASE_URL debe ser la Project URL (API), no la URL del dashboard. Ejemplo: https://<project-ref>.supabase.co';
    }

    return 'VITE_SUPABASE_URL no es valida. Usa la Project URL de Supabase, por ejemplo: https://<project-ref>.supabase.co';
  }

  if (!anonKey || anonKey.length < 20) {
    return 'VITE_SUPABASE_ANON_KEY no es valida.';
  }

  return null;
}

export function getSupabaseConfigError(): string | null {
  return validateSupabaseConfig(SUPABASE_URL, SUPABASE_ANON);
}