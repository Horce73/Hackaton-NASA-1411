import { validarDiseno } from '../engine/diseno';
import { iniciarMision, recursoQueFalta, siguienteTurno } from '../engine/turno';
import type { Configuracion, Estado } from '../engine/tipos';

// Antes de lanzar no existe un Estado de partida (TRD, sección 7).
export type EstadoApp =
  | { fase: 'inicio' }
  | { fase: 'diseno'; config: Configuracion; itemIds: string[] }
  | { fase: 'juego'; partida: Estado; tarjetas: string[] } // historias por mostrar (RF-08)
  | { fase: 'bitacora'; partida: Estado };

export type Accion =
  | { tipo: 'INICIAR'; config: Configuracion }
  | { tipo: 'AÑADIR_ITEM'; itemId: string }
  | { tipo: 'QUITAR_ITEM'; itemId: string }
  | { tipo: 'CONFIRMAR_DISENO' }
  | { tipo: 'ELEGIR_OPCION'; opcionId: string }
  | { tipo: 'CERRAR_TARJETA' }
  | { tipo: 'REPETIR' }
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
    case 'CONFIRMAR_DISENO': {
      if (estado.fase !== 'diseno') return estado;
      const partida = iniciarMision(estado.config, estado.itemIds);
      return { fase: 'juego', partida, tarjetas: partida.historiasDesbloqueadas };
    }
    case 'ELEGIR_OPCION': {
      if (estado.fase !== 'juego' || estado.tarjetas.length > 0) return estado;
      const { partida } = estado;
      const existe = partida.eventoActual?.opciones.some((o) => o.id === accion.opcionId);
      if (!existe || recursoQueFalta(partida, accion.opcionId)) return estado;
      const siguiente = siguienteTurno(partida, accion.opcionId);
      if (siguiente.resultado) return { fase: 'bitacora', partida: siguiente };
      const nuevas = siguiente.historiasDesbloqueadas.filter((h) => !partida.historiasDesbloqueadas.includes(h));
      return { fase: 'juego', partida: siguiente, tarjetas: nuevas };
    }
    case 'CERRAR_TARJETA':
      return estado.fase === 'juego' && estado.tarjetas.length > 0
        ? { ...estado, tarjetas: estado.tarjetas.slice(1) }
        : estado;
    case 'REPETIR':
      return estado.fase === 'bitacora'
        ? { fase: 'juego', partida: iniciarMision(estado.partida.config, estado.partida.diseno.itemIds), tarjetas: [] }
        : estado;
    case 'REINICIAR':
      return ESTADO_INICIAL;
  }
}
