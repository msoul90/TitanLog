// ============================================================
// calendar.ts — Pantalla de Calendario
// ============================================================

import { Exercise } from './types.js';
import { gD, MONTHS, DAYS_OF_WEEK as DAYS, appState, isPR, escHtml } from './app.js';
import { dk, loadGymMonth } from './db.js';

// Alias for backward compatibility
const MOS = MONTHS;

// ── CALENDAR FUNCTIONS ──

/**
 * Changes the calendar month and reloads data
 * @param d - Number of months to add/subtract
 */
async function changeMonth(d: number): Promise<void> {
  appState.calendarDate = new Date(appState.calendarDate.getFullYear(), appState.calendarDate.getMonth() + d, 1);
  await loadGymMonth(appState.calendarDate.getFullYear(), appState.calendarDate.getMonth());
  renderCal();
}

/**
 * Renders the calendar grid for the current month
 */
function renderCal(): void { // NOSONAR
  const y = appState.calendarDate.getFullYear();
  const m = appState.calendarDate.getMonth();

  // Update month/year header
  const monthHeader = document.getElementById('calMo');
  if (monthHeader) {
    monthHeader.textContent = MOS[m]!.charAt(0).toUpperCase() + MOS[m]!.slice(1) + ' ' + y;
  }

  // Get data and current date key
  const data = gD();
  const tdKey = dk(new Date());

  // Calculate first and last day of month
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  // Get calendar grid element
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  // Clear existing content
  grid.innerHTML = '';

  // Add day headers (L, M, X, J, V, S, D)
  ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((d: string) => {
    const el = document.createElement('div');
    el.className = 'cl';
    el.textContent = d;
    grid.appendChild(el);
  });

  // Calculate starting day of week (adjust Sunday from 0 to 6, Monday = 0)
  const startDow = (first.getDay() + 6) % 7;

  // Add empty cells for days before the first day of month
  for (let i = 0; i < startDow; i++) {
    const el = document.createElement('div');
    el.className = 'cd oth';
    grid.appendChild(el);
  }

  // Add cells for each day of the month
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(y, m, d);
    const key = dk(date);

    // Check if day has exercises and if any are personal records
    const hasData = data[key] && data[key].length > 0;
    const hasPR = hasData && data[key]!.some((ex: Exercise) => isPR(ex.name, key, ex.weight));

    // Create day element
    const el = document.createElement('div');
    el.className = 'cd' +
      (key === tdKey ? ' td' : '') +
      (hasData ? ' hd' : '');
    el.textContent = d.toString();

    // Add PR dot if applicable
    if (hasData) {
      const dot = document.createElement('div');
      dot.className = 'cd-dot' + (hasPR ? ' pr' : '');
      el.appendChild(dot);
    }

    // Add click handler
    el.addEventListener('click', () => showCalDet(key, data[key]));

    grid.appendChild(el);
  }

  // Hide calendar details
  const calDet = document.getElementById('calDet');
  if (calDet) {
    calDet.style.display = 'none';
  }
}

/**
 * Shows detailed view for a specific calendar day
 * @param key - Date key in format 'YYYY-MM-DD'
 * @param exs - Array of exercises for the day
 */
function showCalDet(key: string, exs: Exercise[] | undefined): void {
  // Remove selection from all calendar days
  document.querySelectorAll('.cd').forEach((el: Element) => {
    el.classList.remove('sel');
  });

  // Get day number from key
  const day = Number.parseInt(key.split('-')[2]!, 10);

  // Add selection to matching day elements
  document.querySelectorAll('.cd.hd, .cd.td').forEach((el: Element) => {
    if (Number.parseInt((el as HTMLElement).textContent || '0', 10) === day) {
      el.classList.add('sel');
    }
  });

  // Get calendar details element
  const det = document.getElementById('calDet');
  if (!det) return;

  // Hide details if no exercises
  if (!exs?.length) {
    det.style.display = 'none';
    return;
  }

  // Create date object and title
  const d = new Date(key);
  const ttl = DAYS[d.getDay()]!.charAt(0).toUpperCase() + DAYS[d.getDay()]!.slice(1) +
    ', ' + day + ' de ' + MOS[d.getMonth()];

  // Build HTML content
  const content = `<div class="cal-det-ttl">${ttl}</div>` +
    exs.map((ex: Exercise) => {
      const pr = isPR(ex.name, key, ex.weight);
      const stats = [
        ex.weight ? `${escHtml(String(ex.weight))} ${escHtml(ex.unit || 'lb')}` : null,
        ex.reps ? `${escHtml(ex.reps)} reps` : null,
        ex.sets ? `${escHtml(ex.sets.toString())} series` : null
      ].filter(Boolean).join(' · ');

      return `<div class="cal-row"><div class="cr-name">${escHtml(ex.name)}${pr ? '<span class="cr-pr">🏆 PR</span>' : ''}</div><div class="cr-stats">${stats}</div></div>`;
    }).join('');

  det.innerHTML = content;
  det.style.display = 'block';
}

// ── EXPORTS ──

export {
  changeMonth,
  renderCal,
  showCalDet
};

// Make functions globally available for backward compatibility
(globalThis as any).changeMonth = changeMonth;
(globalThis as any).renderCal = renderCal;
(globalThis as any).showCalDet = showCalDet;
