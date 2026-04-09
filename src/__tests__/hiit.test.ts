import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveHiitSessionMock } = vi.hoisted(() => ({
  saveHiitSessionMock: vi.fn(),
}));

vi.mock('../db.js', () => ({
  dk: (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  saveHiitSession: saveHiitSessionMock,
}));

import { openHiitModal, renderHiitProgress, selectRPE, saveHiitSessionModal } from '../hiit.js';

describe('hiit.ts', () => {
  beforeEach(() => {
    (globalThis as any).escHtml = (s: string) => s;
    (globalThis as any).toast = vi.fn();
    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();

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
    `;

    saveHiitSessionMock.mockResolvedValue('abc123');
  });

  it('renderHiitProgress muestra estado vacio si no hay sesiones', () => {
    renderHiitProgress();
    expect(document.getElementById('hiitList')?.innerHTML).toContain('No hay sesiones HIIT');
  });

  it('openHiitModal abre modal y prepara titulo', () => {
    openHiitModal();
    expect(document.getElementById('hiitModTtl')?.textContent).toContain('Nueva');
    expect((globalThis as any).openM).toHaveBeenCalledWith('hiitMod');
  });

  it('selectRPE marca seleccion en UI', () => {
    openHiitModal();
    selectRPE(7);
    expect(document.getElementById('rpeRow')?.innerHTML).toContain('sel');
  });

  it('saveHiitSessionModal valida nombre antes de guardar', async () => {
    await saveHiitSessionModal();
    expect((globalThis as any).toast).toHaveBeenCalled();
    expect(saveHiitSessionMock).not.toHaveBeenCalled();
  });
});
