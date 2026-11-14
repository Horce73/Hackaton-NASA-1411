import { PUNTOS_POR_HISTORIA } from '../data/parametros';
import type { Estado } from './tipos';

// TRD 6.4: ciencia + salud media final + puntos por historia desbloqueada.
export function puntuar(estado: Estado): number {
  const indicadores = estado.tripulacion.flatMap((a) => Object.values(a.salud));
  const saludMedia = indicadores.reduce((suma, valor) => suma + valor, 0) / indicadores.length;
  return (
    estado.ciencia + Math.round(saludMedia) + PUNTOS_POR_HISTORIA * estado.historiasDesbloqueadas.length
  );
}
