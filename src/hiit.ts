import { HIITSession, HIITExercise } from './types.js';
import { dk, saveHiitSession } from './db.js';

declare function escHtml(value: string): string;
declare function showToast(message: string, type?: string): void;
declare function openM(modalId: string): void;
declare function closeM(modalId: string): void;

// DOM IDs constants
const DOM_IDS = {
  HIIT_MOD: 'hiit-mod',
  HIIT_MOD_TTL: 'hiit-mod-ttl',
  H_NAME: 'h-name',
  H_ROUNDS: 'h-rounds',
  H_DURATION: 'h-duration',
  H_NOTES: 'h-notes',
  HIIT_EX_LIST: 'hiit-ex-list',
  RPE_ROW: 'rpe-row'
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
 * Renders the HIIT section for a specific date
 * @param date - Date string in YYYY-MM-DD format
 */
export function renderHiit(date?: string): void {
  if (date) hiitDate = date;

  const hiitContainer = document.getElementById('hiit-container');
  if (!hiitContainer) return;

  const key = dk(new Date(hiitDate));
  const sessions = hiitCache[key] || [];

  hiitContainer.innerHTML = `
    <div class="hiit-header">
      <h3>HIIT Sessions</h3>
      <button class="btn-primary" onclick="openHiitModal()">+ Nueva Sesión</button>
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
          <button onclick="editHiitSession('${session.id}')" class="btn-edit">✏️</button>
          <button onclick="deleteHiitSession('${session.id}')" class="btn-delete">🗑️</button>
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

  document.getElementById(DOM_IDS.HIIT_MOD_TTL)!.textContent = 'Nueva sesión HIIT';
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

  document.getElementById(DOM_IDS.HIIT_MOD_TTL)!.textContent = 'Editar sesión HIIT';
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
    <button type="button" class="hiit-ex-del" onclick="document.getElementById('hiit-ex-${id}').remove()">✕</button>`;
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
    showToast('Error guardando sesión HIIT. Intenta de nuevo.', 'error');
    return;
  }

    closeM(DOM_IDS.HIIT_MOD);
    renderHiit();
    showToast(hiitEditId ? 'Sesión actualizada ✓' : 'Sesión HIIT guardada ⚡', 'success');
  } catch (error) {
    console.error('Error saving HIIT session:', error);
    showToast('Error guardando sesión HIIT. Intenta de nuevo.', 'error');
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
    showToast('Escribe el nombre de la sesión');
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
    rounds: roundsElement.value ? parseInt(roundsElement.value, 10) : undefined,
    duration: durationElement.value.trim() || undefined,
    notes: notesElement.value.trim() || undefined,
    rpe: selectedRPE != null ? selectedRPE as import('./types.js').RPEValue : undefined,
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
      duration: durElement?.value ? parseInt(durElement.value, 10) : undefined,
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
  if (!hiitCache[key]) hiitCache[key] = [];

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
  if (!confirm('¿Eliminar esta sesión HIIT?')) return;

  try {
    const key = dk(new Date(hiitDate));
    const session = hiitCache[key]?.find(s => s.id === sessionId);
    if (!session) return;

    // Remove from cache
    hiitCache[key] = (hiitCache[key] || []).filter(s => s.id !== sessionId);

    // TODO: Implement database deletion
    // await deleteHiitSessionFromDB(sessionId);

    renderHiit();
    showToast('Sesión HIIT eliminada', 'success');
  } catch (error) {
    console.error('Error deleting HIIT session:', error);
    showToast('Error eliminando sesión HIIT', 'error');
  }
}

/**
 * Loads HIIT sessions for a date range
 * @param startDate - Start date
 * @param endDate - End date
 */
export async function loadHiitSessions(startDate: string, endDate: string): Promise<void> {
  try {
    // TODO: Implement database loading
    // const sessions = await loadHiitSessionsFromDB(startDate, endDate);
    // Update cache with loaded sessions
  } catch (error) {
    console.error('Error loading HIIT sessions:', error);
  }
}

// Make functions available globally for onclick handlers
(window as any).openHiitModal = openHiitModal;
(window as any).editHiitSession = editHiitSession;
(window as any).deleteHiitSession = deleteHiitSession;
(window as any).saveHiitSessionModal = saveHiitSessionModal;
(window as any).selectRPE = selectRPE;
(window as any).addHiitEx = addHiitEx;