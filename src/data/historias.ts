// Tarjetas de historia (RF-08).
// Nombre, lugar y año vienen de la tabla del README y están SIN VERIFICAR.
// `texto` se redacta en la fase 5 a partir de la fuente. `fuente` es una URL de la NASA
// que respondía el 2026-11-14; nadie ha contrastado todavía su contenido con la tarjeta.
// `verificada` solo pasa a true cuando una persona del equipo lo confirma.

import type { Historia } from '../engine/tipos';

const PENDIENTE = '[PENDIENTE fase 5]';

export const HISTORIAS: Historia[] = [
  {
    id: 'retrorreflector',
    nombre: 'Retrorreflector láser (Apolo 11)',
    lugar: 'Luna',
    anio: '1969',
    texto: PENDIENTE,
    fuente: 'https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=1969-059C-04',
    verificada: false,
  },
  {
    id: 'alsep',
    nombre: 'ALSEP (estaciones de ciencia, Apolo 12–17)',
    lugar: 'Luna',
    anio: '1969–72',
    texto: PENDIENTE,
    fuente: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C',
    verificada: false,
  },
  {
    id: 'lrv',
    nombre: 'Vehículo lunar (LRV, Apolo 15–17)',
    lugar: 'Luna',
    anio: '1971–72',
    texto: PENDIENTE,
    fuente: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html',
    verificada: false,
  },
  {
    id: 'surveyor-3',
    nombre: 'Surveyor 3',
    lugar: 'Luna',
    anio: '1967',
    texto: PENDIENTE,
    fuente: 'https://science.nasa.gov/mission/surveyor-3/',
    verificada: false,
  },
  {
    id: 'sojourner',
    nombre: 'Sojourner',
    lugar: 'Marte',
    anio: '1997',
    texto: PENDIENTE,
    fuente: 'https://science.nasa.gov/mission/mars-pathfinder/',
    verificada: false,
  },
  {
    id: 'spirit-opportunity',
    nombre: 'Spirit y Opportunity',
    lugar: 'Marte',
    anio: '2004',
    texto: PENDIENTE,
    fuente: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    verificada: false,
  },
  {
    id: 'curiosity',
    nombre: 'Curiosity',
    lugar: 'Marte',
    anio: '2012',
    texto: PENDIENTE,
    fuente: 'https://science.nasa.gov/mission/msl-curiosity/',
    verificada: false,
  },
  {
    id: 'perseverance-ingenuity',
    nombre: 'Perseverance e Ingenuity',
    lugar: 'Marte',
    anio: '2021',
    texto: PENDIENTE,
    fuente: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    verificada: false,
  },
];
