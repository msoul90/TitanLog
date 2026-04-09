import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../app.js', () => ({
  escHtml: (s: string) => s,
  gD: vi.fn(() => ({})),
  sD: vi.fn(),
  gBW: vi.fn(() => ({})),
  sBW: vi.fn(),
  renderToday: vi.fn(),
  isPR: vi.fn(() => false),
}));

vi.mock('../db.js', () => ({
  dk: (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  getCurrentProfile: () => ({ name: 'Mario' }),
}));

import { impData, handleImp, expJSON } from '../progress.js';

describe('progress.ts', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="impFile" type="file" />
      <div id="toast"></div>
    `;
    URL.createObjectURL = vi.fn(() => 'blob:test') as any;
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
});
