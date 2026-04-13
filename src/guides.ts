// ============================================================
// guides.ts — Base de datos de guías de ejercicios
// ============================================================

import { ExerciseGuide } from './types.js';
import { GUIDES } from './data/exercise-guides.js';
import { STRETCH_GUIDES } from './data/stretch-guides.js';

const toast = (msg: string): void => (globalThis as any).toast?.(msg);
const openM = (modalId: string): void => (globalThis as any).openM?.(modalId);
const closeM = (modalId: string): void => (globalThis as any).closeM?.(modalId);

function escHtml(value: string | number | boolean | null | undefined): string {
  const text = value == null ? '' : String(value);
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function encodeInlineValue(value: string): string {
  return encodeURIComponent(value).replaceAll("'", '%27');
}

// ── CONSTANTS ──

/**
 * DOM element IDs for guide display
 */
const GUIDE_DOM_IDS = {
  TITLE: 'gTitle',
  EMOJI: 'gEmoji',
  MUSCLES: 'gMuscles',
  STEPS: 'gSteps',
  ERRORS: 'gErrors',
  TIPS: 'gTips',
  LINKS: 'gLinks',
  ERR_SEC: 'gErrSec',
  TIP_SEC: 'gTipSec',
  LINK_SEC: 'gLinkSec',
  ADD_TXT: 'gAddTxt'
} as const;

/**
 * DOM element IDs for exercise form
 */
const EXERCISE_FORM_IDS = {
  TITLE: 'exModTtl',
  NAME: 'fName',
  WEIGHT: 'fW',
  SETS: 'fS',
  REPS: 'fR',
  NOTES: 'fN',
  UNIT: 'fU'
} as const;

const CONFIG_GUIDE_IDS = {
  LIST: 'cfgGuideList',
  SEARCH: 'cfgGuideSearch'
} as const;

const CONFIG_STRETCH_IDS = {
  LIST: 'cfgStretchList',
  SEARCH: 'cfgStretchSearch',
  FILTER: 'cfgStretchFilter'
} as const;

// -- GUIDE DATA --

// ── STATE ──

/**
 * Currently selected exercise name for guide display
 */
let guideExName: string = '';

/**
 * Currently selected stretch name for modal display
 */
let stretchName: string = '';

// ── STRETCH CATALOG ──

const STRETCH_CATEGORY_LABELS: Record<string, string> = {
  pre: 'Pre-entreno',
  post: 'Post-entreno',
  both: 'Pre y Post'
};

function filterEntriesBySearch<T>(
  entries: Array<[string, T]>,
  normalizedFilter: string,
  getHaystack: (name: string, item: T) => string
): Array<[string, T]> {
  if (!normalizedFilter) return entries;
  return entries.filter(([name, item]) =>
    normalizeExerciseName(getHaystack(name, item)).includes(normalizedFilter)
  );
}

function renderCatalogRows<T>(
  entries: Array<[string, T]>,
  getRow: (name: string, item: T) => { icon: string; subtitleHtml: string; clickHandler: string }
): string {
  return entries.map(([name, item]) => {
    const encodedName = encodeInlineValue(name);
    const row = getRow(name, item);
    return `<button type="button" class="cfg-row cfg-guide-row" onclick='${row.clickHandler}(decodeURIComponent("${encodedName}"))'>
      <span class="cfg-ic" style="background:var(--accent-dim)">${escHtml(row.icon)}</span>
      <span class="cfg-info"><span class="cfg-ttl">${escHtml(name)}</span><span class="cfg-sub cfg-guide-sub">${row.subtitleHtml}</span></span>
      <span class="cfg-arr">›</span>
    </button>`;
  }).join('');
}

function renderStretchCatalog(filter: string = '', categoryFilter: string = 'all'): void {
  const listEl = document.getElementById(CONFIG_STRETCH_IDS.LIST);
  if (!listEl) return;

  const normalizedFilter = normalizeExerciseName(filter);

  let entries = Object.entries(STRETCH_GUIDES);

  if (categoryFilter !== 'all') {
    entries = entries.filter(([, s]) => s.category === categoryFilter || s.category === 'both');
  }

  entries = filterEntriesBySearch(entries, normalizedFilter, (name, s) => [name, ...s.area].join(' '));

  if (entries.length === 0) {
    listEl.innerHTML = '<div class="cfg-guide-empty">No se encontraron estiramientos.</div>';
    return;
  }

  listEl.innerHTML = renderCatalogRows(entries, (_name, s) => {
    const subtitle = escHtml(s.area.slice(0, 3).join(' · '));
    const categoryBadge = `<span class="stretch-badge stretch-badge--${s.category}">${escHtml(STRETCH_CATEGORY_LABELS[s.category])}</span>`;
    return {
      icon: s.emoji,
      subtitleHtml: `${subtitle} ${categoryBadge}`,
      clickHandler: 'openStretch'
    };
  });
}

function filterStretchCatalog(value: string): void {
  const filterEl = document.getElementById(CONFIG_STRETCH_IDS.FILTER) as HTMLSelectElement | null;
  const cat = filterEl?.value ?? 'all';
  renderStretchCatalog(value, cat);
}

function filterStretchCategory(cat: string): void {
  const searchEl = document.getElementById(CONFIG_STRETCH_IDS.SEARCH) as HTMLInputElement | null;
  renderStretchCatalog(searchEl?.value ?? '', cat);
}

function openStretch(name: string): void {
  if (!name || typeof name !== 'string' || name.trim() === '') return;
  stretchName = name.trim();
  const s = STRETCH_GUIDES[stretchName];
  if (!s) return;

  const el = (id: string) => document.getElementById(id);

  const titleEl = el('stTitle');
  if (titleEl) titleEl.textContent = stretchName;

  const emojiEl = el('stEmoji');
  if (emojiEl) emojiEl.textContent = s.emoji;

  const metaEl = el('stMeta');
  if (metaEl) {
    const cat = escHtml(STRETCH_CATEGORY_LABELS[s.category] ?? '');
    const areas = s.area.map(a => `<span class="muscle-tag primary">${escHtml(a)}</span>`).join('');
    metaEl.innerHTML = `${areas}<span class="muscle-tag secondary">⏱ ${escHtml(s.duration)}</span><span class="muscle-tag secondary">🏷 ${cat}</span>`;
  }

  const stepsEl = el('stSteps');
  if (stepsEl) {
    stepsEl.innerHTML = s.steps.map((step, i) =>
      `<div class="guide-step"><div class="step-num">${i + 1}</div><div class="step-text">${escHtml(step)}</div></div>`
    ).join('');
  }

  const tipsEl = el('stTips');
  const tipsSec = el('stTipSec');
  if (tipsEl && tipsSec) {
    if (s.tips && s.tips.length > 0) {
      tipsEl.innerHTML = s.tips.map(t =>
        `<div class="guide-tip ok"><span class="tip-icon">✅</span><span>${escHtml(t)}</span></div>`
      ).join('');
      tipsSec.style.display = '';
    } else {
      tipsSec.style.display = 'none';
    }
  }

  openM('stretchMod');
}

function normalizeExerciseName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '');
}

function findGuideKey(name: string): string | null {
  const normalizedName = normalizeExerciseName(name);
  const match = Object.keys(GUIDES).find(key => normalizeExerciseName(key) === normalizedName);
  return match || null;
}

async function enrichGuideFromDB(requestedName: string): Promise<void> {
  const resolver = (globalThis as any).getExerciseGuideFromDB;
  if (typeof resolver !== 'function') return;

  try {
    const resolved = await resolver(requestedName) as { name?: string; guide?: ExerciseGuide } | null;
    if (!resolved?.guide) return;

    // Do not overwrite if user already navigated to a different exercise.
    if (guideExName !== requestedName) return;

    const canonicalName = (resolved.name || requestedName).trim() || requestedName;
    guideExName = canonicalName;

    // Merge DB guide with local guide: keep local data for fields that are
    // empty in the DB response so that locally-stored tips/steps/errors are
    // never wiped out by an incomplete database record.
    const localKey = findGuideKey(requestedName);
    const localGuide = localKey ? GUIDES[localKey] : null;
    const dbGuide = resolved.guide;

    const mergedGuide: ExerciseGuide = {
      emoji: dbGuide.emoji && dbGuide.emoji !== '📖' ? dbGuide.emoji : (localGuide?.emoji ?? '📖'),
      primary: dbGuide.primary?.length ? dbGuide.primary : (localGuide?.primary ?? []),
      secondary: dbGuide.secondary?.length ? dbGuide.secondary : (localGuide?.secondary ?? []),
      steps: dbGuide.steps?.length ? dbGuide.steps : (localGuide?.steps ?? []),
      errors: dbGuide.errors?.length ? dbGuide.errors : (localGuide?.errors ?? []),
      tips: dbGuide.tips?.length ? dbGuide.tips : (localGuide?.tips ?? []),
      links: dbGuide.links?.length ? dbGuide.links : (localGuide?.links ?? []),
    };

    renderGuideContent(canonicalName, mergedGuide);
  } catch {
    // Local guide fallback is already rendered.
  }
}

function renderGuidesCatalog(filter: string = ''): void {
  const listElement = document.getElementById(CONFIG_GUIDE_IDS.LIST);
  if (!listElement) return;

  const normalizedFilter = normalizeExerciseName(filter);

  const guideEntries = Object.entries(GUIDES).sort(([nameA], [nameB]) =>
    nameA.localeCompare(nameB, 'es', { sensitivity: 'base' })
  );

  const filteredEntries = filterEntriesBySearch(guideEntries, normalizedFilter, (name, guide) => [
    name,
    ...(guide.primary || []),
    ...(guide.secondary || [])
  ].join(' '));

  if (filteredEntries.length === 0) {
    listElement.innerHTML = '<div class="cfg-guide-empty">No se encontraron guías para tu búsqueda.</div>';
    return;
  }

  listElement.innerHTML = renderCatalogRows(filteredEntries, (_name, guide) => {
    const subtitle = [...(guide.primary || []).slice(0, 2), ...(guide.secondary || []).slice(0, 1)]
      .filter(Boolean)
      .join(' · ');

    return {
      icon: guide.emoji || '📖',
      subtitleHtml: escHtml(subtitle || 'Ver técnica y consejos'),
      clickHandler: 'openGuide'
    };
  });
}

function filterGuidesCatalog(value: string): void {
  renderGuidesCatalog(value);
}

// ── FUNCTIONS ──

/**
 * Renders the guide content for a specific exercise
 * @param name - Exercise name
 * @param guide - Guide data object or null if not found
 */
function renderGuideContent(name: string, guide: ExerciseGuide | null): void {
  // Update title
  const titleElement = document.getElementById(GUIDE_DOM_IDS.TITLE);
  if (titleElement) {
    titleElement.textContent = name;
  }

  if (guide) {
    renderGuideDetails(guide);
  } else {
    renderNoGuideAvailable(name);
  }

  // Update add button text
  const addTextElement = document.getElementById(GUIDE_DOM_IDS.ADD_TXT);
  if (addTextElement) {
    addTextElement.textContent = `Agregar "${name}" al día de hoy`;
  }
}

/**
 * Detects movement category from exercise name and returns
 * generic but relevant safety tips and muscles
 */
function detectMovementProfile(name: string): {
  emoji: string;
  category: string;
  muscles: string;
  tips: string[];
} {
  const n = normalizeExerciseName(name);

  if (/press|banca|pecho|bench|fly|fondos|dip|apertura|pec/.test(n)) {
    return {
      emoji: '💪',
      category: 'Empuje horizontal (Pecho)',
      muscles: 'Pectoral · Tríceps · Hombro anterior',
      tips: [
        'Mantén los omóplatos retraídos y deprimidos durante todo el movimiento.',
        'Controla la fase de bajada (excéntrica) — no dejes caer el peso.',
        'No bloquees completamente los codos al extender para mantener tensión continua.'
      ]
    };
  }
  if (/press militar|press de hombro|press arnold|elevacion|lateral|frontal|hombro|deltoid|shoulder|ohp/.test(n)) {
    return {
      emoji: '🏋️',
      category: 'Empuje vertical (Hombros)',
      muscles: 'Deltoides · Tríceps · Trapecios',
      tips: [
        'Activa el core antes de empujar para proteger la zona lumbar.',
        'Evita arquear la espalda baja al subir el peso.',
        'Rango completo de movimiento activa más el deltoides medial.'
      ]
    };
  }
  if (/curl|bicep|martillo|hammer|predicador|concentrado/.test(n)) {
    return {
      emoji: '💪',
      category: 'Flexión de codo (Bíceps)',
      muscles: 'Bíceps braquial · Braquial · Braquiorradial',
      tips: [
        'Mantén los codos pegados al cuerpo — si se mueven, el peso es demasiado.',
        'Controla la fase de bajada (excéntrica) para mayor desarrollo muscular.',
        'Completa el rango de movimiento: extiende completamente al bajar.'
      ]
    };
  }
  if (/tricep|extension|press cerrado|jalon de tricep|copa|skull|kick back|dips/.test(n)) {
    return {
      emoji: '💪',
      category: 'Extensión de codo (Tríceps)',
      muscles: 'Tríceps (3 cabezas)',
      tips: [
        'Mantén los codos en posición fija — solo se mueven los antebrazos.',
        'La extensión completa activa mejor la cabeza lateral del tríceps.',
        'No uses demasiado peso: los tríceps responden mejor al control que a la carga.'
      ]
    };
  }
  if (/remo|jalon|pull.up|chin.up|dominada|jalada|lat|espalda|pullover|encogimiento|shrug|t-bar/.test(n)) {
    return {
      emoji: '🏋️',
      category: 'Jalón / Tirón (Espalda)',
      muscles: 'Latísimo del dorso · Romboides · Bíceps · Trapecios',
      tips: [
        'Inicia el movimiento retrayendo los omóplatos, no doblando los codos.',
        'Imagina que llevas los codos hacia los bolsillos traseros del pantalón.',
        'Controla la fase excéntrica — el estiramiento del músculo es donde ocurre el crecimiento.'
      ]
    };
  }
  if (/sentadilla|squat|prensa|leg press|desplante|zancada|step.up|lunge|bulgara|pistol/.test(n)) {
    return {
      emoji: '🦵',
      category: 'Patrón de sentadilla (Piernas)',
      muscles: 'Cuádriceps · Glúteos · Isquiotibiales · Core',
      tips: [
        'Mantén el pecho arriba y el torso erguido durante la bajada.',
        'Empuja las rodillas hacia afuera siguiendo la dirección de los pies.',
        'Inhala al bajar, exhala al subir — la respiración ayuda a estabilizar el core.'
      ]
    };
  }
  if (/peso muerto|deadlift|buenos dias|hip thrust|puente|kettle|swing|bisagra|rdl/.test(n)) {
    return {
      emoji: '⚡',
      category: 'Bisagra de cadera (Cadena posterior)',
      muscles: 'Glúteos · Isquiotibiales · Espalda baja · Core',
      tips: [
        'El movimiento viene de las caderas hacia atrás, no de doblar la espalda.',
        'Mantén la espalda neutra — redondear la lumbar es el error más peligroso.',
        'Aprieta los glúteos al extender completamente las caderas.'
      ]
    };
  }
  if (/plancha|crunch|abdomen|core|oblicuo|russian|dead bug|rueda|mountain|escalador|hollow/.test(n)) {
    return {
      emoji: '🎯',
      category: 'Core / Abdomen',
      muscles: 'Recto abdominal · Oblicuos · Core profundo · Estabilizadores',
      tips: [
        'La zona lumbar debe permanecer neutral — ni arqueada ni excesivamente aplanada.',
        'Exhala al contraer; una exhalación fuerte aumenta la presión intraabdominal.',
        'La consistencia importa más que la intensidad — el core se desarrolla con volumen.'
      ]
    };
  }
  if (/cardio|caminadora|eliptica|bicicleta|cuerda|jump|rope|remo ergometro|ski/.test(n)) {
    return {
      emoji: '🏃',
      category: 'Cardio / Acondicionamiento',
      muscles: 'Sistema cardiovascular · Cardio general',
      tips: [
        'Empieza a baja intensidad para calentar y termina con 5 min de enfriamiento.',
        'Zona 2 (puedes hablar pero no cantar) es ideal para salud cardiovascular y grasa.',
        'Mantén postura erguida — no te apoyés en los parachoques ni el equipo.'
      ]
    };
  }
  if (/burpee|funcional|kettle|box|salto|battle rope|sled|tire|tire flip|clean|snatch/.test(n)) {
    return {
      emoji: '⚡',
      category: 'Funcional / Potencia',
      muscles: 'Cuerpo completo',
      tips: [
        'Domina la técnica a baja velocidad antes de añadir intensidad o carga.',
        'Los movimientos explosivos requieren mayor calentamiento articular previo.',
        'La fatiga compromete la técnica — para antes de perder la forma.'
      ]
    };
  }

  // Fallback genérico
  return {
    emoji: '📖',
    category: 'Ejercicio personalizado',
    muscles: 'Sin clasificar aún',
    tips: [
      'Aprende la técnica correcta antes de aumentar la carga.',
      'Controla siempre la fase excéntrica (regreso al inicio) — ahí ocurre el desarrollo muscular.',
      'Si sientes dolor articular (distinto a la fatiga muscular), detente y consulta a un profesional.'
    ]
  };
}

/**
 * Renders content when no guide is available for the exercise.
 * Uses movement pattern detection to show relevant generic tips.
 */
function renderNoGuideAvailable(exerciseName?: string): void {
  const profile = detectMovementProfile(exerciseName || '');

  const emojiElement = document.getElementById(GUIDE_DOM_IDS.EMOJI);
  if (emojiElement) emojiElement.textContent = profile.emoji;

  const musclesElement = document.getElementById(GUIDE_DOM_IDS.MUSCLES);
  if (musclesElement) {
    musclesElement.innerHTML =
      `<span class="muscle-tag secondary">${profile.category}</span>` +
      profile.muscles.split(' · ').map(m => `<span class="muscle-tag primary">${m}</span>`).join('');
  }

  const stepsElement = document.getElementById(GUIDE_DOM_IDS.STEPS);
  if (stepsElement) {
    const isCustom = profile.category !== 'Ejercicio personalizado';
    const intro = isCustom
      ? `<div class="guide-tip ok"><span class="tip-icon">🔍</span><span>Detectamos que "<strong>${escHtml(exerciseName || '')}</strong>" parece ser un ejercicio de <strong>${profile.category}</strong>. Te mostramos los principios generales de este patrón de movimiento.</span></div>`
      : `<div class="guide-tip ok"><span class="tip-icon">📖</span><span>No encontramos una guía específica para "<strong>${escHtml(exerciseName || '')}</strong>". Aquí van principios generales seguros.</span></div>`;
    stepsElement.innerHTML = intro;
  }

  const errSec = document.getElementById(GUIDE_DOM_IDS.ERR_SEC);
  if (errSec) errSec.style.display = 'none';

  const tipSec = document.getElementById(GUIDE_DOM_IDS.TIP_SEC);
  const tipsElement = document.getElementById(GUIDE_DOM_IDS.TIPS);
  if (tipSec && tipsElement) {
    tipsElement.innerHTML = profile.tips
      .map(t => `<div class="guide-tip ok"><span class="tip-icon">✅</span><span>${escHtml(t)}</span></div>`)
      .join('');
    tipSec.style.display = '';
  }

  const linkSec = document.getElementById(GUIDE_DOM_IDS.LINK_SEC);
  if (linkSec) linkSec.style.display = 'none';
}

function toSafeExternalHref(rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    const protocol = url.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function cleanGuideList(values?: string[]): string[] {
  return (values || []).map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
}

function setInnerHtmlById(elementId: string, html: string): void {
  const element = document.getElementById(elementId);
  if (element) element.innerHTML = html;
}

function setSectionVisible(sectionId: string, visible: boolean): void {
  const section = document.getElementById(sectionId);
  if (section) section.style.display = visible ? '' : 'none';
}

function renderGuideTipsList(items: string[], itemClass: 'ok' | 'err', icon: string, emptyMessage: string): string {
  if (!items.length) {
    return `<div class="guide-tip empty"><span class="tip-icon">ℹ️</span><span>${emptyMessage}</span></div>`;
  }
  return items
    .map((value) => `<div class="guide-tip ${itemClass}"><span class="tip-icon">${icon}</span><span>${escHtml(value)}</span></div>`)
    .join('');
}

function renderGuideLinksList(links: string[]): string {
  if (!links.length) {
    return '<div class="guide-tip empty"><span class="tip-icon">ℹ️</span><span>Aún no hay links externos para este ejercicio.</span></div>';
  }

  return links.map((link: string) => {
    const href = toSafeExternalHref(link);
    if (!href) {
      return `<div class="guide-tip empty"><span class="tip-icon">ℹ️</span><span>${escHtml(link)}</span></div>`;
    }
    return `<div class="guide-tip ok"><span class="tip-icon">🔗</span><a class="guide-link-item" href="${escHtml(href)}" target="_blank" rel="noopener noreferrer">${escHtml(link)}</a></div>`;
  }).join('');
}

/**
 * Renders detailed guide content for an exercise
 * @param guide - Guide data object
 */
function renderGuideDetails(guide: ExerciseGuide): void {
  const steps = cleanGuideList(guide.steps);
  const errors = cleanGuideList(guide.errors);
  const tips = cleanGuideList(guide.tips);
  const links = cleanGuideList(guide.links);

  // Update emoji
  const emojiElement = document.getElementById(GUIDE_DOM_IDS.EMOJI);
  if (emojiElement) {
    emojiElement.textContent = guide.emoji;
  }

  // Update muscles
  const musclesElement = document.getElementById(GUIDE_DOM_IDS.MUSCLES);
  if (musclesElement) {
    const primaryMuscles = (guide.primary || []).filter(Boolean).map((m: string) =>
      `<span class="muscle-tag primary">${escHtml(m)}</span>`
    ).join('');
    const secondaryMuscles = (guide.secondary || []).filter(Boolean).map((m: string) =>
      `<span class="muscle-tag secondary">${escHtml(m)}</span>`
    ).join('');
    musclesElement.innerHTML = primaryMuscles + secondaryMuscles;
  }

  // Update steps
  setInnerHtmlById(
    GUIDE_DOM_IDS.STEPS,
    steps.length
      ? steps.map((step: string, index: number) =>
          `<div class="guide-step"><div class="step-num">${index + 1}</div><div class="step-text">${escHtml(step)}</div></div>`
        ).join('')
      : '<div class="guide-tip empty"><span class="tip-icon">ℹ️</span><span>Sin pasos de ejecución documentados aún para este ejercicio.</span></div>'
  );

  // Update errors
  setInnerHtmlById(
    GUIDE_DOM_IDS.ERRORS,
    renderGuideTipsList(errors, 'err', '❌', 'Aún no hay errores comunes registrados para este ejercicio.')
  );

  // Update tips
  setInnerHtmlById(
    GUIDE_DOM_IDS.TIPS,
    renderGuideTipsList(tips, 'ok', '✅', 'Tips pro en preparación para este ejercicio.')
  );

  // Show error and tip sections
  setSectionVisible(GUIDE_DOM_IDS.ERR_SEC, true);
  setSectionVisible(GUIDE_DOM_IDS.TIP_SEC, true);
  setInnerHtmlById(GUIDE_DOM_IDS.LINKS, renderGuideLinksList(links));
  setSectionVisible(GUIDE_DOM_IDS.LINK_SEC, true);
}

/**
 * Opens the guide modal for a specific exercise
 * @param name - Exercise name to display guide for
 */
function openGuide(name: string): void {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    console.warn('Invalid exercise name provided to openGuide');
    toast('Nombre de ejercicio inválido');
    return;
  }

  guideExName = name.trim();
  const key = findGuideKey(guideExName);
  const guide = key ? GUIDES[key] : null;

  renderGuideContent(guideExName, guide || null);
  openM('guideMod');
  void enrichGuideFromDB(guideExName);
}

/**
 * Adds the current guide exercise to today's workout
 * Pre-fills the exercise form with the guide's name
 */
function addFromGuide(): void {
  if (!guideExName || guideExName.trim() === '') {
    console.warn('No guide exercise selected');
    toast('No hay ejercicio seleccionado');
    return;
  }

  closeM('guideMod');

  // Update form title
  const titleElement = document.getElementById(EXERCISE_FORM_IDS.TITLE);
  if (titleElement) {
    titleElement.textContent = 'Agregar ejercicio';
  }

  // Pre-fill exercise name
  const nameElement = document.getElementById(EXERCISE_FORM_IDS.NAME) as HTMLInputElement;
  if (nameElement) {
    nameElement.value = guideExName;
  }

  // Clear other form fields
  const fieldsToClear = [EXERCISE_FORM_IDS.WEIGHT, EXERCISE_FORM_IDS.SETS, EXERCISE_FORM_IDS.REPS, EXERCISE_FORM_IDS.NOTES];
  fieldsToClear.forEach(id => {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) element.value = '';
  });

  // Set default unit
  const unitElement = document.getElementById(EXERCISE_FORM_IDS.UNIT) as HTMLSelectElement;
  if (unitElement) {
    unitElement.value = 'lb';
  }

  // Open exercise modal with delay
  setTimeout(() => {
    openM('exMod');
    // Focus weight input after modal animation
    setTimeout(() => {
      const weightElement = document.getElementById(EXERCISE_FORM_IDS.WEIGHT) as HTMLInputElement;
      if (weightElement) weightElement.focus();
    }, 350);
  }, 100);
}

// ── EXPORTS ──

export {
  openGuide,
  addFromGuide,
  filterGuidesCatalog,
  renderGuidesCatalog,
  renderGuideContent,
  renderNoGuideAvailable,
  renderGuideDetails,
  renderStretchCatalog,
  filterStretchCatalog,
  filterStretchCategory,
  openStretch
};

export { GUIDES } from './data/exercise-guides.js';
export { STRETCH_GUIDES } from './data/stretch-guides.js';

// Make functions globally available for backward compatibility
(globalThis as any).openGuide = openGuide;
(globalThis as any).addFromGuide = addFromGuide;
(globalThis as any).filterStretchCatalog = filterStretchCatalog;
(globalThis as any).filterStretchCategory = filterStretchCategory;
(globalThis as any).openStretch = openStretch;
(globalThis as any).filterGuidesCatalog = filterGuidesCatalog;
(globalThis as any).renderGuidesCatalog = renderGuidesCatalog;
(globalThis as any).renderStretchCatalog = renderStretchCatalog;
