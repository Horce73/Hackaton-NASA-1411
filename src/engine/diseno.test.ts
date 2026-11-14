import { expect, test } from 'vitest';
import { PRESUPUESTO } from '../data/parametros';
import { presupuestoRestante, validarDiseno } from './diseno';
import type { Configuracion } from './tipos';

const marte: Configuracion = { destino: 'marte', tripulantes: 3, turnos: 14, semilla: 1 };

test('acepta un diseño dentro del presupuesto', () => {
  const resultado = validarDiseno(marte, ['panel-solar', 'panel-solar', 'reciclador', 'curiosity']);
  expect(resultado).toEqual({ valido: true, presupuestoUsado: 42, errores: [] });
});

test('rechaza superar el presupuesto (RF-02)', () => {
  const reactores = Array(5).fill('reactor'); // 5 × 22 = 110
  const resultado = validarDiseno(marte, reactores);
  expect(resultado.presupuestoUsado).toBeGreaterThan(PRESUPUESTO);
  expect(resultado.valido).toBe(false);
  expect(resultado.errores).toHaveLength(1);
});

test('acepta gastar el presupuesto exacto', () => {
  // 4 reactores (88) + reciclador (12) = 100
  const resultado = validarDiseno(marte, ['reactor', 'reactor', 'reactor', 'reactor', 'reciclador']);
  expect(resultado.presupuestoUsado).toBe(PRESUPUESTO);
  expect(resultado.valido).toBe(true);
});

test('rechaza un equipo que no es del destino', () => {
  expect(validarDiseno(marte, ['lrv']).valido).toBe(false);
});

test('rechaza un equipo histórico repetido, pero no un módulo repetido', () => {
  expect(validarDiseno(marte, ['curiosity', 'curiosity']).valido).toBe(false);
  expect(validarDiseno(marte, ['panel-solar', 'panel-solar']).valido).toBe(true);
});

test('rechaza un elemento que no existe', () => {
  expect(validarDiseno(marte, ['cohete-magico']).valido).toBe(false);
});

test('rechaza una duración fuera de 10–20 turnos (RF-01)', () => {
  expect(validarDiseno({ ...marte, turnos: 9 }, []).valido).toBe(false);
  expect(validarDiseno({ ...marte, turnos: 21 }, []).valido).toBe(false);
  expect(validarDiseno({ ...marte, turnos: 10 }, []).valido).toBe(true);
  expect(validarDiseno({ ...marte, turnos: 20 }, []).valido).toBe(true);
});

test('presupuestoRestante descuenta el coste de los elementos', () => {
  expect(presupuestoRestante([])).toBe(PRESUPUESTO);
  expect(presupuestoRestante(['panel-solar', 'invernadero'])).toBe(PRESUPUESTO - 8 - 15);
});
