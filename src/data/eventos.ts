// Eventos y opciones (RF-04). Pesos y efectos son PROVISIONALES (balance de juego, ajustado en la fase 6:
// las opciones arriesgadas castigan más para que decidir bien importe).
// Unidades: energía en puntos, oxígeno y alimento en kg, agua en litros, dosis en mSv.
// Cada efecto vale solo para el turno en que se elige la opción.
// RF-15: `tareas` es el trabajo que pide la opción (segundos PROVISIONALES): 2 o 3 tareas que cuentan lo que
// significa esa decisión, todas necesarias para que la opción funcione. Las opciones de riesgo no piden tareas. Si no se termina antes de que
// acabe el día, se aplica `opcionSinAtender`, la opción de riesgo, o nada si el evento no la define.
// Las tareas del exterior piden 2 personas a la vez: en la ISS las caminatas espaciales se hacen en pareja.
// https://www.nasa.gov/history/space-station-20th-spacewalking-history/
// Los textos siguen el tono del UX Brief (sección 4): frases cortas y de "tú".
// `archivo`: dato de la NASA que explica el evento. Los que vienen de avisos.ts o de una historia ya están
// verificados; los nuevos llevan `verificada: false` hasta que el equipo los contraste con su fuente.
// `notaDe` (RF-17): misiones cuya medición explica el evento; sin su nota, el jugador ve el riesgo pero no las cifras.

import type { Destino, Evento } from '../engine/tipos';
import { AVISOS } from './avisos';

const AMBOS: Destino[] = ['luna', 'marte'];

export const EVENTOS: Evento[] = [
  {
    id: 'tormenta-solar',
    notaDe: ['curiosity', 'alsep'],
    archivo: AVISOS.radiacion,
    titulo: 'Tormenta solar',
    texto: 'El Sol lanza una ráfaga de radiación. Hoy es peligroso estar fuera.',
    destinos: AMBOS,
    peso: 2,
    opcionSinAtender: 'seguir-fuera',
    opciones: [
      {
        id: 'refugiarse',
        texto: 'Refugiarse en la base',
        efectos: { multiplicadorRadiacion: 1.5, salud: { suenoEstres: -4 } },
        tareas: [
          { estacion: 'habitat', especialidad: 'medicina', trabajo: 10, etiqueta: 'Preparar el refugio' },
          { estacion: 'blindaje', especialidad: 'ingenieria', trabajo: 12, etiqueta: 'Reforzar el blindaje' },
          { estacion: 'habitat', especialidad: 'geologia', trabajo: 8, etiqueta: 'Medir la radiación' },
        ],
      },
      {
        id: 'seguir-fuera',
        texto: 'Seguir trabajando fuera',
        efectos: { multiplicadorRadiacion: 16, ciencia: 5 },
      },
    ],
  },
  {
    id: 'tormenta-polvo',
    notaDe: ['spirit-opportunity'],
    archivo: AVISOS.energia,
    titulo: 'Tormenta de polvo',
    texto: 'Tus paneles solares producen menos hoy.',
    destinos: ['marte'],
    peso: 6,
    opcionSinAtender: 'seguir-con-todo',
    opciones: [
      {
        id: 'ahorrar-energia',
        texto: 'Ahorrar energía',
        efectos: { factorSolar: 0.4, recursos: { energia: 8 }, salud: { suenoEstres: -3 } },
        tareas: [
          { estacion: 'habitat', especialidad: 'ingenieria', trabajo: 10, etiqueta: 'Apagar sistemas no esenciales' },
          { estacion: 'invernadero', especialidad: 'biologia', trabajo: 10, etiqueta: 'Proteger los cultivos del frío' },
        ],
      },
      {
        id: 'seguir-con-todo',
        texto: 'Seguir con todo',
        efectos: { factorSolar: 0.4, salud: { suenoEstres: -20 } },
      },
      {
        id: 'explorar',
        texto: 'Salir a explorar',
        efectos: { factorSolar: 0.4, recursos: { energia: -8 }, ciencia: 6 },
        tareas: [
          { estacion: 'exterior', personas: 2, especialidad: 'geologia', trabajo: 14, etiqueta: 'Explorar con el rover' },
          { estacion: 'habitat', especialidad: 'geologia', trabajo: 8, etiqueta: 'Analizar las muestras' },
        ],
      },
    ],
  },
  {
    id: 'fallo-equipo',
    notaDe: ['perseverance-ingenuity'],
    archivo: AVISOS.soporteVital,
    titulo: 'Fallo de equipo',
    texto: 'Una pieza del sistema de aire deja de funcionar.',
    destinos: AMBOS,
    peso: 2,
    opcionSinAtender: 'usar-reservas',
    opciones: [
      {
        id: 'reparar',
        texto: 'Repararla ahora',
        efectos: { recursos: { energia: -10 }, salud: { suenoEstres: -8 } },
        tareas: [
          { estacion: 'reciclador', especialidad: 'ingenieria', trabajo: 16, etiqueta: 'Reparar el sistema de aire' },
          { estacion: 'habitat', especialidad: 'medicina', trabajo: 8, etiqueta: 'Revisar el aire que respira el equipo' },
        ],
      },
      {
        id: 'usar-reservas',
        texto: 'Usar las reservas de aire',
        efectos: { recursos: { oxigeno: -4.3 } },
      },
    ],
  },
  {
    id: 'fuga-agua',
    archivo: {
      dato: 'La Estación Espacial recicla cerca del 98 % de su agua, incluida la del sudor y la orina de los astronautas.',
      fuente: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
      verificada: false,
    },
    titulo: 'Fuga de agua',
    texto: 'Un depósito pierde agua poco a poco.',
    destinos: AMBOS,
    peso: 2,
    opcionSinAtender: 'racionar',
    opciones: [
      {
        id: 'sellar',
        texto: 'Salir a sellar la fuga',
        efectos: { recursos: { agua: -5 }, dosis: 1 },
        tareas: [
          { estacion: 'exterior', personas: 2, especialidad: 'ingenieria', trabajo: 12, etiqueta: 'Sellar la fuga' },
          { estacion: 'reciclador', especialidad: 'biologia', trabajo: 10, etiqueta: 'Filtrar el agua recuperada' },
        ],
      },
      {
        id: 'racionar',
        texto: 'Racionar el agua hoy',
        efectos: { recursos: { agua: -10 }, salud: { nutricion: -15 } },
      },
    ],
  },
  {
    id: 'dia-tranquilo',
    archivo: AVISOS.musculoHueso,
    titulo: 'Día tranquilo',
    texto: 'Hoy no hay sorpresas. Tú decides en qué usa el día el equipo.',
    destinos: AMBOS,
    peso: 4,
    opciones: [
      {
        id: 'descansar',
        texto: 'Descansar',
        efectos: { salud: { suenoEstres: 10 } },
        tareas: [
          { estacion: 'zona-descanso', especialidad: 'medicina', trabajo: 8, etiqueta: 'Organizar el descanso' },
          { estacion: 'habitat', especialidad: 'medicina', trabajo: 8, etiqueta: 'Revisión médica' },
        ],
      },
      {
        id: 'ejercicio',
        texto: 'Hacer ejercicio',
        efectos: { salud: { musculoHueso: 8 }, recursos: { alimento: -1.8 } },
        tareas: [
          { estacion: 'gimnasio', especialidad: 'medicina', trabajo: 10, etiqueta: 'Dirigir el ejercicio' },
          { estacion: 'invernadero', especialidad: 'biologia', trabajo: 8, etiqueta: 'Preparar comida con proteína' },
        ],
      },
      {
        id: 'ciencia',
        texto: 'Trabajar en ciencia',
        efectos: { ciencia: 4, salud: { suenoEstres: -10 } },
        tareas: [
          { estacion: 'exterior', personas: 2, especialidad: 'geologia', trabajo: 12, etiqueta: 'Tomar muestras' },
          { estacion: 'habitat', especialidad: 'geologia', trabajo: 10, etiqueta: 'Analizar en el laboratorio' },
          { estacion: 'invernadero', especialidad: 'biologia', trabajo: 8, etiqueta: 'Cuidar los cultivos de prueba' },
        ],
      },
    ],
  },
  {
    // Evento educativo: desbloquea la historia con cualquier opción (TRD 6.2, paso 7).
    id: 'surveyor-3',
    archivo: {
      dato: 'En 1967 la sonda Surveyor 3 se posó sola en la Luna. Dos años después, los astronautas del Apolo 12 aterrizaron a unos 180 metros de ella.',
      fuente: 'https://science.nasa.gov/mission/surveyor-3/',
      verificada: true, // resume la historia de Surveyor 3, ya confirmada
    },
    titulo: 'Una sonda antigua',
    texto: 'El equipo detecta cerca una sonda antigua de la NASA: Surveyor 3.',
    destinos: ['luna'],
    peso: 1,
    opcionSinAtender: 'seguir-plan',
    opciones: [
      {
        id: 'visitar',
        texto: 'Ir a verla',
        efectos: { ciencia: 6, dosis: 3, recursos: { energia: -5 } },
        tareas: [
          { estacion: 'exterior', personas: 2, especialidad: 'geologia', trabajo: 14, etiqueta: 'Llegar a la sonda' },
          { estacion: 'habitat', especialidad: 'geologia', trabajo: 6, etiqueta: 'Registrar el hallazgo' },
        ],
      },
      {
        id: 'seguir-plan',
        texto: 'Seguir con el plan del día',
        efectos: {},
      },
    ],
    historiaId: 'surveyor-3',
  },
  {
    id: 'hielo-crater',
    archivo: {
      dato: 'En 2009 la misión LCROSS de la NASA chocó contra el cráter Cabeus, en el polo sur de la Luna, y encontró agua helada.',
      fuente: 'https://science.nasa.gov/mission/lcross/',
      verificada: false,
    },
    titulo: 'Hielo en un cráter',
    texto: 'Los sensores ven hielo en un cráter al que nunca llega la luz del Sol.',
    destinos: ['luna'],
    peso: 2,
    opcionSinAtender: 'cartografiar',
    opciones: [
      {
        id: 'extraer',
        texto: 'Ir a extraer el hielo',
        efectos: { recursos: { agua: 8, energia: -10 }, dosis: 2, ciencia: 3 },
        tareas: [
          { estacion: 'exterior', personas: 2, especialidad: 'geologia', trabajo: 14, etiqueta: 'Perforar el hielo' },
          { estacion: 'reciclador', especialidad: 'biologia', trabajo: 10, etiqueta: 'Purificar el agua del hielo' },
        ],
      },
      {
        id: 'cartografiar',
        texto: 'Solo marcarlo en el mapa',
        efectos: { ciencia: 1 },
      },
    ],
  },
  {
    id: 'polvo-lunar',
    notaDe: ['lrv'],
    archivo: {
      dato: 'Un informe de la NASA sobre las misiones Apolo cuenta que el polvo lunar rayó los trajes, atascó mecanismos y dañó sus juntas.',
      fuente: 'https://ntrs.nasa.gov/citations/20050160460',
      verificada: false,
    },
    titulo: 'Polvo en los trajes',
    texto: 'El polvo de la Luna se pega a los trajes y se mete en las juntas.',
    destinos: ['luna'],
    peso: 2,
    opcionSinAtender: 'seguir-sucios',
    opciones: [
      {
        id: 'limpiar',
        texto: 'Limpiar los trajes',
        efectos: { salud: { suenoEstres: -3 } },
        tareas: [
          { estacion: 'habitat', especialidad: 'ingenieria', trabajo: 12, etiqueta: 'Limpiar las juntas de los trajes' },
          { estacion: 'habitat', especialidad: 'medicina', trabajo: 8, etiqueta: 'Revisar los pulmones del equipo' },
        ],
      },
      {
        id: 'seguir-sucios',
        texto: 'Seguir con los trajes sucios',
        efectos: { recursos: { oxigeno: -3 }, salud: { suenoEstres: -10 } },
      },
    ],
  },
  {
    id: 'conjuncion-solar',
    archivo: {
      dato: 'Cada dos años Marte queda al otro lado del Sol. La NASA deja de enviar órdenes a sus rovers unas dos semanas y ellos siguen con una lista de tareas preparada.',
      fuente: 'https://www.nasa.gov/solar-system/whats-mars-solar-conjunction-and-why-does-it-matter/',
      verificada: false,
    },
    titulo: 'El Sol tapa la Tierra',
    texto: 'Marte queda detrás del Sol y no llegan mensajes de la Tierra.',
    destinos: ['marte'],
    peso: 2,
    opcionSinAtender: 'esperar',
    opciones: [
      {
        id: 'plan-autonomo',
        texto: 'Seguir un plan preparado',
        efectos: { ciencia: 3, salud: { suenoEstres: -4 } },
        tareas: [
          { estacion: 'habitat', especialidad: 'ingenieria', trabajo: 10, etiqueta: 'Programar los sistemas' },
          { estacion: 'habitat', especialidad: 'geologia', trabajo: 10, etiqueta: 'Registrar el clima y la radiación' },
        ],
      },
      {
        id: 'esperar',
        texto: 'Esperar instrucciones',
        efectos: { salud: { suenoEstres: -18 }, recursos: { energia: -6 } },
      },
    ],
  },
  {
    id: 'remolino',
    notaDe: ['sojourner'],
    archivo: {
      dato: 'En 2009 el viento de Marte limpió el polvo de los paneles solares del rover Spirit y le dio más energía cada día.',
      fuente: 'https://www.jpl.nasa.gov/news/spirit-gets-energy-boost-from-cleaner-solar-panels/',
      verificada: false,
    },
    titulo: 'Remolino de polvo',
    texto: 'Un remolino de viento pasa junto a la base.',
    destinos: ['marte'],
    peso: 1,
    opcionSinAtender: 'quedarse-dentro',
    opciones: [
      {
        id: 'aprovechar',
        texto: 'Revisar los paneles y estudiar el remolino',
        efectos: { recursos: { energia: 15 }, ciencia: 2 },
        tareas: [
          { estacion: 'panel-solar', especialidad: 'ingenieria', trabajo: 10, etiqueta: 'Medir los paneles limpios' },
          { estacion: 'exterior', personas: 2, especialidad: 'geologia', trabajo: 12, etiqueta: 'Estudiar la huella del remolino' },
        ],
      },
      {
        id: 'quedarse-dentro',
        texto: 'Quedarse dentro',
        efectos: { salud: { suenoEstres: -4 } },
      },
    ],
  },
];

// La capa 3D no conoce ids de contenido: si el evento del día está en esta lista,
// la escena ofrece un punto de reparación. Si se agrega un evento de avería, va acá.
export const EVENTOS_REPARABLES = ['fallo-equipo', 'fuga-agua', 'tormenta-polvo', 'tormenta-solar'];

// Evento que desbloquea la historia de la Surveyor 3; la escena lo usa para su nodo.
export const EVENTO_SURVEYOR = 'surveyor-3';
