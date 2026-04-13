import { describe, expect, it, vi } from 'vitest';

import { applyNavigationState, initNavigation } from '../../dashboard/navigation';
import type { PageKey } from '../../dashboard/config';

function mountDom() {
  document.body.innerHTML = `
    <div id="sidebar" class="open"></div>
    <div id="sidebar-overlay" class="open"></div>
    <button id="hamburger"></button>
    <button id="theme-toggle"></button>
    <button id="refresh-btn"></button>
    <h1 id="topbar-title"></h1>
    <input id="topbar-search" />
    <div id="page-resumen" class="page"></div>
    <div id="page-miembros" class="page"></div>
    <div id="page-config" class="page"></div>
    <button class="nav-item" data-page="resumen"></button>
    <button class="nav-item" data-page="miembros"></button>
    <button class="nav-item" data-page="admin"></button>
    <button class="nav-item" data-page="config"></button>
  `;
}

describe('dashboard navigation', () => {
  it('applyNavigationState activa pagina, nav y titulo', () => {
    mountDom();
    applyNavigationState('miembros');

    expect(document.getElementById('page-miembros')?.classList.contains('active')).toBe(true);
    expect(document.getElementById('topbar-title')?.textContent).toContain('Miembros');
    expect((document.getElementById('topbar-search') as HTMLInputElement).style.display).toBe('');
    expect(document.getElementById('sidebar')?.classList.contains('open')).toBe(false);
  });

  it('initNavigation conecta callbacks de botones', () => {
    mountDom();
    const onNavigate = vi.fn();
    const onRefresh = vi.fn();
    const onToggleTheme = vi.fn();

    initNavigation({ onNavigate, onRefresh, onToggleTheme });

    (document.querySelector('.nav-item[data-page="admin"]') as HTMLButtonElement).click();
    (document.getElementById('hamburger') as HTMLButtonElement).click();
    (document.getElementById('sidebar-overlay') as HTMLButtonElement).click();
    (document.getElementById('theme-toggle') as HTMLButtonElement).click();
    (document.getElementById('refresh-btn') as HTMLButtonElement).click();

    expect(onNavigate).toHaveBeenCalledWith('admin');
    expect(onToggleTheme).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
  });

  it('applyNavigationState muestra titulo de configuracion y oculta busqueda', () => {
    mountDom();
    applyNavigationState('config');

    expect(document.getElementById('page-config')?.classList.contains('active')).toBe(true);
    expect(document.getElementById('topbar-title')?.textContent).toContain('Configuracion');
    expect((document.getElementById('topbar-search') as HTMLInputElement).style.display).toBe('none');
  });

  it('nav-item con pagina no registrada en PAGE_TITLES no llama onNavigate', () => {
    mountDom();
    const onNavigate = vi.fn();
    initNavigation({ onNavigate, onRefresh: vi.fn(), onToggleTheme: vi.fn() });

    // Add a nav-item with a page key that is not in PAGE_TITLES
    const unknownBtn = document.createElement('button');
    unknownBtn.className = 'nav-item';
    unknownBtn.dataset.page = 'pagina-desconocida';
    document.body.appendChild(unknownBtn);

    // Re-init to register the new button
    initNavigation({ onNavigate, onRefresh: vi.fn(), onToggleTheme: vi.fn() });
    unknownBtn.click();

    expect(onNavigate).not.toHaveBeenCalledWith('pagina-desconocida');
  });

  it('applyNavigationState usa fallback de titulo cuando page no existe en PAGE_TITLES', () => {
    mountDom();

    applyNavigationState('pagina-desconocida' as PageKey);

    expect(document.getElementById('topbar-title')?.textContent).toBe('pagina-desconocida');
  });

  it('applyNavigationState no falla sin elementos opcionales de topbar', () => {
    mountDom();
    document.getElementById('topbar-title')?.remove();
    document.getElementById('topbar-search')?.remove();

    expect(() => applyNavigationState('resumen')).not.toThrow();
    expect(document.getElementById('page-resumen')?.classList.contains('active')).toBe(true);
  });
});
