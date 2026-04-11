// ============================================================
// app.ts — Estado global, tema, navegación y perfil de usuario
// ============================================================

import {
  Exercise,
  BodyWeightEntry,
  AppState,
  UserProfile,
  ValidationErrors,
  ValidationLimits,
  StorageKeys,
  ExerciseDatabaseEntry,
} from './types.js';

// ── CONSTANTS ──

// Exercise database with proper typing
const EXERCISE_DATABASE: ExerciseDatabaseEntry[] = [
  {n:'Sentadilla',m:'Piernas'},{n:'Sentadilla sumo',m:'Piernas'},{n:'Goblet squat',m:'Piernas'},
  {n:'Peso muerto',m:'Piernas / Espalda'},{n:'Peso muerto rumano',m:'Isquiotibiales'},
  {n:'Desplantes hacia adelante',m:'Piernas'},{n:'Desplantes hacia atrás',m:'Piernas'},
  {n:'Desplantes laterales',m:'Piernas'},{n:'Prensa de pierna',m:'Piernas'},
  {n:'Extensión de cuádriceps',m:'Cuádriceps'},{n:'Curl de pierna acostado',m:'Isquiotibiales'},
  {n:'Curl de pierna sentado',m:'Isquiotibiales'},{n:'Hip thrust',m:'Glúteos'},
  {n:'Patada de glúteo',m:'Glúteos'},{n:'Abducción de cadera',m:'Glúteos'},
  {n:'Elevación de talones',m:'Pantorrillas'},{n:'Step up',m:'Piernas'},
  {n:'Press de pecho',m:'Pecho'},{n:'Press de pecho inclinado',m:'Pecho'},
  {n:'Press de pecho declinado',m:'Pecho'},{n:'Press banca con barra',m:'Pecho'},
  {n:'Apertura con mancuernas',m:'Pecho'},{n:'Fondos en barras',m:'Pecho / Tríceps'},
  {n:'Flexiones',m:'Pecho'},{n:'Crossover',m:'Pecho'},
  {n:'Remo con barra',m:'Espalda'},{n:'Remo unilateral',m:'Espalda'},
  {n:'Remo en polea baja',m:'Espalda'},{n:'Jalón al pecho',m:'Espalda'},
  {n:'Jalón con agarre neutro',m:'Espalda'},{n:'Chin-ups',m:'Espalda / Bíceps'},
  {n:'Pull-ups',m:'Espalda'},{n:'Face pull',m:'Espalda / Hombros'},
  {n:'Buenos días',m:'Espalda baja'},
  {n:'Press de hombro con barra',m:'Hombros'},{n:'Press militar',m:'Hombros'},
  {n:'Press Arnold',m:'Hombros'},{n:'Elevaciones laterales',m:'Hombros'},
  {n:'Elevaciones frontales',m:'Hombros'},{n:'Pájaro',m:'Hombros'},
  {n:'Curl con barra',m:'Bíceps'},{n:'Curl con mancuernas',m:'Bíceps'},
  {n:'Martillo',m:'Bíceps'},{n:'Curl predicador',m:'Bíceps'},
  {n:'Curl concentrado',m:'Bíceps'},{n:'Curl en polea',m:'Bíceps'},
  {n:'Copa (Skull crusher)',m:'Tríceps'},{n:'Extensión de tríceps',m:'Tríceps'},
  {n:'Extensión sobre cabeza',m:'Tríceps'},{n:'Press francés',m:'Tríceps'},
  {n:'Jalón de tríceps en polea',m:'Tríceps'},{n:'Kick back',m:'Tríceps'},
  {n:'Plancha',m:'Core'},{n:'Crunch',m:'Abdomen'},{n:'Crunch en polea',m:'Abdomen'},
  {n:'Elevación de piernas',m:'Abdomen'},{n:'Russian twist',m:'Abdomen'},
  {n:'Dead bug',m:'Core'},
  {n:'Hollow body hold',m:'Core'},{n:'Dragon flag',m:'Core'},
  {n:'V-up',m:'Abdomen'},{n:'Bicicleta abdominal',m:'Abdomen'},
  {n:'Chop en polea',m:'Core'},{n:'Pallof press',m:'Core'},{n:'Flutter kicks',m:'Abdomen'},{n:'Caminadora',m:'Cardio'},{n:'Bicicleta estática',m:'Cardio'},
  {n:'Elíptica',m:'Cardio'},{n:'Burpees',m:'Funcional'},{n:'Salto a la caja',m:'Funcional'},
  // TRX / Suspensión
  {n:'TRX Sentadilla',m:'Piernas'},{n:'TRX Zancada',m:'Piernas'},
  {n:'TRX Remo',m:'Espalda'},{n:'TRX Flexiones',m:'Pecho'},
  {n:'TRX Curl de bíceps',m:'Bíceps'},{n:'TRX Extensión de tríceps',m:'Tríceps'},
  {n:'TRX Plancha',m:'Core'},{n:'TRX Pike',m:'Core'},
  {n:'TRX Puente de glúteo',m:'Glúteos'},{n:'TRX Apertura de pecho',m:'Pecho'},
];

// UI Constants
const DAYS_OF_WEEK: readonly string[] = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MONTHS: readonly string[] = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

// Validation Limits
const VALIDATION_LIMITS: ValidationLimits = {
  MAX_EXERCISE_NAME_LENGTH: 100,
  MAX_WEIGHT: 9999,
  MAX_SETS: 99,
  MAX_REPS: 999,
  MAX_DURATION_SECONDS: 3600, // 1 hour
  AUTOCOMPLETE_DEBOUNCE_MS: 150,
  MAX_PR_CACHE_SIZE: 1000,
};

// Storage Keys
const STORAGE_KEYS: StorageKeys = {
  THEME: 'ironlog_theme',
  USER_PROFILE_PREFIX: 'ironlog_profile_',
  GYM_DATA_PREFIX: 'ironlog_gym_',
  BODY_WEIGHT_PREFIX: 'ironlog_bw_',
  HIIT_DATA_PREFIX: 'ironlog_hiit_',
};

// ── GLOBAL STATE ──

// Application state with proper typing
const appState: AppState = {
  viewDate: new Date(),
  calendarDate: new Date(),
  editExerciseId: null,
  bodyWeightUnit: 'lb',
  timerInterval: null,
  timerSeconds: 0,
  autocompleteItems: [],
  autocompleteSelectedIndex: -1,
  exerciseListCache: [],
  personalRecordCache: new Map(), // Renamed from prCache for clarity
  autocompleteTimeout: null
};

// Short alias used internally for the PR cache
const prCache = appState.personalRecordCache;

// Capture DB-backed getters registered by db.ts before this module overwrites globals.
const dbGetGymData = typeof (globalThis as any).gD === 'function'
  ? ((globalThis as any).gD as () => Record<string, Exercise[]>)
  : null;
const dbGetBodyWeightData = typeof (globalThis as any).gBW === 'function'
  ? ((globalThis as any).gBW as () => Record<string, BodyWeightEntry>)
  : null;

// Global variables defined in db.ts
// Inicializados como null; db.ts los sobreescribe vía window en el navegador
let currentUser: UserProfile | null = null;
let currentProfile: UserProfile | null = null;

// STORAGE (sessionStorage — fallback temporal para import/demo offline)

/**
 * Saves gym data to sessionStorage
 * @param data - Exercise data object
 */
function sD(data: Record<string, Exercise[]>): void {
  sessionStorage.setItem(STORAGE_KEYS.GYM_DATA_PREFIX + (currentUser?.id || ''), JSON.stringify(data));
}

/**
 * Loads gym data from sessionStorage
 * @returns Exercise data object
 */
function gD(): Record<string, Exercise[]> {
  if (dbGetGymData) {
    try {
      return dbGetGymData();
    } catch {
      // Fallback to sessionStorage below.
    }
  }

  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.GYM_DATA_PREFIX + (currentUser?.id || ''));
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Saves body weight data to sessionStorage
 * @param data - Body weight data object
 */
function sBW(data: Record<string, BodyWeightEntry>): void {
  sessionStorage.setItem(STORAGE_KEYS.BODY_WEIGHT_PREFIX + (currentUser?.id || ''), JSON.stringify(data));
}

/**
 * Loads body weight data from sessionStorage
 * @returns Body weight data object
 */
function gBW(): Record<string, BodyWeightEntry> {
  if (dbGetBodyWeightData) {
    try {
      return dbGetBodyWeightData();
    } catch {
      // Fallback to sessionStorage below.
    }
  }

  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.BODY_WEIGHT_PREFIX + (currentUser?.id || ''));
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Clears performance cache
 */
function clearPerformanceCache(): void {
  appState.personalRecordCache.clear();
}

/**
 * Checks if a weight is a personal record for an exercise
 * @param name - Exercise name
 * @param curKey - Current date key
 * @param weight - Weight value
 * @returns True if this is a personal record
 */
function isPR(name: string, curKey: string, weight: string | number | null | undefined): boolean { // NOSONAR
  if (weight == null) return false;

  const w = Number.parseFloat(String(weight));
  const cacheKey = `${name.toLowerCase()}_${curKey}`;
  const cached = prCache.get(cacheKey);
  if (cached && cached.weight >= w) {
    return w > cached.max;
  }

  const data = gD();
  let max = 0;

  // More efficient search - break early when possible
  for (const [k, exs] of Object.entries(data)) {
    if (k >= curKey) continue;
    for (const ex of exs) {
      if (ex.name.toLowerCase() === name.toLowerCase() && ex.weight) {
        max = Math.max(max, Number.parseFloat(String(ex.weight)));
        if (max >= w) break; // Early exit if we've already exceeded current weight
      }
    }
    if (max >= w) break; // Early exit for this date if we've exceeded
  }

  const result = w > max && max > 0;

  // Cache the result
  prCache.set(cacheKey, { max, weight: w });

  // Limit cache size to prevent memory leaks
  if (prCache.size > VALIDATION_LIMITS.MAX_PR_CACHE_SIZE) {
    const firstKey = prCache.keys().next().value;
    if (firstKey) {
      prCache.delete(firstKey);
    }
  }

  return result;
}

/**
 * Main function to render the today view
 */
function renderToday(): void {
  // Keep legacy global date in sync for modules/handlers that still read it.
  (globalThis as any).viewDate = new Date(appState.viewDate);

  const today = new Date();
  const isToday = dateKey(appState.viewDate) === dateKey(today);
  const dayName = DAYS_OF_WEEK[appState.viewDate.getDay()] || '';
  const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  const dateMainElement = document.getElementById('dLabel');
  if (dateMainElement) {
    dateMainElement.textContent = isToday ? `Hoy - ${dayNameCapitalized}` : dayNameCapitalized;
  }

  const dateSubElement = document.getElementById('dSub');
  if (dateSubElement) {
    dateSubElement.textContent = `${appState.viewDate.getDate()} de ${MONTHS[appState.viewDate.getMonth()]} ${appState.viewDate.getFullYear()} · ${(currentProfile?.name || '')}`;
  }

  const key = dateKey(appState.viewDate);
  const exercises = gD()[key] || [];
  const exerciseListElement = document.getElementById('exList');
  if (!exerciseListElement) return;

  if (exercises.length === 0) {
    exerciseListElement.innerHTML = '<div class="empty"><div class="empty-ic">🏋️</div><div class="empty-tx">Sin ejercicios este día.<br>Toca <strong>＋</strong> para agregar uno.</div></div>';
    return;
  }

  exerciseListElement.innerHTML = exercises
    .map(exercise => renderTodayExerciseCard(exercise, key))
    .join('');
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function renderTodayExerciseCard(exercise: Exercise, key: string): string {
  const hasWeight = exercise.weight !== null && exercise.weight !== undefined && exercise.weight !== '';
  const hasSets = exercise.sets !== null && exercise.sets !== undefined && exercise.sets !== '';
  const hasReps = exercise.reps !== null && exercise.reps !== undefined && exercise.reps !== '';
  const isPersonalRecord = hasWeight ? isPR(exercise.name, key, exercise.weight) : false;
  const nameForGuide = JSON.stringify(exercise.name);

  return `<div class="ex-card ${hasWeight ? 'has-w' : ''} ${isPersonalRecord ? 'is-pr' : ''}">
    <div class="ex-top">
      <div class="ex-nm">${escHtml(exercise.name)}</div>
      ${isPersonalRecord ? '<div class="pr-tag">🏆 Nuevo máximo</div>' : ''}
    </div>
    <div class="ex-chips">
      ${hasWeight ? `<div class="chip"><span class="chip-v">${escHtml(String(exercise.weight))} ${escHtml(exercise.unit || 'lb')}</span><span class="chip-l">Peso</span></div>` : ''}
      ${hasSets ? `<div class="chip"><span class="chip-v">${escHtml(String(exercise.sets))}</span><span class="chip-l">Series</span></div>` : ''}
      ${hasReps ? `<div class="chip"><span class="chip-v">${escHtml(String(exercise.reps))}</span><span class="chip-l">Reps</span></div>` : ''}
    </div>
    ${exercise.notes ? `<div class="ex-note">📝 ${escHtml(exercise.notes)}</div>` : ''}
    <div class="ex-acts">
      <button type="button" class="act-btn act-edit" onclick="editEx('${key}',${exercise.ts})" aria-label="Editar ejercicio">
        <span class="act-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
        </span><span>Editar</span>
      </button>
      <button type="button" class="act-btn act-del" onclick="delEx('${key}',${exercise.ts})" aria-label="Eliminar ejercicio">
        <span class="act-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M8 6V4h8v2"/>
            <path d="M6 6l1 14h10l1-14"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
          </svg>
        </span><span>Eliminar</span>
      </button>
      <button type="button" class="act-btn act-guide" onclick='openGuide(${nameForGuide})' aria-label="Ver guía del ejercicio">
        <span class="act-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5V4.5A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </span><span>Guía</span>
      </button>
    </div>
  </div>`;
}

function hideAutocomplete(): void {
  const drop = document.getElementById('acDrop');
  if (!drop) return;

  drop.innerHTML = '';
  drop.style.display = 'none';
  appState.autocompleteSelectedIndex = -1;
}

function applyAutocompleteSelection(index: number): void {
  const option = appState.exerciseListCache[index];
  const nameInput = document.getElementById('fName') as HTMLInputElement | null;
  if (!option || !nameInput) return;

  nameInput.value = option.n;
  hideAutocomplete();
}

function renderAutocompleteResults(results: ExerciseDatabaseEntry[]): void {
  const drop = document.getElementById('acDrop');
  if (!drop) return;

  if (results.length === 0) {
    hideAutocomplete();
    return;
  }

  appState.exerciseListCache = results;
  appState.autocompleteSelectedIndex = -1;
  drop.innerHTML = '';

  results.forEach((exercise, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'ac-it';
    item.innerHTML = `<span>${escHtml(exercise.n)}</span><span class="ac-mu">${escHtml(exercise.m)}</span>`;
    item.addEventListener('click', () => applyAutocompleteSelection(index));
    drop.appendChild(item);
  });

  drop.style.display = 'block';
}

function acIn(value: string): void {
  const query = value.trim().toLowerCase();
  if (query.length < 2) {
    hideAutocomplete();
    return;
  }

  const dynamicCatalog = (globalThis as any).getExerciseCatalogForAutocomplete?.() as ExerciseDatabaseEntry[] | null;
  const sourceCatalog = Array.isArray(dynamicCatalog) && dynamicCatalog.length ? dynamicCatalog : EXERCISE_DATABASE;

  const results = sourceCatalog
    .filter(exercise => exercise.n.toLowerCase().includes(query))
    .slice(0, 8);

  renderAutocompleteResults(results);
}

function acKey(event: KeyboardEvent): void {
  const drop = document.getElementById('acDrop');
  if (!drop || drop.style.display === 'none' || appState.exerciseListCache.length === 0) {
    return;
  }

  const items = Array.from(drop.querySelectorAll('.ac-it')) as HTMLElement[];
  if (items.length === 0) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    appState.autocompleteSelectedIndex = (appState.autocompleteSelectedIndex + 1) % items.length;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    appState.autocompleteSelectedIndex = (appState.autocompleteSelectedIndex - 1 + items.length) % items.length;
  } else if (event.key === 'Enter') {
    if (appState.autocompleteSelectedIndex >= 0) {
      event.preventDefault();
      applyAutocompleteSelection(appState.autocompleteSelectedIndex);
    }
    return;
  } else if (event.key === 'Escape') {
    hideAutocomplete();
    return;
  } else {
    return;
  }

  items.forEach((item, index) => {
    item.classList.toggle('hi', index === appState.autocompleteSelectedIndex);
  });
}

// ── UTILITY FUNCTIONS ──

/**
 * Toggles visibility of an input element
 * @param inputId - ID of the input element
 */
function toggleVis(inputId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

/**
 * Escapes HTML special characters
 * @param str - String to escape
 * @returns Escaped HTML string
 */
function escHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Toggles between light and dark theme
 */
function toggleTheme(): void {
  const html = document.documentElement;
  const currentTheme = html.dataset.theme;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.dataset.theme = newTheme;
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
}

/**
 * Initializes theme on page load
 */
function initTheme(): void {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  document.documentElement.dataset.theme = savedTheme;
}

/**
 * Opens a modal by ID
 * @param modalId - The modal element ID
 */
function openM(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modal instanceof HTMLDialogElement) {
      if (!modal.open) {
        modal.showModal();
      }
      requestAnimationFrame(() => modal.classList.add('open'));
      return;
    }

    modal.style.display = 'block';
    requestAnimationFrame(() => modal.classList.add('open'));
  }
}

/**
 * Closes a modal by ID
 * @param modalId - The modal element ID
 */
function closeM(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');

    if (modal instanceof HTMLDialogElement) {
      globalThis.setTimeout(() => {
        if (modal.open) {
          modal.close();
        }
      }, 200);
      return;
    }

    globalThis.setTimeout(() => {
      modal.style.display = 'none';
    }, 200);
  }
}

/**
 * Shows a specific section and updates navigation
 * @param name - Section name to show
 * @param btn - Navigation button element
 */
function showS(name: string, btn: HTMLElement): void {
  // Hide all screens
  document.querySelectorAll('.screen').forEach((screen: Element) => {
    screen.classList.remove('active');
  });

  // Show target screen
  const targetScreen = document.getElementById(`screen-${name}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  // Update navigation
  document.querySelectorAll('.nav-btn').forEach((navBtn: Element) => {
    navBtn.classList.remove('active');
    navBtn.removeAttribute('aria-current');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-current', 'page');

  const fabButton = document.getElementById('fabBtn');
  if (fabButton) {
    fabButton.style.display = name === 'today' ? 'flex' : 'none';
  }

  if (name === 'today') {
    renderToday();
  } else if (name === 'hiit') {
    (globalThis as any).renderHiit?.();
    (globalThis as any).renderHiitProgress?.();
  } else if (name === 'calendar') {
    (globalThis as any).renderCal?.();
  } else if (name === 'progress') {
    (globalThis as any).renderProg?.();
  } else if (name === 'export') {
    (globalThis as any).renderGuidesCatalog?.();
    (globalThis as any).renderStretchCatalog?.();
  }

  // Update URL hash
  globalThis.location.hash = `#${name}`;
}

/**
 * Changes the current view date
 * @param days - Number of days to add/subtract
 */
function changeDay(days: number): void {
  appState.viewDate = new Date(appState.viewDate);
  appState.viewDate.setDate(appState.viewDate.getDate() + days);
  (globalThis as any).viewDate = new Date(appState.viewDate);
  renderToday();
}

function validateWeight(weight: string | number, errors: ValidationErrors): void {
  if (weight === '' || weight === null || weight === undefined) return;
  const w = Number.parseFloat(String(weight));
  if (Number.isNaN(w)) {
    errors.push('El peso debe ser un número válido');
  } else if (w < 0) {
    errors.push('El peso no puede ser negativo');
  } else if (w > VALIDATION_LIMITS.MAX_WEIGHT) {
    errors.push(`El peso no puede exceder ${VALIDATION_LIMITS.MAX_WEIGHT}`);
  }
}

function validateSets(sets: string | number, errors: ValidationErrors): void {
  if (sets === '' || sets === null || sets === undefined) return;
  const s = Number.parseInt(String(sets), 10);
  if (Number.isNaN(s)) {
    errors.push('Las series deben ser un número válido');
  } else if (s < 1) {
    errors.push('Las series deben ser al menos 1');
  } else if (s > VALIDATION_LIMITS.MAX_SETS) {
    errors.push(`Las series no pueden exceder ${VALIDATION_LIMITS.MAX_SETS}`);
  }
}

function validateReps(reps: string, errors: ValidationErrors): void {
  if (!reps?.trim()) {
    errors.push('Las repeticiones son obligatorias');
    return;
  }
  const repsValue = reps.trim();
  if (repsValue.endsWith('s')) {
    const timeValue = Number.parseInt(repsValue.slice(0, -1), 10);
    if (Number.isNaN(timeValue)) {
      errors.push('El formato de tiempo debe ser un número seguido de "s" (ej: 30s)');
    } else if (timeValue < 1) {
      errors.push('El tiempo debe ser al menos 1 segundo');
    } else if (timeValue > VALIDATION_LIMITS.MAX_DURATION_SECONDS) {
      errors.push(`El tiempo no puede exceder ${VALIDATION_LIMITS.MAX_DURATION_SECONDS} segundos`);
    }
  } else {
    const r = Number.parseInt(repsValue, 10);
    if (Number.isNaN(r)) {
      errors.push('Las repeticiones deben ser un número válido o tiempo (ej: 30s)');
    } else if (r < 1) {
      errors.push('Las repeticiones deben ser al menos 1');
    } else if (r > VALIDATION_LIMITS.MAX_REPS) {
      errors.push(`Las repeticiones no pueden exceder ${VALIDATION_LIMITS.MAX_REPS}`);
    }
  }
}

/**
 * Validates exercise input data
 * @param name - Exercise name
 * @param weight - Exercise weight
 * @param sets - Number of sets
 * @param reps - Reps or duration (e.g., "12" or "50s")
 * @returns Array of validation error messages
 */
function validateExerciseInput(
  name: string,
  weight: string | number,
  sets: string | number,
  reps: string
): ValidationErrors {
  const errors: ValidationErrors = [];

  if (!name?.trim()) {
    errors.push('El nombre del ejercicio es obligatorio');
    return errors;
  }
  if (name.trim().length > VALIDATION_LIMITS.MAX_EXERCISE_NAME_LENGTH) {
    errors.push(`El nombre del ejercicio no puede exceder ${VALIDATION_LIMITS.MAX_EXERCISE_NAME_LENGTH} caracteres`);
  }

  validateWeight(weight, errors);
  validateSets(sets, errors);
  validateReps(reps, errors);

  return errors;
}

// ── EXPORTS ──

// Export functions for use in other modules
export {
  // Constants
  EXERCISE_DATABASE,
  DAYS_OF_WEEK,
  MONTHS,
  VALIDATION_LIMITS,
  STORAGE_KEYS,

  // State
  appState,

  // Storage functions
  sD,
  gD,
  sBW,
  gBW,
  clearPerformanceCache,

  // Utility functions
  toggleVis,
  escHtml,
  toggleTheme,
  initTheme,
  openM,
  closeM,
  acIn,
  acKey,
  showS,
  changeDay,
  validateExerciseInput,
  isPR,
  renderToday
};

// Make functions globally available for backward compatibility
(globalThis as any).sD = sD;
(globalThis as any).gD = gD;
(globalThis as any).sBW = sBW;
(globalThis as any).gBW = gBW;
(globalThis as any).clearPerformanceCache = clearPerformanceCache;
(globalThis as any).toggleVis = toggleVis;
(globalThis as any).escHtml = escHtml;
(globalThis as any).toggleTheme = toggleTheme;
(globalThis as any).initTheme = initTheme;
(globalThis as any).openM = openM;
(globalThis as any).closeM = closeM;
(globalThis as any).acIn = acIn;
(globalThis as any).acKey = acKey;
(globalThis as any).showS = showS;
(globalThis as any).changeDay = changeDay;
(globalThis as any).validateExerciseInput = validateExerciseInput;
(globalThis as any).isPR = isPR;
(globalThis as any).renderToday = renderToday;
(globalThis as any).appState = appState;
(globalThis as any).EXERCISE_DATABASE = EXERCISE_DATABASE;
