import { LIMITE_DOSIS } from '../../data/parametros';
import type { Astronauta } from '../../engine/tipos';

// Un decimal como mucho, con coma: 12,5
export function numero(valor: number): string {
  return (Math.round(valor * 10) / 10).toLocaleString('es');
}

// Dosis media de la tripulación como porcentaje del límite de la misión (más alto es peor).
export function porcentajeDosis(tripulacion: Astronauta[]): number {
  if (tripulacion.length === 0) return 0;
  const media = tripulacion.reduce((suma, a) => suma + a.dosis, 0) / tripulacion.length;
  return Math.min(100, Math.round((media / LIMITE_DOSIS) * 100));
}
