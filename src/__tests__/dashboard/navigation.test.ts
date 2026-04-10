import { describe, expect, it, vi } from 'vitest';

import { applyNavigationState, initNavigation } from '../../dashboard/navigation';

describe('dashboard navigation', () => {
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
      <button class="nav-item" data-page="resumen"></button>
      <button class="nav-item" data-page="miembros"></button>
      <button class="nav-item" data-page="admin"></button>
    `;
  }

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
});
