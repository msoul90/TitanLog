// ============================================================
// calendar.ts — Pantalla de Calendario
// ============================================================

import { Exercise } from './types.js';
import { gD, MONTHS, appState, isPR, escHtml } from './app.js';
import { dk, gHiit, loadGymMonth, loadHiitMonth } from './db.js';

// Alias for backward compatibility
const MOS = MONTHS;
const WEEKDAY_SHORT_MX = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;

function parseDateKeyAsLocalDate(key: string): Date {
  const [yearRaw, monthRaw, dayRaw] = key.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  return new Date(year, month - 1, day);
}

// ── CALENDAR FUNCTIONS ──

/**
 * Changes the calendar month and reloads data
 * @param d - Number of months to add/subtract
 */
async function changeMonth(d: number): Promise<void> {
  appState.calendarDate = new Date(appState.calendarDate.getFullYear(), appState.calendarDate.getMonth() + d, 1);
  await Promise.all([
    loadGymMonth(appState.calendarDate.getFullYear(), appState.calendarDate.getMonth()),
    loadHiitMonth(appState.calendarDate.getFullYear(), appState.calendarDate.getMonth())
  ]);
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
  const hiitData = gHiit();
  const tdKey = dk(new Date());

  // Calculate first and last day of month
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  // Get calendar grid element
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  // Clear existing content
  grid.innerHTML = '';

  // Add day headers (D, L, M, X, J, V, S)
  ['D', 'L', 'M', 'X', 'J', 'V', 'S'].forEach((d: string) => {
    const el = document.createElement('div');
    el.className = 'cl';
    el.textContent = d;
    grid.appendChild(el);
  });

  // Calculate starting day of week (Sunday = 0)
  const startDow = first.getDay();

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
    const gymSessions = data[key] || [];
    const hasGymData = gymSessions.length > 0;
    const hasHiitData = (hiitData[key] || []).length > 0;
    const hasData = hasGymData || hasHiitData;
    const hasPR = hasGymData && gymSessions.some((ex: Exercise) => isPR(ex.name, key, ex.weight));

    // Create day element
    const el = document.createElement('div');
    el.className = 'cd' +
      (key === tdKey ? ' td' : '') +
      (hasData ? ' hd' : '');
    el.dataset.key = key;
    el.textContent = d.toString();

    // Add PR dot if applicable
    if (hasData) {
      const dot = document.createElement('div');
      dot.className = 'cd-dot' + (hasPR ? ' pr' : '');
      el.appendChild(dot);
    }

    // Add click handler
    el.addEventListener('click', () => showCalDet(key, gymSessions, hiitData[key]));

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
function showCalDet(key: string, exs: Exercise[] | undefined, hiitSessions: Array<{ name?: string; rounds?: number; duration?: string; rpe?: number; exercises?: Array<{ name?: string }> }> = []): void {
  // Remove selection from all calendar days
  document.querySelectorAll('.cd').forEach((el: Element) => {
    el.classList.remove('sel');
  });

  // Add selection to matching day element
  document.querySelectorAll('.cd').forEach((el: Element) => {
    if ((el as HTMLElement).dataset.key === key) {
      el.classList.add('sel');
    }
  });

  // Get calendar details element
  const det = document.getElementById('calDet');
  if (!det) return;

  const gymSessions = exs || [];
  const hiitItems = hiitSessions || [];

  // Hide details if there are no gym or hiit sessions
  if (!gymSessions.length && !hiitItems.length) {
    det.style.display = 'none';
    return;
  }

  // Create date object and title
  const d = parseDateKeyAsLocalDate(key);
  const day = Number.parseInt(key.split('-')[2]!, 10);
  const weekdayShort = WEEKDAY_SHORT_MX[d.getDay()] || 'dom';
  const ttl = weekdayShort + ', ' + day + ' de ' + MOS[d.getMonth()];

  // Build HTML content
  const gymContent = gymSessions.length
    ? `<div class="cal-sec-ttl">Gym</div>` + gymSessions.map((ex: Exercise) => {
      const pr = isPR(ex.name, key, ex.weight);
      const stats = [
        ex.weight ? `${escHtml(String(ex.weight))} ${escHtml(ex.unit || 'lb')}` : null,
        ex.reps ? `${escHtml(ex.reps)} reps` : null,
        ex.sets ? `${escHtml(ex.sets.toString())} series` : null
      ].filter(Boolean).join(' · ');

      return `<div class="cal-row"><div class="cr-name">${escHtml(ex.name)}${pr ? '<span class="cr-pr">🏆 PR</span>' : ''}</div><div class="cr-stats">${stats}</div></div>`;
    }).join('')
    : '';

  const hiitContent = hiitItems.length
    ? `<div class="cal-sec-ttl">HIIT</div>` + hiitItems.map((session) => {
      const stats = [
        session.rounds ? `${escHtml(String(session.rounds))} rondas` : null,
        session.duration ? escHtml(session.duration) : null,
        session.rpe ? `RPE ${escHtml(String(session.rpe))}` : null,
        session.exercises?.length ? `${escHtml(String(session.exercises.length))} ejercicios` : null
      ].filter(Boolean).join(' · ');

      return `<div class="cal-row"><div class="cr-name">${escHtml(session.name || 'Sesión HIIT')}</div><div class="cr-stats">${stats}</div></div>`;
    }).join('')
    : '';

  const content = `<div class="cal-det-ttl">${ttl}</div>${gymContent}${hiitContent}`;

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
