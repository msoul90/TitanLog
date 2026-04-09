import { vi, describe, it, expect } from 'vitest';

// Mock Supabase before importing db.ts
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

import { dk } from '../db.js';

describe('dk', () => {
  it('agrega cero a mes y día de un solo dígito', () => {
    expect(dk(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('formatea correctamente mes y día de dos dígitos', () => {
    expect(dk(new Date(2024, 11, 31))).toBe('2024-12-31');
  });

  it('formatea correctamente una fecha a mitad de año', () => {
    expect(dk(new Date(2023, 5, 15))).toBe('2023-06-15');
  });

  it('mantiene el año de cuatro dígitos', () => {
    expect(dk(new Date(2000, 0, 1))).toBe('2000-01-01');
  });
});

