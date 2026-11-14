// Eventos y opciones (RF-04). Pesos y efectos son PROVISIONALES (balance de juego).
// Unidades: energía en puntos, oxígeno y alimento en kg, agua en litros, dosis en mSv.
// Cada efecto vale solo para el turno en que se elige la opción.
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
    opciones: [
      {
        id: 'refugiarse',
        texto: 'Refugiarse en la base',
        efectos: { multiplicadorRadiacion: 1.5, salud: { suenoEstres: -4 } },
      },
      {
        id: 'seguir-fuera',
        texto: 'Seguir trabajando fuera',
        efectos: { multiplicadorRadiacion: 6, ciencia: 5 },
      },
    ],
  },
  {
    id: 'tormenta-polvo',
    titulo: 'Tormenta de polvo',
    texto: 'Tus paneles solares producen menos hoy.',
    destinos: ['marte'],
    peso: 3,
    opciones: [
      {
        id: 'ahorrar-energia',
        texto: 'Ahorrar energía',
        efectos: { factorSolar: 0.4, recursos: { energia: 8 }, salud: { suenoEstres: -3 } },
      },
      {
        id: 'seguir-con-todo',
        texto: 'Seguir con todo',
        efectos: { factorSolar: 0.4 },
      },
      {
        id: 'explorar',
        texto: 'Salir a explorar',
        efectos: { factorSolar: 0.4, recursos: { energia: -8 }, ciencia: 6 },
      },
    ],
  },
  {
    id: 'fallo-equipo',
    titulo: 'Fallo de equipo',
    texto: 'Una pieza del sistema de aire deja de funcionar.',
    destinos: AMBOS,
    peso: 2,
    opciones: [
      {
        id: 'reparar',
        texto: 'Repararla ahora',
        efectos: { recursos: { energia: -10 }, salud: { suenoEstres: -3 } },
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
    opciones: [
      {
        id: 'sellar',
        texto: 'Salir a sellar la fuga',
        efectos: { recursos: { agua: -5 }, dosis: 1 },
      },
      {
        id: 'racionar',
        texto: 'Racionar el agua hoy',
        efectos: { recursos: { agua: -10 }, salud: { nutricion: -3 } },
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
      },
      {
        id: 'ejercicio',
        texto: 'Hacer ejercicio',
        efectos: { salud: { musculoHueso: 8 }, recursos: { alimento: -1.8 } },
      },
      {
        id: 'ciencia',
        texto: 'Trabajar en ciencia',
        efectos: { ciencia: 4, salud: { suenoEstres: -3 } },
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
    opciones: [
      {
        id: 'visitar',
        texto: 'Ir a verla',
        efectos: { ciencia: 6, dosis: 0.7, recursos: { energia: -5 } },
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
