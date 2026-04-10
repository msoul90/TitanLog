export { SUPABASE_URL, SUPABASE_ANON, getSupabaseConfigError } from '../supabase-config';

export const PAGE_TITLES = {
  resumen: 'Resumen',
  miembros: 'Miembros',
  progreso: 'Progreso',
  ejercicios: 'Ejercicios',
  actividad: 'Actividad',
  admin: 'Administracion de acceso',
  config: 'Configuracion',
} as const;

export type PageKey = keyof typeof PAGE_TITLES;
