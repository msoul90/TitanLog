// ============================================================
// gym.ts — Pantalla de Gym: ejercicios, composición, timer
// ============================================================

import { BodyWeightEntry } from './types.js';
import { appState, gBW } from './app.js';
import { dk, saveBWDay } from './db.js';

const toast = (msg: string): void => (globalThis as any).toast?.(msg);
const openM = (modalId: string): void => (globalThis as any).openM?.(modalId);
const closeM = (modalId: string): void => (globalThis as any).closeM?.(modalId);
const renderToday = (): void => (globalThis as any).renderToday?.();

// ── CONSTANTS ──

// Body composition categories and ranges
const BODY_COMPOSITION_RANGES = {
  FAT: {
    VERY_LOW: { max: 10, label: 'Muy bajo — revisa con un profesional', class: 'high' },
    ATHLETIC: { max: 18, label: 'Atlético / muy bajo', class: 'ok' },
    FITNESS: { max: 25, label: 'Fitness — rango saludable', class: 'ok' },
    AVERAGE: { max: 32, label: 'Promedio', class: 'warn' },
    HIGH: { max: Infinity, label: 'Alto — considera ajustar tu dieta', class: 'high' }
  },
  MMC: {
    LOW: { max: 30, label: 'Bajo — enfócate en la proteína', class: 'high' },
    AVERAGE: { max: 40, label: 'Promedio', class: 'warn' },
    GOOD: { max: 50, label: 'Bueno — ¡sigue así!', class: 'ok' },
    EXCELLENT: { max: Infinity, label: 'Excelente — masa muscular alta', class: 'ok' }
  }
} as const;

// Validation ranges
const VALIDATION_RANGES = {
  WEIGHT: { min: 20, max: 500 },
  FAT_PERCENTAGE: { min: 1, max: 70 },
  MMC_PERCENTAGE: { min: 5, max: 80 }
} as const;

// DOM element IDs
const DOM_IDS = {
  // Body weight inputs
  BW_INPUT: 'bwIn',
  FAT_INPUT: 'fatIn',
  MMC_INPUT: 'mmcIn',
  FAT_HINT: 'fatHint',
  MMC_HINT: 'mmcHint',
  BC_DERIVED: 'bcDerived',
  BC_DATE_TAG: 'bcDateTag',
  BCD_FAT_KG: 'bcdFatKg',
  BCD_MMC_KG: 'bcdMMCKg',
  BCD_LEAN_KG: 'bcdLeanKg',
  BU_LB: 'bUlb',
  BU_KG: 'bUkg',
  // Timer elements
  TIMER_NUM: 'timerNum'
} as const;

// Date constants
const DAYS_OF_WEEK: readonly string[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS: readonly string[] = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// ── BODY COMPOSITION ──

/**
 * Categorizes body fat percentage and returns label and CSS class
 * @param pct - Body fat percentage
 * @returns Object with label and CSS class
 */
function fatCategory(pct: number): { lbl: string; cls: string } {
  if (pct < BODY_COMPOSITION_RANGES.FAT.VERY_LOW.max) {
    return { lbl: BODY_COMPOSITION_RANGES.FAT.VERY_LOW.label, cls: BODY_COMPOSITION_RANGES.FAT.VERY_LOW.class };
  }
  if (pct < BODY_COMPOSITION_RANGES.FAT.ATHLETIC.max) {
    return { lbl: BODY_COMPOSITION_RANGES.FAT.ATHLETIC.label, cls: BODY_COMPOSITION_RANGES.FAT.ATHLETIC.class };
  }
  if (pct < BODY_COMPOSITION_RANGES.FAT.FITNESS.max) {
    return { lbl: BODY_COMPOSITION_RANGES.FAT.FITNESS.label, cls: BODY_COMPOSITION_RANGES.FAT.FITNESS.class };
  }
  if (pct < BODY_COMPOSITION_RANGES.FAT.AVERAGE.max) {
    return { lbl: BODY_COMPOSITION_RANGES.FAT.AVERAGE.label, cls: BODY_COMPOSITION_RANGES.FAT.AVERAGE.class };
  }
  return { lbl: BODY_COMPOSITION_RANGES.FAT.HIGH.label, cls: BODY_COMPOSITION_RANGES.FAT.HIGH.class };
}

/**
 * Categorizes muscle mass percentage and returns label and CSS class
 * @param pct - Muscle mass percentage
 * @returns Object with label and CSS class
 */
function mmcCategory(pct: number): { lbl: string; cls: string } {
  if (pct < BODY_COMPOSITION_RANGES.MMC.LOW.max) {
    return { lbl: BODY_COMPOSITION_RANGES.MMC.LOW.label, cls: BODY_COMPOSITION_RANGES.MMC.LOW.class };
  }
  if (pct < BODY_COMPOSITION_RANGES.MMC.AVERAGE.max) {
    return { lbl: BODY_COMPOSITION_RANGES.MMC.AVERAGE.label, cls: BODY_COMPOSITION_RANGES.MMC.AVERAGE.class };
  }
  if (pct < BODY_COMPOSITION_RANGES.MMC.GOOD.max) {
    return { lbl: BODY_COMPOSITION_RANGES.MMC.GOOD.label, cls: BODY_COMPOSITION_RANGES.MMC.GOOD.class };
  }
  return { lbl: BODY_COMPOSITION_RANGES.MMC.EXCELLENT.label, cls: BODY_COMPOSITION_RANGES.MMC.EXCELLENT.class };
}

/**
 * Updates the derived body composition values and hints in real-time
 */
function updateDerived(): void {
  const inputValues = getBodyCompositionInputs();
  updateFatHint(inputValues.fatV);
  updateMmcHint(inputValues.mmcV);
  updateDerivedValues(inputValues);
}

/**
 * Gets parsed input values from body composition form
 * @returns Object with bwV, fatV, mmcV
 */
function getBodyCompositionInputs(): { bwV: number; fatV: number; mmcV: number } {
  return {
    bwV: Number.parseFloat((document.getElementById(DOM_IDS.BW_INPUT) as HTMLInputElement)?.value || ''),
    fatV: Number.parseFloat((document.getElementById(DOM_IDS.FAT_INPUT) as HTMLInputElement)?.value || ''),
    mmcV: Number.parseFloat((document.getElementById(DOM_IDS.MMC_INPUT) as HTMLInputElement)?.value || '')
  };
}

/**
 * Updates the fat percentage hint display
 * @param fatV - Fat percentage value
 */
function updateFatHint(fatV: number): void {
  const fatHintElement = document.getElementById(DOM_IDS.FAT_HINT);
  if (!fatHintElement) return;

  if (!Number.isNaN(fatV) && fatV > 0) {
    const cat = fatCategory(fatV);
    fatHintElement.textContent = cat.lbl;
    fatHintElement.className = 'pct-hint ' + cat.cls;
  } else {
    fatHintElement.textContent = '';
    fatHintElement.className = 'pct-hint';
  }
}

/**
 * Updates the muscle mass percentage hint display
 * @param mmcV - Muscle mass percentage value
 */
function updateMmcHint(mmcV: number): void {
  const mmcHintElement = document.getElementById(DOM_IDS.MMC_HINT);
  if (!mmcHintElement) return;

  if (!Number.isNaN(mmcV) && mmcV > 0) {
    const cat = mmcCategory(mmcV);
    mmcHintElement.textContent = cat.lbl;
    mmcHintElement.className = 'pct-hint ' + cat.cls;
  } else {
    mmcHintElement.textContent = '';
    mmcHintElement.className = 'pct-hint';
  }
}

/**
 * Updates the derived weight values display
 * @param inputValues - Object with bwV, fatV, mmcV
 */
function updateDerivedValues(inputValues: { bwV: number; fatV: number; mmcV: number }): void { // NOSONAR
  const { bwV, fatV, mmcV } = inputValues;
  const derivedElement = document.getElementById(DOM_IDS.BC_DERIVED);
  if (!derivedElement) return;

  const hasWeight = !Number.isNaN(bwV) && bwV > 0;
  const hasFat = !Number.isNaN(fatV);
  const hasMmc = !Number.isNaN(mmcV);

  if (hasWeight && (hasFat || hasMmc)) {
    derivedElement.style.display = 'flex';
    const unit = appState.bodyWeightUnit;

    const fatKg = hasFat ? (bwV * fatV / 100).toFixed(1) : '-';
    const mmcKg = hasMmc ? (bwV * mmcV / 100).toFixed(1) : '-';
    const leanKg = hasFat ? (bwV * (100 - fatV) / 100).toFixed(1) : '-';

    const fatKgElement = document.getElementById(DOM_IDS.BCD_FAT_KG);
    if (fatKgElement) {
      fatKgElement.textContent = hasFat ? fatKg + ' ' + unit : '-';
    }

    const mmcKgElement = document.getElementById(DOM_IDS.BCD_MMC_KG);
    if (mmcKgElement) {
      mmcKgElement.textContent = hasMmc ? mmcKg + ' ' + unit : '-';
    }

    const leanKgElement = document.getElementById(DOM_IDS.BCD_LEAN_KG);
    if (leanKgElement) {
      leanKgElement.textContent = hasFat ? leanKg + ' ' + unit : '-';
    }
  } else {
    derivedElement.style.display = 'none';
  }
}

/**
 * Opens the body weight modal and populates it with current data
 */
function openBW(): void {
  const bodyWeightData = getCurrentBodyWeightData();
  populateBodyWeightForm(bodyWeightData);
  setupBodyWeightModal();
  attachInputListeners();
  openModalAndFocus();
}

/**
 * Gets the current body weight data for the selected date
 * @returns Body weight data or null if not found
 */
function getCurrentBodyWeightData(): BodyWeightEntry | null {
  return gBW()[dk(appState.viewDate)] || null;
}

/**
 * Populates the body weight form with existing data
 * @param bw - Body weight data
 */
function populateBodyWeightForm(bw: BodyWeightEntry | null): void {
  const bwInput = document.getElementById(DOM_IDS.BW_INPUT) as HTMLInputElement;
  if (bwInput) bwInput.value = bw ? bw.v.toString() : '';
  const fatValue = bw?.fat;
  const mmcValue = bw?.mmc;

  const fatInput = document.getElementById(DOM_IDS.FAT_INPUT) as HTMLInputElement;
  if (fatInput) fatInput.value = fatValue == null ? '' : fatValue.toString();

  const mmcInput = document.getElementById(DOM_IDS.MMC_INPUT) as HTMLInputElement;
  if (mmcInput) mmcInput.value = mmcValue == null ? '' : mmcValue.toString();

  if (bw) setBWU((bw.u as 'lb' | 'kg') ?? 'lb');
}

/**
 * Sets up the body weight modal UI elements
 */
function setupBodyWeightModal(): void {
  const dateTagElement = document.getElementById(DOM_IDS.BC_DATE_TAG);
  if (dateTagElement) {
    dateTagElement.textContent = formatDateForModal(appState.viewDate);
  }

  const derivedElement = document.getElementById(DOM_IDS.BC_DERIVED);
  if (derivedElement) derivedElement.style.display = 'none';

  const fatHintElement = document.getElementById(DOM_IDS.FAT_HINT);
  if (fatHintElement) fatHintElement.textContent = '';

  const mmcHintElement = document.getElementById(DOM_IDS.MMC_HINT);
  if (mmcHintElement) mmcHintElement.textContent = '';
}

/**
 * Formats a date for display in the body weight modal
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatDateForModal(date: Date): string {
  const dayName = DAYS_OF_WEEK[date.getDay()];
  const day = date.getDate();
  const monthName = MONTHS[date.getMonth()];
  return `📅 ${dayName} ${day} de ${monthName}`;
}

/**
 * Attaches input listeners for real-time updates
 */
function attachInputListeners(): void {
  const inputIds = [DOM_IDS.BW_INPUT, DOM_IDS.FAT_INPUT, DOM_IDS.MMC_INPUT];
  inputIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.oninput = updateDerived;
    }
  });
}

/**
 * Opens the modal and focuses the weight input
 */
function openModalAndFocus(): void {
  openM('bwMod');
  setTimeout(() => {
    const bwInput = document.getElementById(DOM_IDS.BW_INPUT) as HTMLInputElement;
    if (bwInput) bwInput.focus();
  }, 340);
}

/**
 * Sets the body weight unit and updates UI
 * @param u - Unit ('lb' or 'kg')
 */
function setBWU(u: 'lb' | 'kg'): void {
  if (u !== 'lb' && u !== 'kg') {
    console.warn('Invalid unit provided to setBWU:', u);
    return;
  }

  appState.bodyWeightUnit = u;

  const lbButton = document.getElementById(DOM_IDS.BU_LB);
  if (lbButton) lbButton.classList.toggle('on', u === 'lb');

  const kgButton = document.getElementById(DOM_IDS.BU_KG);
  if (kgButton) kgButton.classList.toggle('on', u === 'kg');
}

/**
 * Saves the body weight data to the database
 */
async function saveBW(): Promise<void> {
  try {
    const weightData = validateAndParseBodyWeightData();
    if (!weightData) return; // Validation failed

    await saveBWDay(dk(appState.viewDate), weightData);
    closeM('bwMod');
    renderToday();
    toast('Medidas guardadas ✓');
  } catch (err) {
    console.error('Error saving body weight:', err);
    toast('Error guardando medidas. Intenta de nuevo.');
  }
}

/**
 * Validates and parses body weight form data
 * @returns Parsed data or null if validation fails
 */
function validateAndParseBodyWeightData(): BodyWeightEntry | null {
  const bwInput = document.getElementById(DOM_IDS.BW_INPUT) as HTMLInputElement;
  const fatInput = document.getElementById(DOM_IDS.FAT_INPUT) as HTMLInputElement;
  const mmcInput = document.getElementById(DOM_IDS.MMC_INPUT) as HTMLInputElement;

  if (!bwInput || !fatInput || !mmcInput) {
    console.error('Required body weight form elements not found');
    toast('Error en la interfaz. Recarga la página.');
    return null;
  }

  const v = Number.parseFloat(bwInput.value);
  if (!v || v < VALIDATION_RANGES.WEIGHT.min) {
    toast('Ingresa un peso válido');
    return null;
  }

  const fat = fatInput.value === '' ? undefined : Number.parseFloat(fatInput.value);
  const mmc = mmcInput.value === '' ? undefined : Number.parseFloat(mmcInput.value);

  if (fat != null && (fat < VALIDATION_RANGES.FAT_PERCENTAGE.min || fat > VALIDATION_RANGES.FAT_PERCENTAGE.max)) {
    toast(`% de grasa no válido (${VALIDATION_RANGES.FAT_PERCENTAGE.min}-${VALIDATION_RANGES.FAT_PERCENTAGE.max})`);
    return null;
  }

  if (mmc != null && (mmc < VALIDATION_RANGES.MMC_PERCENTAGE.min || mmc > VALIDATION_RANGES.MMC_PERCENTAGE.max)) {
    toast(`% MMC no válido (${VALIDATION_RANGES.MMC_PERCENTAGE.min}-${VALIDATION_RANGES.MMC_PERCENTAGE.max})`);
    return null;
  }

  return { v, u: appState.bodyWeightUnit, fat, mmc };
}

// ── TIMER ──

/**
 * Starts the timer with specified duration
 * @param secs - Duration in seconds
 * @param btn - Button element that triggered the timer
 */
function startT(secs: number, btn: HTMLElement): void {
  if (appState.timerInterval) clearInterval(appState.timerInterval);
  appState.timerSeconds = secs;

  // Reset all timer buttons
  document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('on'));

  // Activate the clicked button
  if (btn) btn.classList.add('on');

  updT();

  appState.timerInterval = setInterval(() => {
    appState.timerSeconds--;
    updT();
    if (appState.timerSeconds <= 0) {
      clearInterval(appState.timerInterval!);
      appState.timerInterval = null;

      const timerNumElement = document.getElementById(DOM_IDS.TIMER_NUM);
      if (timerNumElement) {
        timerNumElement.textContent = '¡Listo!';
        timerNumElement.classList.add('warn');
      }

      // Reset all buttons
      document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('on'));

      // Reset display after 3 seconds
      setTimeout(() => {
        const timerNumElement = document.getElementById(DOM_IDS.TIMER_NUM);
        if (timerNumElement) {
          timerNumElement.textContent = '0:00';
          timerNumElement.classList.remove('warn');
        }
      }, 3000);
    }
  }, 1000);
}

/**
 * Resets the timer to initial state
 */
function resetT(): void {
  if (appState.timerInterval) clearInterval(appState.timerInterval);
  appState.timerInterval = null;
  appState.timerSeconds = 0;

  const timerNumElement = document.getElementById(DOM_IDS.TIMER_NUM);
  if (timerNumElement) {
    timerNumElement.textContent = '0:00';
    timerNumElement.classList.remove('warn');
  }

  // Reset all timer buttons
  document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('on'));
}

/**
 * Updates the timer display
 */
function updT(): void {
  const m = Math.floor(appState.timerSeconds / 60);
  const s = appState.timerSeconds % 60;
  const timeString = `${m}:${String(s).padStart(2, '0')}`;

  const timerNumElement = document.getElementById(DOM_IDS.TIMER_NUM);
  if (timerNumElement) {
    timerNumElement.textContent = timeString;
    timerNumElement.classList.toggle('warn', appState.timerSeconds <= 10 && appState.timerSeconds > 0);
  }
}

// ── EXPORTS ──

export {
  // Constants
  BODY_COMPOSITION_RANGES,
  VALIDATION_RANGES,
  DOM_IDS,
  DAYS_OF_WEEK,
  MONTHS,

  // Body composition functions
  fatCategory,
  mmcCategory,
  updateDerived,
  getBodyCompositionInputs,
  updateFatHint,
  updateMmcHint,
  updateDerivedValues,
  openBW,
  getCurrentBodyWeightData,
  populateBodyWeightForm,
  setupBodyWeightModal,
  formatDateForModal,
  attachInputListeners,
  openModalAndFocus,
  setBWU,
  saveBW,
  validateAndParseBodyWeightData,

  // Timer functions
  startT,
  resetT,
  updT
};

// Make functions globally available for backward compatibility
(globalThis as any).fatCategory = fatCategory;
(globalThis as any).mmcCategory = mmcCategory;
(globalThis as any).updateDerived = updateDerived;
(globalThis as any).getBodyCompositionInputs = getBodyCompositionInputs;
(globalThis as any).updateFatHint = updateFatHint;
(globalThis as any).updateMmcHint = updateMmcHint;
(globalThis as any).updateDerivedValues = updateDerivedValues;
(globalThis as any).openBW = openBW;
(globalThis as any).getCurrentBodyWeightData = getCurrentBodyWeightData;
(globalThis as any).populateBodyWeightForm = populateBodyWeightForm;
(globalThis as any).setupBodyWeightModal = setupBodyWeightModal;
(globalThis as any).formatDateForModal = formatDateForModal;
(globalThis as any).attachInputListeners = attachInputListeners;
(globalThis as any).openModalAndFocus = openModalAndFocus;
(globalThis as any).setBWU = setBWU;
(globalThis as any).saveBW = saveBW;
(globalThis as any).validateAndParseBodyWeightData = validateAndParseBodyWeightData;
(globalThis as any).startT = startT;
(globalThis as any).resetT = resetT;
(globalThis as any).updT = updT;
