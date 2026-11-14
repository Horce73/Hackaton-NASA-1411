import type { Efectos, Item } from '../../engine/tipos';
import { Icono } from './Icono';
import estilos from './ItemCatalogo.module.css';

const ETIQUETAS: [keyof Omit<Efectos, 'saludBonus'>, (valor: number) => string][] = [
  ['energiaSolar', (v) => `+${v} energía solar al día`],
  ['energiaProduccion', (v) => `+${v} energía al día`],
  ['energiaConsumo', (v) => `-${v} energía al día`],
  ['alimentoProduccion', (v) => `+${v.toLocaleString('es')} kg de comida al día`],
  ['soporteVital', (v) => `Recicla el aire y el agua de ${v} astronautas`],
  ['blindaje', (v) => `Frena el ${Math.round(v * 100)} % de la radiación`],
  ['ciencia', (v) => `+${v} ciencia al día`],
  ['resistenciaPolvo', (v) => `Resiste el ${Math.round(v * 100)} % del polvo`],
];

function describir(efectos: Efectos): string[] {
  const lineas = ETIQUETAS.flatMap(([campo, texto]) => (efectos[campo] ? [texto(efectos[campo])] : []));
  if (efectos.saludBonus?.suenoEstres) lineas.push(`+${efectos.saludBonus.suenoEstres} descanso al día`);
  if (efectos.saludBonus?.musculoHueso) lineas.push(`+${efectos.saludBonus.musculoHueso} músculos y huesos al día`);
  return lineas;
}

interface Props {
  item: Item;
  motivoBloqueo?: string; // si existe, no se puede añadir y se explica por qué
  onAnadir: () => void;
}

export function ItemCatalogo({ item, motivoBloqueo, onAnadir }: Props) {
  return (
    <li className={estilos.item} data-bloqueado={motivoBloqueo ? '' : undefined}>
      <div className={estilos.cabecera}>
        <h3 className={estilos.nombre}>{item.nombre}</h3>
        <p className={estilos.coste}>
          {item.coste} <span>puntos</span>
        </p>
      </div>
      {item.tipo === 'historico' && (
        <p className={estilos.real}>
          <Icono nombre="estrella" /> Equipo real de la NASA
        </p>
      )}
      <ul className={estilos.efectos}>
        {describir(item.efectos).map((linea) => (
          <li key={linea}>{linea}</li>
        ))}
      </ul>
      <button type="button" className={estilos.anadir} disabled={Boolean(motivoBloqueo)} onClick={onAnadir}>
        <Icono nombre="mas" /> Añadir<span className="solo-lectores"> {item.nombre}</span>
      </button>
      {motivoBloqueo && <p className={estilos.motivo}>{motivoBloqueo}</p>}
    </li>
  );
}
