import { beforeEach, describe, expect, it, vi } from 'vitest';

const { gDMock, sDMock, gBWMock, sBWMock, renderTodayMock, isPRMock } = vi.hoisted(() => ({
  gDMock: vi.fn(() => ({})),
  sDMock: vi.fn(),
  gBWMock: vi.fn(() => ({})),
  sBWMock: vi.fn(),
  renderTodayMock: vi.fn(),
  isPRMock: vi.fn(() => false),
}));

vi.mock('../app.js', () => ({
  escHtml: (s: string) => s,
  gD: gDMock,
  sD: sDMock,
  gBW: gBWMock,
  sBW: sBWMock,
  renderToday: renderTodayMock,
  isPR: isPRMock,
}));

vi.mock('../db.js', () => ({
  dk: (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  getCurrentProfile: () => ({ name: 'Mario' }),
}));

import { impData, handleImp, expJSON, expCSV, loadDemo, renderProg } from '../progress.js';

describe('progress.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-09T10:00:00Z'));

    document.body.innerHTML = `
      <div id="sDay"></div>
      <div id="sEx"></div>
      <div id="sPR"></div>
      <div id="sStr"></div>
      <div id="sWStr"></div>
      <div id="weekDots"></div>
      <div id="bcSection"></div>
      <div id="progList"></div>
      <input id="impFile" type="file" />
      <div id="toast"></div>
    `;
    URL.createObjectURL = vi.fn(() => 'blob:test') as any;
    gDMock.mockReset();
    sDMock.mockReset();
    gBWMock.mockReset();
    sBWMock.mockReset();
    renderTodayMock.mockReset();
    isPRMock.mockReset();
    isPRMock.mockReturnValue(false);
    (globalThis as any).confirm = vi.fn(() => true);
  });

  it('impData dispara click del input de importacion', () => {
    const input = document.getElementById('impFile') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    impData();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handleImp sale si no hay archivo', () => {
    const event = { target: { files: [] } } as unknown as Event;
    expect(() => handleImp(event)).not.toThrow();
  });

  it('expJSON crea descarga', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    expJSON();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('expJSON maneja errores de exportacion', () => {
    const original = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => {
      throw new Error('blob fail');
    }) as any;

    expect(() => expJSON()).not.toThrow();
    expect(document.getElementById('toast')?.textContent).toContain('Error al exportar JSON');

    URL.createObjectURL = original;
  });

  it('renderProg completa estadisticas y progreso', () => {
    gDMock.mockReturnValue({
      '2026-04-08': [{ name: 'Press', weight: '60', unit: 'kg', sets: '3', reps: '8', ts: 1 }],
      '2026-04-09': [{ name: 'Press', weight: '62', unit: 'kg', sets: '3', reps: '8', ts: 2 }],
    });
    gBWMock.mockReturnValue({
      '2026-04-08': { v: 80, u: 'kg', fat: 20, mmc: 35 },
      '2026-04-09': { v: 79.5, u: 'kg', fat: 19.8, mmc: 35.2 },
    });

    renderProg();

    expect(document.getElementById('sDay')?.textContent).toBe('2');
    expect(document.getElementById('sEx')?.textContent).toBe('2');
    expect(document.getElementById('bcSection')?.innerHTML).toContain('Historial de peso');
    expect(document.getElementById('progList')?.innerHTML).toContain('Press');
  });

  it('expCSV crea descarga de CSV', () => {
    gDMock.mockReturnValue({
      '2026-04-09': [{ name: 'Sentadilla', weight: '80', unit: 'kg', sets: '3', reps: '10', notes: 'ok', ts: 1 }],
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    expCSV();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('expCSV neutraliza formulas en celdas', async () => {
    gDMock.mockReturnValue({
      '2026-04-09': [{ name: '=cmd', weight: '+10', unit: 'kg', sets: '3', reps: '@calc', notes: '-boom', ts: 1 }],
    });

    let exportedBlob: unknown = null;
    const original = URL.createObjectURL;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      exportedBlob = blob;
      return 'blob:test';
    }) as any;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    expCSV();

    if (!(exportedBlob instanceof Blob)) {
      throw new TypeError('Expected CSV blob to be created');
    }
    const text = await exportedBlob.text();
    expect(text).toContain('"\'=cmd"');
    expect(text).toContain('"\'+10"');
    expect(text).toContain('"\'@calc"');
    expect(text).toContain('"\'-boom"');

    URL.createObjectURL = original;
  });

  it('expCSV maneja errores de exportacion', () => {
    const original = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => {
      throw new Error('csv fail');
    }) as any;

    expect(() => expCSV()).not.toThrow();
    expect(document.getElementById('toast')?.textContent).toContain('Error al exportar CSV');

    URL.createObjectURL = original;
  });

  it('handleImp importa y fusiona datos sin duplicar por ts', async () => {
    gDMock.mockReturnValue({
      '2026-04-09': [{ name: 'A', reps: '10', ts: 1 }],
    });
    gBWMock.mockReturnValue({});

    const event = {
      target: {
        files: [{ text: () => Promise.resolve(JSON.stringify({ data: { '2026-04-09': [{ name: 'A', reps: '10', ts: 1 }, { name: 'B', reps: '12', ts: 2 }] }, bw: { '2026-04-09': { v: 80, u: 'kg' } } })) }],
        value: 'x',
      },
    } as unknown as Event;

    handleImp(event);
    await Promise.resolve();
    await Promise.resolve();

    expect(sDMock).toHaveBeenCalledTimes(1);
    const merged = sDMock.mock.calls[0]?.[0];
    expect(merged['2026-04-09']).toHaveLength(2);
    expect(sBWMock).toHaveBeenCalledTimes(1);
    expect(renderTodayMock).toHaveBeenCalled();
    expect((event.target as HTMLInputElement).value).toBe('');
  });

  it('handleImp maneja JSON invalido', async () => {
    const event = {
      target: {
        files: [{ text: () => Promise.resolve('{ no-json') }],
        value: 'x',
      },
    } as unknown as Event;

    handleImp(event);
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('toast')?.textContent).toContain('archivo inválido');
    expect((event.target as HTMLInputElement).value).toBe('');
  });

  it('handleImp maneja error de lectura de archivo', async () => {
    const event = {
      target: {
        files: [{ text: () => Promise.reject(new Error('read fail')) }],
        value: 'x',
      },
    } as unknown as Event;

    handleImp(event);
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('toast')?.textContent).toContain('Error leyendo archivo');
    expect((event.target as HTMLInputElement).value).toBe('');
  });

  it('loadDemo guarda rutina demo cuando se confirma', () => {
    gDMock.mockReturnValue({});

    loadDemo();

    expect(sDMock).toHaveBeenCalledTimes(1);
    const saved = sDMock.mock.calls[0]?.[0];
    expect(Object.keys(saved).length).toBe(2);
    expect(renderTodayMock).toHaveBeenCalled();
  });

  it('loadDemo no hace cambios si el usuario cancela', () => {
    (globalThis as any).confirm = vi.fn(() => false);

    loadDemo();

    expect(sDMock).not.toHaveBeenCalled();
  });

  it('renderProg muestra vacios cuando no hay datos', () => {
    gDMock.mockReturnValue({});
    gBWMock.mockReturnValue({});

    renderProg();

    expect(document.getElementById('bcSection')?.innerHTML).toContain('Registra tu composición corporal');
    expect(document.getElementById('progList')?.innerHTML).toContain('Registra ejercicios con peso');
    expect(document.getElementById('weekDots')?.innerHTML).toContain('week-dot');
  });
});
