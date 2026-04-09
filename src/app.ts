// ============================================================
// app.ts â€” Estado global, tema, navegaciÃ³n y perfil de usuario
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

// â”€â”€ CONSTANTS â”€â”€

// Exercise database with proper typing
const EXERCISE_DATABASE: ExerciseDatabaseEntry[] = [
  {n:'Sentadilla',m:'Piernas'},{n:'Sentadilla sumo',m:'Piernas'},{n:'Goblet squat',m:'Piernas'},
  {n:'Peso muerto',m:'Piernas / Espalda'},{n:'Peso muerto rumano',m:'Isquiotibiales'},
  {n:'Desplantes hacia adelante',m:'Piernas'},{n:'Desplantes hacia atrÃ¡s',m:'Piernas'},
  {n:'Desplantes laterales',m:'Piernas'},{n:'Prensa de pierna',m:'Piernas'},
  {n:'ExtensiÃ³n de cuÃ¡driceps',m:'CuÃ¡driceps'},{n:'Curl de pierna acostado',m:'Isquiotibiales'},
  {n:'Curl de pierna sentado',m:'Isquiotibiales'},{n:'Hip thrust',m:'GlÃºteos'},
  {n:'Patada de glÃºteo',m:'GlÃºteos'},{n:'AbducciÃ³n de cadera',m:'GlÃºteos'},
  {n:'ElevaciÃ³n de talones',m:'Pantorrillas'},{n:'Step up',m:'Piernas'},
  {n:'Press de pecho',m:'Pecho'},{n:'Press de pecho inclinado',m:'Pecho'},
  {n:'Press de pecho declinado',m:'Pecho'},{n:'Press banca con barra',m:'Pecho'},
  {n:'Apertura con mancuernas',m:'Pecho'},{n:'Fondos en barras',m:'Pecho / TrÃ­ceps'},
  {n:'Flexiones',m:'Pecho'},{n:'Crossover',m:'Pecho'},
  {n:'Remo con barra',m:'Espalda'},{n:'Remo unilateral',m:'Espalda'},
  {n:'Remo en polea baja',m:'Espalda'},{n:'JalÃ³n al pecho',m:'Espalda'},
  {n:'JalÃ³n con agarre neutro',m:'Espalda'},{n:'Chin-ups',m:'Espalda / BÃ­ceps'},
  {n:'Pull-ups',m:'Espalda'},{n:'Face pull',m:'Espalda / Hombros'},
  {n:'Buenos dÃ­as',m:'Espalda baja'},
  {n:'Press de hombro con barra',m:'Hombros'},{n:'Press militar',m:'Hombros'},
  {n:'Press Arnold',m:'Hombros'},{n:'Elevaciones laterales',m:'Hombros'},
  {n:'Elevaciones frontales',m:'Hombros'},{n:'PÃ¡jaro',m:'Hombros'},
  {n:'Curl con barra',m:'BÃ­ceps'},{n:'Curl con mancuernas',m:'BÃ­ceps'},
  {n:'Martillo',m:'BÃ­ceps'},{n:'Curl predicador',m:'BÃ­ceps'},
  {n:'Curl concentrado',m:'BÃ­ceps'},{n:'Curl en polea',m:'BÃ­ceps'},
  {n:'Copa (Skull crusher)',m:'TrÃ­ceps'},{n:'ExtensiÃ³n de trÃ­ceps',m:'TrÃ­ceps'},
  {n:'ExtensiÃ³n sobre cabeza',m:'TrÃ­ceps'},{n:'Press francÃ©s',m:'TrÃ­ceps'},
  {n:'JalÃ³n de trÃ­ceps en polea',m:'TrÃ­ceps'},{n:'Kick back',m:'TrÃ­ceps'},
  {n:'Plancha',m:'Core'},{n:'Crunch',m:'Abdomen'},{n:'Crunch en polea',m:'Abdomen'},
  {n:'ElevaciÃ³n de piernas',m:'Abdomen'},{n:'Russian twist',m:'Abdomen'},
  {n:'Dead bug',m:'Core'},{n:'Caminadora',m:'Cardio'},{n:'Bicicleta estÃ¡tica',m:'Cardio'},
  {n:'ElÃ­ptica',m:'Cardio'},{n:'Burpees',m:'Funcional'},{n:'Salto a la caja',m:'Funcional'},
];

// UI Constants
const DAYS_OF_WEEK: readonly string[] = ['domingo','lunes','martes','miÃ©rcoles','jueves','viernes','sÃ¡bado'];
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

// â”€â”€ GLOBAL STATE â”€â”€

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

// Global variables defined in db.ts
// Inicializados como null; db.ts los sobreescribe vÃ­a window en el navegador
let currentUser: UserProfile | null = null;
let currentProfile: UserProfile | null = null;

// STORAGE (localStorage â€” usado solo para import/demo offline)

/**
 * Saves gym data to localStorage
 * @param data - Exercise data object
 */
function sD(data: Record<string, Exercise[]>): void {
  localStorage.setItem(STORAGE_KEYS.GYM_DATA_PREFIX + (currentUser?.id || ''), JSON.stringify(data));
}

/**
 * Loads gym data from localStorage
 * @returns Exercise data object
 */
function gD(): Record<string, Exercise[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GYM_DATA_PREFIX + (currentUser?.id || ''));
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Saves body weight data to localStorage
 * @param data - Body weight data object
 */
function sBW(data: Record<string, BodyWeightEntry>): void {
  localStorage.setItem(STORAGE_KEYS.BODY_WEIGHT_PREFIX + (currentUser?.id || ''), JSON.stringify(data));
}

/**
 * Loads body weight data from localStorage
 * @returns Body weight data object
 */
function gBW(): Record<string, BodyWeightEntry> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BODY_WEIGHT_PREFIX + (currentUser?.id || ''));
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
  // Update header with current date and profile info
  const headerElement = document.getElementById('dSub');
  if (headerElement && appState.viewDate) {
    headerElement.textContent = `${appState.viewDate.getDate()} de ${MONTHS[appState.viewDate.getMonth()]} ${appState.viewDate.getFullYear()} Â· ${(currentProfile?.name || '')}`;
  }

  // Render exercises for current date
  const exerciseList = document.getElementById('exList');
  if (exerciseList) {
    // This would need the full exercise rendering logic
    // For now, just clear it
    exerciseList.innerHTML = '';
  }
}

// â”€â”€ UTILITY FUNCTIONS â”€â”€

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
  renderToday();
}

function validateWeight(weight: string | number, errors: ValidationErrors): void {
  if (weight === '' || weight === null || weight === undefined) return;
  const w = Number.parseFloat(String(weight));
  if (Number.isNaN(w)) {
    errors.push('El peso debe ser un nÃºmero vÃ¡lido');
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
    errors.push('Las series deben ser un nÃºmero vÃ¡lido');
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
      errors.push('El formato de tiempo debe ser un nÃºmero seguido de "s" (ej: 30s)');
    } else if (timeValue < 1) {
      errors.push('El tiempo debe ser al menos 1 segundo');
    } else if (timeValue > VALIDATION_LIMITS.MAX_DURATION_SECONDS) {
      errors.push(`El tiempo no puede exceder ${VALIDATION_LIMITS.MAX_DURATION_SECONDS} segundos`);
    }
  } else {
    const r = Number.parseInt(repsValue, 10);
    if (Number.isNaN(r)) {
      errors.push('Las repeticiones deben ser un nÃºmero vÃ¡lido o tiempo (ej: 30s)');
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

// â”€â”€ EXPORTS â”€â”€

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
(globalThis as any).showS = showS;
(globalThis as any).changeDay = changeDay;
(globalThis as any).validateExerciseInput = validateExerciseInput;
(globalThis as any).isPR = isPR;
(globalThis as any).renderToday = renderToday;
