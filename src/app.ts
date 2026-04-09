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
import { dk } from './db.js';

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
  {n:'Dead bug',m:'Core'},{n:'Caminadora',m:'Cardio'},{n:'Bicicleta estática',m:'Cardio'},
  {n:'Elíptica',m:'Cardio'},{n:'Burpees',m:'Funcional'},{n:'Salto a la caja',m:'Funcional'},
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

// Global variables defined in db.ts
// Inicializados como null; db.ts los sobreescribe vía window en el navegador
let currentUser: UserProfile | null = null;
let currentProfile: UserProfile | null = null;

// STORAGE (localStorage — usado solo para import/demo offline)

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
function isPR(name: string, curKey: string, weight: string | number | null | undefined): boolean {
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
    headerElement.textContent = `${appState.viewDate.getDate()} de ${MONTHS[appState.viewDate.getMonth()]} ${appState.viewDate.getFullYear()} · ${(currentProfile?.name || '')}`;
  }

  // Render exercises for current date
  const exercises = gD()[dk(appState.viewDate)] || [];
  const exerciseList = document.getElementById('exList');
  if (exerciseList) {
    // This would need the full exercise rendering logic
    // For now, just clear it
    exerciseList.innerHTML = '';
  }
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
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
}

/**
 * Initializes theme on page load
 */
function initTheme(): void {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * Opens a modal by ID
 * @param modalId - The modal element ID
 */
function openM(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    (modal as HTMLElement).style.display = 'block';
  }
}

/**
 * Closes a modal by ID
 * @param modalId - The modal element ID
 */
function closeM(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    (modal as HTMLElement).style.display = 'none';
  }
}

/**
 * Shows a specific section and updates navigation
 * @param name - Section name to show
 * @param btn - Navigation button element
 */
function showS(name: string, btn: HTMLElement): void {
  // Hide all sections
  document.querySelectorAll('.section').forEach((section: Element) => {
    (section as HTMLElement).style.display = 'none';
  });

  // Show target section
  const targetSection = document.getElementById(name);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  // Update navigation
  document.querySelectorAll('.nav-btn').forEach((navBtn: Element) => {
    navBtn.classList.remove('active');
  });
  btn.classList.add('active');

  // Update URL hash
  window.location.hash = name;
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
  showS,
  changeDay,
  validateExerciseInput,
  isPR,
  renderToday
};

// Make functions globally available for backward compatibility
(window as any).sD = sD;
(window as any).gD = gD;
(window as any).sBW = sBW;
(window as any).gBW = gBW;
(window as any).clearPerformanceCache = clearPerformanceCache;
(window as any).toggleVis = toggleVis;
(window as any).escHtml = escHtml;
(window as any).toggleTheme = toggleTheme;
(window as any).initTheme = initTheme;
(window as any).openM = openM;
(window as any).closeM = closeM;
(window as any).showS = showS;
(window as any).changeDay = changeDay;
(window as any).validateExerciseInput = validateExerciseInput;
(window as any).isPR = isPR;
(window as any).renderToday = renderToday;