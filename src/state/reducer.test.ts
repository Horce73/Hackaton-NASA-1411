import { expect, test } from 'vitest';
import type { Configuracion } from '../engine/tipos';
import { ESTADO_INICIAL, reducer, type Accion, type EstadoApp } from './reducer';

const config: Configuracion = { destino: 'marte', tripulantes: 3, turnos: 14, semilla: 5 };

function aplicar(...acciones: Accion[]): EstadoApp {
  return acciones.reduce(reducer, ESTADO_INICIAL);
}
const anadir = (itemId: string): Accion => ({ tipo: 'AÑADIR_ITEM', itemId });

test('INICIAR pasa al diseño con la misión vacía', () => {
  expect(aplicar({ tipo: 'INICIAR', config })).toEqual({ fase: 'diseno', config, itemIds: [] });
});

test('INICIAR ignora una configuración fuera de rango (RF-01)', () => {
  expect(aplicar({ tipo: 'INICIAR', config: { ...config, turnos: 30 } })).toBe(ESTADO_INICIAL);
});

test('añadir y quitar elementos', () => {
  const estado = aplicar({ tipo: 'INICIAR', config }, anadir('panel-solar'), anadir('panel-solar'), anadir('curiosity'), {
    tipo: 'QUITAR_ITEM',
    itemId: 'panel-solar',
  });
  expect(estado).toMatchObject({ itemIds: ['panel-solar', 'curiosity'] });
});

test('no deja añadir lo que supera el presupuesto ni lo que no es del destino (RF-02)', () => {
  const lleno = aplicar({ tipo: 'INICIAR', config }, ...Array(4).fill(anadir('reactor')));
  expect(reducer(lleno, anadir('invernadero'))).toBe(lleno);
  expect(reducer(lleno, anadir('lrv'))).toBe(lleno);
  expect(reducer(lleno, anadir('reciclador'))).toMatchObject({ itemIds: { length: 5 } });
});

test('CONFIRMAR_DISENO lanza la misión con el diseño elegido', () => {
  const estado = aplicar({ tipo: 'INICIAR', config }, anadir('reciclador'), anadir('curiosity'), {
    tipo: 'CONFIRMAR_DISENO',
  });
  expect(estado).toMatchObject({
    fase: 'juego',
    partida: { turno: 1, config, diseno: { itemIds: ['reciclador', 'curiosity'] }, historiasDesbloqueadas: ['curiosity'] },
  });
});

test('las acciones de diseño no hacen nada fuera del diseño y REINICIAR vuelve al inicio', () => {
  expect(reducer(ESTADO_INICIAL, anadir('reactor'))).toBe(ESTADO_INICIAL);
  expect(reducer(ESTADO_INICIAL, { tipo: 'CONFIRMAR_DISENO' })).toBe(ESTADO_INICIAL);
  expect(aplicar({ tipo: 'INICIAR', config }, { tipo: 'REINICIAR' })).toBe(ESTADO_INICIAL);
});
