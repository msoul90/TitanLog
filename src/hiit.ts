import { HIITSession, HIITExercise } from './types.js';
import { dk, saveHiitSession } from './db.js';

const escHtml = (value: string): string => (globalThis as any).escHtml?.(value) ?? value;
const showToast = (message: string, _type?: string): void => (globalThis as any).toast?.(message);
const openM = (modalId: string): void => (globalThis as any).openM?.(modalId);
const closeM = (modalId: string): void => (globalThis as any).closeM?.(modalId);

// DOM IDs constants
const DOM_IDS = {
  HIIT_MOD: 'hiitMod',
  HIIT_MOD_TTL: 'hiitModTtl',
  H_NAME: 'hName',
  H_ROUNDS: 'hRounds',
  H_DURATION: 'hDuration',
  H_NOTES: 'hNotes',
  HIIT_EX_LIST: 'hiitExList',
  RPE_ROW: 'rpeRow'
} as const;

// Global variables with proper typing
let hiitDate: string = new Date().toISOString().slice(0, 10);
let hiitEditId: { id: string } | null = null;
let selectedRPE: number | null = null;
let hiitExCount: number = 0;
let hiitCache: Record<string, HIITSession[]> = {};

/**
 * Initializes HIIT functionality
 */
export function initHiit(): void {
  // Initialize cache and other setup if needed
}

/**
 * Renders the HIIT progress section (list of sessions)
 */
export function renderHiitProgress(): void {
  const hiitList = document.getElementById('hiitList');
  if (!hiitList) return;

  const currentDate = dk(new Date(hiitDate));
  const sessions = hiitCache[currentDate] || [];

  if (sessions.length === 0) {
    hiitList.innerHTML = '<div class="empty-hiit">No hay sesiones HIIT registradas para hoy.<br>Â¡Empieza tu primer entrenamiento!</div>';
    return;
  }

  hiitList.innerHTML = sessions.map(session => renderHiitSession(session)).join('');
}


/**
 * Renders the HIIT section for a specific date
 * @param date - Date string in YYYY-MM-DD format
 */
export function renderHiit(date?: string): void {
  if (date) hiitDate = date;

  const hiitContainer = document.getElementById('hiitList');
  if (!hiitContainer) return;

  const key = dk(new Date(hiitDate));
  const sessions = hiitCache[key] || [];

  hiitContainer.innerHTML = `
    <div class="hiit-header">
      <h3>HIIT Sessions</h3>
      <button class="btn-primary" onclick="openHiitModal()">+ Nueva SesiÃ³n</button>
    </div>
    <div class="hiit-sessions">
      ${sessions.length ? sessions.map(session => renderHiitSession(session)).join('') : '<p class="no-data">No HIIT sessions for this date</p>'}
    </div>
  `;
}

/**
 * Renders a single HIIT session
 * @param session - HIIT session data
 * @returns HTML string for the session
 */
function renderHiitSession(session: HIITSession): string {
  const exercisesHtml = session.exercises?.map(ex => `
    <div class="hiit-exercise">
      <span class="ex-name">${escHtml(ex.name)}</span>
      ${ex.duration ? `<span class="ex-duration">${ex.duration}s</span>` : ''}
      ${ex.reps ? `<span class="ex-reps">${ex.reps} reps</span>` : ''}
    </div>
  `).join('') || '';

  return `
    <div class="hiit-session-card" data-id="${session.id}">
      <div class="hiit-session-header">
        <h4>${escHtml(session.name)}</h4>
        <div class="hiit-session-actions">
          <button onclick="editHiitSession('${session.id}')" class="btn-edit">âœï¸</button>
          <button onclick="deleteHiitSession('${session.id}')" class="btn-delete">ðŸ—‘ï¸</button>
        </div>
      </div>
      ${session.rounds ? `<div class="hiit-rounds">Rounds: ${session.rounds}</div>` : ''}
      ${session.duration ? `<div class="hiit-duration">Duration: ${session.duration}</div>` : ''}
      ${session.rpe ? `<div class="hiit-rpe">RPE: ${session.rpe}/10</div>` : ''}
      <div class="hiit-exercises">
        ${exercisesHtml}
      </div>
      ${session.notes ? `<div class="hiit-notes">${escHtml(session.notes)}</div>` : ''}
    </div>
  `;
}

/**
 * Opens the HIIT modal for creating a new session
 */
export function openHiitModal(): void {
  hiitEditId = null;
  selectedRPE = null;
  hiitExCount = 0;

  document.getElementById(DOM_IDS.HIIT_MOD_TTL)!.textContent = 'Nueva sesiÃ³n HIIT';
  populateHiitModalFields({ exercises: [] });
  renderRPE();
  openM(DOM_IDS.HIIT_MOD);
}

/**
 * Opens the HIIT modal for editing an existing session
 * @param sessionId - ID of the session to edit
 */
export function editHiitSession(sessionId: string): void {
  const key = dk(new Date(hiitDate));
  const session = hiitCache[key]?.find(s => s.id === sessionId);
  if (!session) return;

  hiitEditId = { id: sessionId };
  selectedRPE = session.rpe || null;

  document.getElementById(DOM_IDS.HIIT_MOD_TTL)!.textContent = 'Editar sesiÃ³n HIIT';
  populateHiitModalFields(session);
  renderRPE();
  openM(DOM_IDS.HIIT_MOD);
}

/**
 * Populates the HIIT modal fields with session data
 * @param session - Session data
 */
function populateHiitModalFields(session: Partial<HIITSession>): void {
  const nameElement = document.getElementById(DOM_IDS.H_NAME) as HTMLInputElement;
  const roundsElement = document.getElementById(DOM_IDS.H_ROUNDS) as HTMLInputElement;
  const durationElement = document.getElementById(DOM_IDS.H_DURATION) as HTMLInputElement;
  const notesElement = document.getElementById(DOM_IDS.H_NOTES) as HTMLTextAreaElement;

  nameElement.value = session.name || '';
  roundsElement.value = session.rounds?.toString() || '';
  durationElement.value = session.duration || '';
  notesElement.value = session.notes || '';

  const exList = document.getElementById(DOM_IDS.HIIT_EX_LIST)!;
  exList.innerHTML = '';

  const exercises = session.exercises || [];
  exercises.forEach(exercise => addHiitEx(exercise));
  if (!exercises.length) addHiitEx();
}

/**
 * Adds a new exercise row to the HIIT modal
 * @param data - Exercise data to populate
 */
function addHiitEx(data: Partial<HIITExercise> = {}): void {
  const id = hiitExCount++;
  const row = document.createElement('div');
  row.className = 'hiit-ex-row';
  row.id = `hiit-ex-${id}`;
  row.innerHTML = `
    <input class="fi" placeholder="Ejercicio (ej: Burpees)" value="${escHtml(data.name || '')}" id="hex-name-${id}" autocomplete="off">
    <input class="fi" placeholder="Seg" type="number" min="1" value="${escHtml(data.duration?.toString() || '')}" id="hex-dur-${id}" style="width:56px">
    <input class="fi" placeholder="Reps" value="${escHtml(String(data.reps || ''))}" id="hex-reps-${id}" style="width:60px">
    <button type="button" class="hiit-ex-del" onclick="document.getElementById('hiit-ex-${id}').remove()">âœ•</button>`;
  document.getElementById(DOM_IDS.HIIT_EX_LIST)!.appendChild(row);
}

/**
 * Renders the RPE (Rate of Perceived Exertion) selection buttons
 */
function renderRPE(): void {
  const rpeRow = document.getElementById(DOM_IDS.RPE_ROW);
  if (!rpeRow) return;

  rpeRow.innerHTML = Array.from({ length: 10 }, (_, i) => i + 1)
    .map(n => `<button type="button" class="rpe-btn ${selectedRPE === n ? 'sel' : ''}" onclick="selectRPE(${n})" aria-pressed="${selectedRPE === n}">${n}</button>`)
    .join('');
}

/**
 * Selects an RPE value
 * @param n - RPE value (1-10)
 */
export function selectRPE(n: number): void {
  selectedRPE = n;
  renderRPE();
}

/**
 * Saves the HIIT session from the modal
 */
export async function saveHiitSessionModal(): Promise<void> {
  try {
    const sessionData = collectHiitSessionData();
    if (!sessionData) return; // Validation failed

    const key = dk(new Date(hiitDate));
    const existingId = hiitEditId?.id || null;

    const result = await saveHiitSession(key, sessionData, existingId);
  if (!result) {
    showToast('Error guardando sesiÃ³n HIIT. Intenta de nuevo.', 'error');
    return;
  }

    closeM(DOM_IDS.HIIT_MOD);
    renderHiit();
    showToast(hiitEditId ? 'SesiÃ³n actualizada âœ“' : 'SesiÃ³n HIIT guardada âš¡', 'success');
  } catch (error) {
    console.error('Error saving HIIT session:', error);
    showToast('Error guardando sesiÃ³n HIIT. Intenta de nuevo.', 'error');
  }
}

/**
 * Collects and validates session data from the modal
 * @returns Session data or null if validation fails
 */
function collectHiitSessionData(): Omit<HIITSession, 'id' | 'date'> | null {
  const nameElement = document.getElementById(DOM_IDS.H_NAME) as HTMLInputElement;
  const name = nameElement.value.trim();
  if (!name) {
    showToast('Escribe el nombre de la sesiÃ³n');
    return null;
  }

  const exercises = collectHiitExercises();
  if (exercises.length === 0) {
    showToast('Agrega al menos un ejercicio');
    return null;
  }

  const roundsElement = document.getElementById(DOM_IDS.H_ROUNDS) as HTMLInputElement;
  const durationElement = document.getElementById(DOM_IDS.H_DURATION) as HTMLInputElement;
  const notesElement = document.getElementById(DOM_IDS.H_NOTES) as HTMLTextAreaElement;

  return {
    name,
    rounds: roundsElement.value ? Number.parseInt(roundsElement.value, 10) : undefined,
    duration: durationElement.value.trim() || undefined,
    notes: notesElement.value.trim() || undefined,
    rpe: selectedRPE == null ? undefined : selectedRPE as import('./types.js').RPEValue,
    exercises
  };
}

/**
 * Collects exercise data from the modal
 * @returns Array of exercise objects
 */
function collectHiitExercises(): HIITExercise[] {
  const exercises: HIITExercise[] = [];
  document.querySelectorAll(`#${DOM_IDS.HIIT_EX_LIST} .hiit-ex-row`).forEach(row => {
    const id = row.id.replace('hiit-ex-', '');
    const nameElement = document.getElementById(`hex-name-${id}`) as HTMLInputElement;
    const exerciseName = nameElement?.value?.trim();
    if (!exerciseName) return;

    const durElement = document.getElementById(`hex-dur-${id}`) as HTMLInputElement;
    const repsElement = document.getElementById(`hex-reps-${id}`) as HTMLInputElement;

    exercises.push({
      name: exerciseName,
      duration: durElement?.value ? Number.parseInt(durElement.value, 10) : undefined,
      reps: repsElement?.value || undefined
    });
  });
  return exercises;
}

/**
 * Updates the HIIT cache with the new/updated session
 * @param key - Date key
 * @param sessionData - Session data
 * @param existingId - Existing session ID if updating
 * @param resultId - New session ID from database
 */
function updateHiitCache(key: string, sessionData: Omit<HIITSession, 'id' | 'date'>, existingId: string | null, resultId: string): void {
  hiitCache[key] ??= [];

  if (existingId) {
    const idx = hiitCache[key].findIndex(s => s.id === existingId);
    if (idx >= 0) {
      hiitCache[key][idx] = { ...sessionData, id: existingId, date: key };
    }
  } else {
    hiitCache[key].push({ ...sessionData, id: resultId, date: key });
  }
}

/**
 * Deletes a HIIT session
 * @param sessionId - ID of the session to delete
 */
export async function deleteHiitSession(sessionId: string): Promise<void> {
  if (!confirm('Â¿Eliminar esta sesiÃ³n HIIT?')) return;

  try {
    const key = dk(new Date(hiitDate));
    const session = hiitCache[key]?.find(s => s.id === sessionId);
    if (!session) return;

    // Remove from cache
    hiitCache[key] = (hiitCache[key] || []).filter(s => s.id !== sessionId);

    // NOTE: DB deletion pending integration with persistent API layer.
    // await deleteHiitSessionFromDB(sessionId);

    renderHiit();
    showToast('SesiÃ³n HIIT eliminada', 'success');
  } catch (error) {
    console.error('Error deleting HIIT session:', error);
    showToast('Error eliminando sesiÃ³n HIIT', 'error');
  }
}

/**
 * Loads HIIT sessions for a date range
 * @param startDate - Start date
 * @param endDate - End date
 */
export async function loadHiitSessions(startDate: string, endDate: string): Promise<void> {
  try {
    // NOTE: DB loading pending integration with persistent API layer.
    // const sessions = await loadHiitSessionsFromDB(startDate, endDate);
    // Update cache with loaded sessions
  } catch (error) {
    console.error('Error loading HIIT sessions:', error);
  }
}

// Make functions available globally for onclick handlers
(globalThis as any).openHiitModal = openHiitModal;
(globalThis as any).openHiitMod = openHiitModal;
(globalThis as any).editHiitSession = editHiitSession;
(globalThis as any).renderHiitProgress = renderHiitProgress;
(globalThis as any).hiitChangeDay = (dir: number): void => {
  const next = new Date(hiitDate);
  next.setDate(next.getDate() + dir);
  hiitDate = dk(next);
  (globalThis as any).hiitDate = next;

  const hiitLabel = document.getElementById('hiitLabel');
  const hiitSub = document.getElementById('hiitSub');
  if (hiitLabel) hiitLabel.textContent = `HIIT - ${next.getDate()}/${next.getMonth() + 1}/${next.getFullYear()}`;
  if (hiitSub) hiitSub.textContent = '';

  renderHiitProgress();
};
(globalThis as any).deleteHiitSession = deleteHiitSession;
(globalThis as any).saveHiitSessionModal = saveHiitSessionModal;
(globalThis as any).selectRPE = selectRPE;
(globalThis as any).addHiitEx = addHiitEx;
