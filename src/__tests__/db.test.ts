import { vi, describe, it, expect } from 'vitest';

// Mock Supabase before importing db.ts
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

import { dk } from '../db.js';

describe('dk', () => {
  it('agrega cero a mes y dÃ­a de un solo dÃ­gito', () => {
    expect(dk(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('formatea correctamente mes y dÃ­a de dos dÃ­gitos', () => {
    expect(dk(new Date(2024, 11, 31))).toBe('2024-12-31');
  });

  it('formatea correctamente una fecha a mitad de aÃ±o', () => {
    expect(dk(new Date(2023, 5, 15))).toBe('2023-06-15');
  });

  it('mantiene el aÃ±o de cuatro dÃ­gitos', () => {
    expect(dk(new Date(2000, 0, 1))).toBe('2000-01-01');
  });
});

