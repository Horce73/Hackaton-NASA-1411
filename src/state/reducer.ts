// Máquina de fases de la aplicación (TRD sección 5).
// La partida simulada vive en engine/; acá se guarda solo la intención de la interfaz.

import { CATALOGO_POR_ID } from '../data/catalogo';
import {
  PREAJUSTES,
  PRESUPUESTO,
  SEMILLA_DEMO,
  TURNOS_MAX,
  TURNOS_MIN,
} from '../data/parametros';
import { describirRecompensa } from '../data/recompensas';
import type { TareaExploracion } from '../data/recompensas';
import { validarDiseno } from '../engine/diseno';
import { completarTareaExploracion } from '../engine/exploracion';
import { iniciarMision, recursoQueFalta, siguienteTurno } from '../engine/turno';
import type { Configuracion, Destino, Estado } from '../engine/tipos';

export type EstadoApp =
  | { fase: 'inicio'; config: Configuracion; itemIds: string[] }
  | { fase: 'diseno'; config: Configuracion; itemIds: string[]; errorDiseno: string | null }
  | {
      fase: 'juego';
      partida: Estado;
      tarjetas: string[]; // historias por mostrar, en orden (RF-08)
      avisoCampo: string | null; // aviso breve de una acción 3D
      nodos3dCompletados: string[];
    }
  | { fase: 'bitacora'; partida: Estado };

export type Accion =
  | { tipo: 'CAMBIAR_DESTINO'; destino: Destino }
  | { tipo: 'CAMBIAR_TRIPULANTES'; tripulantes: 2 | 3 | 4 }
  | { tipo: 'CAMBIAR_TURNOS'; turnos: number }
  | { tipo: 'APLICAR_PREAJUSTE'; preajusteId: string }
  | { tipo: 'INICIAR'; config?: Configuracion }
  | { tipo: 'VOLVER_INICIO' }
  | { tipo: 'AÑADIR_ITEM'; itemId: string }
  | { tipo: 'QUITAR_ITEM'; itemId: string }
  | { tipo: 'CARGAR_SUGERENCIA' }
  | { tipo: 'LIMPIAR_DISENO' }
  | { tipo: 'CONFIRMAR_DISENO' }
  | { tipo: 'ELEGIR_OPCION'; opcionId: string }
  | { tipo: 'COMPLETAR_TAREA_3D'; tarea: TareaExploracion; nodoId: string; historiaId?: string }
  | { tipo: 'LIMPIAR_AVISO_CAMPO' }
  | { tipo: 'ABRIR_HISTORIA'; historiaId: string }
  | { tipo: 'CERRAR_TARJETA' }
  | { tipo: 'ABORTAR_MISION' }
  | { tipo: 'REPETIR' }
  | { tipo: 'REINICIAR' };

// Semilla fija por defecto; ?seed= permite repetir una partida desde la URL.
export function semillaInicial(): number {
  if (typeof window === 'undefined') return SEMILLA_DEMO;
  const valor = new URLSearchParams(window.location.search).get('seed');
  const numero = valor ? Number(valor) : Number.NaN;
  return Number.isFinite(numero) && numero > 0 ? Math.floor(numero) : SEMILLA_DEMO;
}

export function crearEstadoInicial(semilla = semillaInicial()): EstadoApp {
  const preajuste = PREAJUSTES[0];
  return {
    fase: 'inicio',
    config: {
      destino: preajuste.destino,
      tripulantes: preajuste.tripulantes,
      turnos: preajuste.turnos,
      semilla,
    },
    itemIds: [...preajuste.itemsSugeridos],
  };
}

export const ESTADO_INICIAL: EstadoApp = crearEstadoInicial();

function itemsCompatibles(itemIds: string[], destino: Destino): string[] {
  return itemIds.filter((id) => CATALOGO_POR_ID[id]?.destinos.includes(destino));
}

// Fases donde el jugador todavía puede cambiar la configuración de la misión.
type EstadoEditable = Extract<EstadoApp, { fase: 'inicio' | 'diseno' }>;

function conConfig(estado: EstadoEditable, config: Configuracion): EstadoEditable {
  if (estado.fase === 'inicio') return { ...estado, config };
  return { ...estado, config, errorDiseno: null };
}

function sinAviso(partida: EstadoApp): EstadoApp {
  if (partida.fase !== 'juego') return partida;
  return { ...partida, avisoCampo: null };
}

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.tipo) {
    case 'CAMBIAR_DESTINO': {
      if (estado.fase !== 'inicio' && estado.fase !== 'diseno') return estado;
      if (accion.destino === estado.config.destino) return estado;
      return {
        ...conConfig(estado, { ...estado.config, destino: accion.destino }),
        itemIds: itemsCompatibles(estado.itemIds, accion.destino),
      };
    }

    case 'CAMBIAR_TRIPULANTES': {
      if (estado.fase !== 'inicio' && estado.fase !== 'diseno') return estado;
      return conConfig(estado, { ...estado.config, tripulantes: accion.tripulantes });
    }

    case 'CAMBIAR_TURNOS': {
      if (estado.fase !== 'inicio' && estado.fase !== 'diseno') return estado;
      const turnos = Math.max(TURNOS_MIN, Math.min(TURNOS_MAX, Math.round(accion.turnos)));
      return conConfig(estado, { ...estado.config, turnos });
    }

    case 'APLICAR_PREAJUSTE': {
      const preajuste = PREAJUSTES.find((p) => p.id === accion.preajusteId);
      if (!preajuste || (estado.fase !== 'inicio' && estado.fase !== 'diseno')) return estado;
      const config: Configuracion = {
        ...estado.config,
        destino: preajuste.destino,
        tripulantes: preajuste.tripulantes,
        turnos: preajuste.turnos,
      };
      return { ...conConfig(estado, config), itemIds: [...preajuste.itemsSugeridos] };
    }

    case 'INICIAR': {
      if (estado.fase !== 'inicio') return estado;
      const config = accion.config ?? estado.config;
      return {
        fase: 'diseno',
        config,
        itemIds: itemsCompatibles(estado.itemIds, config.destino),
        errorDiseno: null,
      };
    }

    case 'VOLVER_INICIO': {
      if (estado.fase === 'diseno') {
        return { fase: 'inicio', config: estado.config, itemIds: estado.itemIds };
      }
      if (estado.fase === 'inicio') return estado;
      return crearEstadoInicial(estado.partida.config.semilla);
    }

    case 'AÑADIR_ITEM': {
      if (estado.fase !== 'diseno') return estado;
      const itemIds = [...estado.itemIds, accion.itemId];
      const validacion = validarDiseno(estado.config, itemIds);
      if (!validacion.valido) {
        return { ...estado, errorDiseno: validacion.errores[0] ?? 'No se puede añadir este elemento.' };
      }
      return { ...estado, itemIds, errorDiseno: null };
    }

    case 'QUITAR_ITEM': {
      if (estado.fase !== 'diseno') return estado;
      const indice = estado.itemIds.lastIndexOf(accion.itemId);
      if (indice < 0) return estado;
      return {
        ...estado,
        itemIds: estado.itemIds.filter((_, i) => i !== indice),
        errorDiseno: null,
      };
    }

    case 'CARGAR_SUGERENCIA': {
      if (estado.fase !== 'diseno') return estado;
      const preajuste =
        PREAJUSTES.find((p) => p.destino === estado.config.destino) ?? PREAJUSTES[0];
      return { ...estado, itemIds: [...preajuste.itemsSugeridos], errorDiseno: null };
    }

    case 'LIMPIAR_DISENO':
      if (estado.fase !== 'diseno') return estado;
      return { ...estado, itemIds: [], errorDiseno: null };

    case 'CONFIRMAR_DISENO': {
      if (estado.fase !== 'diseno') return estado;
      const validacion = validarDiseno(estado.config, estado.itemIds);
      if (!validacion.valido || validacion.presupuestoUsado > PRESUPUESTO) {
        return {
          ...estado,
          errorDiseno: validacion.errores[0] ?? 'Revisa tu diseño antes de lanzar.',
        };
      }
      const partida = iniciarMision(estado.config, estado.itemIds);
      return {
        fase: 'juego',
        partida,
        tarjetas: [...partida.historiasDesbloqueadas],
        avisoCampo: null,
        nodos3dCompletados: [],
      };
    }

    case 'ELEGIR_OPCION': {
      if (estado.fase !== 'juego') return estado;
      // Mientras hay una historia abierta, el día está en pausa (RF-08).
      if (estado.tarjetas.length > 0) return estado;
      const { partida, tarjetas } = estado;
      // Una opción inexistente o bloqueada no se resuelve: el motor, por contrato, lanza.
      const existe = partida.eventoActual?.opciones.some((o) => o.id === accion.opcionId);
      if (!existe || recursoQueFalta(partida, accion.opcionId)) return estado;
      const yaDesbloqueadas = new Set(partida.historiasDesbloqueadas);
      const siguiente = siguienteTurno(partida, accion.opcionId);
      const nuevas = siguiente.historiasDesbloqueadas.filter((id) => !yaDesbloqueadas.has(id));
      const cola = [...tarjetas, ...nuevas];
      if (siguiente.resultado && cola.length === 0) {
        return { fase: 'bitacora', partida: siguiente };
      }
      return {
        fase: 'juego',
        partida: siguiente,
        tarjetas: cola,
        avisoCampo: null,
        nodos3dCompletados: estado.nodos3dCompletados,
      };
    }

    case 'COMPLETAR_TAREA_3D': {
      if (estado.fase !== 'juego') return estado;
      const yaCompletado = estado.nodos3dCompletados.includes(accion.nodoId);
      if (yaCompletado) return estado;

      return {
        ...estado,
        partida: completarTareaExploracion(estado.partida, accion.tarea, accion.historiaId),
        avisoCampo: describirRecompensa(accion.tarea, accion.historiaId),
        // Inspeccionar un equipo NASA abre su historia encima del juego.
        tarjetas: accion.historiaId ? [accion.historiaId, ...estado.tarjetas] : estado.tarjetas,
        nodos3dCompletados: [...estado.nodos3dCompletados, accion.nodoId],
      };
    }

    case 'LIMPIAR_AVISO_CAMPO':
      return sinAviso(estado);

    case 'ABRIR_HISTORIA': {
      if (estado.fase !== 'juego') return estado;
      return { ...estado, tarjetas: [accion.historiaId, ...estado.tarjetas] };
    }

    case 'CERRAR_TARJETA': {
      if (estado.fase !== 'juego' || estado.tarjetas.length === 0) return estado;
      const [, ...resto] = estado.tarjetas;
      if (resto.length === 0 && estado.partida.resultado) {
        return { fase: 'bitacora', partida: estado.partida };
      }
      return { ...estado, tarjetas: resto };
    }

    case 'ABORTAR_MISION': {
      if (estado.fase !== 'juego') return estado;
      return {
        fase: 'bitacora',
        partida: {
          ...estado.partida,
          resultado: 'abortada',
          motivoFin: 'Decidiste abortar la misión antes de tiempo. Tu equipo regresa a salvo.',
        },
      };
    }

    case 'REPETIR': {
      if (estado.fase !== 'bitacora') return estado;
      const { partida } = estado;
      const nueva = iniciarMision(partida.config, partida.diseno.itemIds);
      return {
        fase: 'juego',
        partida: nueva,
        tarjetas: [...nueva.historiasDesbloqueadas],
        avisoCampo: null,
        nodos3dCompletados: [],
      };
    }

    case 'REINICIAR': {
      if (estado.fase === 'inicio') return estado;
      const semilla =
        estado.fase === 'diseno' ? estado.config.semilla : estado.partida.config.semilla;
      return crearEstadoInicial(semilla);
    }
  }
}
