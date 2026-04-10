export const SUPABASE_URL = 'https://TU_PROJECT_ID.supabase.co';
export const SUPABASE_ANON = 'TU_ANON_PUBLIC_KEY';

export const PAGE_TITLES = {
  resumen: 'Resumen',
  miembros: 'Miembros',
  progreso: 'Progreso',
  ejercicios: 'Ejercicios',
  actividad: 'Actividad',
  admin: 'Administracion de acceso',
} as const;

export type PageKey = keyof typeof PAGE_TITLES;
