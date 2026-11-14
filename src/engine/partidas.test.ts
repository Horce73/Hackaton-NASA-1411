// Pruebas de propiedades (TRD sección 9): invariantes y reproducibilidad en partidas completas.

import { expect, test } from 'vitest';
import { CATALOGO } from '../data/catalogo';
import { CAPACIDAD_ENERGIA, PRESUPUESTO } from '../data/parametros';
import { validarDiseno } from './diseno';
import { siguiente } from './prng';
import { puntuar } from './puntuacion';
import { iniciarMision, recursoQueFalta, siguienteTurno } from './turno';
import type { Configuracion, Estado } from './tipos';

// Configuración, diseño y decisiones salen de la semilla, así que cada partida es distinta y repetible.
function partidaAleatoria(semilla: number) {
  let rng = semilla;
  const azar = (n: number) => {
    const paso = siguiente(rng);
    rng = paso.rng;
    return Math.floor(paso.valor * n);
  };

  const config: Configuracion = {
    destino: azar(2) === 0 ? 'luna' : 'marte',
    tripulantes: ([2, 3, 4] as const)[azar(3)],
    turnos: 10 + azar(11),
    semilla,
  };

  const itemIds: string[] = [];
  for (let intento = 0; intento < 12; intento++) {
    const candidato = CATALOGO[azar(CATALOGO.length)].id;
    if (validarDiseno(config, [...itemIds, candidato]).valido) itemIds.push(candidato);
  }

  const estados: Estado[] = [iniciarMision(config, itemIds)];
  while (!estados[estados.length - 1].resultado) {
    const estado = estados[estados.length - 1];
    const opciones = estado.eventoActual!.opciones.filter((o) => !recursoQueFalta(estado, o.id));
    estados.push(siguienteTurno(estado, opciones[azar(opciones.length)].id));
  }
  return { config, itemIds, estados };
}

function problemas(estado: Estado): string[] {
  const lista: string[] = [];
  for (const [recurso, valor] of Object.entries(estado.recursos)) {
    if (!Number.isFinite(valor) || valor < 0) lista.push(`${recurso} = ${valor}`);
  }
  if (estado.recursos.energia > CAPACIDAD_ENERGIA) lista.push(`energia = ${estado.recursos.energia}`);
  if (!Number.isFinite(estado.ciencia) || estado.ciencia < 0) lista.push(`ciencia = ${estado.ciencia}`);
  for (const astronauta of estado.tripulacion) {
    for (const [indicador, valor] of Object.entries(astronauta.salud)) {
      if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
        lista.push(`${astronauta.nombre}.${indicador} = ${valor}`);
      }
    }
    if (!Number.isFinite(astronauta.dosis) || astronauta.dosis < 0) lista.push(`dosis = ${astronauta.dosis}`);
  }
  return lista;
}

test('1 000 partidas con semillas distintas: ningún recurso negativo ni indicador fuera de 0–100', () => {
  const resultados = { exito: 0, abortada: 0 };
  for (let semilla = 1; semilla <= 1000; semilla++) {
    const { config, estados } = partidaAleatoria(semilla);
    for (const estado of estados) {
      expect(problemas(estado), `semilla ${semilla}, turno ${estado.turno}`).toEqual([]);
      expect(estado.diseno.presupuestoUsado).toBeLessThanOrEqual(PRESUPUESTO);
    }
    const final = estados[estados.length - 1];
    expect(final.turno).toBeLessThanOrEqual(config.turnos);
    expect(final.historial).toHaveLength(final.turno);
    expect(Number.isInteger(puntuar(final))).toBe(true);
    resultados[final.resultado!]++;
  }
  // Si todas acaban igual, el motor o el balance están rotos.
  expect(resultados.exito).toBeGreaterThan(0);
  expect(resultados.abortada).toBeGreaterThan(0);
});

test('misma semilla y mismas decisiones dan exactamente la misma partida', () => {
  for (const semilla of [1, 42, 2026]) {
    expect(partidaAleatoria(semilla)).toEqual(partidaAleatoria(semilla));
  }
});

test('semillas distintas dan partidas distintas', () => {
  const config: Configuracion = { destino: 'marte', tripulantes: 3, turnos: 20, semilla: 1 };
  const eventos = (semilla: number) => {
    let estado = iniciarMision({ ...config, semilla }, ['panel-solar', 'panel-solar', 'reciclador']);
    const ids: string[] = [];
    while (!estado.resultado) {
      ids.push(estado.eventoActual!.id);
      const e = estado;
      estado = siguienteTurno(e, e.eventoActual!.opciones.find((o) => !recursoQueFalta(e, o.id))!.id);
    }
    return ids;
  };
  expect(eventos(1)).not.toEqual(eventos(2));
});
