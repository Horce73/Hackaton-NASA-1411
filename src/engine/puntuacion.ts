import { PUNTOS_POR_HISTORIA } from '../data/parametros';
import type { Astronauta, Estado } from './tipos';

export interface DesglosePuntuacion {
  ciencia: number;
  saludMedia: number; // redondeada: el total es la suma exacta de las tres partes
  historiasBonus: number;
  total: number;
}

// Media de los indicadores de la tripulación (0..100). La usan la bitácora y la gráfica.
export function saludMedia(tripulacion: Astronauta[]): number {
  const indicadores = tripulacion.flatMap((a) => Object.values(a.salud));
  if (indicadores.length === 0) return 0;
  return indicadores.reduce((suma, valor) => suma + valor, 0) / indicadores.length;
}

// TRD 6.4: ciencia + salud media final + puntos por historia desbloqueada.
// La bitácora muestra el desglose; `puntuar` sigue devolviendo solo el total.
export function desglosePuntuacion(estado: Estado): DesglosePuntuacion {
  const media = Math.round(saludMedia(estado.tripulacion));
  const historiasBonus = PUNTOS_POR_HISTORIA * estado.historiasDesbloqueadas.length;
  return {
    ciencia: estado.ciencia,
    saludMedia: media,
    historiasBonus,
    total: estado.ciencia + media + historiasBonus,
  };
}

export function puntuar(estado: Estado): number {
  return desglosePuntuacion(estado).total;
}
