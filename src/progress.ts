import { Exercise, BodyWeightEntry } from './types.js';
import { dk, getCurrentProfile } from './db.js';
import { escHtml, gD, sD, gBW, sBW, renderToday, isPR } from './app.js';

// DOM element IDs
const PROGRESS_DOM_IDS = {
  // Statistics display
  DAYS_COUNT: 'sDay',
  EXERCISES_COUNT: 'sEx',
  PR_COUNT: 'sPR',
  STREAK_COUNT: 'sStr',
  WEEK_STREAK_COUNT: 'sWStr',
  WEEK_DOTS: 'weekDots',
  BC_SECTION: 'bcSection',
  PROGRESS_LIST: 'progList',
  TOAST: 'toast',
  IMPORT_FILE: 'impFile'
} as const;

// Progress calculation constants
const PROGRESS_CONSTANTS = {
  MAX_HISTORY_DOTS: 10,
  MAX_PROGRESS_DOTS: 8,
  MAX_WEEK_CHECK: 52,
  MILLISECONDS_PER_DAY: 86400000,
  WEEK_DAYS: 7
} as const;

// Body composition metrics
const BC_METRICS = {
  WEIGHT: { emoji: '⚖️', label: 'Peso', invertDelta: false },
  FAT_PERCENT: { emoji: '🔥', label: '% Grasa', invertDelta: true },
  MMC_PERCENT: { emoji: '💪', label: '% MMC', invertDelta: false }
} as const;

// History chart titles
const HISTORY_TITLES = {
  WEIGHT: '📈 Historial de peso',
  FAT: '🔥 Historial % grasa',
  MMC: '💪 Historial % masa muscular'
} as const;

// Export/import constants
const EXPORT_CONSTANTS = {
  DEFAULT_USER: 'usuario',
  JSON_INDENT: 2,
  CSV_HEADERS: 'Fecha,Ejercicio,Peso,Unidad,Series,Repeticiones,Observaciones',
  TOAST_DURATION: 2400
} as const;

// Type definitions for progress calculations
interface MonthlyStats {
  trainingDays: number;
  totalExercises: number;
  personalRecords: number;
}

interface ExerciseProgressEntry {
  date: string;
  weight: number;
  unit: string;
}

interface ExerciseProgressMap {
  [exerciseName: string]: ExerciseProgressEntry[];
}

// ── UTILITY FUNCTIONS ──

/**
 * Calculates delta HTML for body composition cards
 * @param current - Current value
 * @param previous - Previous value
 * @param unit - Unit symbol
 * @param invertColor - Whether to invert color logic (good when lower is better)
 * @returns HTML string for delta display
 */
function deltaHtml(current: number | null, previous: number | null, unit: string, invertColor: boolean): string {
  if (current == null) return '';
  if (previous == null) return '<div class="bc-lc-delta neu">-</div>';

  const diff = (current - previous).toFixed(1);
  const isIncrease = Number.parseFloat(diff) > 0;
  const isGoodChange = !invertColor;
  let cssClass = 'neu';
  if (diff !== '0.0') {
    cssClass = isIncrease === isGoodChange ? 'up' : 'dn';
  }

  return `<div class="bc-lc-delta ${cssClass}">${isIncrease ? '?' : '?'} ${Math.abs(Number.parseFloat(diff))} ${unit}</div>`;
}

/**
 * Returns ISO week string (YYYY-WNN) for a given date, Monday-based
 * @param date - Date to get week for
 * @returns Week string in format YYYY-WNN
 */
function getMonWeek(date: Date): string {
  // Algorithm: Adjust date to Thursday of the week, then calculate week number from year start
  // This ensures correct ISO week numbering where weeks start on Monday
  const workingDate = new Date(date);
  workingDate.setHours(0, 0, 0, 0);
  workingDate.setDate(workingDate.getDate() + 4 - (workingDate.getDay() || 7)); // Thursday of week

  const yearStart = new Date(workingDate.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((workingDate.getTime() - yearStart.getTime()) / PROGRESS_CONSTANTS.MILLISECONDS_PER_DAY) + 1) / PROGRESS_CONSTANTS.WEEK_DAYS);

  return `${workingDate.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// ── PROGRESS RENDERING ──

/**
 * Main function to render the progress section
 * Orchestrates all progress calculations and UI updates
 */
export function renderProg(): void {
  const exerciseData: Record<string, Exercise[]> = gD();
  const today = new Date();

  // Calculate monthly statistics
  const monthlyStats = calculateMonthlyStats(exerciseData, today);

  // Calculate streaks
  const dailyStreak = calculateDailyStreak(exerciseData, today);
  const weeklyStreak = calculateWeeklyStreak(exerciseData, today);

  // Update statistics display
  updateStatisticsDisplay(monthlyStats, dailyStreak, weeklyStreak);

  // Render weekly visualization
  renderWeeklyDots(exerciseData, today);

  // Render body composition section
  renderBodyCompositionSection();

  // Render exercise progress
  renderExerciseProgress(exerciseData);
}

/**
 * Calculates monthly statistics for the current month
 * @param exerciseData - Exercise data object
 * @param today - Current date
 * @returns Monthly statistics
 */
function calculateMonthlyStats(exerciseData: Record<string, Exercise[]>, today: Date): MonthlyStats {
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  let trainingDays = 0;
  let totalExercises = 0;
  let personalRecords = 0;

  for (const [dateKey, exercises] of Object.entries(exerciseData)) {
    if (dateKey.startsWith(monthKey)) {
      trainingDays++;
      totalExercises += exercises.length;
      personalRecords += exercises.filter(ex => isPR(ex.name, dateKey, ex.weight)).length;
    }
  }

  return { trainingDays, totalExercises, personalRecords };
}

/**
 * Calculates the current daily streak
 * @param exerciseData - Exercise data object
 * @param today - Current date
 * @returns Daily streak length
 */
function calculateDailyStreak(exerciseData: Record<string, Exercise[]>, today: Date): number {
  let streak = 0;
  const streakDate = new Date(today);

  while (true) {
    const dateKey = dk(streakDate);
    const dayExercises = exerciseData[dateKey];

    if (!dayExercises || dayExercises.length === 0) {
      break;
    }

    streak++;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  return streak;
}

/**
 * Calculates the current weekly streak
 * @param exerciseData - Exercise data object
 * @param today - Current date
 * @returns Weekly streak length
 */
function calculateWeeklyStreak(exerciseData: Record<string, Exercise[]>, today: Date): number {
  // Build set of weeks with training sessions
  const trainedWeeks = new Set<string>();
  for (const [dateKey, exercises] of Object.entries(exerciseData)) {
    if (exercises.length > 0) {
      trainedWeeks.add(getMonWeek(new Date(dateKey)));
    }
  }

  // Count consecutive weeks backwards from current week
  let weekStreak = 0;
  let checkDate = new Date(today);

  // Go to Monday of current week (Monday = 0 in our calculation)
  const dayOfWeek = (checkDate.getDay() + 6) % 7;
  checkDate.setDate(checkDate.getDate() - dayOfWeek);

  for (let weekIndex = 0; weekIndex < PROGRESS_CONSTANTS.MAX_WEEK_CHECK; weekIndex++) {
    const weekKey = getMonWeek(checkDate);

    if (trainedWeeks.has(weekKey)) {
      weekStreak++;
      checkDate.setDate(checkDate.getDate() - PROGRESS_CONSTANTS.WEEK_DAYS);
    } else {
      // For current week, don't break if no training yet
      if (weekIndex === 0) {
        checkDate.setDate(checkDate.getDate() - PROGRESS_CONSTANTS.WEEK_DAYS);
        continue;
      }
      break;
    }
  }

  return weekStreak;
}

/**
 * Updates the statistics display elements
 * @param monthlyStats - Monthly statistics
 * @param dailyStreak - Daily streak count
 * @param weeklyStreak - Weekly streak count
 */
function updateStatisticsDisplay(monthlyStats: MonthlyStats, dailyStreak: number, weeklyStreak: number): void {
  const daysElement = document.getElementById(PROGRESS_DOM_IDS.DAYS_COUNT);
  const exercisesElement = document.getElementById(PROGRESS_DOM_IDS.EXERCISES_COUNT);
  const prElement = document.getElementById(PROGRESS_DOM_IDS.PR_COUNT);
  const streakElement = document.getElementById(PROGRESS_DOM_IDS.STREAK_COUNT);
  const weekStreakElement = document.getElementById(PROGRESS_DOM_IDS.WEEK_STREAK_COUNT);

  if (daysElement) daysElement.textContent = monthlyStats.trainingDays.toString();
  if (exercisesElement) exercisesElement.textContent = monthlyStats.totalExercises.toString();
  if (prElement) prElement.textContent = monthlyStats.personalRecords.toString();
  if (streakElement) streakElement.textContent = dailyStreak.toString();
  if (weekStreakElement) weekStreakElement.textContent = weeklyStreak.toString();
}

/**
 * Renders the weekly training dots visualization
 * @param exerciseData - Exercise data object
 * @param today - Current date
 */
function renderWeeklyDots(exerciseData: Record<string, Exercise[]>, today: Date): void {
  const trainedWeeks = new Set<string>();
  for (const [dateKey, exercises] of Object.entries(exerciseData)) {
    if (exercises.length > 0) {
      trainedWeeks.add(getMonWeek(new Date(dateKey)));
    }
  }

  const dotContainer = document.getElementById(PROGRESS_DOM_IDS.WEEK_DOTS);
  if (!dotContainer) return;

  const dots: string[] = [];
  let dotDate = new Date(today);

  // Go to Monday of current week
  const dayOfWeek = (dotDate.getDay() + 6) % 7;
  dotDate.setDate(dotDate.getDate() - dayOfWeek);

  // Go back 7 more weeks to show 8 weeks total
  dotDate.setDate(dotDate.getDate() - PROGRESS_CONSTANTS.WEEK_DAYS * 7);

  for (let weekIndex = 0; weekIndex < PROGRESS_CONSTANTS.MAX_PROGRESS_DOTS; weekIndex++) {
    const weekKey = getMonWeek(dotDate);
    const isCurrentWeek = weekIndex === PROGRESS_CONSTANTS.MAX_PROGRESS_DOTS - 1;
    const hasTraining = trainedWeeks.has(weekKey);

    // Extract week number for display
    const weekNumber = Number.parseInt(weekKey.split('-W')[1] ?? '0', 10);

    let cssClass = 'week-dot';
    if (hasTraining && !isCurrentWeek) cssClass += ' done streak';
    else if (hasTraining && isCurrentWeek) cssClass += ' done';
    else if (isCurrentWeek) cssClass += ' current';

    const displayText = hasTraining ? '✓' : `S${weekNumber}`;
    dots.push(`<div class="${cssClass}" title="Semana ${weekNumber}">${displayText}</div>`);

    dotDate.setDate(dotDate.getDate() + PROGRESS_CONSTANTS.WEEK_DAYS);
  }

  dotContainer.innerHTML = dots.join('');
}

/**
 * Renders the body composition section
 */
function renderBodyCompositionSection(): void {
  const bodyWeightData: Record<string, BodyWeightEntry> = gBW();
  const bodyCompositionEntries = Object.entries(bodyWeightData).sort(([a], [b]) => a.localeCompare(b));
  const bcElement = document.getElementById(PROGRESS_DOM_IDS.BC_SECTION);

  if (!bcElement) return;

  if (!bodyCompositionEntries.length) {
    bcElement.innerHTML = '<div style="color:var(--text3);font-size:0.8rem;padding:4px 2px">Registra tu composición corporal para ver el historial.</div>';
    return;
  }

  const latestEntry = bodyCompositionEntries.at(-1)?.[1];
  if (!latestEntry) return;
  const previousEntry = bodyCompositionEntries.length > 1 ? bodyCompositionEntries.at(-2)?.[1] ?? null : null;
  const unit = latestEntry.u || 'lb';

  let html = generateBodyCompositionCards(latestEntry, previousEntry, unit);
  html += generateWeightHistory(bodyCompositionEntries);
  html += generateFatHistory(bodyCompositionEntries);
  html += generateMmcHistory(bodyCompositionEntries);

  bcElement.innerHTML = html;
}

/**
 * Generates the latest body composition metric cards
 * @param latest - Latest body composition data
 * @param previous - Previous body composition data
 * @param unit - Weight unit
 * @returns HTML for metric cards
 */
function generateBodyCompositionCards(latest: BodyWeightEntry, previous: BodyWeightEntry | null, unit: string): string {
  const fatText = latest.fat == null ? '—' : `${latest.fat}%`;
  const mmcText = latest.mmc == null ? '—' : `${latest.mmc}%`;

  return `
    <div class="bc-latest-cards">
      <div class="bc-lc">
        <div class="bc-lc-val">${latest.v} <span style="font-size:0.7rem;color:var(--text2)">${unit}</span></div>
        <div class="bc-lc-lbl">${BC_METRICS.WEIGHT.emoji} ${BC_METRICS.WEIGHT.label}</div>
        ${deltaHtml(latest.v, previous?.v || null, unit, BC_METRICS.WEIGHT.invertDelta)}
      </div>
      <div class="bc-lc">
        <div class="bc-lc-val">${fatText}</div>
        <div class="bc-lc-lbl">${BC_METRICS.FAT_PERCENT.emoji} ${BC_METRICS.FAT_PERCENT.label}</div>
        ${deltaHtml(latest.fat ?? null, previous?.fat ?? null, '%', BC_METRICS.FAT_PERCENT.invertDelta)}
      </div>
      <div class="bc-lc">
        <div class="bc-lc-val">${mmcText}</div>
        <div class="bc-lc-lbl">${BC_METRICS.MMC_PERCENT.emoji} ${BC_METRICS.MMC_PERCENT.label}</div>
        ${deltaHtml(latest.mmc ?? null, previous?.mmc ?? null, '%', BC_METRICS.MMC_PERCENT.invertDelta)}
      </div>
    </div>`;
}

/**
 * Generates weight history visualization
 * @param entries - Body composition entries
 * @returns HTML for weight history
 */
function generateWeightHistory(entries: [string, BodyWeightEntry][]): string {
  const weightEntries = entries.filter(([, entry]) => entry.v != null);
  if (weightEntries.length === 0) return '';

  const recentEntries = weightEntries.slice(-PROGRESS_CONSTANTS.MAX_HISTORY_DOTS);
  const dotsHtml = recentEntries.map(([key, entry]) => {
    const date = new Date(key);
    return `<div class="bc-hdot"><span class="bhv">${entry.v}<span style="font-size:0.6rem;font-weight:400"> ${entry.u || 'lb'}</span></span>${date.getDate()}/${date.getMonth() + 1}</div>`;
  }).join('');

  return `<div class="bc-hist-card">
    <div class="bc-hist-title">${HISTORY_TITLES.WEIGHT}</div>
    <div class="bc-hist-dots">${dotsHtml}</div>
  </div>`;
}

/**
 * Generates fat percentage history visualization
 * @param entries - Body composition entries
 * @returns HTML for fat history
 */
function generateFatHistory(entries: [string, BodyWeightEntry][]): string {
  const fatEntries = entries.filter(([, entry]) => entry.fat != null);
  if (fatEntries.length === 0) return '';

  const recentEntries = fatEntries.slice(-PROGRESS_CONSTANTS.MAX_HISTORY_DOTS);
  const dotsHtml = recentEntries.map(([key, entry]) => {
    const date = new Date(key);
    return `<div class="bc-hdot"><span class="bhv">${entry.fat}%</span>${date.getDate()}/${date.getMonth() + 1}</div>`;
  }).join('');

  return `<div class="bc-hist-card">
    <div class="bc-hist-title">${HISTORY_TITLES.FAT}</div>
    <div class="bc-hist-dots">${dotsHtml}</div>
  </div>`;
}

/**
 * Generates muscle mass percentage history visualization
 * @param entries - Body composition entries
 * @returns HTML for MMC history
 */
function generateMmcHistory(entries: [string, BodyWeightEntry][]): string {
  const mmcEntries = entries.filter(([, entry]) => entry.mmc != null);
  if (mmcEntries.length === 0) return '';

  const recentEntries = mmcEntries.slice(-PROGRESS_CONSTANTS.MAX_HISTORY_DOTS);
  const dotsHtml = recentEntries.map(([key, entry]) => {
    const date = new Date(key);
    return `<div class="bc-hdot"><span class="bhv">${entry.mmc}%</span>${date.getDate()}/${date.getMonth() + 1}</div>`;
  }).join('');

  return `<div class="bc-hist-card">
    <div class="bc-hist-title">${HISTORY_TITLES.MMC}</div>
    <div class="bc-hist-dots">${dotsHtml}</div>
  </div>`;
}

/**
 * Renders the exercise progress section
 * @param exerciseData - Exercise data object
 */
function renderExerciseProgress(exerciseData: Record<string, Exercise[]>): void {
  const exerciseMap = buildExerciseProgressMap(exerciseData);
  const progressListElement = document.getElementById(PROGRESS_DOM_IDS.PROGRESS_LIST);

  if (!progressListElement) return;

  const entries = Object.entries(exerciseMap).filter(([, progressData]) => progressData.length > 0);

  if (!entries.length) {
    progressListElement.innerHTML = '<div class="empty"><div class="empty-ic">📊</div><div class="empty-tx">Registra ejercicios con peso<br>para ver el progreso aquí.</div></div>';
    return;
  }

  const progressCards = entries.map(([exerciseName, progressData]) => {
    return generateExerciseProgressCard(exerciseName, progressData);
  }).join('');

  progressListElement.innerHTML = progressCards;
}

/**
 * Builds a map of exercise progress data
 * @param exerciseData - Exercise data object
 * @returns Exercise progress map
 */
function buildExerciseProgressMap(exerciseData: Record<string, Exercise[]>): ExerciseProgressMap {
  const exerciseMap: ExerciseProgressMap = {};

  // Sort dates to ensure chronological order
  const sortedDates = Object.keys(exerciseData).sort((a, b) => a.localeCompare(b));

  for (const dateKey of sortedDates) {
    const dailyExercises = exerciseData[dateKey] ?? [];
    for (const exercise of dailyExercises) {
      const exerciseProgress = exerciseMap[exercise.name] ?? [];

      if (exercise.weight != null) {
        const weight = typeof exercise.weight === 'string' ? Number.parseFloat(exercise.weight) : exercise.weight;
        if (typeof weight === 'number' && Number.isFinite(weight)) {
          exerciseProgress.push({
            date: dateKey,
            weight,
            unit: exercise.unit || 'lb'
          });
          exerciseMap[exercise.name] = exerciseProgress;
        }
      }
    }
  }

  return exerciseMap;
}

/**
 * Generates an exercise progress card
 * @param exerciseName - Name of the exercise
 * @param progressData - Progress data for the exercise
 * @returns HTML for exercise progress card
 */
function generateExerciseProgressCard(exerciseName: string, progressData: ExerciseProgressEntry[]): string {
  const maxWeight = Math.max(...progressData.map(entry => entry.weight));
  const recentEntries = progressData.slice(-PROGRESS_CONSTANTS.MAX_PROGRESS_DOTS);
  const latestEntry = progressData.at(-1);
  if (!latestEntry) return '';

  const progressDots = recentEntries.map(entry => {
    const date = new Date(entry.date);
    const isPersonalRecord = entry.weight === maxWeight;
    const cssClass = `p-dot${isPersonalRecord ? ' pk' : ''}`;

    return `<div class="${cssClass}"><span class="pv">${entry.weight}</span>${date.getDate()}/${date.getMonth() + 1}</div>`;
  }).join('');

  const latestUnit = latestEntry.unit || 'lb';

  return `<div class="prog-card">
    <div class="pc-top">
      <div class="pc-name">${escHtml(exerciseName)}</div>
      <div class="pc-best">🏆 Máx: ${maxWeight} ${escHtml(latestUnit)}</div>
    </div>
    <div class="pc-dots">${progressDots}</div>
  </div>`;
}

// ── EXPORT / IMPORT ──

/**
 * Exports user data as JSON file
 */
export function expJSON(): void {
  try {
    const userName = getCurrentProfile()?.name || EXPORT_CONSTANTS.DEFAULT_USER;
    const exportData = {
      user: userName,
      data: gD(),
      bw: gBW(),
      exp: new Date().toISOString()
    };

    const dataBlob = new Blob([JSON.stringify(exportData, null, EXPORT_CONSTANTS.JSON_INDENT)], { type: 'application/json' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = `ironlog_${userName}_${dk(new Date())}.json`;
    downloadLink.click();

    showToast('JSON exportado ✓', 'success');
  } catch (error) {
    console.error('Error exporting JSON:', error);
    showToast('Error al exportar JSON', 'error');
  }
}

/**
 * Exports user data as CSV file
 */
export function expCSV(): void {
  try {
    const userName = getCurrentProfile()?.name || EXPORT_CONSTANTS.DEFAULT_USER;
    const exerciseData: Record<string, Exercise[]> = gD();

    let csvContent = EXPORT_CONSTANTS.CSV_HEADERS + '\n';

    // Sort dates chronologically
    const sortedDates = Object.keys(exerciseData).sort((a, b) => a.localeCompare(b));

    for (const dateKey of sortedDates) {
      const dailyExercises = exerciseData[dateKey] ?? [];
      for (const exercise of dailyExercises) {
        const row = [
          `"${dateKey}"`,
          `"${exercise.name || ''}"`,
          `"${exercise.weight || ''}"`,
          `"${exercise.unit || 'lb'}"`,
          `"${exercise.sets || ''}"`,
          `"${exercise.reps || ''}"`,
          `"${exercise.notes || ''}"`
        ].join(',');
        csvContent += row + '\n';
      }
    }

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = `ironlog_${userName}_${dk(new Date())}.csv`;
    downloadLink.click();

    showToast('CSV exportado ✓', 'success');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showToast('Error al exportar CSV', 'error');
  }
}

/**
 * Initiates the data import process by triggering file input
 */
export function impData(): void {
  const fileInput = document.getElementById(PROGRESS_DOM_IDS.IMPORT_FILE) as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Handles the file import process
 * @param event - File input change event
 */
export function handleImp(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  file.text().then((result) => {
    try {
      const parsedData = JSON.parse(result);
      const importedData = (parsedData.data || parsedData) as Record<string, Exercise[]>;
      const currentData = gD();

      // Merge imported data with existing data
      for (const [dateKey, exercises] of Object.entries(importedData)) {
        currentData[dateKey] ??= [];

        // Avoid duplicates based on timestamp
        for (const exercise of exercises) {
          const isDuplicate = currentData[dateKey].some((existing: Exercise) => existing.ts === exercise.ts);
          if (!isDuplicate) {
            currentData[dateKey].push(exercise);
          }
        }
      }

      // Save merged exercise data
      sD(currentData);

      // Import body weight data if present
      if (parsedData.bw) {
        const currentBodyWeight = gBW();
        Object.assign(currentBodyWeight, parsedData.bw);
        sBW(currentBodyWeight);
      }

      // Refresh UI
      renderToday();
      showToast('Datos importados ✓', 'success');
    } catch (error) {
      console.error('Error importing data:', error);
      showToast('Error: archivo inválido', 'error');
    }
  }).catch((error) => {
    console.error('Error reading file:', error);
    showToast('Error leyendo archivo', 'error');
  });

  target.value = ''; // Reset file input
}

// ── DEMO DATA ──

/**
 * Loads demo workout data for user demonstration
 * Creates sample workouts for Monday and Tuesday
 */
export function loadDemo(): void {
  if (!confirm('¿Cargar la rutina de ejemplo?')) return;

  const exerciseData = gD();
  const today = new Date();

  // Calculate Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  // Calculate Tuesday (Monday + 1 day)
  const tuesday = new Date(monday);
  tuesday.setDate(monday.getDate() + 1);

  const mondayKey = dk(monday);
  const tuesdayKey = dk(tuesday);

  // Monday workout: Lower body focus
  exerciseData[mondayKey] = createMondayDemoWorkout();

  // Tuesday workout: Upper body focus
  exerciseData[tuesdayKey] = createTuesdayDemoWorkout();

  // Save data and update UI
  sD(exerciseData);
  // Note: viewDate assignment removed as it's not defined in this module
  renderToday();

  showToast('¡Rutina cargada! 🚀', 'success');

  // Navigate to today view
  const todayNavButton = document.querySelectorAll('.nav-btn')[0] as HTMLElement;
  if (todayNavButton) {
    // Note: showS function needs to be imported or defined
    // showS('today', todayNavButton);
  }
}

/**
 * Creates demo workout data for Monday (lower body focus)
 * @returns Array of exercise objects
 */
function createMondayDemoWorkout(): Exercise[] {
  const baseTimestamp = Date.now();

  return [
    {
      name: 'Peso muerto',
      weight: '10',
      unit: 'lb',
      sets: '3',
      reps: '10',
      notes: null,
      ts: baseTimestamp
    },
    {
      name: 'Desplantes hacia atrás',
      weight: '20',
      unit: 'lb',
      sets: '3',
      reps: '12',
      notes: null,
      ts: baseTimestamp + 1
    },
    {
      name: 'Sentadilla sumo',
      weight: null,
      unit: 'lb',
      sets: '3',
      reps: '15',
      notes: 'Verde fuerte',
      ts: baseTimestamp + 2
    },
    {
      name: 'Curl de pierna acostado',
      weight: '25',
      unit: 'lb',
      sets: '3',
      reps: '12',
      notes: null,
      ts: baseTimestamp + 3
    },
    {
      name: 'Goblet squat',
      weight: '25',
      unit: 'lb',
      sets: '3',
      reps: '10',
      notes: null,
      ts: baseTimestamp + 4
    }
  ];
}

/**
 * Creates demo workout data for Tuesday (upper body focus)
 * @returns Array of exercise objects
 */
function createTuesdayDemoWorkout(): Exercise[] {
  const baseTimestamp = Date.now() + 5;

  return [
    {
      name: 'Press de hombro con barra',
      weight: null,
      unit: 'lb',
      sets: '3',
      reps: '6-8',
      notes: null,
      ts: baseTimestamp
    },
    {
      name: 'Chin-ups',
      weight: null,
      unit: 'lb',
      sets: '3',
      reps: '8-10',
      notes: null,
      ts: baseTimestamp + 1
    },
    {
      name: 'Press de pecho',
      weight: '25',
      unit: 'lb',
      sets: '3',
      reps: '10',
      notes: null,
      ts: baseTimestamp + 2
    },
    {
      name: 'Remo unilateral',
      weight: '25',
      unit: 'lb',
      sets: '3',
      reps: '12',
      notes: null,
      ts: baseTimestamp + 3
    },
    {
      name: 'Fondos en barras',
      weight: null,
      unit: 'lb',
      sets: '3',
      reps: '8',
      notes: null,
      ts: baseTimestamp + 4
    },
    {
      name: 'Martillo',
      weight: '15',
      unit: 'lb',
      sets: '3',
      reps: '10-12',
      notes: null,
      ts: baseTimestamp + 5
    },
    {
      name: 'Copa (Skull crusher)',
      weight: '25',
      unit: 'lb',
      sets: '3',
      reps: '6',
      notes: null,
      ts: baseTimestamp + 6
    }
  ];
}

// ── TOAST NOTIFICATIONS ──

/**
 * Shows a toast notification to the user
 * @param message - Message to display
 * @param type - Toast type ('success', 'error', 'info')
 */
function showToast(message: string, type: string = 'info'): void {
  const toastElement = document.getElementById(PROGRESS_DOM_IDS.TOAST);
  if (!toastElement) return;

  toastElement.textContent = message;
  toastElement.classList.add('show');

  // Auto-hide after duration
  setTimeout(() => {
    toastElement.classList.remove('show');
  }, EXPORT_CONSTANTS.TOAST_DURATION);
}

// Make functions available globally for onclick handlers
(globalThis as any).expJSON = expJSON;
(globalThis as any).expCSV = expCSV;
(globalThis as any).impData = impData;
(globalThis as any).handleImp = handleImp;
(globalThis as any).loadDemo = loadDemo;
