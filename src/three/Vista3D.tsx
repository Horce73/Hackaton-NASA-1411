import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Destino } from '../engine/tipos';
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
}

interface Vista3DProps {
  destino: Destino;
  itemIds: string[];
  modo: ModoCamara3D;
  eventoActualId: string | null;
  turno: number;
  onTelemetria: (estado: EstadoTelemetria3D) => void;
  onAccionCompletada: (accion: EventoAccion3D) => void;
}

export const Vista3D = forwardRef<Vista3DRef, Vista3DProps>(function Vista3D(
  { destino, itemIds, modo, eventoActualId, turno, onTelemetria, onAccionCompletada },
  ref,
) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const escenaRef = useRef<EscenaPlaneta | null>(null);

  const onTelemetriaRef = useRef(onTelemetria);
  const onAccionRef = useRef(onAccionCompletada);
  onTelemetriaRef.current = onTelemetria;
  onAccionRef.current = onAccionCompletada;

  useImperativeHandle(
    ref,
    () => ({
      ejecutarAccionCercana: () => escenaRef.current?.ejecutarAccionCercana() ?? false,
      setEntradaTactil: (entrada) => escenaRef.current?.setEntradaTactil(entrada),
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
    });
    escenaRef.current = escena;

    return () => {
      escena.dispose();
      escenaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div
      ref={contenedorRef}
      className="fixed inset-0 z-0 select-none overflow-hidden bg-[#060914]"
      aria-label="Mundo espacial 3D en tercera persona"
    />
  );
});
