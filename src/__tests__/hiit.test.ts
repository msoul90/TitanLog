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
import { addHiitEx, openHiitModal, renderHiit, renderHiitProgress, selectRPE, saveHiitSessionModal, editHiitSession, deleteHiitSession, hiitChangeDay, adjustHiitTimer, toggleHiitTimer, resetHiitTimer, initHiit } from '../hiit.js';

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
    resetHiitTimer();
  });

  it('renderHiitProgress muestra estado vacio si no hay sesiones', () => {
    renderHiitProgress();
    expect(document.getElementById('hiitList')?.innerHTML).toContain('No hay sesiones HIIT');
  });

  it('renderHiit blinda ids en acciones inline', async () => {
    hoisted.setHiitData({
      '2026-04-09': [
        { id: `sess' onmouseover='alert(1)`, date: '2026-04-09', name: 'Sprint', exercises: [{ name: 'Sprint' }] },
      ],
    });

    renderHiit();

    const html = document.getElementById('hiitList')?.innerHTML || '';
    expect(html).toContain('data-hiit-action="edit"');
    expect(html).toContain('sess%27%20onmouseover%3D%27alert(1)');
    expect(html).not.toContain('onclick=');
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

  it('initHiit sincroniza fecha global y renderiza cabecera con fecha no-hoy', () => {
    const nonToday = new Date(2099, 0, 15);
    (globalThis as any).hiitDate = nonToday;

    initHiit();

    const expectedLabel = `${nonToday.getDate()}/${nonToday.getMonth() + 1}/${nonToday.getFullYear()}`;
    expect(document.getElementById('hiitLabel')?.textContent).toContain(expectedLabel);
    expect(document.getElementById('hiitSub')?.textContent).toContain(`${nonToday.getDate()} de`);
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

  it('saveHiitSessionModal valida que exista al menos un ejercicio', async () => {
    openHiitModal();
    (document.getElementById('hName') as HTMLInputElement).value = 'Tabata';

    await saveHiitSessionModal();

    expect((globalThis as any).toast).toHaveBeenCalledWith('Agrega al menos un ejercicio');
    expect(hoisted.saveHiitSessionMock).not.toHaveBeenCalled();
  });

  it('saveHiitSessionModal ignora ejercicios vacios y duraciones invalidas', async () => {
    openHiitModal();
    (document.getElementById('hName') as HTMLInputElement).value = 'Circuito';
    (document.getElementById('hex-name-0') as HTMLInputElement).value = '   ';
    addHiitEx({ name: 'Remo' });
    (document.getElementById('hex-dur-1') as HTMLInputElement).value = 'abc';
    (document.getElementById('hex-reps-1') as HTMLInputElement).value = '12';

    await saveHiitSessionModal();

    expect(hoisted.saveHiitSessionMock).toHaveBeenCalledWith(
      '2026-04-09',
      expect.objectContaining({
        exercises: [expect.objectContaining({ name: 'Remo', duration: undefined, reps: '12' })],
      }),
      null
    );
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

  it('muestra toast cuando intenta editar una sesion inexistente', () => {
    editHiitSession('missing');

    expect((globalThis as any).toast).toHaveBeenCalledWith('No se encontró la sesión HIIT');
  });

  it('saveHiitSessionModal muestra error si guardar devuelve null', async () => {
    hoisted.saveHiitSessionMock.mockResolvedValueOnce(null);
    openHiitModal();
    (document.getElementById('hName') as HTMLInputElement).value = 'Tabata';
    (document.getElementById('hex-name-0') as HTMLInputElement).value = 'Burpees';

    await saveHiitSessionModal();

    expect((globalThis as any).toast).toHaveBeenCalledWith('Error guardando sesión HIIT. Intenta de nuevo.');
    expect((globalThis as any).closeM).not.toHaveBeenCalledWith('hiitMod');
  });

  it('saveHiitSessionModal maneja excepciones inesperadas', async () => {
    hoisted.saveHiitSessionMock.mockRejectedValueOnce(new Error('save failed'));
    openHiitModal();
    (document.getElementById('hName') as HTMLInputElement).value = 'Tabata';
    (document.getElementById('hex-name-0') as HTMLInputElement).value = 'Burpees';

    await saveHiitSessionModal();

    expect((globalThis as any).toast).toHaveBeenCalledWith('Error guardando sesión HIIT. Intenta de nuevo.');
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

  it('deleteHiitSession corta si el usuario cancela', async () => {
    (globalThis as any).confirm = vi.fn(() => false);
    hoisted.deleteHiitSessionMock.mockClear();

    await deleteHiitSession('sess-del');

    expect(hoisted.deleteHiitSessionMock).not.toHaveBeenCalled();
  });

  it('deleteHiitSession maneja errores del borrado', async () => {
    hoisted.deleteHiitSessionMock.mockRejectedValueOnce(new Error('delete failed'));

    await deleteHiitSession('sess-del');

    expect((globalThis as any).toast).toHaveBeenCalledWith('Error eliminando sesión HIIT. Intenta de nuevo.');
  });

  it('hiitChangeDay cambia fecha y recarga el mes', async () => {
    await hiitChangeDay(1);

    expect(hoisted.loadHiitMonthMock).toHaveBeenCalledWith(2026, 3);
    expect((globalThis as any).hiitDate).toBeInstanceOf(Date);
    expect((globalThis as any).hiitDate.getDate()).toBe(10);
  });

  it('renderHiitProgress ordena por created_at y contempla fechas invalidas', () => {
    hoisted.setHiitData({
      '2026-04-09': [
        {
          id: 'older',
          date: '2026-04-09',
          name: 'A',
          created_at: '2026-04-09T10:00:00.000Z',
          exercises: [{ name: 'Remo' }],
        },
        {
          id: 'invalid',
          date: '2026-04-09',
          name: 'B',
          created_at: 'not-a-date',
          exercises: [{ name: 'Burpees' }],
        },
        {
          id: 'newer',
          date: '2026-04-09',
          name: 'C',
          created_at: '2026-04-09T11:00:00.000Z',
          exercises: [{ name: 'Sprint' }],
        },
      ],
    });

    renderHiitProgress();

    const html = document.getElementById('hiitList')?.innerHTML || '';
    expect(html.indexOf('C')).toBeLessThan(html.indexOf('A'));
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

  it('adjustHiitTimer respeta limites y bloquea cambios mientras corre', () => {
    renderHiit();

    adjustHiitTimer('work', -100);
    adjustHiitTimer('rest', 1000);
    adjustHiitTimer('rounds', -100);

    expect(document.getElementById('htcWork')?.textContent).toBe('5');
    expect(document.getElementById('htcRest')?.textContent).toBe('600');
    expect(document.getElementById('htcRounds')?.textContent).toBe('1');

    toggleHiitTimer();
    adjustHiitTimer('work', 5);

    expect((globalThis as any).toast).toHaveBeenCalledWith('Pausa el temporizador para ajustar valores');
  });

  it('toggleHiitTimer reinicia desde estado completado', () => {
    vi.useFakeTimers();
    renderHiit();

    (document.getElementById('htcWork') as HTMLElement).textContent = '1';
    (document.getElementById('htcRest') as HTMLElement).textContent = '1';
    (document.getElementById('htcRounds') as HTMLElement).textContent = '1';

    toggleHiitTimer();
    vi.advanceTimersByTime(3000);
    toggleHiitTimer();

    expect(document.getElementById('htcPhase')?.textContent).toContain('Trabajo - ronda 1/1');
    expect(document.getElementById('htcStartBtn')?.textContent).toContain('Pausar');
    vi.useRealTimers();
  });

  it('temporizador HIIT completa una ronda y finaliza', () => {
    vi.useFakeTimers();
    renderHiit();

    (document.getElementById('htcWork') as HTMLElement).textContent = '1';
    (document.getElementById('htcRest') as HTMLElement).textContent = '1';
    (document.getElementById('htcRounds') as HTMLElement).textContent = '1';

    toggleHiitTimer();
    vi.advanceTimersByTime(3000);

    expect(document.getElementById('htcPhase')?.textContent).toBe('Completado');
    expect((globalThis as any).toast).toHaveBeenCalledWith('HIIT completado ⚡');
    vi.useRealTimers();
  });
});
