import { reservasIniciales } from '../../engine/diseno';
import type { Astronauta, Estado } from '../../engine/tipos';
import { numero, RECURSOS } from '../comun/formato';
import { Sparkline } from '../comun/Sparkline';
import estilos from './Tendencias.module.css';

function saludMedia(tripulacion: Astronauta[]): number {
  const valores = tripulacion.flatMap((a) => Object.values(a.salud));
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

// Tendencia de salud y recursos día a día (RF-06).
export function Tendencias({ partida }: { partida: Estado }) {
  if (partida.historial.length === 0) {
    return <p className={estilos.vacio}>La tendencia aparece al terminar el primer día.</p>;
  }
  const inicio = reservasIniciales(partida.config);
  const salud = [100, ...partida.historial.map((h) => saludMedia(h.tripulacion))];
  return (
    <div className={estilos.lista}>
      <Sparkline
        titulo="Salud media del equipo"
        valores={salud}
        min={0}
        max={100}
        resumen={`de ${Math.round(salud[0])} a ${Math.round(salud[salud.length - 1])}`}
      />
      {RECURSOS.map(({ id, nombre, unidad }) => {
        const valores = [inicio[id], ...partida.historial.map((h) => h.recursos[id])];
        const fin = valores[valores.length - 1];
        return (
          <Sparkline
            key={id}
            titulo={nombre}
            valores={valores}
            min={0}
            resumen={`de ${numero(valores[0])} a ${numero(fin)}${unidad ? ` ${unidad}` : ''}`}
          />
        );
      })}
    </div>
  );
}
