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
  ERR_SEC: 'gErrSec',
  TIP_SEC: 'gTipSec',
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
    secondary: ['Romboides', 'Bíceps braquial'],
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
      'Prueba la plancha con elevación de piernas o brazos para más dificultad.'
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
    renderGuideContent(canonicalName, resolved.guide);
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
    renderNoGuideAvailable();
  }

  // Update add button text
  const addTextElement = document.getElementById(GUIDE_DOM_IDS.ADD_TXT);
  if (addTextElement) {
    addTextElement.textContent = `Agregar "${name}" al día de hoy`;
  }
}

/**
 * Renders content when no guide is available for the exercise
 */
function renderNoGuideAvailable(): void {
  const emojiElement = document.getElementById(GUIDE_DOM_IDS.EMOJI);
  if (emojiElement) {
    emojiElement.textContent = '📖';
  }

  const musclesElement = document.getElementById(GUIDE_DOM_IDS.MUSCLES);
  if (musclesElement) {
    musclesElement.innerHTML = '<span class="muscle-tag secondary">Sin guía disponible aún</span>';
  }

  const stepsElement = document.getElementById(GUIDE_DOM_IDS.STEPS);
  if (stepsElement) {
    stepsElement.innerHTML = '<div class="guide-tip ok"><span class="tip-icon">💡</span><span>No tenemos una guía específica para este ejercicio todavía. ¡Consulta con tu entrenador o busca en YouTube para ver la técnica correcta!</span></div>';
  }

  // Hide error and tip sections
  const errSec = document.getElementById(GUIDE_DOM_IDS.ERR_SEC);
  if (errSec) {
    errSec.style.display = 'none';
  }

  const tipSec = document.getElementById(GUIDE_DOM_IDS.TIP_SEC);
  if (tipSec) {
    tipSec.style.display = 'none';
  }
}

/**
 * Renders detailed guide content for an exercise
 * @param guide - Guide data object
 */
function renderGuideDetails(guide: ExerciseGuide): void {
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
  const stepsElement = document.getElementById(GUIDE_DOM_IDS.STEPS);
  if (stepsElement) {
    stepsElement.innerHTML = (guide.steps || []).map((step: string, index: number) =>
      `<div class="guide-step"><div class="step-num">${index + 1}</div><div class="step-text">${escHtml(step)}</div></div>`
    ).join('');
  }

  // Update errors
  const errorsElement = document.getElementById(GUIDE_DOM_IDS.ERRORS);
  if (errorsElement) {
    errorsElement.innerHTML = (guide.errors || []).map((error: string) =>
      `<div class="guide-tip err"><span class="tip-icon">❌</span><span>${escHtml(error)}</span></div>`
    ).join('');
  }

  // Update tips
  const tipsElement = document.getElementById(GUIDE_DOM_IDS.TIPS);
  if (tipsElement) {
    tipsElement.innerHTML = (guide.tips || []).map((tip: string) =>
      `<div class="guide-tip ok"><span class="tip-icon">✅</span><span>${escHtml(tip)}</span></div>`
    ).join('');
  }

  // Show error and tip sections
  const errSec = document.getElementById(GUIDE_DOM_IDS.ERR_SEC);
  if (errSec) {
    errSec.style.display = '';
  }

  const tipSec = document.getElementById(GUIDE_DOM_IDS.TIP_SEC);
  if (tipSec) {
    tipSec.style.display = '';
  }
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
