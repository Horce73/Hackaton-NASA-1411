import { expect, test } from 'vitest';
import { siguiente } from './prng';

function serie(semilla: number, n: number): number[] {
  const valores: number[] = [];
  let rng = semilla;
  for (let i = 0; i < n; i++) {
    const paso = siguiente(rng);
    valores.push(paso.valor);
    rng = paso.rng;
  }
  return valores;
}

test('la misma semilla da la misma serie', () => {
  expect(serie(42, 20)).toEqual(serie(42, 20));
});

test('semillas distintas dan series distintas', () => {
  expect(serie(1, 5)).not.toEqual(serie(2, 5));
});

test('los valores están en [0, 1) y no se quedan pegados', () => {
  const valores = serie(7, 1000);
  expect(valores.every((v) => v >= 0 && v < 1)).toBe(true);
  expect(new Set(valores).size).toBeGreaterThan(990);
});
