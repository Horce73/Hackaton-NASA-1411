// Guardado de la partida en curso en localStorage (RF-12).
// Solo se guarda la fase de juego: al terminar la misión se borra, y una partida nueva la sobrescribe.
// Si los datos del juego cambian de forma incompatible, sube VERSION y las partidas viejas se ignoran.

import type { EstadoApp } from './reducer';

export type EstadoJuego = Extract<EstadoApp, { fase: 'juego' }>;
type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const CLAVE = 'mision-legado:partida';
const VERSION = 4; // 2: tripulación y plan del día; 3: eventos nuevos; 4: cuaderno de misión

function almacenNavegador(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // el navegador puede bloquear el acceso (modo privado, permisos)
  }
}

export function guardarPartida(estado: EstadoApp, almacen = almacenNavegador()): void {
  if (!almacen) return;
  try {
    if (estado.fase === 'juego') almacen.setItem(CLAVE, JSON.stringify({ version: VERSION, estado }));
    else if (estado.fase === 'bitacora') almacen.removeItem(CLAVE);
  } catch {
    // Sin espacio o sin permiso: el juego sigue sin guardar.
  }
}

export function cargarPartida(almacen = almacenNavegador()): EstadoJuego | null {
  try {
    const guardado = JSON.parse(almacen?.getItem(CLAVE) ?? 'null') as { version?: number; estado?: EstadoJuego } | null;
    const estado = guardado?.version === VERSION ? guardado.estado : undefined;
    if (estado?.fase !== 'juego' || !estado.partida?.config || estado.partida.resultado) return null;
    return estado;
  } catch {
    return null;
  }
}
