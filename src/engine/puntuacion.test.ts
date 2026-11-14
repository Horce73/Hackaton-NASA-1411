import { expect, test } from 'vitest';
import { PUNTOS_POR_HISTORIA } from '../data/parametros';
import { puntuar } from './puntuacion';
import { iniciarMision } from './turno';

const inicial = iniciarMision({ destino: 'marte', tripulantes: 2, turnos: 10, semilla: 1 }, ['curiosity']);

test('suma ciencia, salud media redondeada y puntos por historia (TRD 6.4)', () => {
  const estado = {
    ...inicial,
    ciencia: 12,
    tripulacion: [
      { ...inicial.tripulacion[0], salud: { radiacion: 90, nutricion: 80, suenoEstres: 70, musculoHueso: 61 } },
      { ...inicial.tripulacion[1], salud: { radiacion: 50, nutricion: 50, suenoEstres: 50, musculoHueso: 50 } },
    ],
  };
  // media = 501 / 8 = 62,625 → 63
  expect(puntuar(estado)).toBe(12 + 63 + PUNTOS_POR_HISTORIA);
});

test('más historias desbloqueadas dan más puntos', () => {
  const conDos = { ...inicial, historiasDesbloqueadas: ['curiosity', 'sojourner'] };
  expect(puntuar(conDos) - puntuar(inicial)).toBe(PUNTOS_POR_HISTORIA);
});
