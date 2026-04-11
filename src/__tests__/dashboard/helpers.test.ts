import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  escapeHtml,
  showToast,
  safeColor,
  sanitizeCsvCell,
  colorForMuscle,
  daysAgo,
  initials,
  muscleGroup,
  niceDate,
  statusBadge,
  today,
} from '../../dashboard/helpers';

describe('dashboard helpers date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('today devuelve fecha ISO yyyy-mm-dd', () => {
    expect(today()).toBe('2026-04-10');
  });

  it('daysAgo resta dias correctamente', () => {
    expect(daysAgo(7)).toBe('2026-04-03');
    expect(daysAgo(0)).toBe('2026-04-10');
  });

  it('niceDate retorna guion largo para vacio', () => {
    expect(niceDate('')).toBe('—');
  });

  it('niceDate formatea una fecha valida', () => {
    const result = niceDate('2026-04-10');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('2026');
  });

  it('showToast agrega mensaje al contenedor', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="toast-container"></div>';
    showToast('ok', 'success');
    expect(document.getElementById('toast-container')?.innerHTML).toContain('ok');
    vi.runAllTimers();
    vi.useRealTimers();
  });
});

describe('dashboard helpers text utils', () => {
  it('initials retorna ? cuando no hay nombre', () => {
    expect(initials('')).toBe('?');
  });

  it('initials toma hasta 2 iniciales', () => {
    expect(initials('Iron Log Team')).toBe('IL');
  });

  it('escapeHtml neutraliza etiquetas y atributos', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toContain('&lt;img');
    expect(escapeHtml('"quoted"')).toContain('&quot;');
  });

  it('safeColor acepta solo hex y usa fallback si es invalido', () => {
    expect(safeColor('#4ab8ff', '#000000')).toBe('#4ab8ff');
    expect(safeColor('url(javascript:alert(1))', '#000000')).toBe('#000000');
  });

  it('sanitizeCsvCell neutraliza formulas de hoja de calculo', () => {
    expect(sanitizeCsvCell('=2+3')).toBe('"\'=2+3"');
    expect(sanitizeCsvCell('normal')).toBe('"normal"');
  });
});

describe('dashboard helpers status badge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('statusBadge retorna inactivo cuando no hay fecha', () => {
    expect(statusBadge('')).toContain('badge-inactive');
  });

  it('statusBadge retorna activo para ultimos 3 dias', () => {
    expect(statusBadge('2026-04-09')).toContain('badge-active');
  });

  it('statusBadge retorna advertencia para 4-7 dias', () => {
    expect(statusBadge('2026-04-05')).toContain('badge-warn');
  });

  it('statusBadge retorna inactivo despues de 7 dias', () => {
    expect(statusBadge('2026-04-01')).toContain('badge-inactive');
  });
});

describe('dashboard helpers muscle map', () => {
  it('muscleGroup clasifica piernas', () => {
    expect(muscleGroup('Sentadilla libre')).toBe('Piernas');
  });

  it('muscleGroup clasifica espalda', () => {
    expect(muscleGroup('Lat pulldown')).toBe('Espalda');
  });

  it('muscleGroup clasifica HIIT como fallback', () => {
    expect(muscleGroup('Burpee interval')).toBe('HIIT');
  });

  it('colorForMuscle retorna color conocido', () => {
    expect(colorForMuscle('Pecho')).toBe('#ff6b6b');
  });

  it('colorForMuscle retorna default para grupo desconocido', () => {
    expect(colorForMuscle('Otro')).toBe('#9090b8');
  });
});

describe('dashboard helpers toText edge cases', () => {
  it('escapeHtml maneja tipo symbol con descripcion', () => {
    const sym = Symbol('mi-simbolo');
    expect(escapeHtml(sym)).toBe('mi-simbolo');
  });

  it('escapeHtml maneja tipo symbol sin descripcion', () => {
    const sym = Symbol();
    expect(escapeHtml(sym)).toBe('');
  });

  it('sanitizeCsvCell maneja tipo symbol', () => {
    const sym = Symbol('test');
    expect(sanitizeCsvCell(sym)).toBe('"test"');
  });

  it('escapeHtml devuelve cadena vacia para objeto con referencia circular', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(escapeHtml(obj)).toBe('');
  });

  it('escapeHtml maneja tipo bigint', () => {
    expect(escapeHtml(BigInt(42))).toBe('42');
  });

  it('showToast no falla cuando no existe contenedor de toast', () => {
    document.body.innerHTML = '';
    expect(() => showToast('mensaje sin contenedor')).not.toThrow();
  });
});
