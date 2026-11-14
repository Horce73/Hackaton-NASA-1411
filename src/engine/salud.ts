import {
  DESGASTE_SUENO,
  LIMITE_DOSIS,
  PENALIZACION_SOPORTE_VITAL,
  PERDIDA_MUSCULO,
  PERDIDA_NUTRICION,
  RECUPERACION_NUTRICION,
  UMBRAL_AMBAR,
  UMBRAL_VERDE,
} from '../data/parametros';
import type { Astronauta, Destino, Indicador } from './tipos';

export interface ContextoSalud {
  destino: Destino;
  coberturaAlimento: number; // 0..1, parte del alimento del turno que se cubrió
  coberturaSoporteVital: number; // 0..1, la peor entre oxígeno y agua
  bonus: Partial<Record<Indicador, number>>; // suma de saludBonus de los ítems
}

export function limitar(valor: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, valor));
}

// Salud de un astronauta al final del turno (TRD 6.3). No modifica el de entrada.
export function actualizarSalud(astronauta: Astronauta, contexto: ContextoSalud): Astronauta {
  const { salud, dosis } = astronauta;
  const faltaAlimento = 1 - contexto.coberturaAlimento;
  const sinSoporteVital = PENALIZACION_SOPORTE_VITAL * (1 - contexto.coberturaSoporteVital);

  const cambioNutricion =
    faltaAlimento > 0 ? -PERDIDA_NUTRICION * faltaAlimento : RECUPERACION_NUTRICION;

  return {
    ...astronauta,
    salud: {
      radiacion: limitar(100 * (1 - dosis / LIMITE_DOSIS)),
      nutricion: limitar(
        salud.nutricion + cambioNutricion + (contexto.bonus.nutricion ?? 0) - sinSoporteVital,
      ),
      suenoEstres: limitar(
        salud.suenoEstres - DESGASTE_SUENO + (contexto.bonus.suenoEstres ?? 0) - sinSoporteVital,
      ),
      musculoHueso: limitar(
        salud.musculoHueso -
          PERDIDA_MUSCULO[contexto.destino] +
          (contexto.bonus.musculoHueso ?? 0) -
          sinSoporteVital,
      ),
    },
  };
}

export function semaforo(valor: number): 'verde' | 'ambar' | 'rojo' {
  if (valor >= UMBRAL_VERDE) return 'verde';
  return valor >= UMBRAL_AMBAR ? 'ambar' : 'rojo';
}
