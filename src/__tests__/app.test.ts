import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase para que db.ts no falle al importar
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

import { validateExerciseInput, escHtml, isPR, clearPerformanceCache } from '../app.js';

// -----------------------------------------
// escHtml
// -----------------------------------------
describe('escHtml', () => {
  it('escapa < y >', () => {
    expect(escHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapa &', () => {
    expect(escHtml('a & b')).toBe('a &amp; b');
  });

  it('no modifica texto plano', () => {
    expect(escHtml('IronLog')).toBe('IronLog');
  });

  it('escapa multiples caracteres especiales juntos', () => {
    expect(escHtml('<b>peso & rep</b>')).toBe('&lt;b&gt;peso &amp; rep&lt;/b&gt;');
  });
});

// -----------------------------------------
// validateExerciseInput
// -----------------------------------------
describe('validateExerciseInput', () => {
  it('retorna error cuando el nombre esta vacio', () => {
    const errs = validateExerciseInput('', 80, 3, '10');
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatch(/nombre/i);
  });

  it('retorna error cuando el nombre excede 100 caracteres', () => {
    const errs = validateExerciseInput('a'.repeat(101), 80, 3, '10');
    expect(errs.some(e => e.includes('100'))).toBe(true);
  });

  it('retorna error con peso negativo', () => {
    const errs = validateExerciseInput('Sentadilla', -1, 3, '10');
    expect(errs.some(e => /negativo/i.test(e))).toBe(true);
  });

  it('retorna error con peso mayor al limite (9999)', () => {
    const errs = validateExerciseInput('Sentadilla', 10000, 3, '10');
    expect(errs.some(e => e.includes('9999'))).toBe(true);
  });

  it('retorna error cuando el peso no es numero', () => {
    const errs = validateExerciseInput('Sentadilla', 'abc', 3, '10');
    expect(errs.some(e => /peso/i.test(e))).toBe(true);
  });

  it('retorna error cuando las series son 0', () => {
    const errs = validateExerciseInput('Sentadilla', 80, 0, '10');
    expect(errs.some(e => /serie|1/i.test(e))).toBe(true);
  });

  it('retorna error cuando las series superan el limite (99)', () => {
    const errs = validateExerciseInput('Sentadilla', 80, 100, '10');
    expect(errs.some(e => e.includes('99'))).toBe(true);
  });

  it('retorna error cuando las reps estan vacias', () => {
    const errs = validateExerciseInput('Sentadilla', 80, 3, '');
    expect(errs.some(e => /repeticion|obligatori/i.test(e))).toBe(true);
  });

  it('retorna error con formato de tiempo invalido', () => {
    const errs = validateExerciseInput('Plancha', 0, 3, 'abcs');
    expect(errs.length).toBeGreaterThan(0);
  });

  it('acepta formato de tiempo valido (ej: 30s)', () => {
    const errs = validateExerciseInput('Plancha', 0, 3, '30s');
    expect(errs).toHaveLength(0);
  });

  it('retorna error cuando el tiempo supera 3600s', () => {
    const errs = validateExerciseInput('Plancha', 0, 3, '3601s');
    expect(errs.some(e => e.includes('3600'))).toBe(true);
  });

  it('acepta un ejercicio completamente valido', () => {
    const errs = validateExerciseInput('Sentadilla', 80, 4, '12');
    expect(errs).toHaveLength(0);
  });

  it('acepta peso vacio/0 (ejercicio sin peso)', () => {
    const errs = validateExerciseInput('Plancha', '', 3, '60s');
    expect(errs).toHaveLength(0);
  });
});

// -----------------------------------------
// isPR
// -----------------------------------------
describe('isPR', () => {
  beforeEach(() => {
    localStorage.clear();
    clearPerformanceCache();
  });

  it('retorna false cuando el peso es null', () => {
    expect(isPR('Sentadilla', '2024-01-10', null)).toBe(false);
  });

  it('retorna false cuando el peso es undefined', () => {
    expect(isPR('Sentadilla', '2024-01-10', undefined)).toBe(false);
  });

  it('retorna false en el primer registro (sin historial previo)', () => {
    // Sin historial: max=0, condicion w > max && max > 0 es false
    expect(isPR('Sentadilla', '2024-01-10', 100)).toBe(false);
  });

  it('retorna true cuando supera el maximo historico', () => {
    // Historial: 80kg en fecha anterior
    localStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Sentadilla', weight: 80, reps: '10', ts: 0 }],
    }));
    expect(isPR('Sentadilla', '2024-01-10', 100)).toBe(true);
  });

  it('retorna false cuando no supera el maximo historico', () => {
    localStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Sentadilla', weight: 120, reps: '5', ts: 0 }],
    }));
    expect(isPR('Sentadilla', '2024-01-10', 100)).toBe(false);
  });

  it('retorna false cuando iguala exactamente el maximo', () => {
    localStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Sentadilla', weight: 100, reps: '5', ts: 0 }],
    }));
    expect(isPR('Sentadilla', '2024-01-10', 100)).toBe(false);
  });

  it('ignora sesiones de la misma fecha o posteriores', () => {
    localStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-10': [{ name: 'Sentadilla', weight: 200, reps: '1', ts: 0 }],
      '2024-01-15': [{ name: 'Sentadilla', weight: 300, reps: '1', ts: 0 }],
    }));
    // Sin historial anterior a la fecha, no puede ser PR
    expect(isPR('Sentadilla', '2024-01-10', 150)).toBe(false);
  });

  it('no mezcla ejercicios distintos', () => {
    localStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Press banca', weight: 120, reps: '5', ts: 0 }],
    }));
    // Sentadilla no tiene historial propio
    expect(isPR('Sentadilla', '2024-01-10', 80)).toBe(false);
  });

  it('la comparacion de nombre no distingue mayusculas', () => {
    localStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'SENTADILLA', weight: 80, reps: '10', ts: 0 }],
    }));
    expect(isPR('sentadilla', '2024-01-10', 100)).toBe(true);
  });
});
