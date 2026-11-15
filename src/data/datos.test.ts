// Integridad de los datos y regla de dependencias (TRD sección 9).

import { expect, test } from 'vitest';
import { validarDiseno } from '../engine/diseno';
import { iniciarMision } from '../engine/turno';
import type { Configuracion } from '../engine/tipos';
import { AVISOS } from './avisos';
import { CATALOGO, CATALOGO_POR_ID } from './catalogo';
import { EVENTOS, EVENTOS_REPARABLES, EVENTO_SURVEYOR } from './eventos';
import { HISTORIAS } from './historias';
import { NOMBRES_TRIPULACION, PREAJUSTES } from './parametros';

const idsHistorias = HISTORIAS.map((h) => h.id);

function sinRepetidos(ids: string[]): boolean {
  return new Set(ids).size === ids.length;
}

test('los ids no se repiten', () => {
  expect(sinRepetidos(CATALOGO.map((i) => i.id))).toBe(true);
  expect(sinRepetidos(EVENTOS.map((e) => e.id))).toBe(true);
  expect(sinRepetidos(idsHistorias)).toBe(true);
  for (const evento of EVENTOS) {
    expect(sinRepetidos(evento.opciones.map((o) => o.id)), evento.id).toBe(true);
  }
});

test('todo equipo histórico tiene historia y los módulos no', () => {
  for (const item of CATALOGO) {
    if (item.tipo === 'historico') expect(idsHistorias, item.id).toContain(item.historiaId);
    else expect(item.historiaId, item.id).toBeUndefined();
  }
});

test('toda referencia historiaId de un evento existe', () => {
  for (const evento of EVENTOS) {
    if (evento.historiaId) expect(idsHistorias, evento.id).toContain(evento.historiaId);
  }
});

test('toda historia tiene nombre, lugar, año y una fuente de nasa.gov', () => {
  for (const historia of HISTORIAS) {
    expect(new URL(historia.fuente).hostname, historia.id).toMatch(/(^|\.)nasa\.gov$/);
    expect(historia.nombre && historia.lugar && historia.anio && historia.datoCurioso, historia.id).toBeTruthy();
    expect(new URL(historia.imagen.fuente).hostname, historia.id).toBe('images.nasa.gov');
    expect(historia.imagen.alt.length, historia.id).toBeGreaterThan(10);
    // 2 o 3 frases (RF-08)
    const frases = historia.texto.split(/(?<=\.)\s+/).length;
    expect(frases, historia.id).toBeGreaterThanOrEqual(2);
    expect(frases, historia.id).toBeLessThanOrEqual(3);
  }
});

test('todo aviso tiene sus textos, un dato y una fuente de nasa.gov', () => {
  for (const [id, aviso] of Object.entries(AVISOS)) {
    expect(new URL(aviso.fuente).hostname, id).toMatch(/(^|\.)nasa\.gov$/);
    expect(aviso.nombre && aviso.ok && aviso.riesgo && aviso.dato, id).toBeTruthy();
  }
});

test('cada misión histórica tiene su medición con fuente y las notas de los eventos existen (RF-17)', () => {
  for (const historia of HISTORIAS) {
    expect(historia.medicion.dato.length, historia.id).toBeGreaterThan(20);
    expect(historia.medicion.fuente, historia.id).toMatch(/^https:\/\//);
  }
  const ids = HISTORIAS.map((h) => h.id);
  for (const evento of EVENTOS) for (const id of evento.notaDe ?? []) expect(ids, evento.id).toContain(id);
});

test('cada aviso cuenta su porqué con un caso real y cada módulo tiene su tema', () => {
  for (const [id, aviso] of Object.entries(AVISOS)) {
    expect(aviso.historia.dato.length, id).toBeGreaterThan(20);
    expect(aviso.historia.fuente, id).toMatch(/^https:\/\/([a-z]+\.)*nasa\.gov\//);
  }
  for (const item of CATALOGO.filter((i) => i.tipo === 'modulo')) expect(Object.keys(AVISOS), item.id).toContain(item.tema);
});

test('cada evento tiene un dato del archivo NASA con su fuente', () => {
  for (const evento of EVENTOS) {
    expect(evento.archivo.dato.length, evento.id).toBeGreaterThan(20);
    expect(evento.archivo.fuente, evento.id).toMatch(/^https:\/\/([a-z]+\.)*nasa\.gov\//);
  }
});

test('cada evento tiene 2 o 3 opciones y peso positivo (RF-04)', () => {
  for (const evento of EVENTOS) {
    expect(evento.opciones.length, evento.id).toBeGreaterThanOrEqual(2);
    expect(evento.opciones.length, evento.id).toBeLessThanOrEqual(3);
    expect(evento.peso, evento.id).toBeGreaterThan(0);
  }
});

test('contenido mínimo del PRD', () => {
  expect(CATALOGO.filter((i) => i.tipo === 'modulo').length).toBeGreaterThanOrEqual(6);
  expect(EVENTOS.length).toBeGreaterThanOrEqual(6);
  expect(NOMBRES_TRIPULACION.length).toBeGreaterThanOrEqual(4);
  for (const destino of ['luna', 'marte'] as const) {
    const historicos = CATALOGO.filter((i) => i.tipo === 'historico' && i.destinos.includes(destino));
    expect(historicos.length, destino).toBeGreaterThanOrEqual(3);
    expect(EVENTOS.some((e) => e.destinos.includes(destino)), destino).toBe(true);
  }
});

test('ningún texto visible usa raya larga', () => {
  const textos = [
    ...CATALOGO.map((i) => i.nombre),
    ...EVENTOS.flatMap((e) => [e.titulo, e.texto, e.archivo.dato, ...e.opciones.map((o) => o.texto)]),
    ...HISTORIAS.flatMap((h) => [h.nombre, h.texto, h.datoCurioso, h.imagen.alt, h.medicion.dato]),
    ...Object.values(AVISOS).flatMap((a) => [a.nombre, a.ok, a.riesgo, a.dato, a.historia.dato]),
  ];
  expect(textos.filter((t) => t.includes('—'))).toEqual([]);
});

test('cada imagen de historia existe en public/img', () => {
  const imagenes = Object.keys(import.meta.glob('../../public/img/*.webp')).map((r) => r.replace('../../public/', ''));
  for (const historia of HISTORIAS) expect(imagenes, historia.id).toContain(historia.imagen.src);
});

test('engine/ no importa React, ui/ ni state/ (RNF-04)', () => {
  const fuentes = import.meta.glob<string>('../engine/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  expect(Object.keys(fuentes).length).toBeGreaterThan(5);
  for (const [archivo, codigo] of Object.entries(fuentes)) {
    expect(codigo, archivo).not.toMatch(/(from|import)\s*\(?\s*['"](react|[./]*\/(ui|state)\/)/);
  }
});

test('cada preajuste trae un diseño sugerido válido y lanzable', () => {
  for (const preajuste of PREAJUSTES) {
    const config: Configuracion = {
      destino: preajuste.destino,
      tripulantes: preajuste.tripulantes,
      turnos: preajuste.turnos,
      semilla: 1,
    };
    expect(validarDiseno(config, preajuste.itemsSugeridos).valido, preajuste.id).toBe(true);
    expect(() => iniciarMision(config, preajuste.itemsSugeridos), preajuste.id).not.toThrow();
  }
});

test('el índice del catálogo y las referencias de la escena 3D son consistentes', () => {
  expect(Object.keys(CATALOGO_POR_ID)).toHaveLength(CATALOGO.length);
  for (const item of CATALOGO) expect(CATALOGO_POR_ID[item.id]).toBe(item);

  const idsEventos = EVENTOS.map((e) => e.id);
  for (const id of EVENTOS_REPARABLES) expect(idsEventos, id).toContain(id);

  const surveyor = EVENTOS.find((e) => e.id === EVENTO_SURVEYOR);
  expect(surveyor?.historiaId, EVENTO_SURVEYOR).toBeTruthy();
});

test('physics/ no importa React, three, ui/ ni state/', () => {
  const fuentes = import.meta.glob<string>('../physics/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  expect(Object.keys(fuentes).length).toBeGreaterThan(1);
  for (const [archivo, codigo] of Object.entries(fuentes)) {
    expect(codigo, archivo).not.toMatch(/from\s+['"](react|three|[./]*\/(ui|state)\/)/);
  }
});

test('las tareas de las opciones apuntan a estaciones que existen y la opción de riesgo es del evento (RF-15)', () => {
  for (const evento of EVENTOS) {
    if (evento.opcionSinAtender) {
      const riesgo = evento.opciones.find((o) => o.id === evento.opcionSinAtender);
      expect(riesgo, evento.id).toBeDefined();
      expect(riesgo!.tareas ?? [], `${evento.id}: la opción de riesgo no pide tareas`).toEqual([]);
    }
    for (const tarea of evento.opciones.flatMap((o) => o.tareas ?? [])) {
      const valida = ['habitat', 'exterior'].includes(tarea.estacion) || CATALOGO_POR_ID[tarea.estacion]?.tipo === 'modulo';
      expect(valida, `${evento.id}: ${tarea.estacion}`).toBe(true);
      expect(tarea.trabajo).toBeGreaterThan(0);
      // Las del exterior van en pareja, como una caminata espacial; ninguna pide más de 2 (cabe en Luna fácil).
      expect(tarea.personas ?? 1, `${evento.id}: ${tarea.etiqueta}`).toBe(tarea.estacion === 'exterior' ? 2 : 1);
    }
  }
});
