import { LIMITE_DOSIS } from '../../data/parametros';
import type { Astronauta, Recursos } from '../../engine/tipos';
import type { NombreIcono } from './Icono';

export const RECURSOS: { id: keyof Recursos; nombre: string; unidad: string; icono: NombreIcono }[] = [
  { id: 'energia', nombre: 'Energía', unidad: '', icono: 'energia' },
  { id: 'alimento', nombre: 'Comida', unidad: 'kg', icono: 'alimento' },
  { id: 'oxigeno', nombre: 'Aire', unidad: 'kg', icono: 'oxigeno' },
  { id: 'agua', nombre: 'Agua', unidad: 'L', icono: 'agua' },
];

// Un decimal como mucho, con coma: 12,5
export function numero(valor: number): string {
  return (Math.round(valor * 10) / 10).toLocaleString('es');
}

// Dosis media de la tripulación como porcentaje del límite de la misión (más alto es peor).
export function porcentajeDosis(tripulacion: Astronauta[]): number {
  const media = tripulacion.reduce((suma, a) => suma + a.dosis, 0) / tripulacion.length;
  return Math.min(100, Math.round((media / LIMITE_DOSIS) * 100));
}
