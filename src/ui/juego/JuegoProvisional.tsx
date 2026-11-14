import type { Estado } from '../../engine/tipos';
import { useEstado } from '../comun/EstadoContext';
import estilos from './JuegoProvisional.module.css';

// TODO fase 3: sustituir por la pantalla de turnos (RF-03, RF-04). Hoy solo confirma el lanzamiento.
export function JuegoProvisional({ partida }: { partida: Estado }) {
  const { dispatch } = useEstado();
  return (
    <main className={estilos.pagina}>
      <h1>Misión lanzada</h1>
      <p>
        Tu equipo de {partida.config.tripulantes} astronautas ya está en camino con {partida.diseno.itemIds.length}{' '}
        elementos a bordo.
      </p>
      <p className={estilos.pendiente}>
        Todavía no se puede jugar la misión día a día. Esa parte del juego está en construcción.
      </p>
      <button type="button" className={estilos.volver} onClick={() => dispatch({ tipo: 'REINICIAR' })}>
        Diseñar otra misión
      </button>
    </main>
  );
}
