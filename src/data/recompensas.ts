// Recompensas de las acciones de campo en la exploración 3D (RF-09).
// Vive en data/ para que el reducer, la escena y los textos muestren los mismos números.

import type { Recursos } from '../engine/tipos';
import { EVENTO_SURVEYOR } from './eventos';

export type TareaExploracion = 'averia' | 'historia';

export interface Recompensa {
  recursos: Partial<Recursos>;
  ciencia: number;
  etiqueta: string;
}

export const RECOMPENSAS: Record<TareaExploracion, Recompensa> = {
  averia: { recursos: { energia: 6 }, ciencia: 4, etiqueta: 'Calibración exterior completada' },
  historia: { recursos: {}, ciencia: 3, etiqueta: 'Inspección de campo NASA' },
};

// La Surveyor 3 es el hallazgo estrella de la Luna: paga más ciencia.
export const CIENCIA_EXTRA_SURVEYOR = 5;

const NOMBRES_RECURSO: Record<keyof Recursos, string> = {
  energia: 'Energía',
  alimento: 'Alimento',
  oxigeno: 'Oxígeno',
  agua: 'Agua',
};

export function cienciaDeRecompensa(tipo: TareaExploracion, historiaId?: string): number {
  const base = RECOMPENSAS[tipo].ciencia;
  return tipo === 'historia' && historiaId === EVENTO_SURVEYOR ? base + CIENCIA_EXTRA_SURVEYOR : base;
}

// Texto corto con la ganancia, por ejemplo: "+6 Agua · +4 Oxígeno · +4 Ciencia".
export function describirRecompensa(tipo: TareaExploracion, historiaId?: string): string {
  const { recursos } = RECOMPENSAS[tipo];
  const partes = (Object.keys(recursos) as (keyof Recursos)[]).map(
    (recurso) => `+${recursos[recurso]} ${NOMBRES_RECURSO[recurso]}`,
  );
  partes.push(`+${cienciaDeRecompensa(tipo, historiaId)} Ciencia`);
  return partes.join(' · ');
}
