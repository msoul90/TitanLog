// ============================================================
// guides.ts â€” Base de datos de guÃ­as de ejercicios
// ============================================================

import { ExerciseGuide } from './types.js';

const toast = (msg: string): void => (globalThis as any).toast?.(msg);
const openM = (modalId: string): void => (globalThis as any).openM?.(modalId);
const closeM = (modalId: string): void => (globalThis as any).closeM?.(modalId);

// â”€â”€ CONSTANTS â”€â”€

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

// â”€â”€ GUIDE DATA â”€â”€

/**
 * Comprehensive exercise guides database
 */
const GUIDES: Record<string, ExerciseGuide> = {
  'Sentadilla': {
    emoji: 'ðŸ¦µ',
    primary: ['CuÃ¡driceps', 'GlÃºteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'PÃ¡rate con pies a la altura de los hombros, puntas ligeramente hacia afuera.',
      'MantÃ©n el pecho arriba y la mirada al frente.',
      'Empuja las rodillas hacia afuera mientras bajas, como si te sentaras en una silla.',
      'Baja hasta que tus muslos queden paralelos al suelo o mÃ¡s abajo.',
      'Empuja el suelo con los talones para subir, apretando los glÃºteos al llegar arriba.'
    ],
    errors: [
      'Dejar caer las rodillas hacia adentro (valgo de rodilla).',
      'Levantar los talones del suelo.',
      'Inclinar demasiado el torso hacia adelante.'
    ],
    tips: [
      'Coloca tus talones sobre una superficie elevada si tienes poca movilidad de tobillo.',
      'Imagina que empujas el suelo hacia afuera con los pies para activar glÃºteos.',
      'La respiraciÃ³n: inhala al bajar, exhala al subir.'
    ]
  },
  'Sentadilla sumo': {
    emoji: 'ðŸ¦µ',
    primary: ['Aductores', 'GlÃºteos'],
    secondary: ['CuÃ¡driceps', 'Core'],
    steps: [
      'Abre los pies mÃ¡s allÃ¡ del ancho de hombros, puntas apuntando 45Â° hacia afuera.',
      'SostÃ©n la pesa (mancuerna o kettlebell) con ambas manos frente a ti.',
      'MantÃ©n el torso erguido y baja empujando las rodillas hacia las puntas de los pies.',
      'Baja hasta que tus muslos queden paralelos al suelo.',
      'Sube apretando los glÃºteos y la zona interna del muslo.'
    ],
    errors: [
      'Dejar que las rodillas colapsen hacia adentro.',
      'Inclinar el torso excesivamente.',
      'No abrir suficiente los pies.'
    ],
    tips: [
      'Ideal para trabajar mÃ¡s la zona interna del muslo que la sentadilla convencional.',
      'Prueba con diferentes anchos de apertura para encontrar tu posiciÃ³n cÃ³moda.'
    ]
  },
  'Goblet squat': {
    emoji: 'ðŸº',
    primary: ['CuÃ¡driceps', 'GlÃºteos'],
    secondary: ['Core', 'Hombros'],
    steps: [
      'SostÃ©n una mancuerna o kettlebell verticalmente contra el pecho con ambas manos.',
      'Pies a la altura de los hombros o un poco mÃ¡s abiertos, puntas hacia afuera.',
      'MantÃ©n los codos apuntando hacia abajo durante todo el movimiento.',
      'Baja profundo, usando la pesa como contrapeso para mantener el equilibrio.',
      'Sube empujando los talones, manteniendo el pecho arriba.'
    ],
    errors: [
      'Soltar los codos hacia los lados.',
      'No bajar lo suficiente.',
      'Perder la tensiÃ³n en el core.'
    ],
    tips: [
      'Excelente para aprender la mecÃ¡nica de la sentadilla con buena postura.',
      'Usa los codos para separar las rodillas al fondo del movimiento.'
    ]
  },
  'Peso muerto': {
    emoji: 'âš¡',
    primary: ['Isquiotibiales', 'GlÃºteos', 'Espalda baja'],
    secondary: ['Trapecios', 'Core', 'CuÃ¡driceps'],
    steps: [
      'PÃ¡rate con los pies a la altura de las caderas, barra sobre el medio del pie.',
      'Dobla las caderas hacia atrÃ¡s (no las rodillas primero) hasta agarrar la barra.',
      'Espalda recta, pecho arriba, hombros ligeramente delante de la barra.',
      'Empuja el suelo con los pies y extiende caderas y rodillas al mismo tiempo.',
      'MantÃ©n la barra pegada al cuerpo durante todo el recorrido.',
      'Baja de forma controlada invirtiendo el movimiento.'
    ],
    errors: [
      'Redondear la espalda baja â€” el error mÃ¡s peligroso.',
      'Doblar los brazos durante el jalÃ³n.',
      'Dejar que la barra se aleje del cuerpo.',
      'Bloquear las rodillas antes de las caderas al subir.'
    ],
    tips: [
      'La clave es empujar el suelo, no jalar la barra.',
      'Lleva los hombros hacia atrÃ¡s y abajo antes de iniciar.',
      'Usa cinturÃ³n solo cuando el peso es verdaderamente pesado, no de entrada.'
    ]
  },
  'Peso muerto rumano': {
    emoji: 'âš¡',
    primary: ['Isquiotibiales', 'GlÃºteos'],
    secondary: ['Espalda baja', 'Trapecios'],
    steps: [
      'PÃ¡rate con pesas frente a los muslos, pies a la altura de la cadera.',
      'MantÃ©n las rodillas ligeramente flexionadas durante todo el movimiento.',
      'Lleva las caderas hacia atrÃ¡s mientras bajas las pesas por el frente de las piernas.',
      'Siente el estiramiento en los isquiotibiales; baja hasta donde tu espalda no se redondee.',
      'Contrae los glÃºteos para volver a la posiciÃ³n inicial.'
    ],
    errors: [
      'Redondear la espalda baja.',
      'Doblar demasiado las rodillas (se convierte en sentadilla).',
      'Bajar las pesas mÃ¡s allÃ¡ de tu rango de movimiento seguro.'
    ],
    tips: [
      'La diferencia con el peso muerto convencional: las rodillas casi no se doblan.',
      'Empuja las caderas hacia atrÃ¡s como si quisieras tocar la pared detrÃ¡s tuyo.',
      'Ideal para el dÃ­a de piernas con foco en posterior.'
    ]
  },
  'Desplantes hacia atrÃ¡s': {
    emoji: 'ðŸ¦µ',
    primary: ['CuÃ¡driceps', 'GlÃºteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'PÃ¡rate erguido con las pesas al costado o en los hombros.',
      'Da un paso largo hacia atrÃ¡s con una pierna.',
      'Baja la rodilla trasera hacia el suelo sin tocarlo, rodilla delantera a 90Â°.',
      'La rodilla delantera no debe pasar la punta del pie.',
      'Empuja con el talÃ³n delantero para volver a la posiciÃ³n inicial.'
    ],
    errors: [
      'Dejar que la rodilla delantera colapse hacia adentro.',
      'Inclinarse demasiado hacia adelante.',
      'Dar pasos demasiado cortos.'
    ],
    tips: [
      'El desplante hacia atrÃ¡s es mÃ¡s amigable con las rodillas que hacia adelante.',
      'Activa el core para no perder el equilibrio al dar el paso.',
      'Alterna piernas o haz todas las reps de un lado antes de cambiar.'
    ]
  },
  'Desplantes hacia adelante': {
    emoji: 'ðŸ¦µ',
    primary: ['CuÃ¡driceps', 'GlÃºteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'PÃ¡rate erguido con las pesas al costado.',
      'Da un paso largo hacia adelante con una pierna.',
      'Baja el cuerpo hasta que ambas rodillas formen Ã¡ngulos de 90Â°.',
      'La rodilla trasera casi toca el suelo.',
      'Empuja con el talÃ³n delantero para volver al inicio.'
    ],
    errors: [
      'Rodilla delantera pasando la punta del pie.',
      'Inclinar el torso hacia adelante.',
      'Pasos demasiado cortos.'
    ],
    tips: [
      'Mira hacia adelante para mantener el torso erguido.',
      'El talÃ³n trasero se levanta del suelo â€” es normal.'
    ]
  },
  'Curl de pierna acostado': {
    emoji: 'ðŸ¦µ',
    primary: ['Isquiotibiales'],
    secondary: ['Pantorrillas'],
    steps: [
      'AcuÃ©state boca abajo en la mÃ¡quina, tobillo bajo el rodillo.',
      'MantÃ©n las caderas pegadas al banco durante todo el movimiento.',
      'Curva las piernas hacia los glÃºteos de forma controlada.',
      'Aprieta los isquiotibiales en el punto mÃ¡s alto.',
      'Baja lentamente (el excÃ©ntrico es igual de importante).'
    ],
    errors: [
      'Levantar las caderas del banco al subir el peso.',
      'Bajar el peso sin control.',
      'Usar demasiado peso y perder el rango de movimiento.'
    ],
    tips: [
      'Hazlo con un pie a la vez para detectar desequilibrios.',
      'La fase de bajada lenta (3-4 seg.) genera mÃ¡s estÃ­mulo muscular.'
    ]
  },
  'Press de pecho': {
    emoji: 'ðŸ’ª',
    primary: ['Pectoral mayor'],
    secondary: ['TrÃ­ceps', 'Hombro anterior'],
    steps: [
      'AcuÃ©state en el banco con pies planos en el suelo.',
      'Agarra las mancuernas con manos a la altura del pecho, codos a ~45Â° del torso.',
      'Empuja las pesas hacia arriba hasta casi extender los brazos completamente.',
      'Baja de forma controlada, sintiendo el estiramiento en el pecho.',
      'MantÃ©n los omÃ³platos retraÃ­dos y el pecho elevado durante todo el movimiento.'
    ],
    errors: [
      'Dejar que los codos apunten hacia los lados (90Â°) â€” sobrecarga los hombros.',
      'Rebotar las pesas en el pecho.',
      'Levantar las caderas del banco.'
    ],
    tips: [
      'Imagina que intentas doblar la barra/mancuernas hacia adentro para activar mÃ¡s el pecho.',
      'Retrae los omÃ³platos antes de bajar para proteger los hombros.',
      'Pausa de 1 segundo en el pecho maximiza el estÃ­mulo.'
    ]
  },
  'Press banca con barra': {
    emoji: 'ðŸ‹ï¸',
    primary: ['Pectoral mayor'],
    secondary: ['TrÃ­ceps', 'Hombro anterior'],
    steps: [
      'AcuÃ©state con los ojos bajo la barra, pies en el suelo o en el banco.',
      'Agarre ligeramente mÃ¡s ancho que los hombros, pulgar envuelve la barra.',
      'Saca la barra y bÃ¡jala controladamente a la parte inferior del esternÃ³n.',
      'MantÃ©n los codos a ~45-75Â° del torso, no a 90Â°.',
      'Empuja la barra hacia arriba y ligeramente hacia los pies.'
    ],
    errors: [
      'Grip demasiado ancho (lesiona hombros).',
      'Barra cae sobre el cuello en lugar del pecho.',
      'Codos en 90Â° (crea impingement en hombros).',
      'Levantar las caderas del banco.'
    ],
    tips: [
      'La tÃ©cnica de arco lumbar (powerlifting) reduce el rango y protege los hombros.',
      'Aprieta la barra con fuerza para activar mÃ¡s los trÃ­ceps.',
      'Nunca hagas press banca pesado solo sin spotter o rack con safety bars.'
    ]
  },
  'Fondos en barras': {
    emoji: 'ðŸ’ª',
    primary: ['TrÃ­ceps', 'Pectoral inferior'],
    secondary: ['Hombro anterior', 'Core'],
    steps: [
      'Agarra las barras paralelas y sube con brazos extendidos.',
      'Para enfatizar el pecho: inclÃ­nate ligeramente hacia adelante.',
      'Para enfatizar los trÃ­ceps: mantente mÃ¡s vertical.',
      'Baja controladamente hasta que los codos estÃ©n a ~90Â°.',
      'Empuja hacia arriba extendiendo completamente los brazos.'
    ],
    errors: [
      'Bajar en exceso (>90Â°) â€” sobrecarga los hombros.',
      'Balancearse.',
      'No llegar a la extensiÃ³n completa.'
    ],
    tips: [
      'Si no puedes hacer fondos con tu propio peso, usa una banda de asistencia.',
      'Agrega peso con una cadena o cinturÃ³n para progresar.'
    ]
  },
  'Chin-ups': {
    emoji: 'ðŸ”',
    primary: ['Dorsal ancho', 'BÃ­ceps'],
    secondary: ['Romboides', 'BÃ­ceps braquial'],
    steps: [
      'Agarra la barra con palmas mirando hacia ti (supinaciÃ³n), ancho de hombros.',
      'Cuelga con brazos completamente extendidos.',
      'Tira de los codos hacia abajo y atrÃ¡s para subir.',
      'Lleva el mentÃ³n por encima de la barra.',
      'Baja lentamente hasta la extensiÃ³n completa.'
    ],
    errors: [
      'Usar impulso o kipping.',
      'No llegar a la extensiÃ³n completa abajo.',
      'Encogerse de hombros al subir.'
    ],
    tips: [
      'El chin-up activa mÃ¡s el bÃ­ceps que el pull-up (agarre prono).',
      'EnfÃ³cate en llevar los codos a las costillas, no en subir la barbilla.',
      'Una bajada de 4 segundos construye fuerza rÃ¡pidamente.'
    ]
  },
  'Pull-ups': {
    emoji: 'ðŸ”',
    primary: ['Dorsal ancho'],
    secondary: ['Romboides', 'BÃ­ceps', 'Core'],
    steps: [
      'Agarra la barra con palmas mirando hacia afuera (pronaciÃ³n), mÃ¡s ancho que hombros.',
      'Cuelga con brazos completamente extendidos y hombros activos.',
      'Deprime los hombros (bajarlos de las orejas) antes de empezar.',
      'Tira de los codos hacia el suelo para subir el cuerpo.',
      'Baja de forma controlada.'
    ],
    errors: [
      'Subir con los hombros encogidos hasta las orejas.',
      'No llegar a la extensiÃ³n completa.',
      'Balancear el cuerpo para ganar impulso.'
    ],
    tips: [
      'El pull-up es uno de los mejores ejercicios de espalda que existen.',
      'VarÃ­a el agarre (ancho, neutro, prono) para distintos estÃ­mulos.'
    ]
  },
  'Remo unilateral': {
    emoji: 'ðŸ’ª',
    primary: ['Dorsal ancho', 'Romboides'],
    secondary: ['BÃ­ceps', 'Trapecio inferior'],
    steps: [
      'Apoya una rodilla y mano del mismo lado en un banco.',
      'Agarra la mancuerna con la mano libre, brazo extendido.',
      'Tira de la mancuerna hacia la cadera, no hacia el hombro.',
      'MantÃ©n la espalda paralela al suelo durante todo el movimiento.',
      'Baja controladamente hasta la extensiÃ³n completa.'
    ],
    errors: [
      'Rotar el torso en exceso para usar impulso.',
      'Jalar hacia el hombro en lugar de la cadera.',
      'No llegar a la extensiÃ³n completa abajo.'
    ],
    tips: [
      'Imagina que tienes un lÃ¡piz entre los omÃ³platos y lo intentas apretar al subir.',
      'El codo debe quedarse cerca del cuerpo durante el movimiento.'
    ]
  },
  'Press de hombro con barra': {
    emoji: 'ðŸ‹ï¸',
    primary: ['Deltoides anterior y lateral'],
    secondary: ['TrÃ­ceps', 'Trapecio'],
    steps: [
      'SiÃ©ntate con espalda apoyada o de pie, barra a la altura de los hombros.',
      'Agarre ligeramente mÃ¡s ancho que los hombros.',
      'Empuja la barra hacia arriba en lÃ­nea recta.',
      'Extiende completamente los brazos sin bloquear los codos.',
      'Baja la barra de forma controlada hasta la altura de la barbilla.'
    ],
    errors: [
      'Arquear excesivamente la zona lumbar.',
      'Llevar la barra hacia adelante en lugar de verticalmente.',
      'Bajar la barra hasta los hombros bruscamente.'
    ],
    tips: [
      'El press militar de pie activa mÃ¡s el core que sentado.',
      'Aprieta los glÃºteos para proteger la zona lumbar.',
      'El agarre neutro (mancuernas) es mÃ¡s amigable con los hombros.'
    ]
  },
  'Elevaciones laterales': {
    emoji: 'ðŸ’«',
    primary: ['Deltoides lateral'],
    secondary: ['Trapecio superior'],
    steps: [
      'PÃ¡rate o siÃ©ntate con mancuernas a los costados.',
      'Levanta los brazos hacia los lados con codos ligeramente flexionados.',
      'Sube hasta que los brazos estÃ©n paralelos al suelo (no mÃ¡s arriba).',
      'Controla la bajada durante 2-3 segundos.'
    ],
    errors: [
      'Usar impulso o balancearse.',
      'Subir las mancuernas por delante del cuerpo (trabaja el deltoides anterior).',
      'Encogerse de hombros al subir.'
    ],
    tips: [
      'El peso debe ser relativamente ligero â€” el deltoides lateral es pequeÃ±o.',
      'Inclina ligeramente las mancuernas (el meÃ±ique arriba) para mejor aislamiento.',
      'Las elevaciones en cable dan tensiÃ³n constante durante todo el rango.'
    ]
  },
  'Martillo': {
    emoji: 'ðŸ’ª',
    primary: ['Braquiorradial', 'BÃ­ceps'],
    secondary: ['Antebrazo'],
    steps: [
      'PÃ¡rate o siÃ©ntate con mancuernas a los costados, palmas mirÃ¡ndose.',
      'MantÃ©n los codos fijos al costado del cuerpo.',
      'Curva los antebrazos hacia los hombros sin rotar las muÃ±ecas.',
      'Aprieta en la cima del movimiento.',
      'Baja de forma controlada.'
    ],
    errors: [
      'Balancear el torso para subir el peso.',
      'Mover los codos hacia adelante.',
      'Bajar el peso sin control.'
    ],
    tips: [
      'El agarre neutro (palmas mirÃ¡ndose) activa mÃ¡s el braquiorradial que el curl clÃ¡sico.',
      'Excelente para desarrollar el grosor del brazo.'
    ]
  },
  'Copa (Skull crusher)': {
    emoji: 'ðŸ’ª',
    primary: ['TrÃ­ceps (cabeza larga)'],
    secondary: ['TrÃ­ceps medial y lateral'],
    steps: [
      'AcuÃ©state con la mancuerna sostenida con ambas manos sobre el pecho.',
      'Extiende los brazos hacia arriba, codos ligeramente hacia adentro.',
      'Baja la mancuerna controladamente hacia la frente o detrÃ¡s de la cabeza.',
      'Extiende los codos sin moverlos de su posiciÃ³n.',
      'El movimiento ocurre solo en los codos, no en los hombros.'
    ],
    errors: [
      'Mover los hombros durante el ejercicio.',
      'Dejar que los codos se abran hacia los lados.',
      'Bajar demasiado rÃ¡pido.'
    ],
    tips: [
      'La cabeza larga del trÃ­ceps se activa mÃ¡s cuando el brazo estÃ¡ sobre la cabeza.',
      'El skull crusher con barra EZ es una variaciÃ³n clÃ¡sica.',
      'MantÃ©n el core activo para no arquear la espalda baja.'
    ]
  },
  'Plancha': {
    emoji: 'ðŸ§±',
    primary: ['Core', 'Transverso abdominal'],
    secondary: ['Hombros', 'GlÃºteos'],
    steps: [
      'Apoya los antebrazos en el suelo, codos bajo los hombros.',
      'Extiende las piernas hacia atrÃ¡s, apoyÃ¡ndote en las puntas de los pies.',
      'Tu cuerpo debe formar una lÃ­nea recta de cabeza a talones.',
      'Aprieta el abdomen, glÃºteos y cuÃ¡driceps.',
      'MantÃ©n la posiciÃ³n sin dejar caer las caderas ni levantarlas.'
    ],
    errors: [
      'Dejar caer las caderas (posiciÃ³n de arco).',
      'Levantar las caderas (posiciÃ³n de pirÃ¡mide).',
      'Mirar hacia arriba y comprimir el cuello.',
      'Aguantar la respiraciÃ³n.'
    ],
    tips: [
      'Mira hacia el suelo, manteniendo el cuello en posiciÃ³n neutral.',
      'Imagina que alguien va a darte un golpe en el abdomen â€” esa es la contracciÃ³n que necesitas.',
      'Prueba la plancha con elevaciÃ³n de piernas o brazos para mÃ¡s dificultad.'
    ]
  },
  'Curl con mancuernas': {
    emoji: 'ðŸ’ª',
    primary: ['BÃ­ceps'],
    secondary: ['Braquiorradial', 'Antebrazo'],
    steps: [
      'PÃ¡rate o siÃ©ntate con mancuernas a los costados, palmas hacia adelante.',
      'MantÃ©n los codos pegados al cuerpo.',
      'Sube las mancuernas contrayendo el bÃ­ceps.',
      'Supina ligeramente las muÃ±ecas (gÃ­ralas hacia afuera) al subir.',
      'Baja lentamente hasta la extensiÃ³n completa.'
    ],
    errors: [
      'Mover los codos hacia adelante (usar el deltoides en vez del bÃ­ceps).',
      'Bajar el peso sin control (perder el excÃ©ntrico).',
      'Balancear el torso.'
    ],
    tips: [
      'La supinaciÃ³n de muÃ±eca en la cima activa mÃ¡s el bÃ­ceps.',
      'El curl alterno te permite concentrarte en un brazo a la vez.',
      'La bajada controlada (3 seg.) es igual de importante que la subida.'
    ]
  },
  'Curl predicador': {
    emoji: 'ðŸ’ª',
    primary: ['BÃ­ceps (cabeza corta)'],
    secondary: ['Braquiorradial'],
    steps: [
      'Ajusta el banco predicador para que los brazos queden bien apoyados.',
      'Agarra la barra o mancuernas con palmas hacia arriba.',
      'Sube controlando que los codos no se levanten del pad.',
      'Baja hasta casi la extensiÃ³n completa â€” no bloquees los codos.',
      'El movimiento es estrictamente en los codos.'
    ],
    errors: [
      'Levantar los codos del apoyo para subir mÃ¡s.',
      'Bajar el peso completamente (hiperextensiÃ³n del codo).',
      'Usar impulso.'
    ],
    tips: [
      'El banco predicador elimina el impulso â€” trabaja el bÃ­ceps de forma estricta.',
      'La cabeza corta del bÃ­ceps se activa preferentemente en este ejercicio.'
    ]
  },
  'JalÃ³n al pecho': {
    emoji: 'ðŸ”',
    primary: ['Dorsal ancho'],
    secondary: ['Romboides', 'BÃ­ceps', 'Trapecio inferior'],
    steps: [
      'SiÃ©ntate con los muslos bajo los rodillos de la mÃ¡quina.',
      'Agarra la barra con agarre prono, ligeramente mÃ¡s ancho que los hombros.',
      'InclÃ­nate ligeramente hacia atrÃ¡s y deprime los hombros.',
      'Tira de la barra hacia el pecho llevando los codos hacia abajo y atrÃ¡s.',
      'Vuelve a la posiciÃ³n inicial de forma controlada.'
    ],
    errors: [
      'Jalar hacia el cuello o detrÃ¡s de la cabeza (riesgo de lesiÃ³n).',
      'Encogerse de hombros al subir.',
      'Inclinar el cuerpo demasiado hacia atrÃ¡s (se convierte en remo).'
    ],
    tips: [
      'EnfÃ³cate en llevar los codos al suelo, no en bajar la barra.',
      'Un agarre neutro (manos mirÃ¡ndose) activa mÃ¡s el dorsal.',
      'No bloquees los codos arriba â€” mantÃ©n un poco de tensiÃ³n.'
    ]
  },
  'Face pull': {
    emoji: 'ðŸ’«',
    primary: ['Deltoides posterior', 'Trapecio medio'],
    secondary: ['Manguito rotador', 'Romboides'],
    steps: [
      'Ajusta la polea a la altura de la cara.',
      'Agarra la cuerda con ambas manos, palmas hacia abajo, y da un paso atrÃ¡s.',
      'Tira de la cuerda hacia la cara separando las manos al llegar.',
      'Los codos deben quedar mÃ¡s arriba que las muÃ±ecas.',
      'Vuelve al inicio controladamente.'
    ],
    errors: [
      'Jalar hacia el cuello (muy bajo).',
      'No separar las manos al final del recorrido.',
      'Usar demasiado peso y perder la tÃ©cnica.'
    ],
    tips: [
      'El face pull es uno de los mejores ejercicios para la salud del hombro.',
      'Hazlo con un peso ligero y volumen alto (15-20 reps).',
      'Excelente como calentamiento o al final de cualquier sesiÃ³n.'
    ]
  },
  'Hip thrust': {
    emoji: 'ðŸ‘',
    primary: ['GlÃºteo mayor'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'Apoya los omÃ³platos en un banco resistente.',
      'Barra sobre las caderas con un foam pad para protecciÃ³n.',
      'Pies planos en el suelo, a la altura de las caderas.',
      'Empuja la barra hacia arriba contrayendo los glÃºteos.',
      'Al llegar arriba, tu cuerpo forma una lÃ­nea recta de hombros a rodillas.',
      'Baja sin que las caderas toquen el suelo.'
    ],
    errors: [
      'Hipextender la columna lumbar al llegar arriba.',
      'No apretar los glÃºteos en el punto mÃ¡ximo.',
      'Pies muy lejos o muy cerca.'
    ],
    tips: [
      'Mete el mentÃ³n al pecho para proteger la columna.',
      'El hip thrust es el rey para desarrollar glÃºteos.',
      'Prueba con una sola pierna para mayor intensidad.'
    ]
  },
  'ExtensiÃ³n de cuÃ¡driceps': {
    emoji: 'ðŸ¦µ',
    primary: ['CuÃ¡driceps'],
    secondary: [],
    steps: [
      'SiÃ©ntate en la mÃ¡quina, espalda apoyada y rodillas en el borde del asiento.',
      'Ajusta el rodillo para que quede en la parte baja de las espinillas.',
      'Extiende las piernas hasta quedar casi rectas.',
      'Aprieta los cuÃ¡driceps en la posiciÃ³n extendida.',
      'Baja lentamente hasta 90Â° (no mÃ¡s abajo).'
    ],
    errors: [
      'Bajar mÃ¡s allÃ¡ de 90Â° (sobrecarga el tendÃ³n rotuliano).',
      'Usar impulso o balanceo.',
      'No llegar a la extensiÃ³n completa.'
    ],
    tips: [
      'SeÃ±ala los pies ligeramente hacia adentro o afuera para variar el estÃ­mulo.',
      'El control excÃ©ntrico (bajar lento) es muy efectivo para el desarrollo del cuÃ¡driceps.'
    ]
  },
  'Prensa de pierna': {
    emoji: 'ðŸ¦µ',
    primary: ['CuÃ¡driceps', 'GlÃºteos'],
    secondary: ['Isquiotibiales'],
    steps: [
      'SiÃ©ntate en la mÃ¡quina y coloca los pies en la plataforma a la altura de la cadera.',
      'Suelta los seguros y baja la plataforma hasta que las rodillas formen ~90Â°.',
      'Empuja con los talones para extender las piernas sin bloquear las rodillas.',
      'MantÃ©n la espalda baja pegada al respaldo todo el tiempo.'
    ],
    errors: [
      'Despegar la espalda baja al bajar (riesgo de hernias).',
      'Bloquear completamente las rodillas al extender.',
      'Pies muy arriba (activa mÃ¡s los glÃºteos) o muy abajo (mÃ¡s cuÃ¡driceps) â€” elige segÃºn tu objetivo.'
    ],
    tips: [
      'MÃ¡s apertura entre pies activa mÃ¡s los aductores.',
      'No pongas las manos en las rodillas â€” apÃ³yalas en los agarres laterales.'
    ]
  },
  'ElevaciÃ³n de talones': {
    emoji: 'ðŸ¦¶',
    primary: ['Pantorrilla (gastrocnemio)'],
    secondary: ['SÃ³leo'],
    steps: [
      'PÃ¡rate en un escalÃ³n o superficie elevada con los talones colgando.',
      'SÃºbete de puntillas lo mÃ¡s alto posible.',
      'MantÃ©n 1-2 segundos en la cima.',
      'Baja lentamente hasta sentir el estiramiento en las pantorrillas.'
    ],
    errors: [
      'Hacer el movimiento muy rÃ¡pido sin control.',
      'No bajar lo suficiente (perder el estiramiento).',
      'Doblar las rodillas.'
    ],
    tips: [
      'Con rodillas rectas trabajas mÃ¡s el gastrocnemio; con rodillas flexionadas, mÃ¡s el sÃ³leo.',
      'Las pantorrillas responden bien al volumen alto (15-20 reps).',
      'Hazlo unilateral para mayor intensidad.'
    ]
  },
  'Russian twist': {
    emoji: 'ðŸ”„',
    primary: ['Oblicuos'],
    secondary: ['Recto abdominal', 'Core'],
    steps: [
      'SiÃ©ntate en el suelo con rodillas flexionadas y pies ligeramente elevados.',
      'InclÃ­nate hacia atrÃ¡s hasta ~45Â°, manteniendo la espalda recta.',
      'Entrelaza las manos o sostÃ©n un peso frente al pecho.',
      'Gira el torso de lado a lado, sin mover la cadera.',
      'MantÃ©n el abdomen contraÃ­do durante todo el movimiento.'
    ],
    errors: [
      'Girar solo los brazos, no el torso.',
      'Redondear la espalda.',
      'Mover la cadera al rotar.'
    ],
    tips: [
      'Baja los pies al suelo si el equilibrio es difÃ­cil al inicio.',
      'MantÃ©n la respiraciÃ³n constante â€” exhala al rotar.',
      'Agrega una pelota medicinal o mancuerna para progresar.'
    ]
  },
  'Burpees': {
    emoji: 'âš¡',
    primary: ['Cuerpo completo'],
    secondary: ['Cardio', 'Core', 'Piernas'],
    steps: [
      'PÃ¡rate con pies a la altura de los hombros.',
      'AgÃ¡chate y apoya las manos en el suelo.',
      'Salta los pies hacia atrÃ¡s quedando en posiciÃ³n de plancha.',
      'Haz una flexiÃ³n (opcional).',
      'Salta los pies hacia las manos.',
      'Salta hacia arriba extendiendo los brazos sobre la cabeza.'
    ],
    errors: [
      'No extender completamente el cuerpo en el salto.',
      'Dejar caer las caderas en la plancha.',
      'Apurar el movimiento perdiendo la forma.'
    ],
    tips: [
      'Es un ejercicio de acondicionamiento â€” la intensidad es el objetivo.',
      'Puedes eliminar el salto al inicio para hacerlo de menor impacto.',
      'Ideal para circuitos de cardio o finalizadores de sesiÃ³n.'
    ]
  },
  'Caminadora': {
    emoji: 'ðŸš¶',
    primary: ['Cardio', 'Piernas'],
    secondary: ['Core'],
    steps: [
      'Comienza a velocidad baja para calentar (3-4 km/h).',
      'Aumenta gradualmente la velocidad segÃºn tu objetivo.',
      'MantÃ©n una postura erguida, no te apoyes en los parachoques.',
      'Para aumentar la intensidad, sube la inclinaciÃ³n.',
      'EnfrÃ­a con 5 minutos a baja velocidad.'
    ],
    errors: [
      'Agarrarse de las parandas â€” anula el gasto calÃ³rico.',
      'Velocidad demasiado alta sin inclinaciÃ³n.',
      'Postura encorvada.'
    ],
    tips: [
      'Caminar al 10-15% de inclinaciÃ³n (incline walking) es excelente para glÃºteos y cardio de baja intensidad.',
      'Una sesiÃ³n de 30-40 min en zona 2 (puedes conversar) mejora la salud cardiovascular.'
    ]
  },
  'AbducciÃ³n de cadera': {
    emoji: 'ðŸ‘',
    primary: ['GlÃºteo medio y menor', 'Tensor de la fascia lata'],
    secondary: ['GlÃºteo mayor'],
    steps: [
      'Usa la mÃ¡quina de abducciÃ³n o una banda resistencia.',
      'SiÃ©ntate con los pads en la parte externa de las rodillas.',
      'Abre las piernas contra la resistencia, apretando los glÃºteos.',
      'MantÃ©n 1 segundo en la posiciÃ³n abierta.',
      'Vuelve lentamente a la posiciÃ³n inicial.'
    ],
    errors: [
      'Usar demasiado peso y perder la forma.',
      'No llegar al rango completo de movimiento.',
      'Inclinarse hacia los lados.'
    ],
    tips: [
      'El glÃºteo medio es clave para la estabilidad de la rodilla y cadera.',
      'TambiÃ©n puedes hacerlo de pie con una banda resistencia.'
    ]
  },
  'Patada de glÃºteo': {
    emoji: 'ðŸ‘',
    primary: ['GlÃºteo mayor'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'ColÃ³cate en cuadrupedia (manos y rodillas en el suelo).',
      'MantÃ©n el core activo y la espalda neutra.',
      'Extiende una pierna hacia atrÃ¡s y arriba, apretando el glÃºteo.',
      'No hipextender la columna al subir la pierna.',
      'Baja controladamente y repite.'
    ],
    errors: [
      'Arquear la espalda baja para elevar la pierna mÃ¡s.',
      'No contraer el glÃºteo en la posiciÃ³n extendida.',
      'Rotar la cadera al elevar.'
    ],
    tips: [
      'AÃ±ade una mancuerna detrÃ¡s de la rodilla o una band para mÃ¡s resistencia.',
      'MantÃ©n la mirada hacia abajo para no tensionar el cuello.'
    ]
  },
  'Apertura con mancuernas': {
    emoji: 'ðŸ’ª',
    primary: ['Pectoral mayor'],
    secondary: ['Hombro anterior', 'BÃ­ceps'],
    steps: [
      'AcuÃ©state en el banco con mancuernas sobre el pecho, palmas mirÃ¡ndose.',
      'Abre los brazos hacia los lados con codos ligeramente flexionados.',
      'Baja hasta sentir el estiramiento en el pecho (sin pasar la lÃ­nea del banco).',
      'Vuelve al inicio como si abrazaras un Ã¡rbol.',
      'El movimiento es en los hombros, no en los codos.'
    ],
    errors: [
      'Doblar demasiado los codos (se convierte en press).',
      'Bajar las mancuernas mÃ¡s allÃ¡ del plano del pecho.',
      'Usar demasiado peso y perder el estiramiento.'
    ],
    tips: [
      'Las aperturas son ideales para el final de la sesiÃ³n de pecho con peso ligero y muchas reps.',
      'En cable, la tensiÃ³n es constante durante todo el rango.'
    ]
  },
  'Press Arnold': {
    emoji: 'ðŸ’«',
    primary: ['Deltoides anterior y lateral'],
    secondary: ['TrÃ­ceps', 'Trapecio'],
    steps: [
      'SiÃ©ntate con mancuernas a la altura de los hombros, palmas mirando hacia ti.',
      'Al empujar hacia arriba, rota las palmas hasta que miren hacia afuera.',
      'Extiende completamente los brazos.',
      'Al bajar, rota de regreso hasta que las palmas te miren.',
      'Es un movimiento fluido de rotaciÃ³n + press.'
    ],
    errors: [
      'Hacer la rotaciÃ³n de forma abrupta.',
      'No completar el rango de rotaciÃ³n.',
      'Arquear la espalda.'
    ],
    tips: [
      'Creado por Arnold Schwarzenegger para trabajar mÃ¡s Ã¡ngulos del deltoides.',
      'El rango de movimiento mÃ¡s completo activa mejor el deltoides medial.'
    ]
  },
  'Press francÃ©s': {
    emoji: 'ðŸ’ª',
    primary: ['TrÃ­ceps'],
    secondary: [],
    steps: [
      'AcuÃ©state con la barra EZ o mancuerna sobre el pecho, brazos extendidos.',
      'Baja la pesa hacia la frente o detrÃ¡s de la cabeza doblando solo los codos.',
      'Los codos apuntan al techo durante todo el movimiento.',
      'Extiende los brazos de regreso a la posiciÃ³n inicial.'
    ],
    errors: [
      'Mover los hombros durante el movimiento.',
      'Codos que se abren hacia los lados.',
      'Bajar demasiado rÃ¡pido.'
    ],
    tips: [
      'La variante con barra EZ es mÃ¡s cÃ³moda para las muÃ±ecas.',
      'Combinado con press de pecho en superserie = excelente para trÃ­ceps.'
    ]
  },
  'JalÃ³n de trÃ­ceps en polea': {
    emoji: 'ðŸ’ª',
    primary: ['TrÃ­ceps'],
    secondary: [],
    steps: [
      'PÃ¡rate frente a la polea alta con la cuerda o barra.',
      'Codos pegados al cuerpo, parte superior del brazo inmÃ³vil.',
      'Extiende los antebrazos hacia abajo hasta bloquear los codos.',
      'Vuelve lentamente arriba hasta que los antebrazos estÃ©n paralelos al suelo.'
    ],
    errors: [
      'Mover los codos hacia adelante y atrÃ¡s.',
      'No llegar a la extensiÃ³n completa.',
      'Inclinarse hacia adelante en exceso.'
    ],
    tips: [
      'Al usar la cuerda, separa las manos al final para activar mÃ¡s la cabeza lateral.',
      'MantÃ©n los codos fijos â€” si se mueven, el peso es demasiado.'
    ]
  },
  'Dead bug': {
    emoji: 'ðŸ§±',
    primary: ['Core profundo', 'Transverso abdominal'],
    secondary: ['Psoas', 'Estabilizadores lumbares'],
    steps: [
      'AcuÃ©state boca arriba con brazos extendidos hacia el techo y caderas y rodillas a 90Â°.',
      'MantÃ©n la zona lumbar PEGADA al suelo â€” este es el punto clave.',
      'Baja lentamente el brazo derecho y la pierna izquierda hacia el suelo.',
      'Para cuando la zona lumbar empiece a despegarse.',
      'Regresa al inicio y repite del otro lado.'
    ],
    errors: [
      'Dejar que la zona lumbar se arquee al extender.',
      'Ir demasiado rÃ¡pido.',
      'No coordinar brazo y pierna opuestos.'
    ],
    tips: [
      'Este ejercicio es mÃ¡s difÃ­cil de lo que parece â€” empieza con rangos cortos.',
      'Exhala al extender las extremidades para facilitar la estabilizaciÃ³n.',
      'Es uno de los mejores ejercicios para el core profundo y la estabilidad lumbar.'
    ]
  },
  'Step up': {
    emoji: 'ðŸ¦µ',
    primary: ['CuÃ¡driceps', 'GlÃºteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'PÃ¡rate frente a un banco o escalÃ³n a la altura de la rodilla.',
      'Sube con una pierna, empujando completamente hasta extender la rodilla.',
      'No empujes con la pierna del suelo â€” todo el trabajo es de la pierna elevada.',
      'Baja controladamente al inicio.'
    ],
    errors: [
      'Ayudarse con la pierna del suelo.',
      'Inclinarse demasiado hacia adelante.',
      'Usar un banco demasiado bajo.'
    ],
    tips: [
      'Cuanto mÃ¡s alto el escalÃ³n, mÃ¡s glÃºteo; mÃ¡s bajo, mÃ¡s cuÃ¡driceps.',
      'Agrega mancuernas para aumentar la dificultad.'
    ]
  },
  'Buenos dÃ­as': {
    emoji: 'âš¡',
    primary: ['Isquiotibiales', 'Espalda baja'],
    secondary: ['GlÃºteos', 'Core'],
    steps: [
      'PÃ¡rate con la barra en los trapecios (igual que en sentadilla).',
      'Rodillas ligeramente flexionadas, pies a la altura de los hombros.',
      'Inclina el torso hacia adelante llevando las caderas hacia atrÃ¡s.',
      'Baja hasta que el torso quede casi paralelo al suelo o donde sientas el lÃ­mite.',
      'Vuelve al inicio contrayendo glÃºteos e isquiotibiales.'
    ],
    errors: [
      'Redondear la espalda.',
      'Doblar demasiado las rodillas.',
      'Usar peso excesivo al inicio.'
    ],
    tips: [
      'Empieza con peso muy ligero para aprender la mecÃ¡nica.',
      'El movimiento es similar al peso muerto rumano pero con barra en la espalda.'
    ]
  }
};

// â”€â”€ STATE â”€â”€

/**
 * Currently selected exercise name for guide display
 */
let guideExName: string = '';

// â”€â”€ FUNCTIONS â”€â”€

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
    addTextElement.textContent = `Agregar "${name}" al dÃ­a de hoy`;
  }
}

/**
 * Renders content when no guide is available for the exercise
 */
function renderNoGuideAvailable(): void {
  const emojiElement = document.getElementById(GUIDE_DOM_IDS.EMOJI);
  if (emojiElement) {
    emojiElement.textContent = 'ðŸ“–';
  }

  const musclesElement = document.getElementById(GUIDE_DOM_IDS.MUSCLES);
  if (musclesElement) {
    musclesElement.innerHTML = '<span class="muscle-tag secondary">Sin guÃ­a disponible aÃºn</span>';
  }

  const stepsElement = document.getElementById(GUIDE_DOM_IDS.STEPS);
  if (stepsElement) {
    stepsElement.innerHTML = '<div class="guide-tip ok"><span class="tip-icon">ðŸ’¡</span><span>No tenemos una guÃ­a especÃ­fica para este ejercicio todavÃ­a. Â¡Consulta con tu entrenador o busca en YouTube para ver la tÃ©cnica correcta!</span></div>';
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
      `<span class="muscle-tag primary">${m}</span>`
    ).join('');
    const secondaryMuscles = (guide.secondary || []).filter(Boolean).map((m: string) =>
      `<span class="muscle-tag secondary">${m}</span>`
    ).join('');
    musclesElement.innerHTML = primaryMuscles + secondaryMuscles;
  }

  // Update steps
  const stepsElement = document.getElementById(GUIDE_DOM_IDS.STEPS);
  if (stepsElement) {
    stepsElement.innerHTML = (guide.steps || []).map((step: string, index: number) =>
      `<div class="guide-step"><div class="step-num">${index + 1}</div><div class="step-text">${step}</div></div>`
    ).join('');
  }

  // Update errors
  const errorsElement = document.getElementById(GUIDE_DOM_IDS.ERRORS);
  if (errorsElement) {
    errorsElement.innerHTML = (guide.errors || []).map((error: string) =>
      `<div class="guide-tip err"><span class="tip-icon">âŒ</span><span>${error}</span></div>`
    ).join('');
  }

  // Update tips
  const tipsElement = document.getElementById(GUIDE_DOM_IDS.TIPS);
  if (tipsElement) {
    tipsElement.innerHTML = (guide.tips || []).map((tip: string) =>
      `<div class="guide-tip ok"><span class="tip-icon">âœ…</span><span>${tip}</span></div>`
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
    toast('Nombre de ejercicio invÃ¡lido');
    return;
  }

  guideExName = name.trim();
  const key = Object.keys(GUIDES).find(k => k.toLowerCase() === guideExName.toLowerCase());
  const guide = key ? GUIDES[key] : null;

  renderGuideContent(guideExName, guide || null);
  openM('guideMod');
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

// â”€â”€ EXPORTS â”€â”€

export {
  GUIDES,
  openGuide,
  addFromGuide,
  renderGuideContent,
  renderNoGuideAvailable,
  renderGuideDetails
};

// Make functions globally available for backward compatibility
(globalThis as any).openGuide = openGuide;
(globalThis as any).addFromGuide = addFromGuide;
