import { useEstado } from './comun/EstadoContext';
import { Diseno } from './diseno/Diseno';
import { Inicio } from './inicio/Inicio';
import { JuegoProvisional } from './juego/JuegoProvisional';

export function App() {
  const { estado } = useEstado();
  if (estado.fase === 'inicio') return <Inicio />;
  if (estado.fase === 'diseno') return <Diseno config={estado.config} itemIds={estado.itemIds} />;
  return <JuegoProvisional partida={estado.partida} />;
}
