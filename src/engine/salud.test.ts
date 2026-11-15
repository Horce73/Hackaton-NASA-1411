import { expect, test } from 'vitest';
import {
  DESGASTE_SUENO,
  LIMITE_DOSIS,
  PENALIZACION_SOPORTE_VITAL,
  PERDIDA_MUSCULO,
  PERDIDA_NUTRICION,
} from '../data/parametros';
import { actualizarSalud, alertasSalud, semaforo, type ContextoSalud } from './salud';
import { iniciarMision } from './turno';
import type { Astronauta } from './tipos';

const sana: Astronauta = {
  id: 'astronauta-1',
  nombre: 'Lucía',
  especialidad: 'ingenieria',
  salud: { radiacion: 100, nutricion: 80, suenoEstres: 80, musculoHueso: 80 },
  dosis: 0,
};
const normal: ContextoSalud = {
  destino: 'luna',
  coberturaAlimento: 1,
  coberturaSoporteVital: 1,
  bonus: {},
};

test('en un turno normal baja sueño y músculo, y la nutrición se recupera', () => {
  const { salud } = actualizarSalud(sana, normal);
  expect(salud.suenoEstres).toBe(80 - DESGASTE_SUENO);
  expect(salud.musculoHueso).toBe(80 - PERDIDA_MUSCULO.luna);
  expect(salud.nutricion).toBeGreaterThan(80);
});

test('la Luna desgasta más el músculo que Marte', () => {
  const luna = actualizarSalud(sana, normal).salud.musculoHueso;
  const marte = actualizarSalud(sana, { ...normal, destino: 'marte' }).salud.musculoHueso;
  expect(luna).toBeLessThan(marte);
});

test('sin alimento baja la nutrición', () => {
  const { salud } = actualizarSalud(sana, { ...normal, coberturaAlimento: 0 });
  expect(salud.nutricion).toBe(80 - PERDIDA_NUTRICION);
});

test('sin soporte vital se pierde salud rápido en tres indicadores', () => {
  const { salud } = actualizarSalud(sana, { ...normal, coberturaSoporteVital: 0 });
  expect(salud.suenoEstres).toBe(80 - DESGASTE_SUENO - PENALIZACION_SOPORTE_VITAL);
  expect(salud.musculoHueso).toBe(80 - PERDIDA_MUSCULO.luna - PENALIZACION_SOPORTE_VITAL);
  expect(salud.nutricion).toBeLessThan(80);
  expect(salud.radiacion).toBe(100);
});

test('el indicador de radiación se deriva de la dosis acumulada', () => {
  expect(actualizarSalud({ ...sana, dosis: LIMITE_DOSIS / 4 }, normal).salud.radiacion).toBe(75);
  expect(actualizarSalud({ ...sana, dosis: LIMITE_DOSIS * 2 }, normal).salud.radiacion).toBe(0);
});

test('los bonus de los módulos compensan el desgaste', () => {
  const { salud } = actualizarSalud(sana, { ...normal, bonus: { suenoEstres: 2, musculoHueso: 2 } });
  expect(salud.suenoEstres).toBe(80 - DESGASTE_SUENO + 2);
  expect(salud.musculoHueso).toBe(80 - PERDIDA_MUSCULO.luna + 2);
});

test('los indicadores no salen de 0–100 y la entrada no cambia', () => {
  const agotada: Astronauta = {
    ...sana,
    salud: { radiacion: 5, nutricion: 2, suenoEstres: 1, musculoHueso: 1 },
  };
  const copia = structuredClone(agotada);
  const { salud } = actualizarSalud(agotada, { ...normal, coberturaAlimento: 0, coberturaSoporteVital: 0 });
  expect(Object.values(salud).every((v) => v >= 0 && v <= 100)).toBe(true);
  expect(agotada).toEqual(copia);

  const plena = actualizarSalud(
    { ...sana, salud: { radiacion: 100, nutricion: 100, suenoEstres: 100, musculoHueso: 100 } },
    { ...normal, bonus: { suenoEstres: 50, musculoHueso: 50, nutricion: 50 } },
  ).salud;
  expect(Object.values(plena).every((v) => v <= 100)).toBe(true);
});

test('semáforo: verde desde 70, ámbar de 40 a 69, rojo por debajo de 40', () => {
  expect(semaforo(70)).toBe('verde');
  expect(semaforo(69)).toBe('ambar');
  expect(semaforo(40)).toBe('ambar');
  expect(semaforo(39)).toBe('rojo');
});

test('alertasSalud avisa de cada indicador en rojo, del peor al mejor (RF-05)', () => {
  const inicial = iniciarMision({ destino: 'marte', tripulantes: 2, turnos: 10, semilla: 1 }, []);
  expect(alertasSalud(inicial)).toEqual([]);
  const [lucia, marco] = inicial.tripulacion;
  const estado = {
    ...inicial,
    tripulacion: [
      { ...lucia, salud: { ...lucia.salud, suenoEstres: 35, radiacion: 60 } },
      { ...marco, salud: { ...marco.salud, musculoHueso: 12 } },
    ],
  };
  expect(alertasSalud(estado)).toEqual([
    { astronauta: 'Marco', indicador: 'musculoHueso', valor: 12, temprana: false },
    { astronauta: 'Lucía', indicador: 'suenoEstres', valor: 35, temprana: false },
  ]);
});

test('con Curiosity la radiación avisa ya en ámbar', () => {
  const inicial = iniciarMision({ destino: 'marte', tripulantes: 2, turnos: 10, semilla: 1 }, ['curiosity']);
  const [lucia, marco] = inicial.tripulacion;
  const estado = {
    ...inicial,
    tripulacion: [{ ...lucia, salud: { ...lucia.salud, radiacion: 60, nutricion: 65 } }, marco],
  };
  expect(alertasSalud(estado)).toEqual([
    { astronauta: 'Lucía', indicador: 'radiacion', valor: 60, temprana: true },
  ]);
});
