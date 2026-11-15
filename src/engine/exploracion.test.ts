import { expect, test } from 'vitest';
import { CAPACIDAD_ENERGIA } from '../data/parametros';
import { completarTareaExploracion } from './exploracion';
import type { Configuracion, Estado } from './tipos';
import { iniciarMision } from './turno';

const config: Configuracion = { destino: 'luna', tripulantes: 2, turnos: 10, semilla: 7 };
const base = (): Estado => iniciarMision(config, ['reciclador']);

test('la reparación repone energía y no supera la capacidad', () => {
  const inicial = base();
  const normal = completarTareaExploracion(inicial, 'averia');
  expect(normal.recursos.energia).toBe(inicial.recursos.energia + 6);

  const lleno: Estado = { ...inicial, recursos: { ...inicial.recursos, energia: CAPACIDAD_ENERGIA } };
  expect(completarTareaExploracion(lleno, 'averia').recursos.energia).toBe(CAPACIDAD_ENERGIA);
});

test('inspeccionar un equipo NASA desbloquea su historia y suma ciencia', () => {
  const estado = base();
  const nuevo = completarTareaExploracion(estado, 'historia', 'curiosity');
  expect(nuevo.ciencia).toBe(estado.ciencia + 3);
  expect(nuevo.historiasDesbloqueadas).toContain('curiosity');
});

test('la Surveyor 3 paga ciencia extra', () => {
  const estado = base();
  const nuevo = completarTareaExploracion(estado, 'historia', 'surveyor-3');
  expect(nuevo.ciencia).toBe(estado.ciencia + 8);
});

test('no duplica una historia que ya estaba desbloqueada', () => {
  const estado: Estado = { ...base(), historiasDesbloqueadas: ['curiosity'] };
  const nuevo = completarTareaExploracion(estado, 'historia', 'curiosity');
  expect(nuevo.historiasDesbloqueadas.filter((id) => id === 'curiosity')).toHaveLength(1);
});

test('no modifica el estado de entrada ni avanza el turno ni el sorteo', () => {
  const estado = Object.freeze(base());
  const copia = structuredClone(estado);
  const nuevo = completarTareaExploracion(estado, 'averia');

  expect(estado).toEqual(copia);
  expect(nuevo).not.toBe(estado);
  expect(nuevo.turno).toBe(estado.turno);
  expect(nuevo.rng).toBe(estado.rng);
});

test('una misión terminada no cambia', () => {
  const terminada: Estado = { ...base(), resultado: 'exito' };
  expect(completarTareaExploracion(terminada, 'averia')).toBe(terminada);
});
