import { PAGE_TITLES, PageKey } from './config';

function openSidebar(): void {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('open');
}

function closeSidebar(): void {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}

export function applyNavigationState(page: PageKey): void {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', (n as HTMLElement).dataset.page === page);
  });

  const title = document.getElementById('topbar-title');
  if (title) title.textContent = PAGE_TITLES[page] || page;

  const search = document.getElementById('topbar-search') as HTMLInputElement | null;
  if (search) search.style.display = page === 'miembros' ? '' : 'none';

  closeSidebar();
}

export function initNavigation(options: {
  onNavigate: (page: PageKey) => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
}): void {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = (btn as HTMLElement).dataset.page;
      if (page && page in PAGE_TITLES) options.onNavigate(page as PageKey);
    });
  });

  document.getElementById('hamburger')?.addEventListener('click', openSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
  document.getElementById('theme-toggle')?.addEventListener('click', options.onToggleTheme);
  document.getElementById('refresh-btn')?.addEventListener('click', options.onRefresh);
}
