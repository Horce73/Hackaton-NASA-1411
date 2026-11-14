// Módulos de base y equipo histórico (RF-02, RF-07).
// Costes y efectos son PROVISIONALES. Los costes de panel, reactor, invernadero y Curiosity
// salen del boceto del UX Brief (5.2); el resto son plausibles y se calibran en la fase 3.
// Los efectos del equipo histórico siguen la columna "Efecto en el juego" del README.

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
  },
  {
    id: 'reactor',
    nombre: 'Reactor',
    tipo: 'modulo',
    coste: 22,
    destinos: AMBOS,
    efectos: { energiaProduccion: 20 },
  },
  {
    id: 'invernadero',
    nombre: 'Invernadero',
    tipo: 'modulo',
    coste: 15,
    destinos: AMBOS,
    efectos: { alimentoProduccion: 3.6, energiaConsumo: 3 }, // 3,6 kg al día: la comida de 2 tripulantes
  },
  {
    id: 'reciclador',
    nombre: 'Reciclador de aire y agua',
    tipo: 'modulo',
    coste: 12,
    destinos: AMBOS,
    efectos: { soporteVital: 2, energiaConsumo: 3 },
  },
  {
    id: 'blindaje',
    nombre: 'Blindaje',
    tipo: 'modulo',
    coste: 10,
    destinos: AMBOS,
    efectos: { blindaje: 0.3 },
  },
  {
    id: 'zona-descanso',
    nombre: 'Zona de descanso',
    tipo: 'modulo',
    coste: 8,
    destinos: AMBOS,
    efectos: { saludBonus: { suenoEstres: 2 }, energiaConsumo: 1 },
  },
  {
    id: 'gimnasio',
    nombre: 'Gimnasio',
    tipo: 'modulo',
    coste: 8,
    destinos: AMBOS,
    efectos: { saludBonus: { musculoHueso: 2 }, energiaConsumo: 1 },
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
    // La mejora de la alerta de dosis es de interfaz y llega en la fase 4 (supuesto del README).
    id: 'curiosity',
    nombre: 'Curiosity',
    tipo: 'historico',
    coste: 14,
    destinos: ['marte'],
    efectos: { ciencia: 3 },
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
