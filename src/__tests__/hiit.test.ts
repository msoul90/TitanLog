import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  let hiitData: Record<string, any[]> = {};

  return {
    saveHiitSessionMock: vi.fn(),
    deleteHiitSessionMock: vi.fn(),
    loadHiitMonthMock: vi.fn(async () => undefined),
    gHiitMock: vi.fn(() => hiitData),
    setHiitData: (value: Record<string, any[]>) => {
      hiitData = value;
    },
  };
});

vi.mock('../db.js', () => ({
  dk: (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  saveHiitSession: hoisted.saveHiitSessionMock,
  deleteHiitSession: hoisted.deleteHiitSessionMock,
  gHiit: hoisted.gHiitMock,
  loadHiitMonth: hoisted.loadHiitMonthMock,
}));

// @ts-ignore Vitest resolves .js imports to TS sources at runtime.
import { openHiitModal, renderHiit, renderHiitProgress, selectRPE, saveHiitSessionModal, editHiitSession, deleteHiitSession, hiitChangeDay, adjustHiitTimer, toggleHiitTimer, resetHiitTimer } from '../hiit.js';

describe('hiit.ts', () => {
  beforeEach(() => {
    (globalThis as any).escHtml = (s: string) => s;
    (globalThis as any).toast = vi.fn();
    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();
    (globalThis as any).confirm = vi.fn(() => true);
    (globalThis as any).hiitDate = new Date(2026, 3, 9);
    (globalThis as any).EXERCISE_DATABASE = [
      { n: 'Burpees', m: 'Funcional' },
      { n: 'Remo', m: 'Espalda' },
    ];

    document.body.innerHTML = `
      <div id="hiitList"></div>
      <dialog id="hiitMod"></dialog>
      <div id="hiitModTtl"></div>
      <input id="hName" value="" />
      <input id="hRounds" value="8" />
      <input id="hDuration" value="20" />
      <textarea id="hNotes"></textarea>
      <div id="hiitExList"></div>
      <div id="rpeRow"></div>
      <div id="hiitLabel"></div>
      <div id="hiitSub"></div>
      <div id="htcPhase"></div>
      <div id="htcNum"></div>
      <span id="htcWork">40</span>
      <span id="htcRest">20</span>
      <span id="htcRounds">8</span>
      <button id="htcStartBtn"></button>
      <div id="htcProgress"></div>
    `;

    hoisted.setHiitData({});
    hoisted.saveHiitSessionMock.mockResolvedValue('abc123');
    hoisted.deleteHiitSessionMock.mockResolvedValue(undefined);
    hoisted.loadHiitMonthMock.mockClear();
    hoisted.gHiitMock.mockClear();
    vi.useRealTimers();
  });

  it('renderHiitProgress muestra estado vacio si no hay sesiones', () => {
    renderHiitProgress();
    expect(document.getElementById('hiitList')?.innerHTML).toContain('No hay sesiones HIIT');
  });

  it('openHiitModal abre modal y prepara titulo', () => {
    openHiitModal();
    expect(document.getElementById('hiitModTtl')?.textContent).toContain('Nueva');
    expect(document.querySelectorAll('#hiitExList .hiit-ex-row')).toHaveLength(1);
    expect((globalThis as any).openM).toHaveBeenCalledWith('hiitMod');
  });

  it('agrega autocomplete en ejercicios HIIT', () => {
    openHiitModal();

    const input = document.getElementById('hex-name-0') as HTMLInputElement;
    const datalist = document.getElementById('hiitExSuggestions') as HTMLDataListElement;

    expect(input.getAttribute('list')).toBe('hiitExSuggestions');
    expect(datalist).toBeTruthy();
    expect(datalist.innerHTML).toContain('Burpees');
    expect(datalist.innerHTML).toContain('Remo');
  });

  it('selectRPE marca seleccion en UI', () => {
    openHiitModal();
    selectRPE(7);
    expect(document.getElementById('rpeRow')?.innerHTML).toContain('sel');
  });

  it('saveHiitSessionModal valida nombre antes de guardar', async () => {
    await saveHiitSessionModal();
    expect((globalThis as any).toast).toHaveBeenCalled();
    expect(hoisted.saveHiitSessionMock).not.toHaveBeenCalled();
  });

  it('saveHiitSessionModal guarda una nueva sesion HIIT', async () => {
    openHiitModal();
    (document.getElementById('hName') as HTMLInputElement).value = 'Tabata';
    (document.getElementById('hex-name-0') as HTMLInputElement).value = 'Burpees';
    (document.getElementById('hex-dur-0') as HTMLInputElement).value = '30';

    await saveHiitSessionModal();

    expect(hoisted.saveHiitSessionMock).toHaveBeenCalledWith(
      '2026-04-09',
      expect.objectContaining({
        name: 'Tabata',
        exercises: [expect.objectContaining({ name: 'Burpees', duration: 30 })],
      }),
      null
    );
    expect((globalThis as any).closeM).toHaveBeenCalledWith('hiitMod');
  });

  it('permite editar una sesion existente', async () => {
    hoisted.setHiitData({
      '2026-04-09': [
        {
          id: 'sess-1',
          date: '2026-04-09',
          name: 'EMOM',
          rounds: 6,
          duration: '18 min',
          rpe: 8,
          exercises: [{ name: 'Jump Squat', duration: 40, reps: '15' }],
        },
      ],
    });

    editHiitSession('sess-1');
    expect(document.getElementById('hiitModTtl')?.textContent).toContain('Editar');
    expect((document.getElementById('hName') as HTMLInputElement).value).toBe('EMOM');

    (document.getElementById('hName') as HTMLInputElement).value = 'EMOM Pro';
    await saveHiitSessionModal();

    expect(hoisted.saveHiitSessionMock).toHaveBeenLastCalledWith(
      '2026-04-09',
      expect.objectContaining({ name: 'EMOM Pro' }),
      'sess-1'
    );
  });

  it('elimina una sesion HIIT', async () => {
    hoisted.setHiitData({
      '2026-04-09': [
        { id: 'sess-del', date: '2026-04-09', name: 'Sprint', exercises: [{ name: 'Sprint' }] },
      ],
    });

    await deleteHiitSession('sess-del');
    expect(hoisted.deleteHiitSessionMock).toHaveBeenCalledWith('sess-del');
    expect(document.getElementById('hiitList')?.innerHTML).toContain('No hay sesiones HIIT');
  });

  it('hiitChangeDay cambia fecha y recarga el mes', async () => {
    await hiitChangeDay(1);

    expect(hoisted.loadHiitMonthMock).toHaveBeenCalledWith(2026, 3);
    expect((globalThis as any).hiitDate).toBeInstanceOf(Date);
    expect((globalThis as any).hiitDate.getDate()).toBe(10);
  });

  it('temporizador HIIT inicia, pausa y resetea', () => {
    renderHiit();

    adjustHiitTimer('work', 5);
    expect(document.getElementById('htcWork')?.textContent).toBe('45');

    toggleHiitTimer();
    expect(document.getElementById('htcStartBtn')?.textContent).toContain('Pausar');
    expect(document.getElementById('htcPhase')?.textContent).toContain('Trabajo');

    toggleHiitTimer();
    expect(document.getElementById('htcStartBtn')?.textContent).toContain('Reanudar');

    resetHiitTimer();
    expect(document.getElementById('htcNum')?.textContent).toBe('0:00');
    expect(document.getElementById('htcPhase')?.textContent).toBe('Listo');
    expect(document.getElementById('htcStartBtn')?.textContent).toContain('Iniciar');
  });

  it('temporizador HIIT completa una ronda y finaliza', () => {
    vi.useFakeTimers();
    renderHiit();

    (document.getElementById('htcWork') as HTMLElement).textContent = '1';
    (document.getElementById('htcRest') as HTMLElement).textContent = '1';
    (document.getElementById('htcRounds') as HTMLElement).textContent = '1';

    toggleHiitTimer();
    vi.advanceTimersByTime(2000);

    expect(document.getElementById('htcPhase')?.textContent).toBe('Completado');
    expect((globalThis as any).toast).toHaveBeenCalledWith('HIIT completado ⚡');
    vi.useRealTimers();
  });
});
