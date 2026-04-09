import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db.js', () => ({}));
vi.mock('../app.js', () => ({}));
vi.mock('../gym.js', () => ({}));
vi.mock('../calendar.js', () => ({}));
vi.mock('../progress.js', () => ({}));
vi.mock('../guides.js', () => ({}));
vi.mock('../hiit.js', () => ({}));

describe('main.ts', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toast"></div>
      <div id="acDrop" style="display:block"></div>
      <input id="fName" value="x" />
      <input id="fW" value="10" />
      <input id="fS" value="3" />
      <input id="fR" value="10" />
      <input id="fN" value="" />
      <select id="fU"><option value="lb" selected>lb</option></select>
      <div class="overlay"></div>
    `;

    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();
    (globalThis as any).renderToday = vi.fn();
    (globalThis as any).initLogin = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).gD = vi.fn(() => ({}));
    (globalThis as any).saveGymDay = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).viewDate = new Date(2026, 3, 9);
  });

  it('expone funciones globales al importar main', async () => {
    await import('../main.js');
    expect(typeof (globalThis as any).openAdd).toBe('function');
    expect(typeof (globalThis as any).saveEx).toBe('function');
  });

  it('openAdd limpia campos y abre modal', async () => {
    await import('../main.js');
    (globalThis as any).openAdd();
    expect((document.getElementById('fName') as HTMLInputElement).value).toBe('');
    expect((globalThis as any).openM).toHaveBeenCalledWith('exMod');
  });
});
