import { useState, type FormEvent } from 'react';
import { PREAJUSTES, TURNOS_MAX, TURNOS_MIN } from '../../data/parametros';
import type { Configuracion, Destino } from '../../engine/tipos';
import { useEstado } from '../comun/EstadoContext';
import estilos from './Inicio.module.css';

const DESTINOS: { id: Destino; nombre: string; contexto: string }[] = [
  { id: 'luna', nombre: 'Luna', contexto: 'Gravedad 1/6: cuesta mantener los músculos.' },
  { id: 'marte', nombre: 'Marte', contexto: 'Gravedad 3/8 y tormentas de polvo que tapan el Sol.' },
];
const TRIPULACIONES = [2, 3, 4] as const;

// La semilla sale de ?seed= en la URL; si no hay, de la hora (TRD, sección 7).
function semillaInicial(): number {
  const deUrl = Number(new URLSearchParams(window.location.search).get('seed'));
  return Number.isInteger(deUrl) && deUrl > 0 ? deUrl : Date.now() % 2 ** 31;
}

export function Inicio() {
  const { dispatch } = useEstado();
  const [destino, setDestino] = useState<Destino>('luna');
  const [tripulantes, setTripulantes] = useState<Configuracion['tripulantes']>(2);
  const [turnos, setTurnos] = useState(TURNOS_MIN);

  function empezar(evento: FormEvent) {
    evento.preventDefault();
    dispatch({ tipo: 'INICIAR', config: { destino, tripulantes, turnos, semilla: semillaInicial() } });
  }

  return (
    <main className={estilos.pagina}>
      <header className={estilos.cabecera}>
        <h1>Misión Legado</h1>
        <p>Diseña una misión, cuida a tu equipo y descubre qué dejó la NASA en la Luna y en Marte.</p>
      </header>

      <form className={estilos.formulario} onSubmit={empezar}>
        <fieldset>
          <legend>Misiones preparadas</legend>
          <div className={estilos.preajustes}>
            {PREAJUSTES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={estilos.preajuste}
                aria-pressed={p.destino === destino && p.tripulantes === tripulantes && p.turnos === turnos}
                onClick={() => {
                  setDestino(p.destino);
                  setTripulantes(p.tripulantes);
                  setTurnos(p.turnos);
                }}
              >
                <strong>{p.nombre}</strong>
                <span>
                  {p.tripulantes} astronautas, {p.turnos} días
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>¿A dónde vas?</legend>
          <div className={estilos.destinos}>
            {DESTINOS.map((d) => (
              <label key={d.id} className={estilos.destino} data-destino={d.id}>
                <input
                  type="radio"
                  name="destino"
                  value={d.id}
                  checked={destino === d.id}
                  onChange={() => setDestino(d.id)}
                />
                <span className={estilos.astro} aria-hidden="true" />
                <span className={estilos.destinoTexto}>
                  <strong>{d.nombre}</strong>
                  <span>{d.contexto}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>¿Cuántos astronautas?</legend>
          <div className={estilos.tripulacion}>
            {TRIPULACIONES.map((n) => (
              <label key={n} className={estilos.numero}>
                <input
                  type="radio"
                  name="tripulantes"
                  value={n}
                  checked={tripulantes === n}
                  onChange={() => setTripulantes(n)}
                />
                <span>{n}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={estilos.duracion}>
          <label htmlFor="turnos">¿Cuántos días dura la misión?</label>
          <div className={estilos.deslizador}>
            <input
              id="turnos"
              type="range"
              min={TURNOS_MIN}
              max={TURNOS_MAX}
              step={1}
              value={turnos}
              onChange={(e) => setTurnos(Number(e.target.value))}
            />
            <output htmlFor="turnos">{turnos} días</output>
          </div>
        </div>

        <button type="submit" className={estilos.empezar}>
          Empezar
        </button>
      </form>
    </main>
  );
}
