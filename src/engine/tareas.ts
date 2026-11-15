// Tareas del día (RF-13 a RF-16, TRD 6.1). Puro: el reloj y el progreso viven en la interfaz y el 3D.

import { CATALOGO_POR_ID } from '../data/catalogo';
import { CARGA_PRIMER_DIA, CARGA_ULTIMO_DIA, RITMO_ESPECIALISTA } from '../data/parametros';
import type { Astronauta, Especialidad, Estado, Tarea } from './tipos';

// Multiplicador del trabajo de hoy: crece con la tripulación y de forma lineal del primer al último día.
export function cargaDelDia(estado: Pick<Estado, 'config' | 'turno'>): number {
  const { tripulantes, turnos } = estado.config;
  const avance = turnos > 1 ? (estado.turno - 1) / (turnos - 1) : 0;
  return (tripulantes / 2) * (CARGA_PRIMER_DIA + (CARGA_ULTIMO_DIA - CARGA_PRIMER_DIA) * avance);
}

// Lo que hay que hacer hoy tras elegir `opcionId`: las tareas de la opción y el mantenimiento de cada módulo.
export function tareasDelDia(estado: Estado, opcionId: string): Tarea[] {
  const { itemIds } = estado.diseno;
  const opcion = estado.eventoActual?.opciones.find((o) => o.id === opcionId);
  const carga = cargaDelDia(estado);

  const deOpcion: Tarea[] = (opcion?.tareas ?? []).map((t, i) => {
    const esModulo = t.estacion !== 'habitat' && t.estacion !== 'exterior';
    const indice = esModulo ? itemIds.indexOf(t.estacion) : -1;
    return {
      ...t,
      id: `d${estado.turno}-evento-${i}`,
      tipo: 'evento',
      estacion: !esModulo ? t.estacion : indice >= 0 ? `item:${indice}` : 'habitat',
      trabajo: Math.round(t.trabajo * carga),
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
        trabajo: Math.round(item.mantenimiento.trabajo * carga),
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

// Segundos de trabajo por segundo que avanza una tarea con quienes trabajan en ella a la vez (RF-15).
// Una tarea de N personas no avanza con menos de N; con N o más, avanza a la media de sus ritmos,
// así dos no especialistas tardan `trabajo` segundos y un especialista en el equipo lo acelera.
export function ritmoEquipo(especialidades: Especialidad[], tarea: Pick<Tarea, 'especialidad' | 'personas'>): number {
  const personas = tarea.personas ?? 1;
  if (especialidades.length < personas) return 0;
  const suma = especialidades.reduce((total, especialidad) => total + ritmoTrabajo({ especialidad }, tarea), 0);
  return suma / personas;
}

// Índices de itemIds cuyos módulos se quedan sin mantenimiento.
export function modulosParados(pendientes: Tarea[]): Set<number> {
  return new Set(
    pendientes.filter((t) => t.tipo === 'mantenimiento').map((t) => Number(t.estacion.slice('item:'.length))),
  );
}
