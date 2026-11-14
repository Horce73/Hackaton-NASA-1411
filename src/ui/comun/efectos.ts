import type { Efectos, EfectosTurno, Recursos } from '../../engine/tipos';
import { numero } from './formato';

const ETIQUETAS: [keyof Omit<Efectos, 'saludBonus' | 'alertaRadiacion'>, (valor: number) => string][] = [
  ['energiaSolar', (v) => `+${v} energía solar al día`],
  ['energiaProduccion', (v) => `+${v} energía al día`],
  ['energiaConsumo', (v) => `-${v} energía al día`],
  ['alimentoProduccion', (v) => `+${v.toLocaleString('es')} kg de comida al día`],
  ['soporteVital', (v) => `Recicla el aire y el agua de ${v} astronautas`],
  ['blindaje', (v) => `Frena el ${Math.round(v * 100)} % de la radiación`],
  ['ciencia', (v) => `+${v} ciencia al día`],
  ['resistenciaPolvo', (v) => `Resiste el ${Math.round(v * 100)} % del polvo`],
];

// Lo que aporta un módulo o un equipo histórico, en frases cortas.
export function describirEfectos(efectos: Efectos): string[] {
  const lineas = ETIQUETAS.flatMap(([campo, texto]) => (efectos[campo] ? [texto(efectos[campo])] : []));
  if (efectos.saludBonus?.suenoEstres) lineas.push(`+${efectos.saludBonus.suenoEstres} descanso al día`);
  if (efectos.saludBonus?.musculoHueso) lineas.push(`+${efectos.saludBonus.musculoHueso} músculos y huesos al día`);
  if (efectos.alertaRadiacion) lineas.push('Avisa antes de que la radiación sea peligrosa');
  return lineas;
}

const NOMBRE_RECURSO: Record<keyof Recursos, string> = {
  energia: 'energía',
  alimento: 'comida',
  oxigeno: 'aire',
  agua: 'agua',
};
const NOMBRE_SALUD = { nutricion: 'nutrición', suenoEstres: 'descanso', musculoHueso: 'músculos' };

function conSigno(valor: number): string {
  return `${valor > 0 ? '+' : '-'}${numero(Math.abs(valor))}`;
}

// Línea de consecuencia de una opción del día (UX Brief: BotonDecision).
export function describirConsecuencia(efectos: EfectosTurno): string {
  const partes: string[] = [];
  for (const id of ['energia', 'alimento', 'oxigeno', 'agua'] as const) {
    const cambio = efectos.recursos?.[id];
    if (cambio) partes.push(`${conSigno(cambio)} de ${NOMBRE_RECURSO[id]}`);
  }
  for (const id of ['nutricion', 'suenoEstres', 'musculoHueso'] as const) {
    const cambio = efectos.salud?.[id];
    if (cambio) partes.push(`${conSigno(cambio)} ${NOMBRE_SALUD[id]}`);
  }
  if (efectos.ciencia) partes.push(`${conSigno(efectos.ciencia)} ciencia`);
  if (efectos.dosis) partes.push('más radiación por salir');
  if ((efectos.multiplicadorRadiacion ?? 1) > 2) partes.push('mucha más radiación');
  else if ((efectos.multiplicadorRadiacion ?? 1) > 1) partes.push('algo más de radiación');
  return partes.length ? partes.join(', ') : 'Sin cambios extra';
}
