// ============================================================
// stretch-guides.ts - Datos estaticos de guias de estiramientos
// ============================================================

import { StretchGuide } from '../types.js';

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
export { STRETCH_GUIDES };
