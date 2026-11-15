import { expect, test } from 'vitest';
import { EVENTOS } from '../data/eventos';
import { CATALOGO_POR_ID } from '../data/catalogo';
import { CARGA_PRIMER_DIA, CARGA_ULTIMO_DIA, RITMO_ESPECIALISTA } from '../data/parametros';
import { cargaDelDia, ritmoEquipo, ritmoTrabajo, tareasDelDia } from './tareas';
import { iniciarMision, siguienteTurno } from './turno';
import type { Configuracion, Estado } from './tipos';

const marte: Configuracion = { destino: 'marte', tripulantes: 3, turnos: 14, semilla: 3 };

function conEvento(itemIds: string[], eventoId: string): Estado {
  const estado = iniciarMision(marte, itemIds);
  return { ...estado, eventoActual: EVENTOS.find((e) => e.id === eventoId)! };
}

test('el día pide las tareas de la opción y una revisión por módulo, no por equipo histórico (RF-15, RF-16)', () => {
  const estado = conEvento(['panel-solar', 'panel-solar', 'reciclador', 'curiosity'], 'fallo-equipo');
  const tareas = tareasDelDia(estado, 'reparar');
  expect(tareas.map((t) => [t.tipo, t.estacion])).toEqual([
    ['evento', 'item:2'], // la reparación se hace en el reciclador
    ['evento', 'habitat'], // y la revisión del aire, dentro
    ['mantenimiento', 'item:0'],
    ['mantenimiento', 'item:1'],
    ['mantenimiento', 'item:2'],
  ]);
  expect(new Set(tareas.map((t) => t.id)).size).toBe(tareas.length);
  expect(tareasDelDia(estado, 'usar-reservas').filter((t) => t.tipo === 'evento')).toEqual([]);
});

test('el trabajo crece con la tripulación y del primer al último día', () => {
  const estado = conEvento(['reciclador'], 'fallo-equipo');
  expect(cargaDelDia(estado)).toBeCloseTo(1.5 * CARGA_PRIMER_DIA);
  expect(cargaDelDia({ ...estado, turno: marte.turnos })).toBeCloseTo(1.5 * CARGA_ULTIMO_DIA);
  expect(cargaDelDia({ ...estado, config: { ...marte, tripulantes: 4 } })).toBeCloseTo(2 * CARGA_PRIMER_DIA);

  const revision = (e: Estado) => tareasDelDia(e, 'usar-reservas').find((t) => t.tipo === 'mantenimiento')!.trabajo;
  const base = CATALOGO_POR_ID.reciclador.mantenimiento!.trabajo;
  expect(revision(estado)).toBe(Math.round(base * cargaDelDia(estado)));
  expect(revision({ ...estado, turno: marte.turnos })).toBeGreaterThan(revision(estado));
});

test('una tarea en un módulo que no está en el diseño se hace en el hábitat', () => {
  const estado = conEvento(['reactor'], 'fallo-equipo');
  expect(tareasDelDia(estado, 'reparar')[0].estacion).toBe('habitat');
});

test('cada tripulante tiene su especialidad y el especialista trabaja más rápido (RF-14)', () => {
  const estado = conEvento(['reciclador'], 'fallo-equipo');
  expect(estado.tripulacion.map((a) => a.especialidad)).toEqual(['ingenieria', 'biologia', 'geologia']);
  const [reparar] = tareasDelDia(estado, 'reparar');
  expect(ritmoTrabajo(estado.tripulacion[0], reparar)).toBe(RITMO_ESPECIALISTA);
  expect(ritmoTrabajo(estado.tripulacion[1], reparar)).toBe(1);
});

test('una tarea de evento sin hacer aplica la opción de riesgo; sin pendientes, el turno es el de siempre', () => {
  const estado = conEvento(['reciclador', 'panel-solar'], 'tormenta-polvo');
  const tareas = tareasDelDia(estado, 'ahorrar-energia');
  const sinHacer = siguienteTurno(estado, 'ahorrar-energia', tareas.filter((t) => t.tipo === 'evento'));
  const riesgo = siguienteTurno(estado, 'seguir-con-todo');
  expect(sinHacer.recursos).toEqual(riesgo.recursos);
  expect(sinHacer.tripulacion).toEqual(riesgo.tripulacion);
  expect(sinHacer.ultimoDelta?.sinAtender).toBe(true);
  expect(siguienteTurno(estado, 'ahorrar-energia', [])).toEqual(siguienteTurno(estado, 'ahorrar-energia'));
});

test('un módulo sin mantenimiento no rinde ese día (RF-16)', () => {
  const estado = conEvento(['reactor', 'reciclador'], 'dia-tranquilo');
  const mantReactor = tareasDelDia(estado, 'descansar').filter((t) => t.estacion === 'item:0');
  const bien = siguienteTurno(estado, 'descansar');
  const sinReactor = siguienteTurno(estado, 'descansar', mantReactor);
  expect(sinReactor.recursos.energia).toBeLessThan(bien.recursos.energia);
  expect(sinReactor.ultimoDelta?.modulosParados).toBe(1);
});

test('una tarea de dos personas no avanza con una sola y un especialista la acelera (RF-15)', () => {
  const muestras = { especialidad: 'geologia' as const, personas: 2 };
  expect(ritmoEquipo(['geologia'], muestras)).toBe(0);
  expect(ritmoEquipo(['ingenieria', 'biologia'], muestras)).toBe(1);
  expect(ritmoEquipo(['geologia', 'biologia'], muestras)).toBe((RITMO_ESPECIALISTA + 1) / 2);
  // Una tarea de una persona suma a quien ayude.
  expect(ritmoEquipo(['ingenieria', 'biologia'], { especialidad: 'ingenieria' })).toBe(RITMO_ESPECIALISTA + 1);
});
