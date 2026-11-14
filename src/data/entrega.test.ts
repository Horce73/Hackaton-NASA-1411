// Prueba de entrega (TRD 8): solo corre con `npm run test:entrega`, antes de la demo.
// Falla mientras quede contenido sin revisar por una persona del equipo.
import { expect, test } from 'vitest';
import { AVISOS } from './avisos';
import { HISTORIAS } from './historias';

test.runIf(import.meta.env.ENTREGA)('todo el contenido con datos reales está verificado', () => {
  const pendientes = [
    ...HISTORIAS.filter((h) => !h.verificada).map((h) => `historia ${h.id}`),
    ...Object.entries(AVISOS)
      .filter(([, a]) => !a.verificada)
      .map(([id]) => `aviso ${id}`),
  ];
  expect(pendientes).toEqual([]);
});
