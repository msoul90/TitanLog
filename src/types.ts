// ============================================================
// types.ts — Definiciones de tipos TypeScript para IronLog
// ============================================================

// ── CORE DATA TYPES ──

// Exercise entry structure
export interface Exercise {
  name: string;
  weight?: string | number | null;
  unit?: string;
  sets?: string | number | null;
  reps: string;
  notes?: string | null;
  ts: number; // timestamp
}

// Body weight/composition entry
export interface BodyWeightEntry {
  v: number; // value (weight)
  u?: string; // unit
  fat?: number; // body fat percentage
  mmc?: number; // muscle mass percentage
  ts?: number; // timestamp
  id?: string;
}

// HIIT session structure
export interface HIITSession {
  id?: string;
  date: string;
  name: string;
  rounds?: number;
  duration?: string;
  notes?: string;
  rpe?: RPEValue;
  exercises: HIITExercise[];
  created_at?: string;
}

// HIIT exercise within a session
export interface HIITExercise {
  name: string;
  duration?: string | number;
  reps?: string | number;
  rounds?: number;
}

// ── ENUMS & UNION TYPES ──

// RPE (Rate of Perceived Exertion) values
export type RPEValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Timer phases
export type TimerPhase = 'idle' | 'work' | 'rest' | 'done';

// Exercise categories
export type ExerciseCategory =
  | 'Piernas'
  | 'Espalda'
  | 'Pecho'
  | 'Hombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Abdomen'
  | 'Core'
  | 'Cardio'
  | 'Funcional'
  | 'Piernas / Espalda'
  | 'Isquiotibiales'
  | 'Cuádriceps'
  | 'Glúteos'
  | 'Pantorrillas'
  | 'Pecho / Tríceps'
  | 'Espalda / Bíceps'
  | 'Espalda / Hombros'
  | 'Espalda baja';

// ── APPLICATION STATE TYPES ──

// Global application state
export interface AppState {
  viewDate: Date;
  calendarDate: Date;
  editExerciseId: string | null;
  bodyWeightUnit: string;
  timerInterval: number | null;
  timerSeconds: number;
  autocompleteItems: HTMLElement[];
  autocompleteSelectedIndex: number;
  exerciseListCache: ExerciseDatabaseEntry[];
  personalRecordCache: Map<string, { max: number; weight: number }>;
  autocompleteTimeout: number | null;
}

// User profile
export interface UserProfile {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

// ── UI & DOM TYPES ──

// Toast notification types
export type ToastType = 'success' | 'error' | 'info';

// Validation error messages
export type ValidationErrors = string[];

// Exercise guide structure
export interface ExerciseGuide {
  emoji: string;
  primary: string[];
  secondary: string[];
  steps: string[];
  errors?: string[];
  tips?: string[];
}

// Stretching guide structure
export interface StretchGuide {
  emoji: string;
  category: 'pre' | 'post' | 'both'; // pre-entreno, post-entreno, o ambos
  area: string[]; // zonas del cuerpo
  duration: string; // tiempo recomendado
  steps: string[];
  tips?: string[];
}

// ── DATABASE & STORAGE TYPES ──

// Supabase response types
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Supabase User type
export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}

// Local storage data structure
export interface LocalStorageData {
  [dateKey: string]: Exercise[];
}

// Gym session data (cache)
export interface GymSessionData {
  [dateKey: string]: { exercises: Exercise[]; id?: string };
}

// HIIT session data (cache)
export interface HIITSessionData {
  [dateKey: string]: HIITSession[];
}

// Body weight data (cache)
export interface BodyWeightData {
  [dateKey: string]: BodyWeightEntry & { id?: string };
}

// ── AUTHENTICATION TYPES ──

// Authentication mode
export type AuthMode = 'signin' | 'signup' | 'reset';

// ── UTILITY TYPES ──

// ── FUNCTION SIGNATURES ──

// Validation function type
export type ValidationFunction = (
  name: string,
  weight: string | number,
  sets: string | number,
  reps: string
) => ValidationErrors;

// Exercise database entry
export interface ExerciseDatabaseEntry {
  n: string; // name
  m: string; // muscle group
}

// ── CONFIGURATION TYPES ──

// Validation limits
export interface ValidationLimits {
  MAX_EXERCISE_NAME_LENGTH: number;
  MAX_WEIGHT: number;
  MAX_SETS: number;
  MAX_REPS: number;
  MAX_DURATION_SECONDS: number;
  AUTOCOMPLETE_DEBOUNCE_MS: number;
  MAX_PR_CACHE_SIZE: number;
}

// Storage keys
export interface StorageKeys {
  THEME: string;
  USER_PROFILE_PREFIX: string;
  GYM_DATA_PREFIX: string;
  BODY_WEIGHT_PREFIX: string;
  HIIT_DATA_PREFIX: string;
}

// ── EVENT HANDLER TYPES ──

// DOM event handlers
export type EventHandler<T extends Event = Event> = (event: T) => void;
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;
export type MouseEventHandler = EventHandler<MouseEvent>;
export type InputEventHandler = EventHandler<InputEvent>;
export type ChangeEventHandler = EventHandler<Event>;

// ── API RESPONSE TYPES ──

// Generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


