import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Destino, Especialidad, Tarea } from '../engine/tipos';
import {
  EscenaPlaneta,
  type EntradaTactil3D,
  type EstadoTelemetria3D,
  type EventoAccion3D,
  type ModoCamara3D,
} from './EscenaPlaneta';

export interface Vista3DRef {
  ejecutarAccionCercana: () => boolean;
  setEntradaTactil: (entrada: Partial<EntradaTactil3D>) => void;
  seleccionar: (indice: number) => void;
}

interface Vista3DProps {
  destino: Destino;
  itemIds: string[];
  modo: ModoCamara3D;
  eventoActualId: string | null;
  turno: number;
  especialidades: Especialidad[]; // una por tripulante (RF-13, RF-14)
  tareas: Tarea[];
  tareasHechas: string[];
  trabajoActivo: boolean;
  enfoque: string | null; // historia en primer plano (RF-17)
  onTelemetria: (estado: EstadoTelemetria3D) => void;
  onAccionCompletada: (accion: EventoAccion3D) => void;
  onTareaCompletada: (tareaId: string) => void;
}

export const Vista3D = forwardRef<Vista3DRef, Vista3DProps>(function Vista3D(
  {
    destino,
    itemIds,
    modo,
    eventoActualId,
    turno,
    especialidades,
    tareas,
    tareasHechas,
    trabajoActivo,
    enfoque,
    onTelemetria,
    onAccionCompletada,
    onTareaCompletada,
  },
  ref,
) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const escenaRef = useRef<EscenaPlaneta | null>(null);

  const onTelemetriaRef = useRef(onTelemetria);
  const onAccionRef = useRef(onAccionCompletada);
  const onTareaRef = useRef(onTareaCompletada);
  onTelemetriaRef.current = onTelemetria;
  onAccionRef.current = onAccionCompletada;
  onTareaRef.current = onTareaCompletada;

  useImperativeHandle(
    ref,
    () => ({
      ejecutarAccionCercana: () => escenaRef.current?.ejecutarAccionCercana() ?? false,
      setEntradaTactil: (entrada) => escenaRef.current?.setEntradaTactil(entrada),
      seleccionar: (indice) => escenaRef.current?.seleccionar(indice),
    }),
    [],
  );

  // Montar un único renderer WebGL persistente
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;

    const escena = new EscenaPlaneta({
      contenedor: el,
      destinoInicial: destino,
      itemsIniciales: itemIds,
      onTelemetria: (t) => onTelemetriaRef.current(t),
      onAccionCompletada: (a) => onAccionRef.current(a),
      onTareaCompletada: (id) => onTareaRef.current(id),
    });
    escenaRef.current = escena;

    return () => {
      escena.dispose();
      escenaRef.current = null;
    };
  }, []);

  useEffect(() => {
    escenaRef.current?.setDestino(destino);
  }, [destino]);

  useEffect(() => {
    escenaRef.current?.setMisionItems(itemIds);
  }, [itemIds]);

  useEffect(() => {
    escenaRef.current?.setModo(modo);
  }, [modo]);

  useEffect(() => {
    escenaRef.current?.setEventoYTurno(eventoActualId, turno);
  }, [eventoActualId, turno]);

  useEffect(() => {
    escenaRef.current?.setTripulacion(especialidades);
  }, [especialidades]);

  useEffect(() => {
    escenaRef.current?.setTareas(tareas, tareasHechas, trabajoActivo);
  }, [tareas, tareasHechas, trabajoActivo]);

  useEffect(() => {
    escenaRef.current?.enfocarHistoria(enfoque);
  }, [enfoque]);

  return (
    <div
      ref={contenedorRef}
      className="fixed inset-0 z-0 select-none overflow-hidden bg-[#060914]"
      aria-label="Mundo espacial 3D en tercera persona"
    />
  );
});
