// Única fuente del balance del juego (TRD 6.5).
// Dos clases de valores:
// - FUENTE NASA: cifra tomada de un documento de la NASA, leído el 2026-11-14. Nadie del equipo la ha
//   contrastado todavía. Unidades reales: kg, litros y mSv por persona y día.
// - PROVISIONAL: balance de juego, sin base real. La energía se mide en puntos abstractos.

import type { Destino, Especialidad, Preajuste } from '../engine/tipos';

// Diseño de misión (RF-01, RF-02)
export const PRESUPUESTO = 100; // PROVISIONAL (el PRD fija 100 puntos)
export const TURNOS_MIN = 10; // RF-01
export const TURNOS_MAX = 20; // RF-01

// PROVISIONAL: preajustes que rellenan la pantalla de inicio (supuesto abierto del README).
// Cada uno trae un diseño sugerido que ya es válido: el jugador puede lanzarlo o editarlo.
export const PREAJUSTES: Preajuste[] = [
  {
    id: 'luna-facil',
    nombre: 'Luna fácil',
    destino: 'luna',
    tripulantes: 2,
    turnos: 10,
    itemsSugeridos: [
      'panel-solar',
      'panel-solar',
      'reciclador',
      'invernadero',
      'gimnasio',
      'zona-descanso',
      'blindaje',
      'retrorreflector',
    ],
  },
  {
    id: 'luna-dificil',
    nombre: 'Luna difícil',
    destino: 'luna',
    tripulantes: 4,
    turnos: 14,
    itemsSugeridos: [
      'reactor',
      'panel-solar',
      'reciclador',
      'reciclador',
      'invernadero',
      'blindaje',
      'gimnasio',
      'zona-descanso',
    ],
  },
  {
    id: 'marte',
    nombre: 'Marte',
    destino: 'marte',
    tripulantes: 3,
    turnos: 10,
    itemsSugeridos: [
      'reactor',
      'reciclador',
      'invernadero',
      'blindaje',
      'gimnasio',
      'zona-descanso',
      'curiosity',
      'sojourner',
    ],
  },
];

// El cuarto nombre es PROVISIONAL: el UX Brief solo da los tres primeros.
export const NOMBRES_TRIPULACION = ['Lucía', 'Marco', 'Aiko', 'Dani'];
// RF-14: especialidad fija de cada tripulante, en el mismo orden que los nombres (TRD 13).
export const ESPECIALIDADES_TRIPULACION: Especialidad[] = ['ingenieria', 'biologia', 'geologia', 'medicina'];
// Nombre y color de uniforme de cada especialidad (no es balance). El color nunca va solo: siempre con el nombre.
export const ESPECIALIDADES: Record<Especialidad, { nombre: string; color: string }> = {
  ingenieria: { nombre: 'Ingeniería', color: '#f28c28' },
  biologia: { nombre: 'Biología', color: '#3fbf6f' },
  geologia: { nombre: 'Geología', color: '#a77bff' },
  medicina: { nombre: 'Medicina', color: '#3fa0ff' },
};

// Tareas del día (RF-13 a RF-16)
// FUENTE NASA (idea, no cifra): en la ISS el mantenimiento es una carga fija de la estación que se reparte
// entre quienes estén. Unas 600 h al año de mantenimiento interno: 4 h por semana y persona con 3
// tripulantes, 12 h si queda uno solo. https://oig.nasa.gov/wp-content/uploads/2024/02/IG-20-005.pdf
// Por eso cada módulo pide su tarea diaria y comprar de más sobrecarga a la tripulación.
export const DURACION_DIA = 60; // PROVISIONAL, segundos de reloj por día
export const RITMO_ESPECIALISTA = 2; // PROVISIONAL, el especialista trabaja el doble de rápido
// PROVISIONAL: el trabajo de cada tarea se multiplica por (tripulantes / 2) y por una carga que sube del primer
// al último día. Así cada tripulante extra trae su propio trabajo y el final de la misión no da para todo.
export const CARGA_PRIMER_DIA = 1.1;
export const CARGA_ULTIMO_DIA = 1.8;
// PROVISIONAL: muestreo diario en el exterior (2 personas, geología). Es opcional y da ciencia si se termina.
export const TRABAJO_MUESTREO = 10;
export const CIENCIA_MUESTREO = 2;

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
// FUENTE NASA: "Short-term radiation exposure to solar particle events is limited to an effective dose of 250 mSv
// per event to minimize acute effects" (Radiation Protection Technical Brief, OCHMO).
// https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
// El juego lo usa como la dosis de toda la misión con la que el indicador llega a 0 (simplificación). Con cifras
// reales, la dosis diaria apenas se nota en 10-20 días: lo peligroso es salir durante una tormenta solar.
export const LIMITE_DOSIS = 250;
export const BLINDAJE_MAX = 0.9; // PROVISIONAL: el blindaje nunca anula toda la dosis

// Salud (TRD 6.3)
// Balance (TRD 13), medido el 2026-11-15 con radiación realista y misiones cortas (300 partidas por preajuste, diseño
// sugerido y todas las tareas hechas): eligiendo al azar se gana el 84 % en Luna fácil, el 59 % en Luna difícil y el
// 69 % en Marte; decidiendo bien, el 100 %. Sin las notas del cuaderno el jugador no ve las cifras y se acerca al azar.
export const UMBRAL_VERDE = 70; // TRD 6.3
export const UMBRAL_AMBAR = 40; // TRD 6.3 y criterio RF-05 del PRD
export const PERDIDA_NUTRICION = 15; // PROVISIONAL: por turno sin nada de alimento
export const RECUPERACION_NUTRICION = 3; // PROVISIONAL: por turno con el alimento cubierto
export const DESGASTE_SUENO = 8; // PROVISIONAL: por turno
// PROVISIONAL: a menor gravedad, más pérdida. Las gravedades (0,17 g y 0,38 g) son las del TRD 6.3.
export const PERDIDA_MUSCULO: Record<Destino, number> = { luna: 6.5, marte: 6 };
// PROVISIONAL: por turno sin nada de oxígeno o de agua, a nutrición, sueño/estrés y músculo/hueso.
export const PENALIZACION_SOPORTE_VITAL = 25;

// Puntuación (TRD 6.4)
export const PUNTOS_POR_HISTORIA = 10; // PROVISIONAL

// Exploración 3D (RF-09): movimiento del astronauta sobre el terreno.
// FUENTE NASA / TRD 6.3: gravedad de superficie 0,17 g en la Luna y 0,38 g en Marte.
export const GRAVEDAD: Record<Destino, number> = { luna: 1.62, marte: 3.72 }; // m/s²
// PROVISIONAL: más despacio que antes (7,2 y 11 m/s) para que se sienta una caminata con traje; sigue siendo más
// rápido que en la realidad para que el día de 60 s alcance.
export const VELOCIDAD_CAMINAR = 4; // m/s
export const VELOCIDAD_SPRINT = 6; // PROVISIONAL, m/s
// Salto con traje: el comandante John Young saltó al saludar a la bandera en el Apolo 16 (foto NASA AS16-113-18339,
// https://moon.nasa.gov/resources/103/jumping-salute/). Se suele citar que subió unos 0,42 m; esa altura no está
// contrastada con una fuente de la NASA. 1,2 m/s da unos 0,44 m en la Luna y 0,19 m en Marte.
export const IMPULSO_SALTO = 1.2; // PROVISIONAL, m/s
export const RADIO_JUGADOR = 0.45; // PROVISIONAL, m
export const ALTURA_JUGADOR = 1.75; // PROVISIONAL, m
export const RADIO_ARENA = 52; // PROVISIONAL, m: límite de la zona explorable
export const TIEMPO_COYOTE = 0.12; // s de margen para saltar después de dejar el suelo
export const TIEMPO_BUFFER_SALTO = 0.12; // s de margen para recordar un salto pulsado en el aire
