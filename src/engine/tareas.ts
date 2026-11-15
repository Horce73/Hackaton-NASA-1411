// Tareas del día (RF-13 a RF-16, TRD 6.1). Puro: el reloj y el progreso viven en la interfaz y el 3D.

import { CATALOGO_POR_ID } from '../data/catalogo';
import { RITMO_ESPECIALISTA } from '../data/parametros';
import type { Astronauta, Estado, Tarea } from './tipos';

// Lo que hay que hacer hoy tras elegir `opcionId`: las tareas de la opción y el mantenimiento de cada módulo.
export function tareasDelDia(estado: Estado, opcionId: string): Tarea[] {
  const { itemIds } = estado.diseno;
  const opcion = estado.eventoActual?.opciones.find((o) => o.id === opcionId);

  const deOpcion: Tarea[] = (opcion?.tareas ?? []).map((t, i) => {
    const esModulo = t.estacion !== 'habitat' && t.estacion !== 'exterior';
    const indice = esModulo ? itemIds.indexOf(t.estacion) : -1;
    return {
      ...t,
      id: `d${estado.turno}-evento-${i}`,
      tipo: 'evento',
      estacion: !esModulo ? t.estacion : indice >= 0 ? `item:${indice}` : 'habitat',
    };
  });

  const mantenimiento: Tarea[] = itemIds.flatMap((id, i) => {
    const item = CATALOGO_POR_ID[id];
    if (!item?.mantenimiento) return [];
    return [
      {
        id: `d${estado.turno}-mant-${i}`,
        tipo: 'mantenimiento' as const,
        estacion: `item:${i}`,
        especialidad: item.mantenimiento.especialidad,
        trabajo: item.mantenimiento.trabajo,
        etiqueta: `Revisar ${item.nombre.toLowerCase()}`,
      },
    ];
  });

  return [...deOpcion, ...mantenimiento];
}

// Segundos de trabajo que avanza un astronauta por segundo en una tarea (RF-14).
export function ritmoTrabajo(astronauta: Pick<Astronauta, 'especialidad'>, tarea: Pick<Tarea, 'especialidad'>): number {
  return astronauta.especialidad === tarea.especialidad ? RITMO_ESPECIALISTA : 1;
}

// Índices de itemIds cuyos módulos se quedan sin mantenimiento.
export function modulosParados(pendientes: Tarea[]): Set<number> {
  return new Set(
    pendientes.filter((t) => t.tipo === 'mantenimiento').map((t) => Number(t.estacion.slice('item:'.length))),
  );
}
