import { semaforo } from '../../engine/salud';
import type { Astronauta, Indicador } from '../../engine/tipos';
import estilos from './Tripulacion.module.css';

export const INDICADORES: { id: Indicador; nombre: string }[] = [
  { id: 'radiacion', nombre: 'Radiación' },
  { id: 'nutricion', nombre: 'Nutrición' },
  { id: 'suenoEstres', nombre: 'Descanso' },
  { id: 'musculoHueso', nombre: 'Músculos' },
];
const ESTADO = { verde: 'bien', ambar: 'atención', rojo: 'peligro' };
// Forma distinta por estado, además del color (UX Brief, sección 8): ● ▲ ■
const FORMA = {
  verde: <circle cx="8" cy="8" r="6" />,
  ambar: <path d="M8 2l6.5 12h-13z" />,
  rojo: <rect x="2.5" y="2.5" width="11" height="11" />,
};

// Panel de salud por astronauta (RF-05): icono, número, barra y estado en texto.
export function Tripulacion({ tripulacion }: { tripulacion: Astronauta[] }) {
  return (
    <ul className={estilos.lista}>
      {tripulacion.map((astronauta) => (
        <li key={astronauta.id} className={estilos.astronauta}>
          <h3>{astronauta.nombre}</h3>
          <dl>
            {INDICADORES.map(({ id, nombre }) => {
              const valor = Math.round(astronauta.salud[id]);
              const estado = semaforo(valor);
              return (
                <div key={id} className={estilos.indicador} data-estado={estado}>
                  <dt>{nombre}</dt>
                  <dd>
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
                      {FORMA[estado]}
                    </svg>
                    {valor}
                    <span className="solo-lectores">, {ESTADO[estado]}</span>
                  </dd>
                  <span className={estilos.barra} aria-hidden="true">
                    <span style={{ width: `${valor}%` }} />
                  </span>
                </div>
              );
            })}
          </dl>
        </li>
      ))}
    </ul>
  );
}
