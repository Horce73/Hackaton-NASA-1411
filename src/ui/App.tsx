import { Bitacora } from './bitacora/Bitacora';
import { useEstado } from './comun/EstadoContext';
import { Diseno } from './diseno/Diseno';
import { Inicio } from './inicio/Inicio';
import { Juego } from './juego/Juego';

export function App() {
  const { estado } = useEstado();
  if (estado.fase === 'inicio') return <Inicio />;
  if (estado.fase === 'diseno') return <Diseno config={estado.config} itemIds={estado.itemIds} />;
  if (estado.fase === 'juego') return <Juego partida={estado.partida} tarjetas={estado.tarjetas} />;
  return <Bitacora partida={estado.partida} />;
}
