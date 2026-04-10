import { HIITSession, HIITExercise, RPEValue } from './types.js';
import {
  dk,
  saveHiitSession,
  deleteHiitSession as deleteHiitSessionFromDB,
  gHiit,
  loadHiitMonth,
} from './db.js';

const escHtml = (value: string): string => (globalThis as any).escHtml?.(value) ?? value;
const showToast = (message: string): void => (globalThis as any).toast?.(message);
const openM = (modalId: string): void => (globalThis as any).openM?.(modalId);
const closeM = (modalId: string): void => (globalThis as any).closeM?.(modalId);

const DOM_IDS = {
  HIIT_MOD: 'hiitMod',
  HIIT_MOD_TTL: 'hiitModTtl',
  H_NAME: 'hName',
  H_ROUNDS: 'hRounds',
  H_DURATION: 'hDuration',
  H_NOTES: 'hNotes',
  HIIT_EX_LIST: 'hiitExList',
  RPE_ROW: 'rpeRow',
  HIIT_LIST: 'hiitList',
  HIIT_LABEL: 'hiitLabel',
  HIIT_SUB: 'hiitSub',
  TIMER_PHASE: 'htcPhase',
  TIMER_NUM: 'htcNum',
  TIMER_WORK: 'htcWork',
  TIMER_REST: 'htcRest',
  TIMER_ROUNDS: 'htcRounds',
  TIMER_START: 'htcStartBtn',
  TIMER_PROGRESS: 'htcProgress',
  HIIT_EX_DATALIST: 'hiitExSuggestions',
} as const;

interface ExerciseSuggestion {
  n: string;
  m?: string;
}

type TimerPhase = 'idle' | 'work' | 'rest' | 'done';

type TimerTarget = 'work' | 'rest' | 'rounds';

interface HiitTimerState {
  work: number;
  rest: number;
  rounds: number;
  currentRound: number;
  remaining: number;
  phase: TimerPhase;
  running: boolean;
  started: boolean;
  intervalId: number | null;
}

const timerState: HiitTimerState = {
  work: 40,
  rest: 20,
  rounds: 8,
  currentRound: 1,
  remaining: 0,
  phase: 'idle',
  running: false,
  started: false,
  intervalId: null,
};

let hiitDate: string = dk(new Date());
let hiitEditId: string | null = null;
let selectedRPE: RPEValue | null = null;
let hiitExCount = 0;
let hiitCache: Record<string, HIITSession[]> = {};

function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function syncHiitDateFromGlobal(): void {
  const globalDate = (globalThis as any).hiitDate;
  if (globalDate instanceof Date) {
    hiitDate = dk(globalDate);
  }
}

function syncHiitCacheFromDB(): void {
  hiitCache = gHiit() || {};
}

function getHiitExerciseSuggestions(): string[] {
  const byName = new Map<string, string>();

  const appDatabase = ((globalThis as any).EXERCISE_DATABASE || []) as ExerciseSuggestion[];
  appDatabase.forEach(entry => {
    const name = entry?.n?.trim();
    if (!name) return;
    byName.set(name.toLowerCase(), name);
  });

  Object.values(hiitCache).forEach(sessions => {
    sessions.forEach(session => {
      (session.exercises || []).forEach(exercise => {
        const name = exercise.name?.trim();
        if (!name) return;
        if (!byName.has(name.toLowerCase())) {
          byName.set(name.toLowerCase(), name);
        }
      });
    });
  });

  return [...byName.values()].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function ensureHiitExerciseDatalist(): void {
  const modal = getElement<HTMLElement>(DOM_IDS.HIIT_MOD);
  if (!modal) return;

  let datalist = getElement<HTMLDataListElement>(DOM_IDS.HIIT_EX_DATALIST);
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = DOM_IDS.HIIT_EX_DATALIST;
    modal.appendChild(datalist);
  }

  const options = getHiitExerciseSuggestions();
  datalist.innerHTML = options.map(name => `<option value="${escHtml(name)}"></option>`).join('');
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

function formatDateLabel(date: Date): string {
  const todayKey = dk(new Date());
  const currentKey = dk(date);
  return currentKey === todayKey ? 'HIIT - Hoy' : `HIIT - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatDateSub(date: Date): string {
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
  const month = date.toLocaleDateString('es-ES', { month: 'long' });
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${weekdayCap} ${date.getDate()} de ${month}`;
}

function renderHiitHeader(): void {
  const date = parseDateKey(hiitDate);

  const hiitLabel = getElement<HTMLElement>(DOM_IDS.HIIT_LABEL);
  if (hiitLabel) hiitLabel.textContent = formatDateLabel(date);

  const hiitSub = getElement<HTMLElement>(DOM_IDS.HIIT_SUB);
  if (hiitSub) hiitSub.textContent = formatDateSub(date);
}

function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function clearTimerInterval(): void {
  if (timerState.intervalId != null) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
}

function ensureTimerConfigFromDom(): void {
  const workEl = getElement<HTMLElement>(DOM_IDS.TIMER_WORK);
  const restEl = getElement<HTMLElement>(DOM_IDS.TIMER_REST);
  const roundsEl = getElement<HTMLElement>(DOM_IDS.TIMER_ROUNDS);

  const workValue = Number.parseInt(workEl?.textContent || '', 10);
  const restValue = Number.parseInt(restEl?.textContent || '', 10);
  const roundsValue = Number.parseInt(roundsEl?.textContent || '', 10);

  if (!Number.isNaN(workValue) && workValue > 0) timerState.work = workValue;
  if (!Number.isNaN(restValue) && restValue > 0) timerState.rest = restValue;
  if (!Number.isNaN(roundsValue) && roundsValue > 0) timerState.rounds = roundsValue;
}

function renderTimerProgress(): void {
  const progressEl = getElement<HTMLElement>(DOM_IDS.TIMER_PROGRESS);
  if (!progressEl) return;

  const dots = Array.from({ length: timerState.rounds }, (_, idx) => {
    const roundNumber = idx + 1;
    let cls = 'htc-round-dot';

    if (timerState.phase === 'done' || roundNumber < timerState.currentRound) {
      cls += ' done';
    } else if (timerState.started && roundNumber === timerState.currentRound) {
      cls += ' active';
    }

    return `<span class="${cls}"></span>`;
  }).join('');

  progressEl.innerHTML = dots;
}

function renderTimerConfigValues(): void {
  const workEl = getElement<HTMLElement>(DOM_IDS.TIMER_WORK);
  if (workEl) workEl.textContent = String(timerState.work);

  const restEl = getElement<HTMLElement>(DOM_IDS.TIMER_REST);
  if (restEl) restEl.textContent = String(timerState.rest);

  const roundsEl = getElement<HTMLElement>(DOM_IDS.TIMER_ROUNDS);
  if (roundsEl) roundsEl.textContent = String(timerState.rounds);
}

function getTimerPhaseText(): string {
  if (timerState.phase === 'work') {
    return `Trabajo - ronda ${timerState.currentRound}/${timerState.rounds}`;
  }
  if (timerState.phase === 'rest') {
    return `Descanso - ronda ${timerState.currentRound}/${timerState.rounds}`;
  }
  if (timerState.phase === 'done') {
    return 'Completado';
  }
  return 'Listo';
}

function renderTimerPhase(): void {
  const phaseEl = getElement<HTMLElement>(DOM_IDS.TIMER_PHASE);
  if (!phaseEl) return;

  phaseEl.classList.remove('work', 'rest', 'done');
  if (timerState.phase !== 'idle') {
    phaseEl.classList.add(timerState.phase);
  }
  phaseEl.textContent = getTimerPhaseText();
}

function renderTimerClock(): void {
  const numEl = getElement<HTMLElement>(DOM_IDS.TIMER_NUM);
  if (!numEl) return;

  numEl.classList.remove('work', 'rest');
  if (timerState.phase === 'work' || timerState.phase === 'rest') {
    numEl.classList.add(timerState.phase);
  }
  numEl.textContent = timerState.started ? formatClock(timerState.remaining) : '0:00';
}

function getStartButtonText(): string {
  if (timerState.running) return '⏸ Pausar';
  if (timerState.started && timerState.phase !== 'done') return '▶ Reanudar';
  return '▶ Iniciar';
}

function renderTimerStartButton(): void {
  const startBtn = getElement<HTMLButtonElement>(DOM_IDS.TIMER_START);
  if (!startBtn) return;

  startBtn.classList.toggle('running', timerState.running);
  startBtn.textContent = getStartButtonText();
}

function renderTimerUI(): void {
  renderTimerConfigValues();
  renderTimerPhase();
  renderTimerClock();
  renderTimerStartButton();
  renderTimerProgress();
}

function startTimerLoop(): void {
  clearTimerInterval();

  timerState.intervalId = globalThis.setInterval(() => {
    if (!timerState.running) return;

    timerState.remaining -= 1;

    if (timerState.remaining > 0) {
      renderTimerUI();
      return;
    }

    if (timerState.phase === 'work') {
      timerState.phase = 'rest';
      timerState.remaining = timerState.rest;
      renderTimerUI();
      return;
    }

    if (timerState.phase === 'rest') {
      if (timerState.currentRound >= timerState.rounds) {
        timerState.phase = 'done';
        timerState.running = false;
        timerState.started = false;
        timerState.remaining = 0;
        clearTimerInterval();
        renderTimerUI();
        showToast('HIIT completado ⚡');
        return;
      }

      timerState.currentRound += 1;
      timerState.phase = 'work';
      timerState.remaining = timerState.work;
      renderTimerUI();
    }
  }, 1000);
}

function sessionSortTimestamp(session: HIITSession): number {
  if (session.created_at) {
    const createdTs = Date.parse(session.created_at);
    if (!Number.isNaN(createdTs)) return createdTs;
  }
  return 0;
}

function encodeSessionId(value: string): string {
  return encodeURIComponent(value).replaceAll("'", '%27');
}

function renderHiitSession(session: HIITSession): string {
  const encodedSessionId = encodeSessionId(String(session.id || ''));
  const metaChips: string[] = [];

  if (session.rounds) {
    metaChips.push(`<span class="hsc-chip">${session.rounds} rondas</span>`);
  }
  if (session.duration) {
    metaChips.push(`<span class="hsc-chip">${escHtml(String(session.duration))}</span>`);
  }
  if (session.rpe) {
    metaChips.push(`<span class="hsc-chip accent">RPE ${session.rpe}</span>`);
  }

  const exercises = (session.exercises || []).map(ex => {
    const stats = [
      ex.duration ? `${ex.duration}s` : '',
      ex.reps ? `${ex.reps} reps` : ''
    ].filter(Boolean).join(' · ');

    return `<div class="hsc-ex-row">
      <span class="hsc-ex-name">${escHtml(ex.name)}</span>
      <span class="hsc-ex-stats">${escHtml(stats || '-')}</span>
    </div>`;
  }).join('');

  return `<article class="hiit-session-card">
    <div class="hsc-top">
      <div>
        <div class="hsc-name">${escHtml(session.name)}</div>
        <div class="hsc-meta">${metaChips.join('')}</div>
      </div>
      <div class="ex-acts">
        <button type="button" class="act-btn act-edit" data-hiit-action="edit" data-session-id="${encodedSessionId}">Editar</button>
        <button type="button" class="act-btn act-del" data-hiit-action="delete" data-session-id="${encodedSessionId}">Eliminar</button>
      </div>
    </div>
    <div class="hsc-exs">${exercises}</div>
    ${session.notes ? `<div class="hsc-note">📝 ${escHtml(session.notes)}</div>` : ''}
  </article>`;
}

function bindHiitActionButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('[data-hiit-action][data-session-id]').forEach(button => {
    button.onclick = null;
    button.addEventListener('click', () => {
      const encodedId = button.dataset.sessionId || '';
      const sessionId = decodeURIComponent(encodedId);
      if (button.dataset.hiitAction === 'edit') {
        editHiitSession(sessionId);
        return;
      }
      void deleteHiitSession(sessionId);
    });
  });
}

export function renderHiitProgress(): void {
  syncHiitDateFromGlobal();
  syncHiitCacheFromDB();

  const listElement = getElement<HTMLElement>(DOM_IDS.HIIT_LIST);
  if (!listElement) return;

  const sessions = [...(hiitCache[hiitDate] || [])]
    .sort((a, b) => sessionSortTimestamp(b) - sessionSortTimestamp(a));

  if (sessions.length === 0) {
    listElement.innerHTML = '<div class="empty-hiit">No hay sesiones HIIT registradas para este día.<br>¡Empieza tu primer entrenamiento!</div>';
    return;
  }

  listElement.innerHTML = sessions.map(renderHiitSession).join('');
  bindHiitActionButtons(listElement);
}

export function renderHiit(date?: string): void {
  if (date) {
    hiitDate = dk(new Date(date));
  } else {
    syncHiitDateFromGlobal();
  }

  renderHiitHeader();
  renderTimerUI();
  renderHiitProgress();
}

function resetExerciseRows(): void {
  const exList = getElement<HTMLElement>(DOM_IDS.HIIT_EX_LIST);
  if (exList) exList.innerHTML = '';
  hiitExCount = 0;
}

function populateHiitModalFields(session: Partial<HIITSession>): void {
  const nameElement = getElement<HTMLInputElement>(DOM_IDS.H_NAME);
  const roundsElement = getElement<HTMLInputElement>(DOM_IDS.H_ROUNDS);
  const durationElement = getElement<HTMLInputElement>(DOM_IDS.H_DURATION);
  const notesElement = getElement<HTMLInputElement>(DOM_IDS.H_NOTES);

  if (nameElement) nameElement.value = session.name || '';
  if (roundsElement) roundsElement.value = session.rounds?.toString() || '';
  if (durationElement) durationElement.value = session.duration || '';
  if (notesElement) notesElement.value = session.notes || '';

  ensureHiitExerciseDatalist();
  resetExerciseRows();

  const exercises = session.exercises || [];
  exercises.forEach(exercise => addHiitEx(exercise));
  if (!exercises.length) addHiitEx();
}

export function openHiitModal(): void {
  hiitEditId = null;
  selectedRPE = null;
  syncHiitCacheFromDB();

  const titleElement = getElement<HTMLElement>(DOM_IDS.HIIT_MOD_TTL);
  if (titleElement) titleElement.textContent = 'Nueva sesión HIIT';

  populateHiitModalFields({ exercises: [] });
  renderRPE();
  openM(DOM_IDS.HIIT_MOD);
}

export function editHiitSession(sessionId: string): void {
  syncHiitCacheFromDB();
  const session = (hiitCache[hiitDate] || []).find(item => item.id === sessionId);
  if (!session) {
    showToast('No se encontró la sesión HIIT');
    return;
  }

  hiitEditId = sessionId;
  selectedRPE = session.rpe ?? null;

  const titleElement = getElement<HTMLElement>(DOM_IDS.HIIT_MOD_TTL);
  if (titleElement) titleElement.textContent = 'Editar sesión HIIT';

  populateHiitModalFields(session);
  renderRPE();
  openM(DOM_IDS.HIIT_MOD);
}

export function addHiitEx(data: Partial<HIITExercise> = {}): void {
  ensureHiitExerciseDatalist();

  const id = hiitExCount++;
  const row = document.createElement('div');
  row.className = 'hiit-ex-row';
  row.id = `hiit-ex-${id}`;
  row.innerHTML = `
    <input class="fi" placeholder="Ejercicio (ej: Burpees)" value="${escHtml(data.name || '')}" id="hex-name-${id}" autocomplete="off" list="${DOM_IDS.HIIT_EX_DATALIST}">
    <input class="fi" placeholder="Seg" type="number" min="1" value="${escHtml(data.duration?.toString() || '')}" id="hex-dur-${id}" style="width:56px">
    <input class="fi" placeholder="Reps" value="${escHtml(String(data.reps || ''))}" id="hex-reps-${id}" style="width:60px">
    <button type="button" class="hiit-ex-del" onclick="document.getElementById('hiit-ex-${id}')?.remove()">✕</button>`;

  const listElement = getElement<HTMLElement>(DOM_IDS.HIIT_EX_LIST);
  listElement?.appendChild(row);
}

function renderRPE(): void {
  const rpeRow = getElement<HTMLElement>(DOM_IDS.RPE_ROW);
  if (!rpeRow) return;

  rpeRow.innerHTML = Array.from({ length: 10 }, (_, idx) => idx + 1)
    .map(value => `<button type="button" class="rpe-btn ${selectedRPE === value ? 'sel' : ''}" onclick="selectRPE(${value})" aria-pressed="${selectedRPE === value}">${value}</button>`)
    .join('');
}

export function selectRPE(value: number): void {
  selectedRPE = value as RPEValue;
  renderRPE();
}

function collectHiitExercises(): HIITExercise[] {
  const exercises: HIITExercise[] = [];

  document.querySelectorAll(`#${DOM_IDS.HIIT_EX_LIST} .hiit-ex-row`).forEach(row => {
    const id = row.id.replace('hiit-ex-', '');
    const nameElement = getElement<HTMLInputElement>(`hex-name-${id}`);
    const durationElement = getElement<HTMLInputElement>(`hex-dur-${id}`);
    const repsElement = getElement<HTMLInputElement>(`hex-reps-${id}`);

    const name = nameElement?.value?.trim();
    if (!name) return;

    const durationValue = durationElement?.value?.trim();
    const parsedDuration = durationValue ? Number.parseInt(durationValue, 10) : undefined;

    exercises.push({
      name,
      duration: parsedDuration && !Number.isNaN(parsedDuration) ? parsedDuration : undefined,
      reps: repsElement?.value?.trim() || undefined,
    });
  });

  return exercises;
}

function collectHiitSessionData(): Omit<HIITSession, 'id' | 'date'> | null {
  const nameElement = getElement<HTMLInputElement>(DOM_IDS.H_NAME);
  const roundsElement = getElement<HTMLInputElement>(DOM_IDS.H_ROUNDS);
  const durationElement = getElement<HTMLInputElement>(DOM_IDS.H_DURATION);
  const notesElement = getElement<HTMLInputElement>(DOM_IDS.H_NOTES);

  const name = nameElement?.value.trim() || '';
  if (!name) {
    showToast('Escribe el nombre de la sesión');
    return null;
  }

  const exercises = collectHiitExercises();
  if (exercises.length === 0) {
    showToast('Agrega al menos un ejercicio');
    return null;
  }

  const roundsText = roundsElement?.value?.trim() || '';
  const rounds = roundsText ? Number.parseInt(roundsText, 10) : undefined;

  return {
    name,
    rounds: rounds && !Number.isNaN(rounds) ? rounds : undefined,
    duration: durationElement?.value?.trim() || undefined,
    notes: notesElement?.value?.trim() || undefined,
    rpe: selectedRPE ?? undefined,
    exercises,
  };
}

function updateHiitCache(
  dateKey: string,
  sessionData: Omit<HIITSession, 'id' | 'date'>,
  sessionId: string,
  existingId: string | null
): void {
  hiitCache[dateKey] ??= [];

  if (existingId) {
    const index = hiitCache[dateKey].findIndex(item => item.id === existingId);
    if (index >= 0) {
      hiitCache[dateKey][index] = { ...hiitCache[dateKey][index], ...sessionData, id: existingId, date: dateKey };
      return;
    }
  }

  hiitCache[dateKey].push({ ...sessionData, id: sessionId, date: dateKey });
}

export async function saveHiitSessionModal(): Promise<void> {
  try {
    syncHiitDateFromGlobal();
    const sessionData = collectHiitSessionData();
    if (!sessionData) return;

    const result = await saveHiitSession(hiitDate, sessionData, hiitEditId);
    if (!result) {
      showToast('Error guardando sesión HIIT. Intenta de nuevo.');
      return;
    }

    syncHiitCacheFromDB();
    updateHiitCache(hiitDate, sessionData, result, hiitEditId);

    const isEdit = Boolean(hiitEditId);
    hiitEditId = null;
    closeM(DOM_IDS.HIIT_MOD);
    renderHiitProgress();
    showToast(isEdit ? 'Sesión HIIT actualizada ✓' : 'Sesión HIIT guardada ⚡');
  } catch (error) {
    console.error('Error saving HIIT session:', error);
    showToast('Error guardando sesión HIIT. Intenta de nuevo.');
  }
}

export async function deleteHiitSession(sessionId: string): Promise<void> {
  if (!globalThis.confirm('¿Eliminar esta sesión HIIT?')) return;

  try {
    await deleteHiitSessionFromDB(sessionId);
    syncHiitCacheFromDB();
    hiitCache[hiitDate] = (hiitCache[hiitDate] || []).filter(session => session.id !== sessionId);
    renderHiitProgress();
    showToast('Sesión HIIT eliminada ✓');
  } catch (error) {
    console.error('Error deleting HIIT session:', error);
    showToast('Error eliminando sesión HIIT. Intenta de nuevo.');
  }
}

export async function hiitChangeDay(direction: number): Promise<void> {
  const nextDate = parseDateKey(hiitDate);
  nextDate.setDate(nextDate.getDate() + direction);

  hiitDate = dk(nextDate);
  (globalThis as any).hiitDate = nextDate;

  await loadHiitMonth(nextDate.getFullYear(), nextDate.getMonth());
  renderHiit();
}

export function adjustHiitTimer(target: TimerTarget, delta: number): void {
  if (timerState.running) {
    showToast('Pausa el temporizador para ajustar valores');
    return;
  }

  ensureTimerConfigFromDom();

  if (target === 'work') {
    timerState.work = Math.min(600, Math.max(5, timerState.work + delta));
  } else if (target === 'rest') {
    timerState.rest = Math.min(600, Math.max(5, timerState.rest + delta));
  } else {
    timerState.rounds = Math.min(30, Math.max(1, timerState.rounds + delta));
  }

  if (!timerState.started) {
    timerState.remaining = 0;
    timerState.currentRound = 1;
    timerState.phase = 'idle';
  }

  renderTimerUI();
}

export function toggleHiitTimer(): void {
  ensureTimerConfigFromDom();

  if (timerState.running) {
    timerState.running = false;
    clearTimerInterval();
    renderTimerUI();
    return;
  }

  if (!timerState.started || timerState.phase === 'done') {
    timerState.started = true;
    timerState.phase = 'work';
    timerState.currentRound = 1;
    timerState.remaining = timerState.work;
  }

  timerState.running = true;
  renderTimerUI();
  startTimerLoop();
}

export function resetHiitTimer(): void {
  clearTimerInterval();
  ensureTimerConfigFromDom();

  timerState.running = false;
  timerState.started = false;
  timerState.phase = 'idle';
  timerState.currentRound = 1;
  timerState.remaining = 0;

  renderTimerUI();
}

export function initHiit(): void {
  syncHiitDateFromGlobal();
  syncHiitCacheFromDB();
  renderHiit();
}

(globalThis as any).openHiitModal = openHiitModal;
(globalThis as any).openHiitMod = openHiitModal;
(globalThis as any).editHiitSession = editHiitSession;
(globalThis as any).deleteHiitSession = deleteHiitSession;
(globalThis as any).saveHiitSessionModal = saveHiitSessionModal;
(globalThis as any).renderHiit = renderHiit;
(globalThis as any).renderHiitProgress = renderHiitProgress;
(globalThis as any).hiitChangeDay = hiitChangeDay;
(globalThis as any).initHiit = initHiit;
(globalThis as any).selectRPE = selectRPE;
(globalThis as any).addHiitEx = addHiitEx;
(globalThis as any).adjustHiitTimer = adjustHiitTimer;
(globalThis as any).toggleHiitTimer = toggleHiitTimer;
(globalThis as any).resetHiitTimer = resetHiitTimer;
