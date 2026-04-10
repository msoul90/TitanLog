import { PageKey } from './config';
import { getTheme, applyTheme, toggleTheme } from './theme';
import { invalidateCache } from './data';
import { showToast } from './helpers';
import { initAuth, getCurrentUser, signOut } from './auth';
import { initNavigation, applyNavigationState } from './navigation';
import { initPages, loadPage } from './pages';

let currentPage: PageKey = 'resumen';

async function navigateTo(page: PageKey): Promise<void> {
  currentPage = page;
  applyNavigationState(page);
  await loadPage(page);
}

function refreshCurrentPage(): void {
  invalidateCache();
  loadPage(currentPage);
  showToast('Datos actualizados');
}

async function bootstrap(): Promise<void> {
  applyTheme(getTheme());

  initPages({
    getCurrentUser,
    signOut,
  });

  initNavigation({
    onNavigate: (page) => {
      void navigateTo(page);
    },
    onRefresh: refreshCurrentPage,
    onToggleTheme: toggleTheme,
  });

  await initAuth(async () => {
    await navigateTo('resumen');
  });
}

bootstrap();
