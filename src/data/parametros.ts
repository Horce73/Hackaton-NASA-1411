// Única fuente del balance del juego (TRD 6.5).
// Dos clases de valores:
// - FUENTE NASA: cifra tomada de un documento de la NASA, leído el 2026-11-14. Nadie del equipo la ha
//   contrastado todavía. Unidades reales: kg, litros y mSv por persona y día.
// - PROVISIONAL: balance de juego, sin base real. La energía se mide en puntos abstractos.

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

// Alimento y soporte vital: consumo por tripulante y turno (1 turno = 1 día)
// FUENTE NASA: "about 1.8 kg of food plus packaging per person per day" en la Estación Espacial.
// https://humanresearchroadmap.nasa.gov/evidence/reports/food.pdf
export const CONSUMO_ALIMENTO = 1.8; // kg
// FUENTE NASA: "Daily oxygen consumption (with exercise) - 1.083 kg/person/day" (OCHMO-TB-002).
// https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-002-eclss.pdf
export const CONSUMO_OXIGENO = 1.08; // kg
// FUENTE NASA: "approximately 2.5 L of potable water for hydration per crewmember per day" (OCHMO-TB-002).
// Solo cuenta el agua para beber, no la de higiene.
export const CONSUMO_AGUA = 2.5; // litros

// Reservas iniciales: parte del consumo de toda la misión que ya viaja en la nave.
export const RESERVA_ALIMENTO = 0.7; // PROVISIONAL
export const RESERVA_OXIGENO = 0.6; // PROVISIONAL
export const RESERVA_AGUA = 0.6; // PROVISIONAL

// Radiación
// Dosis por día en mSv, sin blindaje.
// FUENTE NASA (Marte): "an average of 0.67 millisieverts per day" en el cráter Gale, instrumento RAD de Curiosity.
// https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/
// FUENTE NASA (Luna): "for a surface-based mission, the radiation environment exposure is approximately
// 0.5 mSv per day" (OCHMO-TB-020). Es un análisis genérico de superficie, no una medida en la Luna.
// https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf
export const DOSIS_BASE: Record<Destino, number> = { luna: 0.5, marte: 0.67 };
// PROVISIONAL (juego): dosis en mSv con la que el indicador llega a 0. El límite real de la NASA es de
// 600 mSv en toda la carrera (OCHMO-TB-020); con él la radiación no se notaría en 10-20 días.
export const LIMITE_DOSIS = 30;
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

// Exploración 3D (RF-09): movimiento del astronauta sobre el terreno.
// FUENTE NASA / TRD 6.3: gravedad de superficie 0,17 g en la Luna y 0,38 g en Marte.
export const GRAVEDAD: Record<Destino, number> = { luna: 1.62, marte: 3.72 }; // m/s²
export const VELOCIDAD_CAMINAR = 7.2; // PROVISIONAL, m/s
export const VELOCIDAD_SPRINT = 11; // PROVISIONAL, m/s
export const IMPULSO_SALTO = 3.5; // PROVISIONAL, m/s: unos 3,7 m de altura en la Luna y 1,6 m en Marte
export const EMPUJE_JETPACK = 6.2; // PROVISIONAL, m/s²
export const RADIO_JUGADOR = 0.45; // PROVISIONAL, m
export const ALTURA_JUGADOR = 1.75; // PROVISIONAL, m
export const RADIO_ARENA = 52; // PROVISIONAL, m: límite de la zona explorable
export const TIEMPO_COYOTE = 0.12; // s de margen para saltar después de dejar el suelo
export const TIEMPO_BUFFER_SALTO = 0.12; // s de margen para recordar un salto pulsado en el aire
