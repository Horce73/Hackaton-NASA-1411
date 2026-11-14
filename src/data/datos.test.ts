// Integridad de los datos y regla de dependencias (TRD sección 9).

import { expect, test } from 'vitest';
import { AVISOS } from './avisos';
import { CATALOGO } from './catalogo';
import { EVENTOS } from './eventos';
import { HISTORIAS } from './historias';
import { NOMBRES_TRIPULACION } from './parametros';

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
    expect(historia.nombre && historia.lugar && historia.anio, historia.id).toBeTruthy();
  }
});

test('todo aviso tiene sus textos, un dato y una fuente de nasa.gov', () => {
  for (const [id, aviso] of Object.entries(AVISOS)) {
    expect(new URL(aviso.fuente).hostname, id).toMatch(/(^|\.)nasa\.gov$/);
    expect(aviso.nombre && aviso.ok && aviso.riesgo && aviso.dato, id).toBeTruthy();
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
    ...EVENTOS.flatMap((e) => [e.titulo, e.texto, ...e.opciones.map((o) => o.texto)]),
    ...HISTORIAS.flatMap((h) => [h.nombre, h.texto]),
    ...Object.values(AVISOS).flatMap((a) => [a.nombre, a.ok, a.riesgo, a.dato]),
  ];
  expect(textos.filter((t) => t.includes('—'))).toEqual([]);
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
