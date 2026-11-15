import { expect, test } from 'vitest';
import { describirConsecuencia, describirRiesgo } from './efectos';

test('sin la nota de la misión, la opción dice qué cambia pero no cuánto (RF-17)', () => {
  const efectos = { recursos: { energia: -8 }, ciencia: 6, multiplicadorRadiacion: 16 };
  expect(describirRiesgo(efectos)).toBe('Afecta a: menos energía, más ciencia, mucha más radiación');
  expect(describirRiesgo(efectos)).not.toMatch(/\d/);
  expect(describirConsecuencia(efectos)).toMatch(/8/);
});
