import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openGuide, addFromGuide, GUIDES } from '../guides.js';

describe('guides.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as any).toast = vi.fn();
    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();

    document.body.innerHTML = `
      <div id="gTitle"></div><div id="gEmoji"></div><div id="gMuscles"></div>
      <div id="gSteps"></div><div id="gErrors"></div><div id="gTips"></div>
      <div id="gErrSec"></div><div id="gTipSec"></div><div id="gAddTxt"></div>
      <div id="exModTtl"></div><input id="fName" /><input id="fW" /><input id="fS" /><input id="fR" /><input id="fN" />
      <select id="fU"><option value="lb">lb</option><option value="kg">kg</option></select>
    `;
  });

  it('GUIDES contiene ejercicios base', () => {
    expect(Object.keys(GUIDES).length).toBeGreaterThan(0);
  });

  it('openGuide valida nombre vacio', () => {
    openGuide('');
    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('openGuide muestra modal con ejercicio valido', () => {
    openGuide('Sentadilla');
    expect((globalThis as any).openM).toHaveBeenCalledWith('guideMod');
    expect(document.getElementById('gTitle')?.textContent).toContain('Sentadilla');
  });

  it('addFromGuide precarga formulario y abre modal de ejercicio', () => {
    openGuide('Sentadilla');
    addFromGuide();
    vi.runAllTimers();
    expect(document.getElementById('fName') as HTMLInputElement).toHaveProperty('value', 'Sentadilla');
    expect((globalThis as any).openM).toHaveBeenCalledWith('exMod');
  });
});
