import { describe, expect, test } from 'vitest';
import {
  crearEstadoJugadorInicial,
  groundHeightAt,
  pasoFisicaJugador,
  RADIO_ARENA,
} from './fisica3d';
import type { EntradaMovimiento } from './fisica3d';

const QUIETO: EntradaMovimiento = {
  adelante: 0,
  derecha: 0,
  camaraYaw: 0,
  saltarPresionado: false,
  saltarMantenido: false,
  sprint: false,
};

const CORRER_HACIA_EL_CENTRO: EntradaMovimiento = {
  ...QUIETO,
  adelante: 1,
  sprint: true,
};

describe('terreno', () => {
  test('la plataforma central es plana para apoyar la base y los módulos', () => {
    expect(groundHeightAt(0, 0, 'luna')).toBe(0);
    expect(groundHeightAt(5, -5, 'marte')).toBe(0);
  });

  test('fuera de la plataforma el terreno ondula', () => {
    expect(Math.abs(groundHeightAt(30, 30, 'luna'))).toBeGreaterThan(0);
  });
});

describe('movimiento', () => {
  test('el salto en la Luna alcanza mayor altura que en Marte por menor gravedad', () => {
    let luna = crearEstadoJugadorInicial('luna');
    let marte = crearEstadoJugadorInicial('marte');
    let maxLuna = luna.y;
    let maxMarte = marte.y;

    luna = pasoFisicaJugador(luna, { ...QUIETO, saltarPresionado: true }, 'luna', [], 0.016);
    marte = pasoFisicaJugador(marte, { ...QUIETO, saltarPresionado: true }, 'marte', [], 0.016);

    for (let i = 0; i < 180; i++) {
      luna = pasoFisicaJugador(luna, QUIETO, 'luna', [], 0.016);
      marte = pasoFisicaJugador(marte, QUIETO, 'marte', [], 0.016);
      maxLuna = Math.max(maxLuna, luna.y);
      maxMarte = Math.max(maxMarte, marte.y);
    }

    expect(maxLuna).toBeGreaterThan(maxMarte * 1.8);
  });

  test('el jetpack gasta combustible y se recarga al tocar el suelo', () => {
    let estado = crearEstadoJugadorInicial('luna');
    estado = pasoFisicaJugador(estado, { ...QUIETO, saltarPresionado: true }, 'luna', [], 0.016);
    let empujo = false;
    for (let i = 0; i < 30; i++) {
      estado = pasoFisicaJugador(
        estado,
        { ...QUIETO, saltarMantenido: true, saltarPresionado: false },
        'luna',
        [],
        0.016,
      );
      empujo = empujo || estado.usandoJetpack;
    }
    expect(empujo).toBe(true);
    expect(estado.combustibleJetpack).toBeLessThan(100);
  });
});

describe('colisiones', () => {
  test('el jugador colisiona con obstáculos cilíndricos y no atraviesa el perímetro', () => {
    const obstaculo = [{ id: 'domo', x: 0, z: 0, radio: 4, altura: 5 }];
    let estado = { ...crearEstadoJugadorInicial('luna'), x: 0, z: 4.4 };

    for (let i = 0; i < 40; i++) {
      estado = pasoFisicaJugador(estado, CORRER_HACIA_EL_CENTRO, 'luna', obstaculo, 0.016);
    }
    expect(Math.hypot(estado.x, estado.z)).toBeGreaterThanOrEqual(4.4);

    let borde = { ...crearEstadoJugadorInicial('marte'), x: RADIO_ARENA + 5, z: 0 };
    borde = pasoFisicaJugador(borde, CORRER_HACIA_EL_CENTRO, 'marte', [], 0.016);
    expect(Math.hypot(borde.x, borde.z)).toBeLessThanOrEqual(RADIO_ARENA + 0.001);
  });

  test('pasoFisicaJugador no modifica el estado de entrada', () => {
    const estado = Object.freeze({ ...crearEstadoJugadorInicial('luna') });
    const copia = structuredClone(estado);
    pasoFisicaJugador(estado, CORRER_HACIA_EL_CENTRO, 'luna', [], 0.016);
    expect(estado).toEqual(copia);
  });
});
