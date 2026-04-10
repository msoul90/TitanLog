import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase para que db.ts no falle al importar
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

import {
  validateExerciseInput,
  escHtml,
  isPR,
  clearPerformanceCache,
  toggleTheme,
  initTheme,
  openM,
  closeM,
  showS,
  acIn,
  acKey,
  changeDay,
  appState,
  toggleVis,
  sD,
  gD,
  sBW,
  gBW,
  renderToday,
} from '../app.js';

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
    sessionStorage.clear();
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
    sessionStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Sentadilla', weight: 80, reps: '10', ts: 0 }],
    }));
    expect(isPR('Sentadilla', '2024-01-10', 100)).toBe(true);
  });

  it('retorna false cuando no supera el maximo historico', () => {
    sessionStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Sentadilla', weight: 120, reps: '5', ts: 0 }],
    }));
    expect(isPR('Sentadilla', '2024-01-10', 100)).toBe(false);
  });

  it('retorna false cuando iguala exactamente el maximo', () => {
    sessionStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Sentadilla', weight: 100, reps: '5', ts: 0 }],
    }));
    expect(isPR('Sentadilla', '2024-01-10', 100)).toBe(false);
  });

  it('ignora sesiones de la misma fecha o posteriores', () => {
    sessionStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-10': [{ name: 'Sentadilla', weight: 200, reps: '1', ts: 0 }],
      '2024-01-15': [{ name: 'Sentadilla', weight: 300, reps: '1', ts: 0 }],
    }));
    // Sin historial anterior a la fecha, no puede ser PR
    expect(isPR('Sentadilla', '2024-01-10', 150)).toBe(false);
  });

  it('no mezcla ejercicios distintos', () => {
    sessionStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'Press banca', weight: 120, reps: '5', ts: 0 }],
    }));
    // Sentadilla no tiene historial propio
    expect(isPR('Sentadilla', '2024-01-10', 80)).toBe(false);
  });

  it('la comparacion de nombre no distingue mayusculas', () => {
    sessionStorage.setItem('ironlog_gym_', JSON.stringify({
      '2024-01-05': [{ name: 'SENTADILLA', weight: 80, reps: '10', ts: 0 }],
    }));
    expect(isPR('sentadilla', '2024-01-10', 100)).toBe(true);
  });
});

describe('app UI helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = `
      <input id="pw" type="password" />
      <dialog id="m1"></dialog>
      <div id="m2" style="display:none"></div>
      <div id="acDrop" style="display:none"></div>
      <input id="fName" value="" />
      <button id="fabBtn" style="display:none"></button>
      <button id="todayBtn" class="nav-btn"></button>
      <button id="calBtn" class="nav-btn"></button>
      <section id="screen-today" class="screen"></section>
      <section id="screen-calendar" class="screen"></section>
    `;

    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
    (globalThis as any).renderCal = vi.fn();
  });

  it('toggleVis alterna tipo password/text', () => {
    toggleVis('pw');
    expect((document.getElementById('pw') as HTMLInputElement).type).toBe('text');
    toggleVis('pw');
    expect((document.getElementById('pw') as HTMLInputElement).type).toBe('password');
  });

  it('toggleTheme e initTheme gestionan tema en localStorage', () => {
    document.documentElement.dataset.theme = 'dark';
    toggleTheme();
    expect(document.documentElement.dataset.theme).toBe('light');

    localStorage.setItem('ironlog_theme', 'dark');
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('openM y closeM funcionan con dialog y div', () => {
    vi.useFakeTimers();

    openM('m1');
    expect((document.getElementById('m1') as HTMLDialogElement).open).toBe(true);

    openM('m2');
    expect((document.getElementById('m2') as HTMLElement).style.display).toBe('block');

    closeM('m1');
    vi.advanceTimersByTime(220);
    expect((document.getElementById('m1') as HTMLDialogElement).open).toBe(false);

    closeM('m2');
    vi.advanceTimersByTime(220);
    expect((document.getElementById('m2') as HTMLElement).style.display).toBe('none');

    vi.useRealTimers();
  });

  it('showS activa pantalla y llama render de calendar', () => {
    showS('calendar', document.getElementById('calBtn') as HTMLElement);

    expect(document.getElementById('screen-calendar')?.classList.contains('active')).toBe(true);
    expect(document.getElementById('calBtn')?.classList.contains('active')).toBe(true);
    expect((globalThis as any).renderCal).toHaveBeenCalled();
    expect(globalThis.location.hash).toBe('#calendar');
  });

  it('acIn muestra sugerencias y acKey selecciona con Enter', () => {
    acIn('sen');
    const drop = document.getElementById('acDrop') as HTMLElement;
    expect(drop.style.display).toBe('block');
    expect(drop.querySelectorAll('.ac-it').length).toBeGreaterThan(0);

    acKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    acKey(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect((document.getElementById('fName') as HTMLInputElement).value.length).toBeGreaterThan(0);
    expect(drop.style.display).toBe('none');
  });

  it('changeDay mueve fecha del estado', () => {
    const base = new Date(2026, 3, 9);
    appState.viewDate = new Date(base);

    changeDay(1);

    expect(appState.viewDate.getDate()).toBe(10);
  });

  it('sD/gD y sBW/gBW persisten solo en sessionStorage', () => {
    sD({ '2026-04-09': [{ name: 'Press', reps: '8', ts: 1 }] as any });
    const data = gD();
    expect(data['2026-04-09']?.length).toBe(1);
    expect(localStorage.getItem('ironlog_gym_')).toBeNull();
    expect(sessionStorage.getItem('ironlog_gym_')).toContain('Press');

    sBW({ '2026-04-09': { v: 80, u: 'kg' } as any });
    const bw = gBW();
    expect(bw['2026-04-09']?.v).toBe(80);
    expect(localStorage.getItem('ironlog_bw_')).toBeNull();
    expect(sessionStorage.getItem('ironlog_bw_')).toContain('80');
  });

  it('gD y gBW devuelven {} si JSON está corrupto', () => {
    sessionStorage.setItem('ironlog_gym_', '{');
    sessionStorage.setItem('ironlog_bw_', '{');

    expect(gD()).toEqual({});
    expect(gBW()).toEqual({});
  });

  it('renderToday muestra estado vacío y lista con ejercicios', () => {
    document.body.innerHTML += '<div id="dLabel"></div><div id="dSub"></div><div id="exList"></div>';
    appState.viewDate = new Date(2026, 3, 9);

    renderToday();
    expect(document.getElementById('exList')?.innerHTML).toContain('Sin ejercicios');

    sD({ '2026-04-09': [{ name: 'Sentadilla', reps: '10', ts: 1, weight: '80', unit: 'kg', sets: '3' }] as any });
    renderToday();
    expect(document.getElementById('exList')?.innerHTML).toContain('Sentadilla');
  });

  it('showS cubre ramas hiit/progress/export/today', () => {
    document.body.innerHTML += `
      <button id="n1" class="nav-btn"></button>
      <button id="n2" class="nav-btn"></button>
      <section id="screen-hiit" class="screen"></section>
      <section id="screen-progress" class="screen"></section>
      <section id="screen-export" class="screen"></section>
      <section id="screen-today" class="screen"></section>
      <button id="fabBtn"></button>
    `;
    (globalThis as any).renderHiit = vi.fn();
    (globalThis as any).renderHiitProgress = vi.fn();
    (globalThis as any).renderProg = vi.fn();
    (globalThis as any).renderGuidesCatalog = vi.fn();
    (globalThis as any).renderStretchCatalog = vi.fn();

    showS('hiit', document.getElementById('n1') as HTMLElement);
    showS('progress', document.getElementById('n1') as HTMLElement);
    showS('export', document.getElementById('n1') as HTMLElement);
    showS('today', document.getElementById('n2') as HTMLElement);

    expect((globalThis as any).renderHiit).toHaveBeenCalled();
    expect((globalThis as any).renderProg).toHaveBeenCalled();
    expect((globalThis as any).renderGuidesCatalog).toHaveBeenCalled();
    expect((document.getElementById('fabBtn') as HTMLElement).style.display).toBe('flex');
  });
});
