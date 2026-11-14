import { CATALOGO } from '../data/catalogo';
import { PRESUPUESTO, TURNOS_MAX, TURNOS_MIN } from '../data/parametros';
import type { Configuracion, Item, ResultadoDiseno } from './tipos';

// Lanza un error si el id no existe: quien la llama ya validó el diseño.
export function itemsDe(itemIds: string[]): Item[] {
  return itemIds.map((id) => {
    const item = CATALOGO.find((i) => i.id === id);
    if (!item) throw new Error(`Ítem desconocido: ${id}`);
    return item;
  });
}

export function validarDiseno(config: Configuracion, itemIds: string[]): ResultadoDiseno {
  const errores: string[] = [];
  let presupuestoUsado = 0;

  if (!Number.isInteger(config.turnos) || config.turnos < TURNOS_MIN || config.turnos > TURNOS_MAX) {
    errores.push(`La duración debe estar entre ${TURNOS_MIN} y ${TURNOS_MAX} turnos.`);
  }

  const vistos = new Set<string>();
  for (const id of itemIds) {
    const item = CATALOGO.find((i) => i.id === id);
    if (!item) {
      errores.push(`El elemento "${id}" no existe en el catálogo.`);
      continue;
    }
    presupuestoUsado += item.coste;
    if (!item.destinos.includes(config.destino)) {
      errores.push(`${item.nombre} no se puede llevar a este destino.`);
    }
    if (item.tipo === 'historico' && vistos.has(id)) {
      errores.push(`${item.nombre} solo se puede llevar una vez.`);
    }
    vistos.add(id);
  }

  if (presupuestoUsado > PRESUPUESTO) {
    errores.push(`El diseño cuesta ${presupuestoUsado} puntos y el presupuesto es de ${PRESUPUESTO}.`);
  }

  return { valido: errores.length === 0, presupuestoUsado, errores };
}

export function presupuestoRestante(itemIds: string[]): number {
  return PRESUPUESTO - itemsDe(itemIds).reduce((suma, item) => suma + item.coste, 0);
}
