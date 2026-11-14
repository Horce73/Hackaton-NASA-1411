import { expect, test } from 'vitest';
import { PRESUPUESTO } from '../data/parametros';
import { avisosDiseno, presupuestoRestante, validarDiseno } from './diseno';
import { iniciarMision, siguienteTurno } from './turno';
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

function riesgos(config: Configuracion, itemIds: string[]): string[] {
  return avisosDiseno(config, itemIds)
    .filter((a) => !a.ok)
    .map((a) => a.id);
}

test('un diseño vacío avisa de todo lo que puede fallar', () => {
  expect(riesgos({ ...marte, turnos: 20 }, [])).toEqual([
    'energia',
    'soporteVital',
    'alimento',
    'radiacion',
    'musculoHueso',
    'suenoEstres',
  ]);
});

test('un diseño completo no deja avisos', () => {
  const completo = ['panel-solar', 'panel-solar', 'panel-solar', 'reciclador', 'invernadero', 'blindaje', 'gimnasio', 'zona-descanso'];
  expect(validarDiseno(marte, completo).valido).toBe(true);
  expect(riesgos(marte, completo)).toEqual([]);
});

test('cada módulo quita su aviso', () => {
  expect(riesgos(marte, ['blindaje'])).not.toContain('radiacion');
  expect(riesgos(marte, ['reciclador'])).not.toContain('soporteVital');
  expect(riesgos(marte, ['reactor'])).not.toContain('energia');
  expect(riesgos({ ...marte, turnos: 20 }, ['gimnasio'])).not.toContain('musculoHueso');
});

test('los avisos de recursos coinciden con lo que pasa en una misión sin eventos duros', () => {
  // Con "seguir con el plan" no hay cambios directos: el resultado depende solo del diseño.
  const jugar = (itemIds: string[]) => {
    let estado = iniciarMision({ ...marte, destino: 'luna' }, itemIds);
    const evento = { ...estado.eventoActual!, id: 'neutro', opciones: [{ id: 'nada', texto: '', efectos: {} }] };
    while (!estado.resultado) estado = siguienteTurno({ ...estado, eventoActual: evento }, 'nada');
    return estado;
  };
  const luna = { ...marte, destino: 'luna' as const };

  const sinAvisos = ['reactor', 'reciclador', 'invernadero'];
  expect(riesgos(luna, sinAvisos)).not.toContain('soporteVital');
  expect(riesgos(luna, sinAvisos)).not.toContain('alimento');
  const bien = jugar(sinAvisos);
  expect(bien.historial.every((h) => h.recursos.oxigeno > 0 && h.recursos.alimento > 0)).toBe(true);

  expect(riesgos(luna, ['reactor'])).toContain('soporteVital');
  expect(jugar(['reactor']).recursos.oxigeno).toBe(0);
});
