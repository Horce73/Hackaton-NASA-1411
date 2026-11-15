import { expect, test } from 'vitest';
import { EVENTOS } from '../data/eventos';
import { CIENCIA_MUESTREO, DOSIS_BASE, ENERGIA_INICIAL } from '../data/parametros';
import { tareasDelDia } from './tareas';
import { iniciarMision, recursoQueFalta, siguienteTurno } from './turno';
import type { Configuracion, Estado } from './tipos';

const marte: Configuracion = { destino: 'marte', tripulantes: 2, turnos: 10, semilla: 7 };
const luna: Configuracion = { ...marte, destino: 'luna' };
const BASE_MARTE = ['panel-solar', 'panel-solar', 'reciclador'];

function conEvento(estado: Estado, eventoId: string): Estado {
  return { ...estado, eventoActual: EVENTOS.find((e) => e.id === eventoId) };
}

function primeraLibre(estado: Estado): string {
  return estado.eventoActual!.opciones.find((o) => !recursoQueFalta(estado, o.id))!.id;
}

function congelar<T>(valor: T): T {
  if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

test('iniciarMision crea el turno 1 con tripulación sana y un evento del destino', () => {
  const estado = iniciarMision(marte, [...BASE_MARTE, 'curiosity']);
  expect(estado.turno).toBe(1);
  expect(estado.tripulacion.map((a) => a.nombre)).toEqual(['Lucía', 'Marco']);
  expect(estado.tripulacion.every((a) => Object.values(a.salud).every((v) => v === 100))).toBe(true);
  expect(estado.recursos.energia).toBe(ENERGIA_INICIAL);
  expect(estado.eventoActual?.destinos).toContain('marte');
  expect(estado.diseno.presupuestoUsado).toBe(42);
  expect(estado.resultado).toBeUndefined();
});

test('iniciarMision desbloquea la historia de los equipos históricos del diseño (RF-07, RF-08)', () => {
  const estado = iniciarMision(marte, [...BASE_MARTE, 'curiosity', 'sojourner']);
  expect(estado.historiasDesbloqueadas).toEqual(['curiosity', 'sojourner']);
});

test('iniciarMision rechaza un diseño que supera el presupuesto', () => {
  expect(() => iniciarMision(marte, Array(5).fill('reactor'))).toThrow(/presupuesto/);
});

test('la opción elegida cambia el resultado (RF-04)', () => {
  const estado = conEvento(iniciarMision(marte, BASE_MARTE), 'tormenta-solar');
  const refugio = siguienteTurno(estado, 'refugiarse');
  const fuera = siguienteTurno(estado, 'seguir-fuera');
  expect(fuera.tripulacion[0].dosis).toBeGreaterThan(refugio.tripulacion[0].dosis);
  expect(fuera.ciencia).toBeGreaterThan(refugio.ciencia);
});

test('la tormenta de polvo reduce la energía solar y la resistencia al polvo lo compensa', () => {
  const tranquilo = siguienteTurno(conEvento(iniciarMision(marte, BASE_MARTE), 'dia-tranquilo'), 'descansar');
  const tormenta = siguienteTurno(conEvento(iniciarMision(marte, BASE_MARTE), 'tormenta-polvo'), 'seguir-con-todo');
  const conRovers = siguienteTurno(
    conEvento(iniciarMision(marte, [...BASE_MARTE, 'spirit-opportunity']), 'tormenta-polvo'),
    'seguir-con-todo',
  );
  expect(tormenta.recursos.energia).toBeLessThan(tranquilo.recursos.energia);
  // Los rovers consumen 1 de energía, pero recuperan más de lo que gastan.
  expect(conRovers.recursos.energia).toBeGreaterThan(tormenta.recursos.energia);
});

test('el blindaje reduce la dosis del turno', () => {
  const sin = siguienteTurno(conEvento(iniciarMision(luna, []), 'dia-tranquilo'), 'descansar');
  const con = siguienteTurno(conEvento(iniciarMision(luna, ['blindaje']), 'dia-tranquilo'), 'descansar');
  expect(sin.tripulacion[0].dosis).toBe(DOSIS_BASE.luna);
  expect(con.tripulacion[0].dosis).toBeLessThan(sin.tripulacion[0].dosis);
});

test('el equipo histórico suma ciencia cada turno (RF-07)', () => {
  const sin = siguienteTurno(conEvento(iniciarMision(marte, BASE_MARTE), 'dia-tranquilo'), 'descansar');
  const con = siguienteTurno(
    conEvento(iniciarMision(marte, [...BASE_MARTE, 'curiosity']), 'dia-tranquilo'),
    'descansar',
  );
  expect(sin.ciencia).toBe(CIENCIA_MUESTREO);
  expect(con.ciencia - sin.ciencia).toBe(3);
});

test('el muestreo sin terminar no da ciencia', () => {
  const estado = conEvento(iniciarMision(marte, BASE_MARTE), 'dia-tranquilo');
  const muestreo = tareasDelDia(estado, 'descansar').filter((t) => t.tipo === 'ciencia');
  expect(muestreo).toHaveLength(1);
  expect(siguienteTurno(estado, 'descansar', muestreo).ciencia).toBe(0);
});

test('un evento educativo desbloquea su historia con cualquier opción', () => {
  const estado = conEvento(iniciarMision(luna, []), 'surveyor-3');
  expect(siguienteTurno(estado, 'seguir-plan').historiasDesbloqueadas).toEqual(['surveyor-3']);
  expect(siguienteTurno(estado, 'visitar').historiasDesbloqueadas).toEqual(['surveyor-3']);
});

test('sin energía el reciclador deja de compensar el consumo de oxígeno', () => {
  const inicial = iniciarMision(marte, ['reciclador']);
  const conEnergia = siguienteTurno(conEvento(inicial, 'dia-tranquilo'), 'descansar');
  const sinEnergia = siguienteTurno(
    conEvento({ ...inicial, recursos: { ...inicial.recursos, energia: 0 } }, 'dia-tranquilo'),
    'descansar',
  );
  expect(conEnergia.recursos.oxigeno).toBe(inicial.recursos.oxigeno);
  expect(sinEnergia.recursos.oxigeno).toBeLessThan(inicial.recursos.oxigeno);
});

test('guarda una instantánea por turno y avanza el contador', () => {
  let estado = iniciarMision(marte, BASE_MARTE);
  estado = siguienteTurno(estado, primeraLibre(estado));
  estado = siguienteTurno(estado, primeraLibre(estado));
  expect(estado.turno).toBe(3);
  // El historial arranca con la instantánea del día 0, que es la línea base de las gráficas.
  expect(estado.historial.map((h) => h.turno)).toEqual([0, 1, 2]);
  expect(estado.historial[2].recursos).toEqual(estado.recursos);
});

test('la misión termina con éxito al completar los turnos', () => {
  let estado = iniciarMision(marte, [...BASE_MARTE, 'invernadero', 'gimnasio', 'zona-descanso']);
  while (!estado.resultado) {
    estado = siguienteTurno(conEvento(estado, 'dia-tranquilo'), 'descansar');
  }
  expect(estado.resultado).toBe('exito');
  expect(estado.turno).toBe(10);
  expect(estado.historial).toHaveLength(11); // día 0 más los diez turnos
  expect(estado.eventoActual).toBeUndefined();
});

test('la misión se aborta si un indicador llega a 0', () => {
  // Sin reciclador el oxígeno se acaba antes del final y la salud cae rápido.
  let estado = iniciarMision({ ...marte, turnos: 20 }, ['panel-solar']);
  while (!estado.resultado) {
    estado = siguienteTurno(conEvento(estado, 'dia-tranquilo'), 'descansar');
  }
  expect(estado.resultado).toBe('abortada');
  expect(estado.turno).toBeLessThan(20);
  expect(estado.tripulacion.some((a) => Object.values(a.salud).includes(0))).toBe(true);
});

test('una misión terminada ya no cambia', () => {
  let estado = iniciarMision(marte, BASE_MARTE);
  while (!estado.resultado) {
    estado = siguienteTurno(estado, primeraLibre(estado));
  }
  expect(siguienteTurno(estado, 'descansar')).toBe(estado);
});

test('rechaza una opción que no es del evento actual', () => {
  const estado = conEvento(iniciarMision(marte, BASE_MARTE), 'dia-tranquilo');
  expect(() => siguienteTurno(estado, 'refugiarse')).toThrow(/no existe/);
});

test('siguienteTurno no modifica el estado de entrada', () => {
  const estado = congelar(iniciarMision(marte, [...BASE_MARTE, 'curiosity']));
  const copia = structuredClone(estado);
  const nuevo = siguienteTurno(estado, primeraLibre(estado));
  expect(estado).toEqual(copia);
  expect(nuevo).not.toBe(estado);
});

test('una opción que cuesta más de lo que hay queda bloqueada (decisión de la fase 3)', () => {
  const inicial = iniciarMision(luna, []);
  const sinEnergia = conEvento({ ...inicial, recursos: { ...inicial.recursos, energia: 3 } }, 'surveyor-3');
  expect(recursoQueFalta(sinEnergia, 'visitar')).toBe('energia');
  expect(recursoQueFalta(sinEnergia, 'seguir-plan')).toBeUndefined();
  expect(() => siguienteTurno(sinEnergia, 'visitar')).toThrow(/bloqueada/);
  expect(siguienteTurno(sinEnergia, 'seguir-plan').turno).toBe(2);
});

test('si todas las opciones costaran demasiado, ninguna se bloquea', () => {
  const inicial = iniciarMision(luna, []);
  const sinAgua = conEvento({ ...inicial, recursos: { ...inicial.recursos, agua: 1 } }, 'fuga-agua');
  expect(recursoQueFalta(sinAgua, 'sellar')).toBeUndefined();
  expect(recursoQueFalta(sinAgua, 'racionar')).toBeUndefined();
  expect(siguienteTurno(sinAgua, 'sellar').recursos.agua).toBe(0);
});

test('el delta del turno refleja el cambio neto de cada recurso (RF-04)', () => {
  const inicial = conEvento(iniciarMision(marte, BASE_MARTE), 'dia-tranquilo');
  const nuevo = siguienteTurno(inicial, 'descansar');
  const delta = nuevo.ultimoDelta!;
  expect(delta.opcionTexto).toBe('Descansar');
  expect(delta.energia).toBeCloseTo(nuevo.recursos.energia - inicial.recursos.energia);
  expect(delta.alimento).toBeCloseTo(nuevo.recursos.alimento - inicial.recursos.alimento);
  expect(delta.oxigeno).toBeCloseTo(nuevo.recursos.oxigeno - inicial.recursos.oxigeno);
  expect(delta.agua).toBeCloseTo(nuevo.recursos.agua - inicial.recursos.agua);
  expect(delta.ciencia).toBe(nuevo.ciencia - inicial.ciencia);
});

test('el motivo de fin explica el cierre de la misión', () => {
  let exito = iniciarMision(marte, [...BASE_MARTE, 'invernadero', 'gimnasio', 'zona-descanso']);
  while (!exito.resultado) exito = siguienteTurno(conEvento(exito, 'dia-tranquilo'), 'descansar');
  expect(exito.motivoFin).toMatch(/Misión cumplida/);

  let aborto = iniciarMision({ ...marte, turnos: 20 }, ['panel-solar']);
  while (!aborto.resultado) aborto = siguienteTurno(conEvento(aborto, 'dia-tranquilo'), 'descansar');
  expect(aborto.motivoFin).toMatch(/se aborta/);
});

test('el sorteo no repite el evento del día anterior si hay alternativa', () => {
  const inicial = conEvento(iniciarMision(marte, BASE_MARTE), 'dia-tranquilo');
  const nuevo = siguienteTurno(inicial, 'descansar');
  expect(nuevo.eventoActual?.id).not.toBe('dia-tranquilo');
});

test('un evento educativo no vuelve a salir cuando su historia ya está desbloqueada', () => {
  let estado: Estado = conEvento(iniciarMision(luna, []), 'dia-tranquilo');
  estado = { ...estado, historiasDesbloqueadas: ['surveyor-3'] };
  for (let i = 0; i < 20 && !estado.resultado; i++) {
    estado = siguienteTurno(conEvento(estado, 'dia-tranquilo'), 'descansar');
    expect(estado.eventoActual?.id).not.toBe('surveyor-3');
  }
});
