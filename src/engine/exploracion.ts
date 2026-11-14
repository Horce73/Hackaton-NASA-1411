// Recompensas de la exploración 3D aplicadas al estado de la misión.
// Puro: no modifica el estado que recibe ni avanza el turno.

import { CAPACIDAD_ENERGIA } from '../data/parametros';
import { cienciaDeRecompensa, RECOMPENSAS } from '../data/recompensas';
import type { TareaExploracion } from '../data/recompensas';
import type { Estado, Recursos } from './tipos';

function acotarRecursos(recursos: Recursos, suma: Partial<Recursos>): Recursos {
  return {
    energia: Math.min(CAPACIDAD_ENERGIA, Math.max(0, recursos.energia + (suma.energia ?? 0))),
    alimento: Math.max(0, recursos.alimento + (suma.alimento ?? 0)),
    oxigeno: Math.max(0, recursos.oxigeno + (suma.oxigeno ?? 0)),
    agua: Math.max(0, recursos.agua + (suma.agua ?? 0)),
  };
}

export function completarTareaExploracion(
  estado: Estado,
  tipo: TareaExploracion,
  historiaId?: string,
): Estado {
  if (estado.resultado) return estado;

  const historiasDesbloqueadas =
    historiaId && !estado.historiasDesbloqueadas.includes(historiaId)
      ? [...estado.historiasDesbloqueadas, historiaId]
      : estado.historiasDesbloqueadas;

  return {
    ...estado,
    recursos: acotarRecursos(estado.recursos, RECOMPENSAS[tipo].recursos),
    ciencia: estado.ciencia + cienciaDeRecompensa(tipo, historiaId),
    historiasDesbloqueadas,
  };
}
