import { describe, expect, it } from 'vitest';

import { PAGE_TITLES } from '../../dashboard/config';

describe('dashboard config', () => {
  it('incluye todas las paginas esperadas', () => {
    expect(Object.keys(PAGE_TITLES).sort()).toEqual([
      'actividad',
      'admin',
      'ejercicios',
      'miembros',
      'progreso',
      'resumen',
    ]);
  });

  it('define titulo para administracion', () => {
    expect(PAGE_TITLES.admin).toBe('Administracion de acceso');
  });
});
