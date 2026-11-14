import { HISTORIAS } from '../../data/historias';
import { puntuar } from '../../engine/puntuacion';
import type { Estado } from '../../engine/tipos';
import { useEstado } from '../comun/EstadoContext';
import { Icono } from '../comun/Icono';
import { Tripulacion } from '../salud/Tripulacion';
import estilos from './Bitacora.module.css';

export function Bitacora({ partida }: { partida: Estado }) {
  const { dispatch } = useEstado();
  const exito = partida.resultado === 'exito';
  const historias = HISTORIAS.filter((h) => partida.historiasDesbloqueadas.includes(h.id));

  return (
    <main className={estilos.pagina}>
      <header>
        <h1>{exito ? 'Misión cumplida' : 'La misión se aborta'}</h1>
        <p className={estilos.resumen}>
          {exito
            ? `Tu equipo completó los ${partida.config.turnos} días.`
            : `Tu equipo vuelve a casa a salvo en el día ${partida.turno} de ${partida.config.turnos}.`}
        </p>
      </header>

      <p className={estilos.puntuacion}>
        <strong>{puntuar(partida)}</strong> puntos
        <span>
          {partida.ciencia} de ciencia, {historias.length} {historias.length === 1 ? 'historia' : 'historias'} y la
          salud de tu equipo
        </span>
      </p>

      <section aria-labelledby="t-salud">
        <h2 id="t-salud">Salud final</h2>
        <div className={estilos.panel}>
          <Tripulacion tripulacion={partida.tripulacion} />
        </div>
      </section>

      <section aria-labelledby="t-historias">
        <h2 id="t-historias">Historias desbloqueadas</h2>
        {historias.length === 0 ? (
          <p className={estilos.vacio}>
            Esta vez no llevaste equipo real de la NASA. Añade alguno en tu próxima misión para descubrir su historia.
          </p>
        ) : (
          <ul className={estilos.historias}>
            {historias.map((h) => (
              <li key={h.id}>
                <h3>
                  <Icono nombre="estrella" /> {h.nombre}
                </h3>
                <p>
                  {h.lugar}, {h.anio}.{' '}
                  <a href={h.fuente} target="_blank" rel="noreferrer">
                    Fuente: NASA<span className="solo-lectores"> (se abre en otra pestaña)</span>
                  </a>
                </p>
                {/* TODO fase 5: tarjeta de historia con texto revisado e imagen (RF-08). */}
                <p className={estilos.pendiente}>La tarjeta con su historia está en preparación.</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={estilos.acciones}>
        <button type="button" className={estilos.principal} onClick={() => dispatch({ tipo: 'REPETIR' })}>
          Repetir esta misión
        </button>
        <button type="button" className={estilos.secundario} onClick={() => dispatch({ tipo: 'REINICIAR' })}>
          Diseñar otra misión
        </button>
      </div>
    </main>
  );
}
