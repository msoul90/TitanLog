import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveBWDayMock } = vi.hoisted(() => ({
  saveBWDayMock: vi.fn(),
}));

vi.mock('../app.js', () => ({
  appState: {
    viewDate: new Date(2026, 3, 9),
    bodyWeightUnit: 'lb',
    timerInterval: null,
    timerSeconds: 0,
  },
  gBW: vi.fn(() => ({})),
}));

vi.mock('../db.js', () => ({
  dk: () => '2026-04-09',
  saveBWDay: saveBWDayMock,
}));

import { fatCategory, mmcCategory, setBWU, validateAndParseBodyWeightData, saveBW, updT } from '../gym.js';
import { appState } from '../app.js';

describe('gym.ts', () => {
  beforeEach(() => {
    (globalThis as any).toast = vi.fn();
    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();
    (globalThis as any).renderToday = vi.fn();

    document.body.innerHTML = `
      <input id="bwIn" value="80" />
      <input id="fatIn" value="20" />
      <input id="mmcIn" value="40" />
      <div id="bUlb" class="bw-ub"></div>
      <div id="bUkg" class="bw-ub"></div>
      <div id="timerNum"></div>
      <div id="bwMod"></div>
    `;

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
});
