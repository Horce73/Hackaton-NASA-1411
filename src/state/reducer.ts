import { validarDiseno } from '../engine/diseno';
import { iniciarMision } from '../engine/turno';
import type { Configuracion, Estado } from '../engine/tipos';

// Antes de lanzar no existe un Estado de partida (TRD, sección 7).
export type EstadoApp =
  | { fase: 'inicio' }
  | { fase: 'diseno'; config: Configuracion; itemIds: string[] }
  | { fase: 'juego' | 'bitacora'; partida: Estado };

export type Accion =
  | { tipo: 'INICIAR'; config: Configuracion }
  | { tipo: 'AÑADIR_ITEM'; itemId: string }
  | { tipo: 'QUITAR_ITEM'; itemId: string }
  | { tipo: 'CONFIRMAR_DISENO' }
  | { tipo: 'REINICIAR' };

export const ESTADO_INICIAL: EstadoApp = { fase: 'inicio' };

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.tipo) {
    case 'INICIAR':
      return validarDiseno(accion.config, []).valido
        ? { fase: 'diseno', config: accion.config, itemIds: [] }
        : estado;
    case 'AÑADIR_ITEM': {
      if (estado.fase !== 'diseno') return estado;
      const itemIds = [...estado.itemIds, accion.itemId];
      return validarDiseno(estado.config, itemIds).valido ? { ...estado, itemIds } : estado;
    }
    case 'QUITAR_ITEM': {
      if (estado.fase !== 'diseno') return estado;
      const posicion = estado.itemIds.lastIndexOf(accion.itemId);
      if (posicion < 0) return estado;
      return { ...estado, itemIds: estado.itemIds.filter((_, i) => i !== posicion) };
    }
    case 'CONFIRMAR_DISENO':
      return estado.fase === 'diseno'
        ? { fase: 'juego', partida: iniciarMision(estado.config, estado.itemIds) }
        : estado;
    case 'REINICIAR':
      return ESTADO_INICIAL;
  }
}
