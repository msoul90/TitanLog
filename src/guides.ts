// ============================================================
// guides.ts — Base de datos de guías de ejercicios
// ============================================================

import { ExerciseGuide, StretchGuide } from './types.js';

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

// ── GUIDE DATA ──

/**
 * Comprehensive exercise guides database
 */
const GUIDES: Record<string, ExerciseGuide> = {
  'Sentadilla': {
    emoji: '🦵',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Párate con pies a la altura de los hombros, puntas ligeramente hacia afuera.',
      'Mantén el pecho arriba y la mirada al frente.',
      'Empuja las rodillas hacia afuera mientras bajas, como si te sentaras en una silla.',
      'Baja hasta que tus muslos queden paralelos al suelo o más abajo.',
      'Empuja el suelo con los talones para subir, apretando los glúteos al llegar arriba.'
    ],
    errors: [
      'Dejar caer las rodillas hacia adentro (valgo de rodilla).',
      'Levantar los talones del suelo.',
      'Inclinar demasiado el torso hacia adelante.'
    ],
    tips: [
      'Coloca tus talones sobre una superficie elevada si tienes poca movilidad de tobillo.',
      'Imagina que empujas el suelo hacia afuera con los pies para activar glúteos.',
      'La respiración: inhala al bajar, exhala al subir.'
    ]
  },
  'Sentadilla sumo': {
    emoji: '🦵',
    primary: ['Aductores', 'Glúteos'],
    secondary: ['Cuádriceps', 'Core'],
    steps: [
      'Abre los pies más allá del ancho de hombros, puntas apuntando 45° hacia afuera.',
      'Sostén la pesa (mancuerna o kettlebell) con ambas manos frente a ti.',
      'Mantén el torso erguido y baja empujando las rodillas hacia las puntas de los pies.',
      'Baja hasta que tus muslos queden paralelos al suelo.',
      'Sube apretando los glúteos y la zona interna del muslo.'
    ],
    errors: [
      'Dejar que las rodillas colapsen hacia adentro.',
      'Inclinar el torso excesivamente.',
      'No abrir suficiente los pies.'
    ],
    tips: [
      'Ideal para trabajar más la zona interna del muslo que la sentadilla convencional.',
      'Prueba con diferentes anchos de apertura para encontrar tu posición cómoda.'
    ]
  },
  'Goblet squat': {
    emoji: '🏺',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Core', 'Hombros'],
    steps: [
      'Sostén una mancuerna o kettlebell verticalmente contra el pecho con ambas manos.',
      'Pies a la altura de los hombros o un poco más abiertos, puntas hacia afuera.',
      'Mantén los codos apuntando hacia abajo durante todo el movimiento.',
      'Baja profundo, usando la pesa como contrapeso para mantener el equilibrio.',
      'Sube empujando los talones, manteniendo el pecho arriba.'
    ],
    errors: [
      'Soltar los codos hacia los lados.',
      'No bajar lo suficiente.',
      'Perder la tensión en el core.'
    ],
    tips: [
      'Excelente para aprender la mecánica de la sentadilla con buena postura.',
      'Usa los codos para separar las rodillas al fondo del movimiento.'
    ]
  },
  'Peso muerto': {
    emoji: '⚡',
    primary: ['Isquiotibiales', 'Glúteos', 'Espalda baja'],
    secondary: ['Trapecios', 'Core', 'Cuádriceps'],
    steps: [
      'Párate con los pies a la altura de las caderas, barra sobre el medio del pie.',
      'Dobla las caderas hacia atrás (no las rodillas primero) hasta agarrar la barra.',
      'Espalda recta, pecho arriba, hombros ligeramente delante de la barra.',
      'Empuja el suelo con los pies y extiende caderas y rodillas al mismo tiempo.',
      'Mantén la barra pegada al cuerpo durante todo el recorrido.',
      'Baja de forma controlada invirtiendo el movimiento.'
    ],
    errors: [
      'Redondear la espalda baja — el error más peligroso.',
      'Doblar los brazos durante el jalón.',
      'Dejar que la barra se aleje del cuerpo.',
      'Bloquear las rodillas antes de las caderas al subir.'
    ],
    tips: [
      'La clave es empujar el suelo, no jalar la barra.',
      'Lleva los hombros hacia atrás y abajo antes de iniciar.',
      'Usa cinturón solo cuando el peso es verdaderamente pesado, no de entrada.'
    ]
  },
  'Peso muerto rumano': {
    emoji: '⚡',
    primary: ['Isquiotibiales', 'Glúteos'],
    secondary: ['Espalda baja', 'Trapecios'],
    steps: [
      'Párate con pesas frente a los muslos, pies a la altura de la cadera.',
      'Mantén las rodillas ligeramente flexionadas durante todo el movimiento.',
      'Lleva las caderas hacia atrás mientras bajas las pesas por el frente de las piernas.',
      'Siente el estiramiento en los isquiotibiales; baja hasta donde tu espalda no se redondee.',
      'Contrae los glúteos para volver a la posición inicial.'
    ],
    errors: [
      'Redondear la espalda baja.',
      'Doblar demasiado las rodillas (se convierte en sentadilla).',
      'Bajar las pesas más allá de tu rango de movimiento seguro.'
    ],
    tips: [
      'La diferencia con el peso muerto convencional: las rodillas casi no se doblan.',
      'Empuja las caderas hacia atrás como si quisieras tocar la pared detrás tuyo.',
      'Ideal para el día de piernas con foco en posterior.'
    ]
  },
  'Desplantes hacia atrás': {
    emoji: '🦵',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Párate erguido con las pesas al costado o en los hombros.',
      'Da un paso largo hacia atrás con una pierna.',
      'Baja la rodilla trasera hacia el suelo sin tocarlo, rodilla delantera a 90°.',
      'La rodilla delantera no debe pasar la punta del pie.',
      'Empuja con el talón delantero para volver a la posición inicial.'
    ],
    errors: [
      'Dejar que la rodilla delantera colapse hacia adentro.',
      'Inclinarse demasiado hacia adelante.',
      'Dar pasos demasiado cortos.'
    ],
    tips: [
      'El desplante hacia atrás es más amigable con las rodillas que hacia adelante.',
      'Activa el core para no perder el equilibrio al dar el paso.',
      'Alterna piernas o haz todas las reps de un lado antes de cambiar.'
    ]
  },
  'Desplantes hacia adelante': {
    emoji: '🦵',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Párate erguido con las pesas al costado.',
      'Da un paso largo hacia adelante con una pierna.',
      'Baja el cuerpo hasta que ambas rodillas formen ángulos de 90°.',
      'La rodilla trasera casi toca el suelo.',
      'Empuja con el talón delantero para volver al inicio.'
    ],
    errors: [
      'Rodilla delantera pasando la punta del pie.',
      'Inclinar el torso hacia adelante.',
      'Pasos demasiado cortos.'
    ],
    tips: [
      'Mira hacia adelante para mantener el torso erguido.',
      'El talón trasero se levanta del suelo — es normal.'
    ]
  },
  'Curl de pierna acostado': {
    emoji: '🦵',
    primary: ['Isquiotibiales'],
    secondary: ['Pantorrillas'],
    steps: [
      'Acuéstate boca abajo en la máquina, tobillo bajo el rodillo.',
      'Mantén las caderas pegadas al banco durante todo el movimiento.',
      'Curva las piernas hacia los glúteos de forma controlada.',
      'Aprieta los isquiotibiales en el punto más alto.',
      'Baja lentamente (el excéntrico es igual de importante).'
    ],
    errors: [
      'Levantar las caderas del banco al subir el peso.',
      'Bajar el peso sin control.',
      'Usar demasiado peso y perder el rango de movimiento.'
    ],
    tips: [
      'Hazlo con un pie a la vez para detectar desequilibrios.',
      'La fase de bajada lenta (3-4 seg.) genera más estímulo muscular.'
    ]
  },
  'Press de pecho': {
    emoji: '💪',
    primary: ['Pectoral mayor'],
    secondary: ['Tríceps', 'Hombro anterior'],
    steps: [
      'Acuéstate en el banco con pies planos en el suelo.',
      'Agarra las mancuernas con manos a la altura del pecho, codos a ~45° del torso.',
      'Empuja las pesas hacia arriba hasta casi extender los brazos completamente.',
      'Baja de forma controlada, sintiendo el estiramiento en el pecho.',
      'Mantén los omóplatos retraídos y el pecho elevado durante todo el movimiento.'
    ],
    errors: [
      'Dejar que los codos apunten hacia los lados (90°) — sobrecarga los hombros.',
      'Rebotar las pesas en el pecho.',
      'Levantar las caderas del banco.'
    ],
    tips: [
      'Imagina que intentas doblar la barra/mancuernas hacia adentro para activar más el pecho.',
      'Retrae los omóplatos antes de bajar para proteger los hombros.',
      'Pausa de 1 segundo en el pecho maximiza el estímulo.'
    ]
  },
  'Press banca con barra': {
    emoji: '🏋️',
    primary: ['Pectoral mayor'],
    secondary: ['Tríceps', 'Hombro anterior'],
    steps: [
      'Acuéstate con los ojos bajo la barra, pies en el suelo o en el banco.',
      'Agarre ligeramente más ancho que los hombros, pulgar envuelve la barra.',
      'Saca la barra y bájala controladamente a la parte inferior del esternón.',
      'Mantén los codos a ~45-75° del torso, no a 90°.',
      'Empuja la barra hacia arriba y ligeramente hacia los pies.'
    ],
    errors: [
      'Grip demasiado ancho (lesiona hombros).',
      'Barra cae sobre el cuello en lugar del pecho.',
      'Codos en 90° (crea impingement en hombros).',
      'Levantar las caderas del banco.'
    ],
    tips: [
      'La técnica de arco lumbar (powerlifting) reduce el rango y protege los hombros.',
      'Aprieta la barra con fuerza para activar más los tríceps.',
      'Nunca hagas press banca pesado solo sin spotter o rack con safety bars.'
    ]
  },
  'Fondos en barras': {
    emoji: '💪',
    primary: ['Tríceps', 'Pectoral inferior'],
    secondary: ['Hombro anterior', 'Core'],
    steps: [
      'Agarra las barras paralelas y sube con brazos extendidos.',
      'Para enfatizar el pecho: inclínate ligeramente hacia adelante.',
      'Para enfatizar los tríceps: mantente más vertical.',
      'Baja controladamente hasta que los codos estén a ~90°.',
      'Empuja hacia arriba extendiendo completamente los brazos.'
    ],
    errors: [
      'Bajar en exceso (>90°) — sobrecarga los hombros.',
      'Balancearse.',
      'No llegar a la extensión completa.'
    ],
    tips: [
      'Si no puedes hacer fondos con tu propio peso, usa una banda de asistencia.',
      'Agrega peso con una cadena o cinturón para progresar.'
    ]
  },
  'Chin-ups': {
    emoji: '🔝',
    primary: ['Dorsal ancho', 'Bíceps'],
    secondary: ['Romboides', 'Braquial'],
    steps: [
      'Agarra la barra con palmas mirando hacia ti (supinación), ancho de hombros.',
      'Cuelga con brazos completamente extendidos.',
      'Tira de los codos hacia abajo y atrás para subir.',
      'Lleva el mentón por encima de la barra.',
      'Baja lentamente hasta la extensión completa.'
    ],
    errors: [
      'Usar impulso o kipping.',
      'No llegar a la extensión completa abajo.',
      'Encogerse de hombros al subir.'
    ],
    tips: [
      'El chin-up activa más el bíceps que el pull-up (agarre prono).',
      'Enfócate en llevar los codos a las costillas, no en subir la barbilla.',
      'Una bajada de 4 segundos construye fuerza rápidamente.'
    ]
  },
  'Pull-ups': {
    emoji: '🔝',
    primary: ['Dorsal ancho'],
    secondary: ['Romboides', 'Bíceps', 'Core'],
    steps: [
      'Agarra la barra con palmas mirando hacia afuera (pronación), más ancho que hombros.',
      'Cuelga con brazos completamente extendidos y hombros activos.',
      'Deprime los hombros (bajarlos de las orejas) antes de empezar.',
      'Tira de los codos hacia el suelo para subir el cuerpo.',
      'Baja de forma controlada.'
    ],
    errors: [
      'Subir con los hombros encogidos hasta las orejas.',
      'No llegar a la extensión completa.',
      'Balancear el cuerpo para ganar impulso.'
    ],
    tips: [
      'El pull-up es uno de los mejores ejercicios de espalda que existen.',
      'Varía el agarre (ancho, neutro, prono) para distintos estímulos.'
    ]
  },
  'Remo unilateral': {
    emoji: '💪',
    primary: ['Dorsal ancho', 'Romboides'],
    secondary: ['Bíceps', 'Trapecio inferior'],
    steps: [
      'Apoya una rodilla y mano del mismo lado en un banco.',
      'Agarra la mancuerna con la mano libre, brazo extendido.',
      'Tira de la mancuerna hacia la cadera, no hacia el hombro.',
      'Mantén la espalda paralela al suelo durante todo el movimiento.',
      'Baja controladamente hasta la extensión completa.'
    ],
    errors: [
      'Rotar el torso en exceso para usar impulso.',
      'Jalar hacia el hombro en lugar de la cadera.',
      'No llegar a la extensión completa abajo.'
    ],
    tips: [
      'Imagina que tienes un lápiz entre los omóplatos y lo intentas apretar al subir.',
      'El codo debe quedarse cerca del cuerpo durante el movimiento.'
    ]
  },
  'Press de hombro con barra': {
    emoji: '🏋️',
    primary: ['Deltoides anterior y lateral'],
    secondary: ['Tríceps', 'Trapecio'],
    steps: [
      'Siéntate con espalda apoyada o de pie, barra a la altura de los hombros.',
      'Agarre ligeramente más ancho que los hombros.',
      'Empuja la barra hacia arriba en línea recta.',
      'Extiende completamente los brazos sin bloquear los codos.',
      'Baja la barra de forma controlada hasta la altura de la barbilla.'
    ],
    errors: [
      'Arquear excesivamente la zona lumbar.',
      'Llevar la barra hacia adelante en lugar de verticalmente.',
      'Bajar la barra hasta los hombros bruscamente.'
    ],
    tips: [
      'El press militar de pie activa más el core que sentado.',
      'Aprieta los glúteos para proteger la zona lumbar.',
      'El agarre neutro (mancuernas) es más amigable con los hombros.'
    ]
  },
  'Elevaciones laterales': {
    emoji: '💫',
    primary: ['Deltoides lateral'],
    secondary: ['Trapecio superior'],
    steps: [
      'Párate o siéntate con mancuernas a los costados.',
      'Levanta los brazos hacia los lados con codos ligeramente flexionados.',
      'Sube hasta que los brazos estén paralelos al suelo (no más arriba).',
      'Controla la bajada durante 2-3 segundos.'
    ],
    errors: [
      'Usar impulso o balancearse.',
      'Subir las mancuernas por delante del cuerpo (trabaja el deltoides anterior).',
      'Encogerse de hombros al subir.'
    ],
    tips: [
      'El peso debe ser relativamente ligero — el deltoides lateral es pequeño.',
      'Inclina ligeramente las mancuernas (el meñique arriba) para mejor aislamiento.',
      'Las elevaciones en cable dan tensión constante durante todo el rango.'
    ]
  },
  'Martillo': {
    emoji: '💪',
    primary: ['Braquiorradial', 'Bíceps'],
    secondary: ['Antebrazo'],
    steps: [
      'Párate o siéntate con mancuernas a los costados, palmas mirándose.',
      'Mantén los codos fijos al costado del cuerpo.',
      'Curva los antebrazos hacia los hombros sin rotar las muñecas.',
      'Aprieta en la cima del movimiento.',
      'Baja de forma controlada.'
    ],
    errors: [
      'Balancear el torso para subir el peso.',
      'Mover los codos hacia adelante.',
      'Bajar el peso sin control.'
    ],
    tips: [
      'El agarre neutro (palmas mirándose) activa más el braquiorradial que el curl clásico.',
      'Excelente para desarrollar el grosor del brazo.'
    ]
  },
  'Copa (Skull crusher)': {
    emoji: '💪',
    primary: ['Tríceps (cabeza larga)'],
    secondary: ['Tríceps medial y lateral'],
    steps: [
      'Acuéstate con la mancuerna sostenida con ambas manos sobre el pecho.',
      'Extiende los brazos hacia arriba, codos ligeramente hacia adentro.',
      'Baja la mancuerna controladamente hacia la frente o detrás de la cabeza.',
      'Extiende los codos sin moverlos de su posición.',
      'El movimiento ocurre solo en los codos, no en los hombros.'
    ],
    errors: [
      'Mover los hombros durante el ejercicio.',
      'Dejar que los codos se abran hacia los lados.',
      'Bajar demasiado rápido.'
    ],
    tips: [
      'La cabeza larga del tríceps se activa más cuando el brazo está sobre la cabeza.',
      'El skull crusher con barra EZ es una variación clásica.',
      'Mantén el core activo para no arquear la espalda baja.'
    ]
  },
  'Plancha': {
    emoji: '🧱',
    primary: ['Core', 'Transverso abdominal'],
    secondary: ['Hombros', 'Glúteos'],
    steps: [
      'Apoya los antebrazos en el suelo, codos bajo los hombros.',
      'Extiende las piernas hacia atrás, apoyándote en las puntas de los pies.',
      'Tu cuerpo debe formar una línea recta de cabeza a talones.',
      'Aprieta el abdomen, glúteos y cuádriceps.',
      'Inhala por la nariz y exhala lentamente — nunca aguantes la respiración.',
      'Mantén la posición sin dejar caer las caderas ni levantarlas.'
    ],
    errors: [
      'Dejar caer las caderas (posición de arco).',
      'Levantar las caderas (posición de pirámide).',
      'Mirar hacia arriba y comprimir el cuello.',
      'Aguantar la respiración.'
    ],
    tips: [
      'Mira hacia el suelo, manteniendo el cuello en posición neutral.',
      'Imagina que alguien va a darte un golpe en el abdomen — esa es la contracción que necesitas.',
      'Progresión de tiempo: 3×20 seg → 3×30 seg → 3×45 seg → 3×60 seg → variantes dinámicas.',
      'Prueba la plancha con elevación de piernas o brazos alternos para añadir dificultad.'
    ]
  },
  'Curl con mancuernas': {
    emoji: '💪',
    primary: ['Bíceps'],
    secondary: ['Braquiorradial', 'Antebrazo'],
    steps: [
      'Párate o siéntate con mancuernas a los costados, palmas hacia adelante.',
      'Mantén los codos pegados al cuerpo.',
      'Sube las mancuernas contrayendo el bíceps.',
      'Supina ligeramente las muñecas (gíralas hacia afuera) al subir.',
      'Baja lentamente hasta la extensión completa.'
    ],
    errors: [
      'Mover los codos hacia adelante (usar el deltoides en vez del bíceps).',
      'Bajar el peso sin control (perder el excéntrico).',
      'Balancear el torso.'
    ],
    tips: [
      'La supinación de muñeca en la cima activa más el bíceps.',
      'El curl alterno te permite concentrarte en un brazo a la vez.',
      'La bajada controlada (3 seg.) es igual de importante que la subida.'
    ]
  },
  'Curl predicador': {
    emoji: '💪',
    primary: ['Bíceps (cabeza corta)'],
    secondary: ['Braquiorradial'],
    steps: [
      'Ajusta el banco predicador para que los brazos queden bien apoyados.',
      'Agarra la barra o mancuernas con palmas hacia arriba.',
      'Sube controlando que los codos no se levanten del pad.',
      'Baja hasta casi la extensión completa — no bloquees los codos.',
      'El movimiento es estrictamente en los codos.'
    ],
    errors: [
      'Levantar los codos del apoyo para subir más.',
      'Bajar el peso completamente (hiperextensión del codo).',
      'Usar impulso.'
    ],
    tips: [
      'El banco predicador elimina el impulso — trabaja el bíceps de forma estricta.',
      'La cabeza corta del bíceps se activa preferentemente en este ejercicio.'
    ]
  },
  'Jalón al pecho': {
    emoji: '🔝',
    primary: ['Dorsal ancho'],
    secondary: ['Romboides', 'Bíceps', 'Trapecio inferior'],
    steps: [
      'Siéntate con los muslos bajo los rodillos de la máquina.',
      'Agarra la barra con agarre prono, ligeramente más ancho que los hombros.',
      'Inclínate ligeramente hacia atrás y deprime los hombros.',
      'Tira de la barra hacia el pecho llevando los codos hacia abajo y atrás.',
      'Vuelve a la posición inicial de forma controlada.'
    ],
    errors: [
      'Jalar hacia el cuello o detrás de la cabeza (riesgo de lesión).',
      'Encogerse de hombros al subir.',
      'Inclinar el cuerpo demasiado hacia atrás (se convierte en remo).'
    ],
    tips: [
      'Enfócate en llevar los codos al suelo, no en bajar la barra.',
      'Un agarre neutro (manos mirándose) activa más el dorsal.',
      'No bloquees los codos arriba — mantén un poco de tensión.'
    ]
  },
  'Face pull': {
    emoji: '💫',
    primary: ['Deltoides posterior', 'Trapecio medio'],
    secondary: ['Manguito rotador', 'Romboides'],
    steps: [
      'Ajusta la polea a la altura de la cara.',
      'Agarra la cuerda con ambas manos, palmas hacia abajo, y da un paso atrás.',
      'Tira de la cuerda hacia la cara separando las manos al llegar.',
      'Los codos deben quedar más arriba que las muñecas.',
      'Vuelve al inicio controladamente.'
    ],
    errors: [
      'Jalar hacia el cuello (muy bajo).',
      'No separar las manos al final del recorrido.',
      'Usar demasiado peso y perder la técnica.'
    ],
    tips: [
      'El face pull es uno de los mejores ejercicios para la salud del hombro.',
      'Hazlo con un peso ligero y volumen alto (15-20 reps).',
      'Excelente como calentamiento o al final de cualquier sesión.'
    ]
  },
  'Hip thrust': {
    emoji: '🍑',
    primary: ['Glúteo mayor'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Apoya los omóplatos en un banco resistente.',
      'Barra sobre las caderas con un foam pad para protección.',
      'Pies planos en el suelo, a la altura de las caderas.',
      'Empuja la barra hacia arriba contrayendo los glúteos.',
      'Al llegar arriba, tu cuerpo forma una línea recta de hombros a rodillas.',
      'Baja sin que las caderas toquen el suelo.'
    ],
    errors: [
      'Hipextender la columna lumbar al llegar arriba.',
      'No apretar los glúteos en el punto máximo.',
      'Pies muy lejos o muy cerca.'
    ],
    tips: [
      'Mete el mentón al pecho para proteger la columna.',
      'El hip thrust es el rey para desarrollar glúteos.',
      'Prueba con una sola pierna para mayor intensidad.'
    ]
  },
  'Extensión de cuádriceps': {
    emoji: '🦵',
    primary: ['Cuádriceps'],
    secondary: [],
    steps: [
      'Siéntate en la máquina, espalda apoyada y rodillas en el borde del asiento.',
      'Ajusta el rodillo para que quede en la parte baja de las espinillas.',
      'Extiende las piernas hasta quedar casi rectas.',
      'Aprieta los cuádriceps en la posición extendida.',
      'Baja lentamente hasta 90° (no más abajo).'
    ],
    errors: [
      'Bajar más allá de 90° (sobrecarga el tendón rotuliano).',
      'Usar impulso o balanceo.',
      'No llegar a la extensión completa.'
    ],
    tips: [
      'Señala los pies ligeramente hacia adentro o afuera para variar el estímulo.',
      'El control excéntrico (bajar lento) es muy efectivo para el desarrollo del cuádriceps.'
    ]
  },
  'Prensa de pierna': {
    emoji: '🦵',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales'],
    steps: [
      'Siéntate en la máquina y coloca los pies en la plataforma a la altura de la cadera.',
      'Suelta los seguros y baja la plataforma hasta que las rodillas formen ~90°.',
      'Empuja con los talones para extender las piernas sin bloquear las rodillas.',
      'Mantén la espalda baja pegada al respaldo todo el tiempo.'
    ],
    errors: [
      'Despegar la espalda baja al bajar (riesgo de hernias).',
      'Bloquear completamente las rodillas al extender.',
      'Pies muy arriba (activa más los glúteos) o muy abajo (más cuádriceps) — elige según tu objetivo.'
    ],
    tips: [
      'Más apertura entre pies activa más los aductores.',
      'No pongas las manos en las rodillas — apóyalas en los agarres laterales.'
    ]
  },
  'Elevación de talones': {
    emoji: '🦶',
    primary: ['Pantorrilla (gastrocnemio)'],
    secondary: ['Sóleo'],
    steps: [
      'Párate en un escalón o superficie elevada con los talones colgando.',
      'Súbete de puntillas lo más alto posible.',
      'Mantén 1-2 segundos en la cima.',
      'Baja lentamente hasta sentir el estiramiento en las pantorrillas.'
    ],
    errors: [
      'Hacer el movimiento muy rápido sin control.',
      'No bajar lo suficiente (perder el estiramiento).',
      'Doblar las rodillas.'
    ],
    tips: [
      'Con rodillas rectas trabajas más el gastrocnemio; con rodillas flexionadas, más el sóleo.',
      'Las pantorrillas responden bien al volumen alto (15-20 reps).',
      'Hazlo unilateral para mayor intensidad.'
    ]
  },
  'Russian twist': {
    emoji: '🔄',
    primary: ['Oblicuos'],
    secondary: ['Recto abdominal', 'Core'],
    steps: [
      'Siéntate en el suelo con rodillas flexionadas y pies ligeramente elevados.',
      'Inclínate hacia atrás hasta ~45°, manteniendo la espalda recta.',
      'Entrelaza las manos o sostén un peso frente al pecho.',
      'Gira el torso de lado a lado, sin mover la cadera.',
      'Mantén el abdomen contraído durante todo el movimiento.'
    ],
    errors: [
      'Girar solo los brazos, no el torso.',
      'Redondear la espalda.',
      'Mover la cadera al rotar.'
    ],
    tips: [
      'Baja los pies al suelo si el equilibrio es difícil al inicio.',
      'Mantén la respiración constante — exhala al rotar.',
      'Ritmo lento (2-3 seg por lado) maximiza la contracción de oblicuos.',
      'Agrega una pelota medicinal o mancuerna para progresar.'
    ]
  },
  'Burpees': {
    emoji: '⚡',
    primary: ['Cuerpo completo'],
    secondary: ['Cardio', 'Core', 'Piernas'],
    steps: [
      'Párate con pies a la altura de los hombros.',
      'Agáchate y apoya las manos en el suelo.',
      'Salta los pies hacia atrás quedando en posición de plancha.',
      'Haz una flexión (opcional).',
      'Salta los pies hacia las manos.',
      'Salta hacia arriba extendiendo los brazos sobre la cabeza.'
    ],
    errors: [
      'No extender completamente el cuerpo en el salto.',
      'Dejar caer las caderas en la plancha.',
      'Apurar el movimiento perdiendo la forma.'
    ],
    tips: [
      'Es un ejercicio de acondicionamiento — la intensidad es el objetivo.',
      'Puedes eliminar el salto al inicio para hacerlo de menor impacto.',
      'Ideal para circuitos de cardio o finalizadores de sesión.'
    ]
  },
  'Caminadora': {
    emoji: '🚶',
    primary: ['Cardio', 'Piernas'],
    secondary: ['Core'],
    steps: [
      'Comienza a velocidad baja para calentar (3-4 km/h).',
      'Aumenta gradualmente la velocidad según tu objetivo.',
      'Mantén una postura erguida, no te apoyes en los parachoques.',
      'Para aumentar la intensidad, sube la inclinación.',
      'Enfría con 5 minutos a baja velocidad.'
    ],
    errors: [
      'Agarrarse de las parandas — anula el gasto calórico.',
      'Velocidad demasiado alta sin inclinación.',
      'Postura encorvada.'
    ],
    tips: [
      'Caminar al 10-15% de inclinación (incline walking) es excelente para glúteos y cardio de baja intensidad.',
      'Una sesión de 30-40 min en zona 2 (puedes conversar) mejora la salud cardiovascular.'
    ]
  },
  'Abducción de cadera': {
    emoji: '🍑',
    primary: ['Glúteo medio y menor', 'Tensor de la fascia lata'],
    secondary: ['Glúteo mayor'],
    steps: [
      'Usa la máquina de abducción o una banda resistencia.',
      'Siéntate con los pads en la parte externa de las rodillas.',
      'Abre las piernas contra la resistencia, apretando los glúteos.',
      'Mantén 1 segundo en la posición abierta.',
      'Vuelve lentamente a la posición inicial.'
    ],
    errors: [
      'Usar demasiado peso y perder la forma.',
      'No llegar al rango completo de movimiento.',
      'Inclinarse hacia los lados.'
    ],
    tips: [
      'El glúteo medio es clave para la estabilidad de la rodilla y cadera.',
      'También puedes hacerlo de pie con una banda resistencia.'
    ]
  },
  'Patada de glúteo': {
    emoji: '🍑',
    primary: ['Glúteo mayor'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Colócate en cuadrupedia (manos y rodillas en el suelo).',
      'Mantén el core activo y la espalda neutra.',
      'Extiende una pierna hacia atrás y arriba, apretando el glúteo.',
      'No hipextender la columna al subir la pierna.',
      'Baja controladamente y repite.'
    ],
    errors: [
      'Arquear la espalda baja para elevar la pierna más.',
      'No contraer el glúteo en la posición extendida.',
      'Rotar la cadera al elevar.'
    ],
    tips: [
      'Añade una mancuerna detrás de la rodilla o una band para más resistencia.',
      'Mantén la mirada hacia abajo para no tensionar el cuello.'
    ]
  },
  'Apertura con mancuernas': {
    emoji: '💪',
    primary: ['Pectoral mayor'],
    secondary: ['Hombro anterior', 'Bíceps'],
    steps: [
      'Acuéstate en el banco con mancuernas sobre el pecho, palmas mirándose.',
      'Abre los brazos hacia los lados con codos ligeramente flexionados.',
      'Baja hasta sentir el estiramiento en el pecho (sin pasar la línea del banco).',
      'Vuelve al inicio como si abrazaras un árbol.',
      'El movimiento es en los hombros, no en los codos.'
    ],
    errors: [
      'Doblar demasiado los codos (se convierte en press).',
      'Bajar las mancuernas más allá del plano del pecho.',
      'Usar demasiado peso y perder el estiramiento.'
    ],
    tips: [
      'Las aperturas son ideales para el final de la sesión de pecho con peso ligero y muchas reps.',
      'En cable, la tensión es constante durante todo el rango.'
    ]
  },
  'Press Arnold': {
    emoji: '💫',
    primary: ['Deltoides anterior y lateral'],
    secondary: ['Tríceps', 'Trapecio'],
    steps: [
      'Siéntate con mancuernas a la altura de los hombros, palmas mirando hacia ti.',
      'Al empujar hacia arriba, rota las palmas hasta que miren hacia afuera.',
      'Extiende completamente los brazos.',
      'Al bajar, rota de regreso hasta que las palmas te miren.',
      'Es un movimiento fluido de rotación + press.'
    ],
    errors: [
      'Hacer la rotación de forma abrupta.',
      'No completar el rango de rotación.',
      'Arquear la espalda.'
    ],
    tips: [
      'Creado por Arnold Schwarzenegger para trabajar más ángulos del deltoides.',
      'El rango de movimiento más completo activa mejor el deltoides medial.'
    ]
  },
  'Press francés': {
    emoji: '💪',
    primary: ['Tríceps'],
    secondary: [],
    steps: [
      'Acuéstate con la barra EZ o mancuerna sobre el pecho, brazos extendidos.',
      'Baja la pesa hacia la frente o detrás de la cabeza doblando solo los codos.',
      'Los codos apuntan al techo durante todo el movimiento.',
      'Extiende los brazos de regreso a la posición inicial.'
    ],
    errors: [
      'Mover los hombros durante el movimiento.',
      'Codos que se abren hacia los lados.',
      'Bajar demasiado rápido.'
    ],
    tips: [
      'La variante con barra EZ es más cómoda para las muñecas.',
      'Combinado con press de pecho en superserie = excelente para tríceps.'
    ]
  },
  'Jalón de tríceps en polea': {
    emoji: '💪',
    primary: ['Tríceps'],
    secondary: [],
    steps: [
      'Párate frente a la polea alta con la cuerda o barra.',
      'Codos pegados al cuerpo, parte superior del brazo inmóvil.',
      'Extiende los antebrazos hacia abajo hasta bloquear los codos.',
      'Vuelve lentamente arriba hasta que los antebrazos estén paralelos al suelo.'
    ],
    errors: [
      'Mover los codos hacia adelante y atrás.',
      'No llegar a la extensión completa.',
      'Inclinarse hacia adelante en exceso.'
    ],
    tips: [
      'Al usar la cuerda, separa las manos al final para activar más la cabeza lateral.',
      'Mantén los codos fijos — si se mueven, el peso es demasiado.'
    ]
  },
  'Dead bug': {
    emoji: '🧱',
    primary: ['Core profundo', 'Transverso abdominal'],
    secondary: ['Psoas', 'Estabilizadores lumbares'],
    steps: [
      'Acuéstate boca arriba con brazos extendidos hacia el techo y caderas y rodillas a 90°.',
      'Mantén la zona lumbar PEGADA al suelo — este es el punto clave.',
      'Baja lentamente el brazo derecho y la pierna izquierda hacia el suelo.',
      'Para cuando la zona lumbar empiece a despegarse.',
      'Regresa al inicio y repite del otro lado.'
    ],
    errors: [
      'Dejar que la zona lumbar se arquee al extender.',
      'Ir demasiado rápido.',
      'No coordinar brazo y pierna opuestos.'
    ],
    tips: [
      'Este ejercicio es más difícil de lo que parece — empieza con rangos cortos.',
      'Exhala al extender las extremidades para facilitar la estabilización.',
      'Es uno de los mejores ejercicios para el core profundo y la estabilidad lumbar.'
    ]
  },
  'Step up': {
    emoji: '🦵',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Párate frente a un banco o escalón a la altura de la rodilla.',
      'Sube con una pierna, empujando completamente hasta extender la rodilla.',
      'No empujes con la pierna del suelo — todo el trabajo es de la pierna elevada.',
      'Baja controladamente al inicio.'
    ],
    errors: [
      'Ayudarse con la pierna del suelo.',
      'Inclinarse demasiado hacia adelante.',
      'Usar un banco demasiado bajo.'
    ],
    tips: [
      'Cuanto más alto el escalón, más glúteo; más bajo, más cuádriceps.',
      'Agrega mancuernas para aumentar la dificultad.'
    ]
  },
  // ── NUEVOS EJERCICIOS ──
  'Sentadilla búlgara': {
    emoji: '🦵',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Coloca el pie trasero sobre un banco o superficie elevada detrás de ti.',
      'El pie delantero queda a ~60-70 cm del banco.',
      'Baja la rodilla trasera hacia el suelo manteniendo el torso erguido.',
      'La rodilla delantera sigue la dirección del pie, sin colapsar hacia adentro.',
      'Empuja con el talón delantero para volver a la posición inicial.'
    ],
    errors: [
      'Rodilla delantera colapsando hacia adentro.',
      'Torso muy inclinado hacia adelante.',
      'Pie delantero demasiado cerca del banco.'
    ],
    tips: [
      'Es uno de los mejores ejercicios unilaterales para corregir desequilibrios entre piernas.',
      'Coloca el empeine del pie trasero sobre el banco, no la punta.',
      'Empieza con solo tu peso corporal para dominar el equilibrio.'
    ]
  },
  'Zancadas caminando': {
    emoji: '🚶',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Párate erguido con las pesas al costado o sin ellas.',
      'Da un paso largo hacia adelante y baja hasta que ambas rodillas formen ~90°.',
      'La rodilla trasera casi toca el suelo.',
      'Empuja hacia adelante con el pie delantero para continuar caminando.',
      'Alterna piernas con cada paso.'
    ],
    errors: [
      'Pasos demasiado cortos que no permiten bajar a 90°.',
      'Torso inclinado hacia adelante.',
      'Rodilla delantera pasando la punta del pie.'
    ],
    tips: [
      'Activa el core en cada paso para mejorar el balance.',
      'Perfectas en circuito o como finalizador de piernas.'
    ]
  },
  'Peso muerto sumo': {
    emoji: '⚡',
    primary: ['Glúteos', 'Aductores', 'Isquiotibiales'],
    secondary: ['Espalda baja', 'Trapecios'],
    steps: [
      'Abre los pies más allá del ancho de hombros, puntas apuntando 45° hacia afuera.',
      'Baja las caderas y agarra la barra con agarre neutro entre las piernas.',
      'Espalda recta, pecho arriba, hombros hacia atrás.',
      'Empuja el suelo separando los pies y extiende caderas y rodillas simultáneamente.',
      'Baja de forma controlada invirtiendo el movimiento.'
    ],
    errors: [
      'Redondear la espalda baja.',
      'Dejar que las rodillas colapsen hacia adentro.',
      'No activar las caderas — el movimiento viene de empujar el suelo, no de jalar.'
    ],
    tips: [
      'Activa más los aductores y glúteos que el peso muerto convencional.',
      'Útil para personas con torso largo ya que permite posición más vertical.'
    ]
  },
  'Remo T-bar': {
    emoji: '🏋️',
    primary: ['Latísimo del dorso', 'Romboides'],
    secondary: ['Bíceps', 'Trapecios', 'Core'],
    steps: [
      'Coloca la barra en la esquina o usa la máquina T-bar.',
      'Inclina el torso ~45° con rodillas ligeramente flexionadas.',
      'Agarra el mango neutro (o la barra) con ambas manos.',
      'Jala hacia el abdomen apretando los omóplatos al final del recorrido.',
      'Baja controladamente con los brazos extendidos.'
    ],
    errors: [
      'Redondear la espalda.',
      'Usar impulso del torso para jalar.',
      'No retraer los omóplatos al final.'
    ],
    tips: [
      'Permite mayor carga que el remo unilateral — excelente para espalda gruesa.',
      'Agarre neutro (palmas mirándose) es más cómodo para las muñecas.'
    ]
  },
  'Remo en máquina': {
    emoji: '🏋️',
    primary: ['Latísimo del dorso', 'Romboides'],
    secondary: ['Bíceps', 'Trapecios'],
    steps: [
      'Ajusta el asiento para que el pecho quede apoyado en el pad.',
      'Agarra los agarres con los brazos extendidos.',
      'Jala los agarres hacia el abdomen apretando los omóplatos.',
      'Mantén el pecho en contacto con el pad durante todo el movimiento.',
      'Extiende los brazos lentamente para volver al inicio.'
    ],
    errors: [
      'Separar el pecho del pad.',
      'No llegar al rango completo de extensión.',
      'Tirar con los bíceps en lugar de jalar con los codos.'
    ],
    tips: [
      'La máquina aisla mejor la espalda al eliminar la necesidad de estabilizar el torso.',
      'Ideal para aprender la técnica antes de pasar al remo libre.'
    ]
  },
  'Pullover con mancuerna': {
    emoji: '🏋️',
    primary: ['Latísimo del dorso', 'Pectoral mayor'],
    secondary: ['Tríceps largo', 'Core'],
    steps: [
      'Acuéstate transversal o longitudinal en el banco, espalda apoyada.',
      'Sostén la mancuerna con ambas manos sobre el pecho, codos ligeramente flexionados.',
      'Baja la mancuerna en arco hacia atrás y abajo, detrás de la cabeza.',
      'Siente el estiramiento en el pecho y el latísimo.',
      'Regresa en arco a la posición inicial contrayendo el latísimo.'
    ],
    errors: [
      'Doblar excesivamente los codos (se convierte en press).',
      'Bajar la mancuerna más de lo que la movilidad del hombro permite.',
      'Arquear la espalda baja al bajar.'
    ],
    tips: [
      'Ejercicio único que trabaja simultáneamente pecho y espalda.',
      'Perfecto como ejercicio de transición entre sesiones de pecho y espalda.'
    ]
  },
  'Encogimientos con barra': {
    emoji: '🏔️',
    primary: ['Trapecios superiores'],
    secondary: ['Romboides', 'Elevador de la escápula'],
    steps: [
      'Párate con la barra frente a los muslos, agarre prono al ancho de hombros.',
      'Brazos completamente extendidos, dejando los hombros caer hacia abajo.',
      'Sube los hombros directo hacia las orejas lo más alto posible.',
      'Mantén 1 segundo en la cima apretando los trapecios.',
      'Baja lentamente y repite.'
    ],
    errors: [
      'Rotar los hombros (círculos) — no es necesario y estresa la articulación.',
      'Doblar los codos durante el movimiento.',
      'Rango de movimiento muy pequeño.'
    ],
    tips: [
      'Los trapecios superiores responden bien a cargas altas y reps moderadas.',
      'También con mancuernas o en cables para variar el ángulo.'
    ]
  },
  'Aperturas en polea alta': {
    emoji: '💪',
    primary: ['Pectoral mayor (zona media-baja)'],
    secondary: ['Deltoides anterior', 'Core'],
    steps: [
      'Ajusta las poleas a la altura de los hombros o más arriba.',
      'Párate en el centro con un cable en cada mano, un pie adelantado.',
      'Con codos ligeramente flexionados, lleva las manos hacia el centro y abajo, cruzándolas frente al abdomen.',
      'Aprieta el pecho al final del recorrido.',
      'Regresa lentamente con tensión constante.'
    ],
    errors: [
      'Doblar demasiado los codos (se convierte en jalón).',
      'Mover el torso hacia adelante para ayudarse.',
      'No mantener la tensión en la fase excéntrica.'
    ],
    tips: [
      'El cable mantiene tensión constante a diferencia de las mancuernas.',
      'Baja las poleas para trabajar más la parte superior del pecho.'
    ]
  },
  'Peck deck': {
    emoji: '🦋',
    primary: ['Pectoral mayor'],
    secondary: ['Deltoides anterior'],
    steps: [
      'Siéntate en la máquina ajustando los codos a la altura de los hombros.',
      'Apoya los antebrazos en los pads o agarra los agarres.',
      'Lleva los pads hacia el centro del pecho contrayendo los pectorales.',
      'Mantén 1 segundo al cierre apretando el pecho.',
      'Vuelve lentamente a la posición inicial sin soltar la tensión.'
    ],
    errors: [
      'Dejar que los pads se abran más allá de la línea de los hombros.',
      'Usar demasiado peso y perder el control excéntrico.',
      'Encorvar los hombros hacia adelante.'
    ],
    tips: [
      'Excelente para aislamiento de pecho con bajo riesgo para los hombros.',
      'Ideal para el final de la sesión de pecho con peso moderado y muchas reps.'
    ]
  },
  'Remo al mentón': {
    emoji: '⬆️',
    primary: ['Deltoides lateral', 'Trapecios superiores'],
    secondary: ['Bíceps', 'Deltoides anterior'],
    steps: [
      'Párate con la barra o cables frente a ti, agarre prono al ancho de hombros o más cerrado.',
      'Jala hacia arriba llevando los codos por encima de las manos.',
      'Sube hasta que la barra llegue a la altura del mentón.',
      'Los codos deben quedar más altos que las muñecas en todo momento.',
      'Baja controladamente.'
    ],
    errors: [
      'Agarre demasiado cerrado — aumenta el riesgo de impingement de hombro.',
      'No subir lo suficiente.',
      'Usar impulso del cuerpo.'
    ],
    tips: [
      'El agarre al ancho de hombros reduce el riesgo de lesión en el hombro.',
      'Activa deltoides lateral y trapecios — complementa bien las elevaciones laterales.'
    ]
  },
  'Press de hombro en máquina': {
    emoji: '🔧',
    primary: ['Deltoides anterior y lateral'],
    secondary: ['Tríceps', 'Trapecio'],
    steps: [
      'Ajusta el asiento para que los agarres queden a la altura de los hombros.',
      'Empuja hacia arriba extendiendo los brazos sin bloquear los codos.',
      'Baja controladamente hasta que los codos queden a 90°.',
      'Mantén la espalda baja apoyada en el respaldo.'
    ],
    errors: [
      'Arquear la espalda baja.',
      'Encorvar los hombros al subir.',
      'Rango de movimiento incompleto.'
    ],
    tips: [
      'La máquina es más segura que el press libre para quienes tienen molestia en el hombro.',
      'Permite mayor concentración en el músculo sin preocuparse por el equilibrio.'
    ]
  },
  'Curl inverso': {
    emoji: '💪',
    primary: ['Braquiorradial', 'Extensores de muñeca'],
    secondary: ['Bíceps braquial', 'Braquial'],
    steps: [
      'Agarra la barra con agarre prono (palmas abajo) al ancho de hombros.',
      'Codos pegados al cuerpo, parte superior del brazo inmóvil.',
      'Flexiona los codos llevando la barra hacia los hombros.',
      'Baja lentamente y de forma controlada.'
    ],
    errors: [
      'Mover los codos hacia adelante.',
      'Soltar el agarre prono a mitad del movimiento.',
      'Usar impulso del cuerpo.'
    ],
    tips: [
      'Trabaja principalmente los braquiorradiales — excelente para antebrazos voluminosos.',
      'La barra EZ reduce la tensión en las muñecas vs. la barra recta.'
    ]
  },
  'Curl 21s': {
    emoji: '💪',
    primary: ['Bíceps braquial'],
    secondary: ['Braquial', 'Braquiorradial'],
    steps: [
      'Agarra la barra o mancuernas con agarre supino.',
      'Haz 7 reps de la mitad inferior: de brazos extendidos hasta 90°.',
      'Sin descanso, haz 7 reps de la mitad superior: de 90° hasta los hombros.',
      'Sin descanso, haz 7 reps del rango completo.'
    ],
    errors: [
      'Descansar entre las tres partes del set.',
      'Usar demasiado peso y perder la forma en la última serie.',
      'Mover los codos durante el movimiento.'
    ],
    tips: [
      'El tiempo bajo tensión prolongado es lo que hace este método tan efectivo.',
      'Usa 60-70% del peso que usarías en un curl normal.'
    ]
  },
  'Dips en banco': {
    emoji: '💪',
    primary: ['Tríceps'],
    secondary: ['Pectoral menor', 'Deltoides anterior'],
    steps: [
      'Apoya las palmas en el borde de un banco, dedos hacia adelante.',
      'Pies en el suelo o elevados en otro banco para mayor dificultad.',
      'Baja el cuerpo doblando los codos hasta ~90°.',
      'Empuja hacia arriba extendiendo los brazos.'
    ],
    errors: [
      'Bajar demasiado — crea estrés innecesario en el hombro anterior.',
      'Separar las caderas del banco.',
      'Codos muy abiertos hacia los lados.'
    ],
    tips: [
      'Pies elevados aumenta la dificultad; pies en el suelo la reduce.',
      'Puedes agregar un peso en el regazo para progresar.'
    ]
  },
  'Press cerrado': {
    emoji: '💪',
    primary: ['Tríceps'],
    secondary: ['Pectoral mayor', 'Deltoides anterior'],
    steps: [
      'Acuéstate en el banco con la barra. Agarre prono más cerrado que en el press normal (unos 30-40 cm entre manos).',
      'Baja la barra hacia el pecho bajo con codos ligeramente pegados al cuerpo.',
      'Empuja hacia arriba y ligeramente hacia los hombros.',
      'No bloquees completamente los codos al extender.'
    ],
    errors: [
      'Agarre demasiado cerrado — estresa las muñecas.',
      'Codos muy abiertos hacia los lados (pierde el enfoque en tríceps).',
      'Rebotar la barra en el pecho.'
    ],
    tips: [
      'Es el ejercicio compuesto de tríceps más efectivo junto con los fondos.',
      'Combínalo con jalón de tríceps en superserie para máxima bomba.'
    ]
  },
  'Rueda abdominal': {
    emoji: '⚙️',
    primary: ['Recto abdominal', 'Core profundo'],
    secondary: ['Serrato anterior', 'Flexores de cadera', 'Latísimo del dorso'],
    steps: [
      'Arrodíllate en el suelo con la rueda frente a ti.',
      'Sujeta la rueda con ambas manos y mantén el core muy apretado.',
      'Rueda hacia adelante lentamente extendiendo el cuerpo hacia el suelo.',
      'Para cuando sientas que tu espalda baja va a arquearse.',
      'Vuelve jalando con el abdomen, no empujando con los brazos.'
    ],
    errors: [
      'Arquear la espalda baja — riesgo serio de lesión lumbar.',
      'Ir demasiado lejos antes de tener fuerza suficiente.',
      'No mantener el core activo durante todo el movimiento.'
    ],
    tips: [
      'Empieza con recorridos cortos y ve aumentando el rango con el tiempo.',
      'Uno de los ejercicios de core más exigentes — más difícil de lo que parece.',
      'Fortalece el core profundo, serrato anterior y flexores de cadera.'
    ]
  },
  'Plancha lateral': {
    emoji: '⬛',
    primary: ['Oblicuos'],
    secondary: ['Core profundo', 'Glúteo medio', 'Hombros'],
    steps: [
      'Acuéstate de lado con el cuerpo en línea recta.',
      'Apoya el antebrazo en el suelo, codo bajo el hombro.',
      'Levanta las caderas formando una línea recta desde la cabeza hasta los pies.',
      'Aprieta los oblicuos y el glúteo de la pierna superior.',
      'Respira de forma constante — exhala al elevar las caderas.',
      'Mantén la posición el tiempo indicado sin dejar caer la cadera a la mitad del set.'
    ],
    errors: [
      'Dejar caer las caderas (el error más común).',
      'Rotar el torso hacia adelante o atrás.',
      'Adelantar el codo respecto al hombro.',
      'No mantener la columna neutral.'
    ],
    tips: [
      'Trabaja los oblicuos de forma isométrica — ideal para la cintura lateral.',
      'Progresa levantando la pierna superior o añadiendo rotación de cadera hacia el suelo.',
      'Progresión de tiempo: 3×15 seg → 3×30 seg → 3×45 seg por lado.'
    ]
  },
  'Mountain climbers': {
    emoji: '🧗',
    primary: ['Core', 'Flexores de cadera'],
    secondary: ['Cuádriceps', 'Hombros', 'Cardio'],
    steps: [
      'Colócate en posición de plancha alta (brazos extendidos).',
      'Lleva una rodilla hacia el pecho de forma explosiva.',
      'Vuelve al inicio y alterna rápidamente con la otra pierna.',
      'Mantén las caderas bajas y el core activo durante todo el movimiento.'
    ],
    errors: [
      'Levantar las caderas (posición de V invertida).',
      'No llevar la rodilla suficientemente hacia el pecho.',
      'Perder la tensión en el core.'
    ],
    tips: [
      'Ritmo lento para trabajo de core; ritmo rápido para cardio.',
      'Excelente como finalizador de circuito o calentamiento dinámico.'
    ]
  },

  'Hollow body hold': {
    emoji: '🤸',
    primary: ['Core profundo', 'Transverso abdominal'],
    secondary: ['Recto abdominal', 'Flexores de cadera'],
    steps: [
      'Acuéstate boca arriba con brazos extendidos sobre la cabeza.',
      'Pega la zona lumbar al suelo contrayendo el core — este es el punto clave.',
      'Eleva los hombros y las piernas ligeramente del suelo (15-20 cm).',
      'Mantén las piernas rectas y los pies juntos, punta de pie extendida.',
      'Sostén la posición respirando de forma constante — no aguantes el aire.'
    ],
    errors: [
      'Arquear la zona lumbar — si se despega del suelo, el ejercicio pierde su propósito.',
      'Levantar demasiado los pies o los hombros (más no es mejor).',
      'Aguantar la respiración.'
    ],
    tips: [
      'Si la zona lumbar se despega, sube más las piernas hasta que puedas mantenerla plana.',
      'Empieza con 10-20 seg y progresa hacia 45-60 seg de forma gradual.',
      'La base de la gimnasia olímpica — usado por atletas de alto rendimiento para core profundo.'
    ]
  },

  'Dragon flag': {
    emoji: '🐉',
    primary: ['Recto abdominal', 'Core profundo'],
    secondary: ['Flexores de cadera', 'Glúteos', 'Espalda baja'],
    steps: [
      'Acuéstate en un banco y agarra el respaldo con ambas manos detrás de la cabeza.',
      'Eleva el cuerpo apoyándote solo en los hombros — el cuerpo debe estar recto como una tabla.',
      'Baja el cuerpo lentamente hacia el banco manteniendo la rigidez total.',
      'Detente antes de que las caderas o piernas toquen el banco.',
      'Sube de nuevo contrayendo el core para volver a la posición vertical.'
    ],
    errors: [
      'Doblar las caderas — el cuerpo debe ser una línea recta de hombros a pies.',
      'Bajar demasiado rápido sin controlar la fase excéntrica.',
      'Apoyarse en el cuello en lugar de los hombros.'
    ],
    tips: [
      'Uno de los ejercicios de core más avanzados — popularizado por Bruce Lee.',
      'Progresión: empieza con el negativo (solo la bajada) antes de hacer el movimiento completo.',
      'Requiere core muy sólido — domina primero hollow body, rueda abdominal y plancha antes de intentarlo.'
    ]
  },

  'V-up': {
    emoji: '✌️',
    primary: ['Recto abdominal', 'Flexores de cadera'],
    secondary: ['Oblicuos', 'Core profundo'],
    steps: [
      'Acuéstate boca arriba con brazos extendidos sobre la cabeza y piernas rectas.',
      'Contrae el abdomen y eleva simultáneamente el torso y las piernas hacia el centro.',
      'Intenta tocar los pies con las manos en la cima del movimiento.',
      'Baja lentamente tanto el torso como las piernas sin que toquen el suelo.',
      'Mantén el control excéntrico — no dejes caer de golpe.'
    ],
    errors: [
      'Doblar las rodillas para facilitar el movimiento.',
      'Usar impulso con los brazos en lugar de fuerza abdominal.',
      'Dejar que la zona lumbar se arquee al bajar.'
    ],
    tips: [
      'Si es difícil, empieza con V-up de piernas dobladas para construir la base.',
      'La bajada controlada es tan importante como la subida — aprovecha el excéntrico.',
      'Combina el trabajo del recto abdominal superior e inferior en un solo movimiento.'
    ]
  },

  'Bicicleta abdominal': {
    emoji: '🚲',
    primary: ['Oblicuos', 'Recto abdominal'],
    secondary: ['Core profundo', 'Flexores de cadera'],
    steps: [
      'Acuéstate con las manos detrás de la cabeza y rodillas dobladas a 90°.',
      'Eleva los hombros del suelo manteniendo el cuello relajado.',
      'Lleva el codo derecho hacia la rodilla izquierda mientras extiendes la pierna derecha.',
      'Rota al otro lado de forma controlada — codo izquierdo hacia rodilla derecha.',
      'Mantén un ritmo constante sin acelerar con impulso.'
    ],
    errors: [
      'Jalar la cabeza con las manos — el cuello queda tensionado.',
      'Hacer el movimiento demasiado rápido perdiendo la contracción.',
      'No llevar el codo realmente hacia la rodilla opuesta (rotación incompleta).'
    ],
    tips: [
      'Considerado uno de los ejercicios de oblicuos más efectivos en estudios de electromiografía.',
      'Ritmo lento (2-3 seg por lado) maximiza la activación muscular versus hacerlo rápido.',
      'La extensión completa de la pierna opuesta es clave para el rango de movimiento completo.'
    ]
  },

  'Chop en polea': {
    emoji: '🪓',
    primary: ['Oblicuos', 'Core rotacional'],
    secondary: ['Hombros', 'Glúteos', 'Espalda baja'],
    steps: [
      'Ajusta la polea en posición alta (para chop hacia abajo) o baja (para chop hacia arriba).',
      'Párate de lado a la máquina con pies a la altura de los hombros.',
      'Toma el agarre con ambas manos y mantén los brazos extendidos.',
      'Jala en diagonal cruzando el cuerpo — de arriba a abajo o de abajo a arriba.',
      'Rota el torso de forma controlada manteniendo las caderas estables y mirando al frente.'
    ],
    errors: [
      'Rotar las caderas en lugar del torso — el movimiento viene del tronco.',
      'Doblar demasiado los codos durante el arco del movimiento.',
      'Usar demasiado peso antes de dominar la técnica rotatoria.'
    ],
    tips: [
      'Uno de los mejores ejercicios de core rotacional y funcional — muy transferible al deporte.',
      'Activa oblicuos de forma dinámica, a diferencia de los ejercicios isométricos.',
      'Trabaja ambas versiones: chop alto (oblicuos internos) y chop bajo (oblicuos externos).'
    ]
  },

  'Pallof press': {
    emoji: '🏋️',
    primary: ['Core anti-rotacional', 'Transverso abdominal'],
    secondary: ['Oblicuos', 'Recto abdominal'],
    steps: [
      'Coloca la polea a la altura del pecho y párate de lado a la máquina.',
      'Toma el agarre con ambas manos frente al pecho, alejado de la polea.',
      'Empuja el agarre hacia adelante extendiendo los brazos completamente.',
      'Mantén la posición 1-2 segundos resistiendo activamente la rotación.',
      'Vuelve el agarre al pecho de forma controlada.'
    ],
    errors: [
      'Rotar el torso — el objetivo es resistir la rotación, no realizarla.',
      'Pararse demasiado cerca de la polea, reduciendo la tensión.',
      'Arquear la espalda baja durante la extensión de brazos.'
    ],
    tips: [
      'El Pallof press es anti-rotacional — el core trabaja resistiendo el movimiento, no haciéndolo.',
      'Cuanto más alejado estés de la polea, mayor el desafío.',
      'Excelente para mejorar la estabilidad del core en deportes de combate y rotacionales.'
    ]
  },

  'Flutter kicks': {
    emoji: '🦵',
    primary: ['Recto abdominal inferior', 'Flexores de cadera'],
    secondary: ['Cuádriceps', 'Core'],
    steps: [
      'Acuéstate boca arriba con las manos debajo de los glúteos.',
      'Pega la zona lumbar al suelo contrayendo el core.',
      'Eleva ambas piernas unos 15-20 cm del suelo con las piernas rectas.',
      'Alterna subiendo y bajando cada pierna en movimiento pequeño y rápido.',
      'Mantén la zona lumbar pegada al suelo durante todo el ejercicio.'
    ],
    errors: [
      'Arquear la zona lumbar — si se despega, sube más las piernas o para y descansa.',
      'Doblar las rodillas para facilitar el ejercicio.',
      'Aguantar la respiración durante el movimiento.'
    ],
    tips: [
      'Trabaja en series de tiempo (20-30 seg) más que en repeticiones.',
      'Si la zona lumbar se despega, es mejor parar — la calidad importa más que la cantidad.',
      'Combina con hollow body hold y elevación de piernas para un circuito completo de core inferior.'
    ]
  },

  'Kettlebell swing': {
    emoji: '🔔',
    primary: ['Glúteos', 'Isquiotibiales'],
    secondary: ['Core', 'Espalda baja', 'Trapecios'],
    steps: [
      'Párate con pies a la altura de los hombros, kettlebell en el suelo frente a ti.',
      'Toma la kettlebell con ambas manos y dale un pequeño impulso hacia atrás entre las piernas.',
      'Empuja con las caderas hacia adelante explosivamente extendiendo glúteos y caderas.',
      'La kettlebell sube hasta la altura del pecho por inercia — no jalas con los brazos.',
      'Deja bajar controladamente y repite el movimiento de cadera.'
    ],
    errors: [
      'Hacer una sentadilla en lugar de una bisagra de cadera.',
      'Jalar la kettlebell con los brazos.',
      'Redondear la espalda al bajar.'
    ],
    tips: [
      'El movimiento es 100% de cadera — como si quisieras cerrar un cajón con el trasero.',
      'Activa glúteos, isquiotibiales, core y cardio al mismo tiempo.',
      'Empieza ligero para dominar la mecánica de bisagra antes de añadir carga.'
    ]
  },
  'Saltar la cuerda': {
    emoji: '🪢',
    primary: ['Pantorrillas', 'Cardio'],
    secondary: ['Coordinación', 'Hombros'],
    steps: [
      'Sostén los mangos a la altura de las caderas, cuerda detrás de ti.',
      'Gira la cuerda con las muñecas, no con los codos ni los hombros.',
      'Salta con ambos pies juntos (básico) o alternando (paso corriendo).',
      'Mantén el torso erguido y aterriza suavemente en la punta de los pies.',
      'Empieza con series de 30-60 segundos y descansa.'
    ],
    errors: [
      'Saltar demasiado alto — solo necesitas 2-3 cm de elevación.',
      'Mover los brazos desde el codo o el hombro.',
      'Aterrizar con el talón — aumenta el impacto en las rodillas.'
    ],
    tips: [
      'Quema más calorías que correr al mismo ritmo percibido.',
      'Prueba series de saltos dobles (double unders) para mayor intensidad.'
    ]
  },
  'Buenos días': {
    emoji: '⚡',
    primary: ['Isquiotibiales', 'Espalda baja'],
    secondary: ['Glúteos', 'Core'],
    steps: [
      'Párate con la barra en los trapecios (igual que en sentadilla).',
      'Rodillas ligeramente flexionadas, pies a la altura de los hombros.',
      'Inclina el torso hacia adelante llevando las caderas hacia atrás.',
      'Baja hasta que el torso quede casi paralelo al suelo o donde sientas el límite.',
      'Vuelve al inicio contrayendo glúteos e isquiotibiales.'
    ],
    errors: [
      'Redondear la espalda.',
      'Doblar demasiado las rodillas.',
      'Usar peso excesivo al inicio.'
    ],
    tips: [
      'Empieza con peso muy ligero para aprender la mecánica.',
      'El movimiento es similar al peso muerto rumano pero con barra en la espalda.'
    ]
  },

  // ── PIERNAS ──

  'Curl de pierna sentado': {
    emoji: '🦵',
    primary: ['Isquiotibiales'],
    secondary: ['Gemelos'],
    steps: [
      'Siéntate en la máquina con la espalda apoyada y los tobillos sobre el rodillo.',
      'Ajusta el rodillo para que quede justo encima de los tobillos.',
      'Dobla las rodillas jalando los talones hacia los glúteos.',
      'Aprieta los isquiotibiales en la posición contraída.',
      'Extiende las piernas lentamente hasta casi la extensión completa.'
    ],
    errors: [
      'Levantar las caderas del asiento al contraer.',
      'Mover el torso hacia adelante con impulso.',
      'Extender completamente las rodillas con rebote.'
    ],
    tips: [
      'El curl sentado mantiene los isquiotibiales bajo tensión constante comparado con el acostado.',
      'Controla especialmente la fase excéntrica (extensión) para mayor hipertrofia.'
    ]
  },
  'Desplantes laterales': {
    emoji: '🦵',
    primary: ['Aductores', 'Glúteos'],
    secondary: ['Cuádriceps', 'Core'],
    steps: [
      'Párate con pies juntos o a la altura de los hombros.',
      'Da un paso amplio hacia un lado con una pierna.',
      'Dobla la rodilla de la pierna que avanzó hasta llegar a ~90°, la otra permanece extendida.',
      'Mantén el torso erguido y el pie plano en el suelo.',
      'Empuja con el talón para volver a la posición inicial y repite al otro lado.'
    ],
    errors: [
      'Dejar que la rodilla sobrepase la punta del pie en exceso.',
      'Inclinar el torso excesivamente hacia adelante.',
      'Rebotar en el fondo del movimiento.'
    ],
    tips: [
      'Excelente para movilidad de cadera y activación de aductores.',
      'Puedes sostener una mancuerna en cada mano para añadir resistencia.'
    ]
  },

  // ── PECHO ──

  'Press de pecho inclinado': {
    emoji: '🏋️',
    primary: ['Pectoral superior'],
    secondary: ['Deltoides anterior', 'Tríceps'],
    steps: [
      'Ajusta el banco a 30-45° de inclinación.',
      'Acuéstate con la espalda apoyada, pies en el suelo.',
      'Agarra las mancuernas o barra ligeramente más ancho que los hombros.',
      'Baja el peso controladamente hasta que los codos queden a ~90°.',
      'Empuja hacia arriba y ligeramente hacia adentro, sin bloquear los codos.'
    ],
    errors: [
      'Inclinar el banco demasiado (>45°) — empieza a trabajar el hombro en vez del pecho.',
      'Rebotar el peso en el pecho.',
      'Separar los glúteos del banco al empujar.'
    ],
    tips: [
      'Un ángulo de 30° activa bien el pectoral superior sin delegar tanto al hombro.',
      'Mantén los omóplatos retraídos y deprimidos durante todo el set.'
    ]
  },
  'Press de pecho declinado': {
    emoji: '🏋️',
    primary: ['Pectoral inferior'],
    secondary: ['Tríceps', 'Deltoides anterior'],
    steps: [
      'Ajusta el banco a -15 a -30° de declinación (cabeza hacia abajo).',
      'Asegúrate de que los pies estén bien sujetos en los soportes.',
      'Agarra la barra o mancuernas al ancho de los hombros.',
      'Baja el peso hacia la parte inferior del pecho de forma controlada.',
      'Empuja hacia arriba extendiendo los brazos.'
    ],
    errors: [
      'Arquear excesivamente la espalda.',
      'Dejar caer el peso sin control.',
      'Llevar el peso hacia el cuello en vez de la parte baja del pecho.'
    ],
    tips: [
      'El press declinado reduce la presión en los hombros comparado con el plano.',
      'El rango de movimiento es ligeramente menor que en el press plano o inclinado.'
    ]
  },
  'Flexiones': {
    emoji: '💪',
    primary: ['Pectoral mayor'],
    secondary: ['Tríceps', 'Deltoides anterior', 'Core'],
    steps: [
      'Colócate boca abajo con las manos ligeramente más anchas que los hombros.',
      'Mantén el cuerpo en línea recta desde la cabeza hasta los talones.',
      'Activa el core y los glúteos para no dejar caer las caderas.',
      'Baja el pecho hasta casi tocar el suelo doblando los codos a ~45° del cuerpo.',
      'Empuja el suelo con las palmas hasta extender los brazos completamente.'
    ],
    errors: [
      'Dejar caer las caderas (espalda arqueada).',
      'Elevar los glúteos por encima de la línea del cuerpo.',
      'Abrir demasiado los codos hacia los lados (estresa los hombros).'
    ],
    tips: [
      'Para aumentar la dificultad: eleva los pies, usa un chaleco con peso o agrega pausa en el fondo.',
      'Para reducir la dificultad: flexiones en rodillas o con las manos en un banco elevado.'
    ]
  },
  'Crossover': {
    emoji: '🏋️',
    primary: ['Pectoral mayor (zona media)'],
    secondary: ['Deltoides anterior', 'Bíceps'],
    steps: [
      'Colócate en el centro de la estación de poleas con las poleas en la parte alta.',
      'Agarra un agarre en cada mano y da un pequeño paso hacia adelante.',
      'Con los codos ligeramente flexionados, lleva las manos hacia abajo y al centro.',
      'Cruza una mano por encima de la otra para maximizar la contracción del pecho.',
      'Regresa controladamente a la posición inicial con los brazos abiertos.'
    ],
    errors: [
      'Doblar los codos en exceso (se convierte en un curl).',
      'Inclinar el torso excesivamente hacia adelante.',
      'Dejar que los brazos suban por encima de los hombros en la fase excéntrica.'
    ],
    tips: [
      'La tensión constante del cable hace este ejercicio superior al de mancuernas para aislamiento.',
      'Cambia la altura de la polea para enfatizar zonas distintas: polea alta = pecho inferior; polea baja = pecho superior.'
    ]
  },

  // ── ESPALDA ──

  'Remo con barra': {
    emoji: '🏋️',
    primary: ['Latísimo del dorso', 'Romboides'],
    secondary: ['Bíceps', 'Trapecios', 'Espalda baja'],
    steps: [
      'Párate con pies a la altura de los hombros, barra frente a ti.',
      'Inclina el torso hacia adelante ~45° con rodillas ligeramente flexionadas.',
      'Agarra la barra con agarre prono ligeramente más ancho que los hombros.',
      'Jala la barra hacia el abdomen inferior apretando los omóplatos al final.',
      'Baja la barra controladamente hasta la extensión completa.'
    ],
    errors: [
      'Redondear la espalda baja durante el movimiento.',
      'Usar el impulso del torso para levantar el peso.',
      'Jalar hacia el pecho en vez del abdomen.'
    ],
    tips: [
      'El remo con barra permite cargas muy altas — excelente para espalda gruesa.',
      'El agarre supino (palmas hacia arriba) activa más el bíceps y el latísimo inferior.'
    ]
  },
  'Remo en polea baja': {
    emoji: '🏋️',
    primary: ['Latísimo del dorso', 'Romboides'],
    secondary: ['Bíceps', 'Trapecios medios'],
    steps: [
      'Siéntate frente a la polea baja con los pies apoyados en la plataforma.',
      'Rodillas ligeramente flexionadas, espalda erguida.',
      'Agarra el mango neutro con los brazos extendidos.',
      'Jala el mango hacia el abdomen apretando los omóplatos al final.',
      'Extiende los brazos de forma controlada sin dejar que la espalda se redondee.'
    ],
    errors: [
      'Inclinar el torso hacia atrás para ayudarse — el movimiento debe venir solo de los brazos.',
      'Redondear la espalda al extender.',
      'No retraer los omóplatos al final del jalón.'
    ],
    tips: [
      'Mantén el pecho erguido durante todo el set — si te inclinas atrás, el peso es demasiado.',
      'Prueba diferentes mangos: ancho para romboides, neutro para dorsal.'
    ]
  },
  'Jalón con agarre neutro': {
    emoji: '🏋️',
    primary: ['Latísimo del dorso'],
    secondary: ['Bíceps', 'Romboides'],
    steps: [
      'Siéntate en la máquina de jalón y agarra la barra con agarre neutro (palmas mirándose).',
      'Inclínate ligeramente hacia atrás manteniendo el pecho erguido.',
      'Jala la barra hacia el pecho inferior, llevando los codos hacia las costillas.',
      'Aprieta los omóplatos hacia abajo y adentro en la posición contraída.',
      'Sube la barra de forma controlada hasta la extensión completa.'
    ],
    errors: [
      'Usar el impulso del cuerpo para bajar la barra.',
      'Dejar que los codos se alejen del cuerpo al subir.',
      'Subir la barra sin controlar la fase excéntrica.'
    ],
    tips: [
      'El agarre neutro es más cómodo para las muñecas y activa bien el latísimo.',
      'Imagina que intentas meter los codos en los bolsillos traseros del pantalón.'
    ]
  },

  // ── HOMBROS ──

  'Press militar': {
    emoji: '🏋️',
    primary: ['Deltoides anterior y lateral'],
    secondary: ['Tríceps', 'Trapecio', 'Core'],
    steps: [
      'Párate con pies a la altura de los hombros, barra a la altura de la clavícula.',
      'Agarre ligeramente más ancho que los hombros, codos debajo de la barra.',
      'Empuja la barra verticalmente sobre la cabeza, metiendo la cabeza hacia adelante cuando la barra pase la frente.',
      'Extiende completamente los brazos sin bloquear los codos.',
      'Baja la barra controladamente a la posición de partida.'
    ],
    errors: [
      'Arquear excesivamente la zona lumbar para compensar.',
      'No meter la cabeza al pasar la barra (trayectoria menos eficiente).',
      'Llevar la barra hacia adelante en vez de verticalmente hacia arriba.'
    ],
    tips: [
      'El press militar de pie activa más el core y los estabilizadores que la versión sentada.',
      'Aprieta los glúteos y el core durante todo el set para proteger la zona lumbar.'
    ]
  },
  'Elevaciones frontales': {
    emoji: '💫',
    primary: ['Deltoides anterior'],
    secondary: ['Pectoral superior', 'Trapecio'],
    steps: [
      'Párate con mancuernas frente a los muslos, palmas hacia atrás.',
      'Levanta los brazos hacia adelante con codos ligeramente flexionados.',
      'Sube hasta que los brazos queden paralelos al suelo (o ligeramente arriba).',
      'Controla la bajada durante 2-3 segundos.'
    ],
    errors: [
      'Usar impulso o balancear el torso hacia atrás.',
      'Subir los brazos por encima de 90° innecesariamente.',
      'Encogerse de hombros al subir.'
    ],
    tips: [
      'El deltoides anterior ya se trabaja mucho en press de pecho y hombro; no lo sobrecargues.',
      'Puedes hacer el movimiento con ambos brazos a la vez o de forma alternada.',
      'El cable ofrece tensión constante durante todo el recorrido.'
    ]
  },
  'Pájaro': {
    emoji: '💫',
    primary: ['Deltoides posterior'],
    secondary: ['Romboides', 'Trapecio medio'],
    steps: [
      'Inclínate hacia adelante ~45° con rodillas ligeramente flexionadas.',
      'Agarra las mancuernas con palmas mirándose, brazos colgando.',
      'Con los codos ligeramente flexionados, levanta los brazos hacia los lados hasta la altura de los hombros.',
      'Aprieta los omóplatos al llegar arriba.',
      'Baja lentamente manteniendo el control.'
    ],
    errors: [
      'Usar impulso o balancear el torso.',
      'Subir los brazos más allá de la horizontal.',
      'No mantener la inclinación del torso constante.'
    ],
    tips: [
      'El deltoides posterior es clave para la postura y para hombros equilibrados.',
      'En la máquina peck deck (en reversa) puedes usar más carga con mayor control.',
      'El cable o polea alta dan una curva de fuerza más uniforme que la mancuerna.'
    ]
  },

  // ── BÍCEPS ──

  'Curl con barra': {
    emoji: '💪',
    primary: ['Bíceps braquial'],
    secondary: ['Braquial', 'Braquiorradial'],
    steps: [
      'Párate con la barra colgando a los costados con agarre supino (palmas arriba).',
      'Pies a la altura de los hombros, codos pegados al cuerpo.',
      'Curva los antebrazos hacia los hombros sin mover los codos hacia adelante.',
      'Aprieta los bíceps en la cima del movimiento.',
      'Baja la barra controladamente hasta casi la extensión completa.'
    ],
    errors: [
      'Balancear el torso hacia atrás para subir el peso.',
      'Dejar que los codos se adelanten al subir.',
      'Bajar el peso sin control (fase excéntrica).'
    ],
    tips: [
      'La barra EZ reduce la presión en las muñecas comparado con la barra recta.',
      'Apoyarte contra una pared elimina el impulso y aísla el bíceps.'
    ]
  },
  'Curl concentrado': {
    emoji: '💪',
    primary: ['Bíceps braquial (pico)'],
    secondary: ['Braquial'],
    steps: [
      'Siéntate en un banco con piernas separadas.',
      'Apoya el codo de trabajo en la cara interna del muslo, brazo extendido.',
      'Con la mancuerna colgando, curva el antebrazo hacia el hombro.',
      'Gira ligeramente la muñeca hacia afuera (supinación) al subir.',
      'Baja de forma controlada hasta la extensión completa.'
    ],
    errors: [
      'Mover el hombro o el torso para ayudarse.',
      'No llegar a la extensión completa abajo.',
      'Usar un peso demasiado alto que impida el rango completo.'
    ],
    tips: [
      'Al apoyar el codo en el muslo se elimina el impulso casi por completo.',
      'La supinación al subir maximiza la contracción del bíceps.'
    ]
  },
  'Curl en polea': {
    emoji: '💪',
    primary: ['Bíceps braquial'],
    secondary: ['Braquial', 'Braquiorradial'],
    steps: [
      'Párate frente a la polea baja con la cuerda o barra corta.',
      'Codos pegados al cuerpo, agarre supino.',
      'Curva los antebrazos hacia los hombros manteniendo los codos fijos.',
      'Aprieta en la cima y baja de forma controlada.'
    ],
    errors: [
      'Dejar que los codos se adelanten al subir.',
      'Usar el torso para ayudarse.',
      'Soltar el peso rápido en la fase excéntrica.'
    ],
    tips: [
      'La polea mantiene tensión constante durante todo el rango de movimiento.',
      'Prueba el curl en polea alta (brazos extendidos hacia arriba) para un estímulo diferente.'
    ]
  },

  // ── TRÍCEPS ──

  'Extensión de tríceps': {
    emoji: '💪',
    primary: ['Tríceps'],
    secondary: [],
    steps: [
      'De pie o sentado, sostén la mancuerna con ambas manos sobre la cabeza.',
      'Codos apuntando al techo, brazos junto a la cabeza.',
      'Baja la mancuerna detrás de la cabeza doblando solo los codos.',
      'Extiende los codos completamente para volver a la posición inicial.',
      'Mantén los codos fijos durante todo el movimiento.'
    ],
    errors: [
      'Dejar que los codos se abran hacia los lados.',
      'Mover los hombros durante el ejercicio.',
      'No llegar a la extensión completa.'
    ],
    tips: [
      'La posición sobre la cabeza estira la cabeza larga del tríceps — mayor hipertrofia.',
      'También se puede hacer con barra EZ o en polea alta con cuerda.'
    ]
  },
  'Extensión sobre cabeza': {
    emoji: '💪',
    primary: ['Tríceps (cabeza larga)'],
    secondary: ['Tríceps medial y lateral'],
    steps: [
      'Siéntate o párate con la cuerda de polea alta detrás de ti o usa una mancuerna.',
      'Lleva los brazos sobre la cabeza con codos doblados, antebrazos hacia abajo.',
      'Extiende los codos llevando las manos hacia arriba.',
      'Mantén los codos cerca de la cabeza durante todo el movimiento.',
      'Regresa de forma controlada a la posición inicial.'
    ],
    errors: [
      'Abrir los codos hacia los lados.',
      'Inclinar el torso para compensar.',
      'No llegar a la extensión completa.'
    ],
    tips: [
      'Excelente para la cabeza larga del tríceps por el estiramiento completo.',
      'Con la cuerda en polea puedes girar las muñecas hacia afuera al extender para mayor contracción.'
    ]
  },
  'Kick back': {
    emoji: '💪',
    primary: ['Tríceps'],
    secondary: [],
    steps: [
      'Inclínate hacia adelante apoyando una mano en un banco.',
      'Lleva el brazo de trabajo hasta que la parte superior del brazo quede paralela al suelo.',
      'Extiende el codo hacia atrás hasta que el brazo quede completamente extendido.',
      'Aprieta el tríceps en la posición extendida.',
      'Baja controladamente doblando solo el codo.'
    ],
    errors: [
      'No llevar el brazo paralelo al suelo antes de extender (pierde efectividad).',
      'Balancear el torso para ayudarse.',
      'Doblar la muñeca al extender.'
    ],
    tips: [
      'El kick back en cable mantiene tensión constante a diferencia de la mancuerna.',
      'Pausa 1 segundo en la extensión completa para maximizar la contracción.'
    ]
  },

  // ── ABDOMEN / CORE ──

  'Crunch': {
    emoji: '🔥',
    primary: ['Recto abdominal superior'],
    secondary: ['Oblicuos'],
    steps: [
      'Acuéstate con rodillas flexionadas y pies planos en el suelo.',
      'Coloca las manos detrás de la cabeza o cruzadas sobre el pecho.',
      'Contrae el abdomen para levantar la cabeza y los hombros del suelo.',
      'Lleva el esternón hacia las rodillas sin levantar la zona lumbar.',
      'Baja de forma controlada sin dejar que la cabeza toque el suelo.'
    ],
    errors: [
      'Jalar la cabeza con las manos — genera estrés en el cuello.',
      'Levantar la zona lumbar del suelo (se convierte en sit-up).',
      'Hacer el movimiento con impulso o muy rápido.'
    ],
    tips: [
      'El rango de movimiento es pequeño — la efectividad está en la contracción, no en la altura.',
      'Exhala al subir y contrae el abdomen activamente en cada repetición.'
    ]
  },
  'Crunch en polea': {
    emoji: '🔥',
    primary: ['Recto abdominal'],
    secondary: ['Oblicuos'],
    steps: [
      'Arrodíllate frente a la polea alta con la cuerda detrás del cuello.',
      'Sostén los extremos de la cuerda junto a las orejas.',
      'Flexiona el tronco hacia abajo llevando los codos hacia las rodillas.',
      'Contrae el abdomen fuertemente en la posición baja.',
      'Sube controladamente sin dejar que la carga tire de ti.'
    ],
    errors: [
      'Usar las caderas para bajar en vez de flexionar la columna.',
      'Dejar que la polea te jale de vuelta sin control.',
      'Colocar la cuerda sobre la cabeza — debe estar junto a las orejas.'
    ],
    tips: [
      'La polea permite añadir carga progresiva al abdomen, algo que el crunch en suelo no permite.',
      'Mantén la cadera fija durante todo el movimiento — el movimiento ocurre solo en la columna.'
    ]
  },
  'Elevación de piernas': {
    emoji: '🔥',
    primary: ['Recto abdominal inferior', 'Flexores de cadera'],
    secondary: ['Oblicuos', 'Core'],
    steps: [
      'Acuéstate con la espalda plana en el suelo o en un banco.',
      'Coloca las manos debajo de los glúteos para proteger la zona lumbar.',
      'Con piernas estiradas (o ligeramente flexionadas), levántalas hasta 90°.',
      'Baja las piernas lentamente sin que toquen el suelo completamente.',
      'Para la versión colgante: agárrate de una barra y sube las rodillas o piernas rectas.'
    ],
    errors: [
      'Arquear la zona lumbar al bajar las piernas.',
      'Usar impulso para subir las piernas.',
      'No controlar la fase excéntrica.'
    ],
    tips: [
      'Mantén la zona lumbar pegada al suelo durante todo el movimiento.',
      'La versión colgante en barra es más difícil y activa más el core profundo.'
    ]
  },

  // ── CARDIO ──

  'Bicicleta estática': {
    emoji: '🚴',
    primary: ['Cardio', 'Piernas'],
    secondary: ['Glúteos', 'Core'],
    steps: [
      'Ajusta el asiento para que las rodillas queden ligeramente flexionadas al fondo del pedaleo.',
      'Ajusta el manubrio a una altura cómoda para la espalda.',
      'Pedalea a un ritmo constante manteniendo el core activo.',
      'Para intervalos HIIT: alterna 30 seg al máximo con 90 seg a ritmo moderado.',
      'Mantén una postura erguida y hombros relajados durante toda la sesión.'
    ],
    errors: [
      'Hundir los hombros y redondear la espalda.',
      'Pedalear solo con las puntas de los pies (debe ser con el metatarso).',
      'Resistencia demasiado baja — reduce el beneficio cardiovascular.'
    ],
    tips: [
      'Para quema de grasa: zona 2 cardio (60-70% FC máxima) por 30-60 min.',
      'Para capacidad cardiovascular: intervalos de alta intensidad (HIIT).'
    ]
  },
  'Elíptica': {
    emoji: '🏃',
    primary: ['Cardio', 'Piernas'],
    secondary: ['Glúteos', 'Core', 'Brazos'],
    steps: [
      'Sube a la elíptica y agarra los agarres móviles.',
      'Empieza a pedalear en movimiento elíptico hacia adelante.',
      'Mantén el torso erguido y el peso sobre los talones, no las puntas.',
      'Coordina el movimiento de brazos y piernas de forma opuesta.',
      'Para trabajar más los glúteos: inclina ligeramente el torso hacia adelante.'
    ],
    errors: [
      'Apoyarse en los agarres con el peso del cuerpo.',
      'Ir muy rápido con poca resistencia — es más efectivo lento con más resistencia.',
      'Hundir los hombros.'
    ],
    tips: [
      'La elíptica es de bajo impacto — ideal para quienes tienen problemas en rodillas.',
      'Pedalear hacia atrás activa más los isquiotibiales y glúteos.'
    ]
  },

  // ── FUNCIONAL ──

  'Salto a la caja': {
    emoji: '🦘',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Pantorrillas', 'Core', 'Isquiotibiales'],
    steps: [
      'Párate frente a una caja o plataforma estable a una distancia de un paso.',
      'Flexiona las rodillas en una posición de cuarto de sentadilla con los brazos hacia atrás.',
      'Impulsa los brazos hacia adelante y salta hacia la caja aterrizando con ambos pies.',
      'Aterriza con las rodillas ligeramente flexionadas para absorber el impacto.',
      'Baja de la caja dando un paso (no saltando) para proteger las articulaciones.'
    ],
    errors: [
      'Aterrizar con las rodillas completamente extendidas.',
      'Saltar desde demasiado lejos de la caja.',
      'Bajar de la caja saltando — aumenta el riesgo de lesión al acumular fatiga.'
    ],
    tips: [
      'Empieza con una caja baja (30-40 cm) y aumenta la altura progresivamente.',
      'El salto a la caja trabaja la potencia explosiva, no solo la fuerza.'
    ]
  },

  // ── TRX / SUSPENSIÓN ──

  'TRX Sentadilla': {
    emoji: '🔧',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Sostén las asas del TRX con ambas manos frente a ti, brazos extendidos.',
      'Pies a la altura de los hombros, puntas ligeramente hacia afuera.',
      'Mantén los brazos tensos y el pecho arriba usando las correas como guía.',
      'Baja como en una sentadilla convencional hasta que los muslos queden paralelos al suelo.',
      'Empuja el suelo con los talones para subir, apretando los glúteos al llegar arriba.'
    ],
    errors: [
      'Jalar las correas con los brazos en lugar de usarlas solo como apoyo.',
      'Dejar caer las rodillas hacia adentro.',
      'Inclinarse demasiado hacia atrás apoyándose en las correas.'
    ],
    tips: [
      'Las correas te permiten mantener el torso más erguido, ideal para quienes tienen poca movilidad de tobillo.',
      'Ajusta la longitud de las correas a la altura de la cintura para esta posición.',
      'A medida que ganas fuerza, usa menos tensión en las correas.'
    ]
  },

  'TRX Zancada': {
    emoji: '🔧',
    primary: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Sostén las asas del TRX con ambas manos, brazos extendidos frente al pecho.',
      'Da un paso largo hacia adelante con una pierna.',
      'Baja la rodilla trasera hacia el suelo manteniendo el torso erguido.',
      'La rodilla delantera no debe pasar la punta del pie.',
      'Empuja con el talón delantero para volver a la posición inicial y alterna piernas.'
    ],
    errors: [
      'Dejar que la rodilla delantera colapse hacia adentro.',
      'Inclinar el torso hacia adelante.',
      'Usar las correas para jalar el cuerpo arriba en lugar de usar las piernas.'
    ],
    tips: [
      'Las correas son especialmente útiles para equilibrarte mientras aprendes la técnica.',
      'Mantén la tensión en el core durante todo el movimiento.',
      'Puedes hacer la versión "reversa" dando el paso hacia atrás para un estímulo diferente.'
    ]
  },

  'TRX Remo': {
    emoji: '🔧',
    primary: ['Espalda media', 'Romboides'],
    secondary: ['Core', 'Bíceps'],
    steps: [
      'Sujeta las asas con ambas manos, palmas hacia adentro, y recuéstate hacia atrás inclinando el cuerpo.',
      'Extiende los brazos completamente, manteniendo el cuerpo recto como una tabla.',
      'Jala las asas hacia el pecho doblando los codos hacia atrás.',
      'Lleva los omóplatos juntos al llegar arriba.',
      'Baja de forma controlada extendiendo los brazos de nuevo.'
    ],
    errors: [
      'Dejar caer las caderas durante el movimiento.',
      'Jalar con los brazos en lugar de iniciar desde la espalda.',
      'No llevar los codos lo suficientemente atrás al subir.'
    ],
    tips: [
      'Cuanto más inclinado esté tu cuerpo hacia el suelo, más difícil es el ejercicio.',
      'Mantén el cuerpo perfectamente alineado de cabeza a talones.',
      'Ajusta la dificultad simplemente cambiando la posición de tus pies (más adelante = más fácil).'
    ]
  },

  'TRX Flexiones': {
    emoji: '🔧',
    primary: ['Pecho', 'Tríceps'],
    secondary: ['Core', 'Hombros'],
    steps: [
      'Sujeta las asas con ambas manos, palmas hacia abajo, e inclina el cuerpo hacia adelante.',
      'Extiende los brazos completamente manteniendo el cuerpo recto.',
      'Dobla los codos hacia afuera bajando el pecho hacia las asas.',
      'Mantén el core apretado y las caderas alineadas con el torso.',
      'Empuja para extender los brazos y volver a la posición inicial.'
    ],
    errors: [
      'Dejar caer las caderas o arquear la espalda.',
      'Abrir demasiado los codos (más de 45° del cuerpo).',
      'No completar el rango de movimiento en la bajada.'
    ],
    tips: [
      'Mayor inclinación del cuerpo hacia el suelo = mayor dificultad.',
      'La inestabilidad de las correas activa más el core que las flexiones en el suelo.',
      'Mantén los hombros lejos de las orejas durante todo el movimiento.'
    ]
  },

  'TRX Curl de bíceps': {
    emoji: '🔧',
    primary: ['Bíceps'],
    secondary: ['Core', 'Antebrazos'],
    steps: [
      'Sujeta las asas con palmas hacia arriba e inclina el cuerpo hacia atrás.',
      'Extiende completamente los brazos hacia adelante con el cuerpo inclinado.',
      'Dobla los codos llevando las manos hacia la cabeza, sin mover los codos de su posición.',
      'Mantén los codos fijos — son el pivote del movimiento.',
      'Baja de forma controlada extendiendo los brazos.'
    ],
    errors: [
      'Mover los codos hacia adelante o atrás durante el curl.',
      'Usar el cuerpo (balanceo) para ayudar a subir.',
      'No controlar la bajada.'
    ],
    tips: [
      'Imagina que tus codos son el eje de una puerta — solo se mueve el antebrazo.',
      'Más inclinación corporal = más peso corporal = más difícil.',
      'Excelente opción cuando no hay mancuernas disponibles.'
    ]
  },

  'TRX Extensión de tríceps': {
    emoji: '🔧',
    primary: ['Tríceps'],
    secondary: ['Core', 'Hombros'],
    steps: [
      'Sujeta las asas con palmas hacia abajo e inclina el cuerpo hacia adelante.',
      'Dobla los codos llevando las manos hacia la frente, manteniendo los codos elevados.',
      'El cuerpo debe estar inclinado y los brazos doblados formando un ángulo de 90°.',
      'Extiende los codos empujando hacia adelante para volver a la posición inicial.',
      'Mantén el core activo y evita que las caderas bajen.'
    ],
    errors: [
      'Dejar caer los codos durante la extensión.',
      'Arquear la espalda para compensar.',
      'No mantener los codos a la altura de los hombros.'
    ],
    tips: [
      'Este es uno de los mejores ejercicios de tríceps sin pesas.',
      'Cuanto más horizontal sea tu cuerpo, mayor el desafío.',
      'Mantén la cabeza neutral, no dejes que caiga entre los brazos.'
    ]
  },

  'TRX Plancha': {
    emoji: '🔧',
    primary: ['Core', 'Transverso abdominal'],
    secondary: ['Hombros', 'Glúteos'],
    steps: [
      'Coloca los pies en las asas del TRX boca abajo (correas cortas, talones en las asas).',
      'Apóyate en las manos como en una posición de flexión con el cuerpo recto.',
      'Mantén la posición con el abdomen apretado y las caderas alineadas.',
      'Respira de forma constante sin retener el aire.',
      'Sostén la posición el tiempo indicado.'
    ],
    errors: [
      'Dejar que las caderas suban o bajen.',
      'Dejar caer la cabeza.',
      'Apoyarse solo en los brazos sin activar el core.'
    ],
    tips: [
      'La inestabilidad de las correas hace esta plancha mucho más difícil que la convencional.',
      'Empieza con 20-30 segundos y aumenta progresivamente.',
      'Puedes añadir variantes como llevar las rodillas al pecho desde esta posición (TRX Mountain Climbers).'
    ]
  },

  'TRX Pike': {
    emoji: '🔧',
    primary: ['Core', 'Hombros'],
    secondary: ['Isquiotibiales', 'Transverso abdominal'],
    steps: [
      'Coloca los pies en las asas del TRX boca abajo, apoyado en las manos.',
      'Comienza en posición de plancha alta con el cuerpo recto.',
      'Eleva las caderas hacia arriba formando una "V" invertida, jalando los pies hacia las manos.',
      'Mantén las piernas lo más rectas posible durante el movimiento.',
      'Baja controladamente volviendo a la posición de plancha.'
    ],
    errors: [
      'Doblar las rodillas en lugar de llevar los pies hacia las manos con las piernas rectas.',
      'Redondear la espalda al bajar.',
      'Subir las caderas de golpe sin control.'
    ],
    tips: [
      'Uno de los ejercicios de core más completos del TRX.',
      'Mantén los brazos extendidos y los hombros estables durante todo el movimiento.',
      'Si es muy difícil, empieza con las rodillas dobladas en la versión "TRX Knee Tuck".'
    ]
  },

  'TRX Puente de glúteo': {
    emoji: '🔧',
    primary: ['Glúteos', 'Isquiotibiales'],
    secondary: ['Core', 'Espalda baja'],
    steps: [
      'Coloca los talones en las asas del TRX tumbado boca arriba con los brazos a los lados.',
      'Dobla las rodillas a 90° con los pies en las asas.',
      'Eleva las caderas apretando los glúteos hasta que el cuerpo forme una línea recta.',
      'Mantén la posición arriba 1-2 segundos apretando los glúteos.',
      'Baja de forma controlada sin dejar caer las caderas de golpe.'
    ],
    errors: [
      'Usar la espalda baja en lugar de los glúteos para elevar las caderas.',
      'No llegar a la posición completamente extendida arriba.',
      'Dejar que los pies se muevan en las asas perdiendo la posición.'
    ],
    tips: [
      'Para mayor dificultad, realiza el movimiento con una sola pierna.',
      'Ajusta la altura de las correas para que los talones queden cómodamente dentro.',
      'Ideal para activar glúteos sin carga en la columna.'
    ]
  },

  'TRX Apertura de pecho': {
    emoji: '🔧',
    primary: ['Pecho', 'Pectoral mayor'],
    secondary: ['Hombros', 'Core'],
    steps: [
      'Sujeta las asas con palmas hacia abajo e inclina el cuerpo hacia adelante.',
      'Con los brazos extendidos frente al pecho, abre los brazos hacia los lados.',
      'Baja el pecho hacia el suelo mientras los brazos se abren en arco.',
      'Mantén una ligera flexión en los codos durante todo el movimiento.',
      'Vuelve a la posición inicial juntando los brazos de nuevo.'
    ],
    errors: [
      'Doblar demasiado los codos, convirtiéndolo en una flexión.',
      'Dejar que las caderas caigan durante la apertura.',
      'Abrir los brazos más allá del nivel de los hombros.'
    ],
    tips: [
      'Equivalente funcional al cable fly o apertura con mancuernas.',
      'Mantén una tensión constante en el pecho durante todo el arco.',
      'Mayor inclinación hacia el suelo = más difícil.'
    ]
  }
};

// ── STRETCH DATA ──

const STRETCH_GUIDES: Record<string, StretchGuide> = {
  'Círculos de cadera': {
    emoji: '🔄',
    category: 'pre',
    area: ['Cadera', 'Lumbar'],
    duration: '30 seg por lado',
    steps: [
      'Párate con pies a la altura de los hombros y manos en la cintura.',
      'Dibuja círculos amplios con la cadera, como si usaras un hula hoop.',
      'Realiza 10 círculos hacia un lado y luego cambia de dirección.',
      'Mantén el torso relativamente quieto, el movimiento viene de la cadera.',
      'Aumenta el radio del círculo progresivamente con cada repetición.'
    ],
    tips: [
      'Ideal como primer movimiento de calentamiento.',
      'Si sientes tensión, reduce el rango de movimiento hasta que el cuerpo se caliente.'
    ]
  },
  'Péndulo de pierna': {
    emoji: '🦵',
    category: 'pre',
    area: ['Isquiotibiales', 'Flexores de cadera', 'Glúteos'],
    duration: '10-15 rep por pierna',
    steps: [
      'Apóyate con una mano en la pared o en un soporte estable.',
      'Balancea una pierna hacia adelante y atrás de forma controlada, como un péndulo.',
      'Aumenta el rango progresivamente sin forzar ni perder el control.',
      'Realiza 10-15 balanceos y luego cambia de pierna.',
      'También puedes balancear la pierna de lado a lado para activar la cadera lateralmente.'
    ],
    tips: [
      'El movimiento debe ser fluido, no brusco.',
      'Excelente para activar isquiotibiales antes de sentadillas o peso muerto.'
    ]
  },
  'Rotación de hombros': {
    emoji: '🔃',
    category: 'pre',
    area: ['Hombros', 'Manguito rotador'],
    duration: '10 rep por dirección',
    steps: [
      'Extiende los brazos a los lados formando una "T" con el cuerpo.',
      'Realiza círculos pequeños con los brazos extendidos.',
      'Aumenta gradualmente el tamaño de los círculos.',
      'Luego inviierte la dirección y repite.',
      'Puedes también encogerte de hombros hacia arriba y soltarlos lentamente.'
    ],
    tips: [
      'Perfecto antes de press de banca, press de hombros o cualquier jalón.',
      'Si sientes chasquidos, reduce el rango y aumenta la velocidad de calentamiento gradualmente.'
    ]
  },
  'Estocada dinámica con giro': {
    emoji: '🔀',
    category: 'pre',
    area: ['Flexores de cadera', 'Cuádriceps', 'Core', 'Columna torácica'],
    duration: '8 rep por lado',
    steps: [
      'Da un paso largo hacia adelante con una pierna entrando en posición de estocada.',
      'Baja la rodilla trasera sin tocar el suelo.',
      'En esa posición, lleva ambas manos hacia el lado de la pierna delantera y rota el torso.',
      'Regresa al centro y empuja para volver a la posición inicial.',
      'Alterna piernas con cada repetición.'
    ],
    tips: [
      'Activa la cadera, columna y piernas al mismo tiempo.',
      'Mantén el pie delantero apuntando al frente y la rodilla alineada con el segundo dedo del pie.'
    ]
  },
  'Apertura de pecho dinámica': {
    emoji: '🤸',
    category: 'pre',
    area: ['Pecho', 'Hombros', 'Columna torácica'],
    duration: '10 rep',
    steps: [
      'Extiende ambos brazos al frente a la altura del pecho, palmas juntas.',
      'Abre los brazos hacia los lados de forma explosiva, como si abrieras unas alas.',
      'Siente el estiramiento en el pecho y los hombros al abrir.',
      'Regresa los brazos al centro y repite.',
      'Puedes combinar con una ligera extensión de la columna al abrir.'
    ],
    tips: [
      'Realiza antes de press de banca o ejercicios de empuje.',
      'El movimiento de apertura activa el manguito rotador y prepara el hombro.'
    ]
  },
  'Gato-vaca': {
    emoji: '🐱',
    category: 'both',
    area: ['Columna', 'Lumbar', 'Core'],
    duration: '10 rep lentas',
    steps: [
      'Colócate en cuatro apoyos: manos bajo los hombros y rodillas bajo las caderas.',
      'Inhala: arquea la espalda hacia abajo, levanta la cabeza y el coxis (posición vaca).',
      'Exhala: redondea toda la columna hacia arriba, mete el mentón y el coxis (posición gato).',
      'Alterna lentamente entre ambas posiciones siguiendo tu respiración.',
      'Siente cada vértebra moviéndose de forma secuencial.'
    ],
    tips: [
      'Funciona tanto para calentar como para soltar tensión post-entrenamiento.',
      'Hazlo muy lento; la velocidad elimina el beneficio de movilidad.'
    ]
  },
  'Estiramiento de isquiotibiales': {
    emoji: '🦵',
    category: 'post',
    area: ['Isquiotibiales'],
    duration: '30-45 seg por pierna',
    steps: [
      'Siéntate en el suelo con una pierna extendida y la otra doblada hacia adentro.',
      'Mantén la espalda recta y los hombros relajados.',
      'Inclínate hacia adelante desde la cadera (no desde la espalda) hacia el pie extendido.',
      'Sostén la posición sin rebotar; respira profundo y relaja con cada exhalación.',
      'Cambia de pierna y repite.'
    ],
    tips: [
      'No fuerces la rodilla a quedar completamente extendida; una ligera flexión es válida.',
      'Si no alcanzas el pie, usa una toalla o banda alrededor del pie.'
    ]
  },
  'Estiramiento de cuádriceps': {
    emoji: '🦵',
    category: 'post',
    area: ['Cuádriceps'],
    duration: '30 seg por pierna',
    steps: [
      'Párate apoyándote en una pared o silla con una mano.',
      'Dobla una rodilla llevando el talón hacia los glúteos.',
      'Agarra el tobillo con la mano del mismo lado.',
      'Mantén las rodillas juntas y el torso erguido.',
      'Aguanta el estiramiento y cambia de pierna.'
    ],
    tips: [
      'Aprieta levemente el glúteo de la pierna que estiras para intensificar el estiramiento.',
      'Si tienes problemas de equilibrio, realízalo acostado boca abajo.'
    ]
  },
  'Paloma (estiramiento de glúteos)': {
    emoji: '🍑',
    category: 'post',
    area: ['Glúteos', 'Cadera', 'Piriforme'],
    duration: '45-60 seg por lado',
    steps: [
      'Desde cuatro apoyos, lleva una rodilla hacia adelante y hacia el lado opuesto.',
      'Estira la pierna trasera hacia atrás, dejando el muslo delantero cruzado frente a ti.',
      'Baja las caderas hacia el suelo lentamente.',
      'Mantén las caderas niveladas y apoya los antebrazos si necesitas más comodidad.',
      'Respira profundo y relaja los glúteos con cada exhalación.'
    ],
    tips: [
      'Es uno de los mejores estiramientos post-entrenamiento para días de piernas.',
      'Si sientes molestia en la rodilla, ajusta el ángulo del pie delantero.'
    ]
  },
  'Estiramiento de flexores de cadera': {
    emoji: '🧎',
    category: 'post',
    area: ['Flexores de cadera', 'Psoas', 'Cuádriceps'],
    duration: '30-45 seg por lado',
    steps: [
      'Arrodíllate en el suelo con una rodilla apoyada y la otra pierna adelante en ángulo de 90°.',
      'Empuja suavemente la cadera hacia adelante manteniendo la espalda recta.',
      'Siente el estiramiento en la parte delantera de la cadera de la pierna trasera.',
      'Para intensificar, levanta el brazo del lado trasero hacia arriba y hacia el lado.',
      'Mantén y luego cambia de lado.'
    ],
    tips: [
      'Ideal tras días con muchas sentadillas o estocadas.',
      'Evita arquear en exceso la lumbar; el movimiento viene de la cadera hacia adelante, no de la espalda.'
    ]
  },
  'Estiramiento de pecho y hombros': {
    emoji: '💪',
    category: 'post',
    area: ['Pecho', 'Hombros anteriores', 'Bíceps'],
    duration: '30 seg',
    steps: [
      'Entrelaza los dedos detrás de la espalda con los brazos extendidos.',
      'Levanta los brazos entrelazados alejándolos de la espalda mientras abres el pecho.',
      'Inclina ligeramente el mentón hacia arriba para abrir también el frente del cuello.',
      'Aguanta la posición respirando profundo.',
      'Como variante, apoya una mano en un marco de puerta y gira el torso hacia el lado opuesto.'
    ],
    tips: [
      'Esencial después de días de pecho o press de hombros.',
      'Hazlo sentado si prefieres mayor estabilidad.'
    ]
  },
  'Estiramiento de espalda baja': {
    emoji: '🙆',
    category: 'post',
    area: ['Lumbar', 'Glúteos', 'Columna'],
    duration: '30-45 seg',
    steps: [
      'Acuéstate boca arriba con las piernas extendidas.',
      'Dobla ambas rodillas y acércalas al pecho abrazándolas con los brazos.',
      'Mecete suavemente de lado a lado para masajear la zona lumbar.',
      'Para mayor intensidad, cruza una pierna sobre la otra y lleva ambas rodillas hacia el lado.',
      'Mantén los hombros apoyados en el suelo durante toda la postura.'
    ],
    tips: [
      'Perfecto para terminar cualquier sesión, especialmente días de piernas o espalda.',
      'La variación rotacional también estira la zona torácica.'
    ]
  },
  'Estiramiento de tríceps y latísimo': {
    emoji: '💪',
    category: 'post',
    area: ['Tríceps', 'Latísimo del dorso', 'Hombro'],
    duration: '30 seg por lado',
    steps: [
      'Levanta un brazo por encima de la cabeza y dóblalo llevando la mano hacia la espalda.',
      'Con la mano contraria, agarra el codo del brazo doblado.',
      'Empuja suavemente el codo hacia atrás y hacia abajo.',
      'Para estirar también el latísimo, inclínate levemente hacia el lado opuesto.',
      'Mantén y cambia de brazo.'
    ],
    tips: [
      'Indispensable después de fondos, press francés o cualquier jalón.',
      'No fuerces el codo; el estiramiento debe sentirse en la parte trasera del brazo, no en la articulación.'
    ]
  },
  'Estiramiento de pantorrilla': {
    emoji: '🦶',
    category: 'post',
    area: ['Gastrocnemio', 'Sóleo', 'Tendón de Aquiles'],
    duration: '30 seg por pierna',
    steps: [
      'Apóyate frente a una pared con las manos a la altura del pecho.',
      'Da un paso atrás con una pierna manteniéndola completamente extendida.',
      'Presiona el talón trasero contra el suelo.',
      'Inclínate levemente hacia la pared hasta sentir el estiramiento en la pantorrilla.',
      'Para estirar el sóleo, dobla ligeramente la rodilla trasera manteniendo el talón en el suelo.'
    ],
    tips: [
      'Fundamental después de correr, saltar o días de piernas con mucho volumen.',
      'La versión con rodilla doblada estira el sóleo, que es el músculo más profundo.'
    ]
  }
};

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

function renderStretchCatalog(filter: string = '', categoryFilter: string = 'all'): void {
  const listEl = document.getElementById(CONFIG_STRETCH_IDS.LIST);
  if (!listEl) return;

  const normalizedFilter = normalizeExerciseName(filter);

  let entries = Object.entries(STRETCH_GUIDES);

  if (categoryFilter !== 'all') {
    entries = entries.filter(([, s]) => s.category === categoryFilter || s.category === 'both');
  }

  if (normalizedFilter) {
    entries = entries.filter(([name, s]) => {
      const haystack = [name, ...s.area].join(' ');
      return normalizeExerciseName(haystack).includes(normalizedFilter);
    });
  }

  if (entries.length === 0) {
    listEl.innerHTML = '<div class="cfg-guide-empty">No se encontraron estiramientos.</div>';
    return;
  }

  listEl.innerHTML = entries.map(([name, s]) => {
    const encodedName = encodeInlineValue(name);
    const subtitle = escHtml(s.area.slice(0, 3).join(' · '));
    const categoryBadge = `<span class="stretch-badge stretch-badge--${s.category}">${escHtml(STRETCH_CATEGORY_LABELS[s.category])}</span>`;
    return `<button type="button" class="cfg-row cfg-guide-row" onclick='openStretch(decodeURIComponent("${encodedName}"))'>
      <span class="cfg-ic" style="background:var(--accent-dim)">${escHtml(s.emoji)}</span>
      <span class="cfg-info"><span class="cfg-ttl">${escHtml(name)}</span><span class="cfg-sub cfg-guide-sub">${subtitle} ${categoryBadge}</span></span>
      <span class="cfg-arr">›</span>
    </button>`;
  }).join('');
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

  const filteredEntries = normalizedFilter
    ? guideEntries.filter(([name, guide]) => {
        const haystack = [
          name,
          ...(guide.primary || []),
          ...(guide.secondary || [])
        ].join(' ');
        return normalizeExerciseName(haystack).includes(normalizedFilter);
      })
    : guideEntries;

  if (filteredEntries.length === 0) {
    listElement.innerHTML = '<div class="cfg-guide-empty">No se encontraron guías para tu búsqueda.</div>';
    return;
  }

  listElement.innerHTML = filteredEntries.map(([name, guide]) => {
    const encodedName = encodeInlineValue(name);
    const subtitle = [...(guide.primary || []).slice(0, 2), ...(guide.secondary || []).slice(0, 1)]
      .filter(Boolean)
      .join(' · ');

    return `<button type="button" class="cfg-row cfg-guide-row" onclick='openGuide(decodeURIComponent("${encodedName}"))'>
      <span class="cfg-ic" style="background:var(--accent-dim)">${escHtml(guide.emoji || '📖')}</span>
      <span class="cfg-info"><span class="cfg-ttl">${escHtml(name)}</span><span class="cfg-sub cfg-guide-sub">${escHtml(subtitle || 'Ver técnica y consejos')}</span></span>
      <span class="cfg-arr">›</span>
    </button>`;
  }).join('');
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
  GUIDES,
  openGuide,
  addFromGuide,
  filterGuidesCatalog,
  renderGuidesCatalog,
  renderGuideContent,
  renderNoGuideAvailable,
  renderGuideDetails,
  STRETCH_GUIDES,
  renderStretchCatalog,
  filterStretchCatalog,
  filterStretchCategory,
  openStretch
};

// Make functions globally available for backward compatibility
(globalThis as any).openGuide = openGuide;
(globalThis as any).addFromGuide = addFromGuide;
(globalThis as any).filterStretchCatalog = filterStretchCatalog;
(globalThis as any).filterStretchCategory = filterStretchCategory;
(globalThis as any).openStretch = openStretch;
(globalThis as any).filterGuidesCatalog = filterGuidesCatalog;
(globalThis as any).renderGuidesCatalog = renderGuidesCatalog;
(globalThis as any).renderStretchCatalog = renderStretchCatalog;
