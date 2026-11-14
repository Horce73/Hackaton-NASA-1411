import { expect, test } from 'vitest';
import { recursoQueFalta } from '../engine/turno';
import { cargarPartida, guardarPartida, type EstadoJuego } from './guardado';
import { crearEstadoInicial, reducer, type EstadoApp } from './reducer';

function almacenFalso() {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  };
}

// Juega con la primera opción disponible, cerrando las tarjetas de historia.
function avanzar(estado: EstadoApp, dias: number): EstadoApp {
  for (let i = 0; i < dias && estado.fase === 'juego'; i++) {
    while (estado.fase === 'juego' && estado.tarjetas.length > 0) estado = reducer(estado, { tipo: 'CERRAR_TARJETA' });
    if (estado.fase !== 'juego') break;
    const { partida } = estado;
    const opcion = partida.eventoActual!.opciones.find((o) => !recursoQueFalta(partida, o.id))!;
    estado = reducer(estado, { tipo: 'ELEGIR_OPCION', opcionId: opcion.id });
  }
  return estado;
}

function partidaEnCurso(): EstadoJuego {
  const inicio = crearEstadoInicial(7);
  const estado = avanzar(reducer(reducer(inicio, { tipo: 'INICIAR' }), { tipo: 'CONFIRMAR_DISENO' }), 3);
  if (estado.fase !== 'juego') throw new Error('esperaba una partida en curso');
  return estado;
}

test('guarda la partida en curso y continúa igual que sin recargar (RF-12)', () => {
  const almacen = almacenFalso();
  const enCurso = partidaEnCurso();
  guardarPartida(enCurso, almacen);

  const guardada = cargarPartida(almacen);
  expect(guardada).toEqual(JSON.parse(JSON.stringify(enCurso)));

  const continuada = reducer(crearEstadoInicial(99), { tipo: 'CONTINUAR_PARTIDA', guardada: guardada! });
  const fin = (e: EstadoApp) => (e.fase === 'bitacora' ? e.partida : null);
  const original = fin(avanzar(enCurso, 30));
  expect(original?.resultado).toBeDefined();
  expect(fin(avanzar(continuada, 30))).toEqual(JSON.parse(JSON.stringify(original)));
});

test('al terminar la misión se borra la partida guardada', () => {
  const almacen = almacenFalso();
  const enCurso = partidaEnCurso();
  guardarPartida(enCurso, almacen);
  guardarPartida(reducer(enCurso, { tipo: 'ABORTAR_MISION' }), almacen);
  expect(cargarPartida(almacen)).toBeNull();
});

test('en el inicio y el diseño no toca lo guardado', () => {
  const almacen = almacenFalso();
  guardarPartida(partidaEnCurso(), almacen);
  guardarPartida(crearEstadoInicial(1), almacen);
  expect(cargarPartida(almacen)).not.toBeNull();
});

test('solo se continúa desde el inicio', () => {
  const guardada = partidaEnCurso();
  const diseno = reducer(crearEstadoInicial(1), { tipo: 'INICIAR' });
  expect(reducer(diseno, { tipo: 'CONTINUAR_PARTIDA', guardada })).toBe(diseno);
});

test('ignora datos rotos, de otra versión o un almacén que falla', () => {
  const almacen = almacenFalso();
  expect(cargarPartida(almacen)).toBeNull();
  almacen.datos.set('mision-legado:partida', '{no es json');
  expect(cargarPartida(almacen)).toBeNull();
  almacen.datos.set('mision-legado:partida', JSON.stringify({ version: 0, estado: partidaEnCurso() }));
  expect(cargarPartida(almacen)).toBeNull();

  const roto = {
    getItem: () => {
      throw new Error('bloqueado');
    },
    setItem: () => {
      throw new Error('lleno');
    },
    removeItem: () => {},
  };
  expect(cargarPartida(roto)).toBeNull();
  expect(() => guardarPartida(partidaEnCurso(), roto)).not.toThrow();
});
