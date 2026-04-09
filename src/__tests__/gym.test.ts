import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveBWDayMock, gBWMock } = vi.hoisted(() => ({
  saveBWDayMock: vi.fn(),
  gBWMock: vi.fn(() => ({})),
}));

vi.mock('../app.js', () => ({
  appState: {
    viewDate: new Date(2026, 3, 9),
    bodyWeightUnit: 'lb',
    timerInterval: null,
    timerSeconds: 0,
  },
  gBW: gBWMock,
}));

vi.mock('../db.js', () => ({
  dk: () => '2026-04-09',
  saveBWDay: saveBWDayMock,
}));

import {
  fatCategory,
  mmcCategory,
  setBWU,
  validateAndParseBodyWeightData,
  saveBW,
  updT,
  updateDerived,
  openBW,
  startT,
  resetT,
  formatDateForModal,
  DOM_IDS,
} from '../gym.js';
import { appState } from '../app.js';

describe('gym.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    (globalThis as any).toast = vi.fn();
    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();
    (globalThis as any).renderToday = vi.fn();

    document.body.innerHTML = `
      <input id="bwIn" value="80" />
      <input id="fatIn" value="20" />
      <input id="mmcIn" value="40" />
      <div id="fatHint" class="pct-hint"></div>
      <div id="mmcHint" class="pct-hint"></div>
      <div id="bcDerived" style="display:none"></div>
      <div id="bcDateTag"></div>
      <div id="bcdFatKg"></div>
      <div id="bcdMMCKg"></div>
      <div id="bcdLeanKg"></div>
      <div id="bUlb" class="bw-ub"></div>
      <div id="bUkg" class="bw-ub"></div>
      <div id="timerNum"></div>
      <div id="bwMod"></div>
      <button class="t-btn"></button>
      <button class="t-btn"></button>
    `;

    gBWMock.mockReset();
    gBWMock.mockReturnValue({});
    saveBWDayMock.mockResolvedValue(undefined);
  });

  it('fatCategory y mmcCategory devuelven etiqueta/clase', () => {
    expect(fatCategory(15).cls).toBeDefined();
    expect(mmcCategory(45).lbl.length).toBeGreaterThan(0);
  });

  it('setBWU activa la unidad correcta', () => {
    setBWU('kg');
    expect(document.getElementById('bUkg')?.classList.contains('on')).toBe(true);
    expect(document.getElementById('bUlb')?.classList.contains('on')).toBe(false);
  });

  it('validateAndParseBodyWeightData parsea datos validos', () => {
    const parsed = validateAndParseBodyWeightData();
    expect(parsed?.v).toBe(80);
    expect(parsed?.fat).toBe(20);
    expect(parsed?.mmc).toBe(40);
  });

  it('saveBW guarda y actualiza UI', async () => {
    await saveBW();
    expect(saveBWDayMock).toHaveBeenCalled();
    expect((globalThis as any).closeM).toHaveBeenCalledWith('bwMod');
    expect((globalThis as any).renderToday).toHaveBeenCalled();
  });

  it('updT imprime formato m:ss', () => {
    appState.timerSeconds = 95;
    updT();
    expect(document.getElementById('timerNum')?.textContent).toBe('1:35');
  });

  it('updateDerived muestra hints y valores derivados', () => {
    setBWU('kg');
    updateDerived();

    expect(document.getElementById('fatHint')?.textContent?.length).toBeGreaterThan(0);
    expect(document.getElementById('mmcHint')?.textContent?.length).toBeGreaterThan(0);
    expect((document.getElementById('bcDerived') as HTMLElement).style.display).toBe('flex');
    expect(document.getElementById('bcdFatKg')?.textContent).toContain('kg');
  });

  it('openBW carga datos del dia y abre modal', () => {
    gBWMock.mockReturnValue({
      '2026-04-09': { v: 81, u: 'kg', fat: 18, mmc: 36, ts: 1 },
    });

    openBW();
    vi.advanceTimersByTime(350);

    expect((document.getElementById('bwIn') as HTMLInputElement).value).toBe('81');
    expect(document.getElementById('bcDateTag')?.textContent).toContain('de');
    expect((globalThis as any).openM).toHaveBeenCalledWith('bwMod');
  });

  it('validateAndParseBodyWeightData falla con peso invalido y muestra toast', () => {
    (document.getElementById('bwIn') as HTMLInputElement).value = '10';

    const parsed = validateAndParseBodyWeightData();

    expect(parsed).toBeNull();
    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('validateAndParseBodyWeightData falla con porcentajes fuera de rango', () => {
    (document.getElementById('bwIn') as HTMLInputElement).value = '80';
    (document.getElementById('fatIn') as HTMLInputElement).value = '90';

    const parsedFat = validateAndParseBodyWeightData();
    expect(parsedFat).toBeNull();

    (document.getElementById('fatIn') as HTMLInputElement).value = '20';
    (document.getElementById('mmcIn') as HTMLInputElement).value = '90';

    const parsedMmc = validateAndParseBodyWeightData();
    expect(parsedMmc).toBeNull();
  });

  it('startT inicia cuenta regresiva y resetT limpia estado', () => {
    const btn = document.querySelector('.t-btn') as HTMLElement;

    startT(2, btn);
    expect(btn.classList.contains('on')).toBe(true);

    vi.advanceTimersByTime(2100);
    expect(document.getElementById(DOM_IDS.TIMER_NUM)?.textContent).toBe('¡Listo!');

    resetT();
    expect(document.getElementById(DOM_IDS.TIMER_NUM)?.textContent).toBe('0:00');
  });

  it('formatDateForModal devuelve fecha legible', () => {
    const text = formatDateForModal(new Date(2026, 3, 9));
    expect(text).toContain('📅');
  });

  it('setBWU ignora unidad invalida', () => {
    appState.bodyWeightUnit = 'lb';
    setBWU('lb');
    setBWU('kg');
    expect(appState.bodyWeightUnit).toBe('kg');

    setBWU('xx' as any);
    expect(appState.bodyWeightUnit).toBe('kg');
  });

  it('validateAndParseBodyWeightData falla si faltan elementos', () => {
    document.getElementById('bwIn')?.remove();

    const parsed = validateAndParseBodyWeightData();
    expect(parsed).toBeNull();
    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('saveBW maneja excepcion de guardado', async () => {
    saveBWDayMock.mockRejectedValueOnce(new Error('db fail'));

    await saveBW();

    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('startT completa y reinicia display tras timeout final', () => {
    const btn = document.querySelector('.t-btn') as HTMLElement;
    startT(1, btn);

    vi.advanceTimersByTime(1200);
    expect(document.getElementById('timerNum')?.textContent).toBe('¡Listo!');

    vi.advanceTimersByTime(3000);
    expect(document.getElementById('timerNum')?.textContent).toBe('0:00');
  });
});
