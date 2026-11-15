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

import type { Destino, Evento } from '../engine/tipos';

const AMBOS: Destino[] = ['luna', 'marte'];

export const EVENTOS: Evento[] = [
  {
    id: 'tormenta-solar',
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
];

// La capa 3D no conoce ids de contenido: si el evento del día está en esta lista,
// la escena ofrece un punto de reparación. Si se agrega un evento de avería, va acá.
export const EVENTOS_REPARABLES = ['fallo-equipo', 'fuga-agua', 'tormenta-polvo', 'tormenta-solar'];

// Evento que desbloquea la historia de la Surveyor 3; la escena lo usa para su nodo.
export const EVENTO_SURVEYOR = 'surveyor-3';
