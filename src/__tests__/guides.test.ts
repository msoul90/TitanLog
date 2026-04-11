import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  openGuide,
  addFromGuide,
  GUIDES,
  renderGuidesCatalog,
  filterGuidesCatalog,
  renderStretchCatalog,
  filterStretchCatalog,
  filterStretchCategory,
  openStretch,
  STRETCH_GUIDES,
} from '../guides.js';

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
      <div id="cfgGuideList"></div><input id="cfgGuideSearch" />
      <div id="cfgStretchList"></div><input id="cfgStretchSearch" />
      <select id="cfgStretchFilter"><option value="all">all</option><option value="pre">pre</option><option value="post">post</option></select>
      <div id="stTitle"></div><div id="stEmoji"></div><div id="stMeta"></div>
      <div id="stSteps"></div><div id="stTips"></div><div id="stTipSec"></div>
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

  it('addFromGuide valida cuando no hay ejercicio seleccionado', async () => {
    vi.resetModules();
    const fresh = await import('../guides.js');

    fresh.addFromGuide();
    expect((globalThis as any).toast).toHaveBeenCalled();
  });

  it('openGuide con nombre desconocido muestra estado sin guia', () => {
    openGuide('Ejercicio Inventado');
    expect(document.getElementById('gMuscles')?.textContent).toContain('Ejercicio personalizado');
    expect(document.getElementById('gErrSec')?.getAttribute('style')).toContain('none');
    expect((globalThis as any).openM).toHaveBeenCalledWith('guideMod');
  });

  it('renderGuidesCatalog y filterGuidesCatalog filtran resultados', () => {
    renderGuidesCatalog();
    expect(document.getElementById('cfgGuideList')?.innerHTML).toContain('cfg-guide-row');

    filterGuidesCatalog('sentadilla');
    expect(document.getElementById('cfgGuideList')?.innerHTML.toLowerCase()).toContain('sentadilla');

    renderGuidesCatalog('zzzz-no-existe');
    expect(document.getElementById('cfgGuideList')?.innerHTML).toContain('No se encontraron guías');
  });

  it('renderStretchCatalog renderiza y filtra por texto/categoria', () => {
    expect(Object.keys(STRETCH_GUIDES).length).toBeGreaterThan(0);

    renderStretchCatalog();
    expect(document.getElementById('cfgStretchList')?.innerHTML).toContain('stretch-badge');

    renderStretchCatalog('cuadriceps', 'all');
    expect(document.getElementById('cfgStretchList')?.innerHTML.toLowerCase()).toContain('cuádriceps');

    renderStretchCatalog('zzzz-no-existe', 'all');
    expect(document.getElementById('cfgStretchList')?.innerHTML).toContain('No se encontraron estiramientos');
  });

  it('filterStretchCatalog usa categoria seleccionada y filterStretchCategory usa texto', () => {
    const filter = document.getElementById('cfgStretchFilter') as HTMLSelectElement;
    filter.value = 'pre';

    filterStretchCatalog('movilidad');
    expect(document.getElementById('cfgStretchList')?.innerHTML.length).toBeGreaterThan(0);

    const search = document.getElementById('cfgStretchSearch') as HTMLInputElement;
    search.value = 'cadera';
    filterStretchCategory('post');
    expect(document.getElementById('cfgStretchList')?.innerHTML.length).toBeGreaterThan(0);
  });

  it('openStretch valida entrada y abre modal con contenido', () => {
    openStretch('');
    expect((globalThis as any).openM).not.toHaveBeenCalledWith('stretchMod');

    openStretch('Estiramiento de cuádriceps');
    expect(document.getElementById('stTitle')?.textContent).toContain('Estiramiento de cuádriceps');
    expect(document.getElementById('stSteps')?.innerHTML).toContain('guide-step');
    expect((globalThis as any).openM).toHaveBeenCalledWith('stretchMod');
  });

  it('escapa contenido dinamico en catalogo y detalle', () => {
    GUIDES['Ejercicio <img src=x onerror=alert(1)>'] = {
      emoji: '<svg onload=alert(1)>',
      primary: ['Pecho<script>'],
      secondary: ['Triceps<img>'],
      steps: ['Paso <b>1</b>'],
      errors: ['Error <img src=x>'],
      tips: ['Tip <script>alert(1)</script>'],
    } as any;

    renderGuidesCatalog('Ejercicio <img');
    expect(document.getElementById('cfgGuideList')?.innerHTML).not.toContain('<img');
    expect(document.getElementById('cfgGuideList')?.innerHTML).toContain('decodeURIComponent(');

    openGuide('Ejercicio <img src=x onerror=alert(1)>');
    expect(document.getElementById('gSteps')?.innerHTML).toContain('&lt;b&gt;1&lt;/b&gt;');
    expect(document.getElementById('gErrors')?.innerHTML).not.toContain('<img');
    expect(document.getElementById('gTips')?.innerHTML).not.toContain('<script>');

    delete GUIDES['Ejercicio <img src=x onerror=alert(1)>'];
  });

  it('openGuide muestra placeholders cuando la guia viene vacia', () => {
    GUIDES['Ejercicio Vacio'] = {
      emoji: '📘',
      primary: ['Core'],
      secondary: [],
      steps: [],
      errors: [],
      tips: []
    } as any;

    openGuide('Ejercicio Vacio');

    expect(document.getElementById('gSteps')?.textContent).toContain('Sin pasos de ejecución documentados aún');
    expect(document.getElementById('gErrors')?.textContent).toContain('Aún no hay errores comunes registrados');
    expect(document.getElementById('gTips')?.textContent).toContain('Tips pro en preparación');
    expect(document.getElementById('gErrSec')?.getAttribute('style') || '').not.toContain('none');
    expect(document.getElementById('gTipSec')?.getAttribute('style') || '').not.toContain('none');

    delete GUIDES['Ejercicio Vacio'];
  });

  it('openGuide renderiza contenido parcial y placeholders solo donde falta', () => {
    GUIDES['Ejercicio Parcial'] = {
      emoji: '📗',
      primary: ['Pecho'],
      secondary: [],
      steps: ['Paso real'],
      errors: [],
      tips: ['Tip real']
    } as any;

    openGuide('Ejercicio Parcial');

    expect(document.getElementById('gSteps')?.textContent).toContain('Paso real');
    expect(document.getElementById('gErrors')?.textContent).toContain('Aún no hay errores comunes registrados');
    expect(document.getElementById('gTips')?.textContent).toContain('Tip real');

    delete GUIDES['Ejercicio Parcial'];
  });
});
