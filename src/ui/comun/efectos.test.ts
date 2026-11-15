import { expect, test } from 'vitest';
import { describirConsecuencia, describirRiesgo } from './efectos';

test('sin la nota de la misión, la opción dice qué cambia pero no cuánto (RF-17)', () => {
  const fuera = { recursos: { energia: -8 }, ciencia: 6, dosis: 150 };
  expect(describirRiesgo(fuera)).toBe('Afecta a: menos energía, más ciencia, mucha radiación fuera');
  expect(describirRiesgo(fuera)).not.toMatch(/\d/);
  expect(describirConsecuencia(fuera)).toBe('-8 de energía, +6 ciencia, +150 mSv de radiación fuera');
  expect(describirRiesgo({ multiplicadorRadiacion: 40 })).toBe('Afecta a: más radiación dentro');
});
