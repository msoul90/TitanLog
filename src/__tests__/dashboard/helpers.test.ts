import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  showToast,
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
