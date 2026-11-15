// Módulos de base y equipo histórico (RF-02, RF-07).
// Costes y efectos son PROVISIONALES. Los costes de panel, reactor, invernadero y Curiosity
// salen del boceto del UX Brief (5.2); el resto son plausibles y se calibran en la fase 3.
// Los efectos del equipo histórico siguen la columna "Efecto en el juego" del README.
// `mantenimiento` (RF-16): tarea diaria de cada módulo, en segundos de un no especialista. PROVISIONAL.

import type { Destino, Item } from '../engine/tipos';

const AMBOS: Destino[] = ['luna', 'marte'];

export const CATALOGO: Item[] = [
  {
    id: 'panel-solar',
    nombre: 'Panel solar',
    tipo: 'modulo',
    coste: 8,
    destinos: AMBOS,
    efectos: { energiaSolar: 8 },
    mantenimiento: { especialidad: 'ingenieria', trabajo: 6 },
  },
  {
    id: 'reactor',
    nombre: 'Reactor',
    tipo: 'modulo',
    coste: 22,
    destinos: AMBOS,
    efectos: { energiaProduccion: 20 },
    mantenimiento: { especialidad: 'ingenieria', trabajo: 12 },
  },
  {
    id: 'invernadero',
    nombre: 'Invernadero',
    tipo: 'modulo',
    coste: 15,
    destinos: AMBOS,
    efectos: { alimentoProduccion: 3.6, energiaConsumo: 3 }, // 3,6 kg al día: la comida de 2 tripulantes
    mantenimiento: { especialidad: 'biologia', trabajo: 12 },
  },
  {
    id: 'reciclador',
    nombre: 'Reciclador de aire y agua',
    tipo: 'modulo',
    coste: 12,
    destinos: AMBOS,
    efectos: { soporteVital: 2, energiaConsumo: 3 },
    mantenimiento: { especialidad: 'ingenieria', trabajo: 10 },
  },
  {
    id: 'blindaje',
    nombre: 'Blindaje',
    tipo: 'modulo',
    coste: 10,
    destinos: AMBOS,
    efectos: { blindaje: 0.45 },
    mantenimiento: { especialidad: 'ingenieria', trabajo: 6 },
  },
  {
    id: 'zona-descanso',
    nombre: 'Zona de descanso',
    tipo: 'modulo',
    coste: 8,
    destinos: AMBOS,
    efectos: { saludBonus: { suenoEstres: 2 }, energiaConsumo: 1 },
    mantenimiento: { especialidad: 'medicina', trabajo: 6 },
  },
  {
    id: 'gimnasio',
    nombre: 'Gimnasio',
    tipo: 'modulo',
    coste: 8,
    destinos: AMBOS,
    efectos: { saludBonus: { musculoHueso: 2 }, energiaConsumo: 1 },
    mantenimiento: { especialidad: 'medicina', trabajo: 6 },
  },
  {
    id: 'retrorreflector',
    nombre: 'Retrorreflector láser (Apolo 11)',
    tipo: 'historico',
    coste: 4,
    destinos: ['luna'],
    efectos: { ciencia: 1 },
    historiaId: 'retrorreflector',
  },
  {
    id: 'alsep',
    nombre: 'ALSEP (estación de ciencia)',
    tipo: 'historico',
    coste: 10,
    destinos: ['luna'],
    efectos: { ciencia: 3, energiaConsumo: 2 },
    historiaId: 'alsep',
  },
  {
    id: 'lrv',
    nombre: 'Vehículo lunar (LRV)',
    tipo: 'historico',
    coste: 18,
    destinos: ['luna'],
    efectos: { ciencia: 5, energiaConsumo: 2 },
    historiaId: 'lrv',
  },
  {
    id: 'sojourner',
    nombre: 'Sojourner',
    tipo: 'historico',
    coste: 5,
    destinos: ['marte'],
    efectos: { ciencia: 1, energiaConsumo: 1 },
    historiaId: 'sojourner',
  },
  {
    id: 'spirit-opportunity',
    nombre: 'Spirit y Opportunity',
    tipo: 'historico',
    coste: 12,
    destinos: ['marte'],
    efectos: { ciencia: 2, resistenciaPolvo: 0.5, energiaConsumo: 1 },
    historiaId: 'spirit-opportunity',
  },
  {
    id: 'curiosity',
    nombre: 'Curiosity',
    tipo: 'historico',
    coste: 14,
    destinos: ['marte'],
    efectos: { ciencia: 3, alertaRadiacion: true }, // su instrumento RAD mide la radiación
    historiaId: 'curiosity',
  },
  {
    id: 'perseverance-ingenuity',
    nombre: 'Perseverance e Ingenuity',
    tipo: 'historico',
    coste: 20,
    destinos: ['marte'],
    efectos: { ciencia: 6, energiaConsumo: 2 },
    historiaId: 'perseverance-ingenuity',
  },
];

// Índice por id para la escena 3D y el motor, que resuelven ítems por identificador.
export const CATALOGO_POR_ID: Record<string, Item> = Object.fromEntries(
  CATALOGO.map((item) => [item.id, item]),
);
