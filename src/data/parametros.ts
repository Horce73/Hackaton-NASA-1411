// Única fuente del balance del juego.
// TODOS los valores son PROVISIONALES: plausibles para jugar, sin calibrar con fuentes de la NASA.
// Las unidades son abstractas (puntos), no medidas reales. Se calibran en la fase 3 (TRD 6.5).

import type { Destino, Preajuste } from '../engine/tipos';

// Diseño de misión (RF-01, RF-02)
export const PRESUPUESTO = 100; // PROVISIONAL (el PRD fija 100 puntos)
export const TURNOS_MIN = 10; // RF-01
export const TURNOS_MAX = 20; // RF-01

// PROVISIONAL: preajustes que rellenan la pantalla de inicio (supuesto abierto del README).
export const PREAJUSTES: Preajuste[] = [
  { id: 'luna-facil', nombre: 'Luna fácil', destino: 'luna', tripulantes: 2, turnos: 10 },
  { id: 'luna-dificil', nombre: 'Luna difícil', destino: 'luna', tripulantes: 4, turnos: 20 },
  { id: 'marte', nombre: 'Marte', destino: 'marte', tripulantes: 3, turnos: 14 },
];

// El cuarto nombre es PROVISIONAL: el UX Brief solo da los tres primeros.
export const NOMBRES_TRIPULACION = ['Lucía', 'Marco', 'Aiko', 'Dani'];

// Energía
export const CAPACIDAD_ENERGIA = 100; // PROVISIONAL
export const ENERGIA_INICIAL = 50; // PROVISIONAL
export const CONSUMO_ENERGIA_POR_TRIPULANTE = 3; // PROVISIONAL, por turno

// Alimento y soporte vital: consumo por tripulante y turno
export const CONSUMO_ALIMENTO = 1; // PROVISIONAL
export const CONSUMO_OXIGENO = 1; // PROVISIONAL
export const CONSUMO_AGUA = 1; // PROVISIONAL

// Reservas iniciales: parte del consumo de toda la misión que ya viaja en la nave.
export const RESERVA_ALIMENTO = 0.7; // PROVISIONAL
export const RESERVA_OXIGENO = 0.6; // PROVISIONAL
export const RESERVA_AGUA = 0.6; // PROVISIONAL

// Radiación
// PROVISIONAL y sin calibrar: también el orden (Luna por encima de Marte) está por confirmar con fuentes.
export const DOSIS_BASE: Record<Destino, number> = { luna: 2, marte: 1.5 };
export const LIMITE_DOSIS = 100; // PROVISIONAL: dosis con la que el indicador llega a 0
export const BLINDAJE_MAX = 0.9; // PROVISIONAL: el blindaje nunca anula toda la dosis

// Salud (TRD 6.3)
export const UMBRAL_VERDE = 70; // TRD 6.3
export const UMBRAL_AMBAR = 40; // TRD 6.3 y criterio RF-05 del PRD
export const PERDIDA_NUTRICION = 15; // PROVISIONAL: por turno sin nada de alimento
export const RECUPERACION_NUTRICION = 3; // PROVISIONAL: por turno con el alimento cubierto
export const DESGASTE_SUENO = 3; // PROVISIONAL: por turno
// PROVISIONAL: a menor gravedad, más pérdida. Las gravedades (0,17 g y 0,38 g) son las del TRD 6.3.
export const PERDIDA_MUSCULO: Record<Destino, number> = { luna: 4, marte: 3 };
// PROVISIONAL: por turno sin nada de oxígeno o de agua, a nutrición, sueño/estrés y músculo/hueso.
export const PENALIZACION_SOPORTE_VITAL = 25;

// Puntuación (TRD 6.4)
export const PUNTOS_POR_HISTORIA = 10; // PROVISIONAL
