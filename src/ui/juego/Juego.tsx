import { reservasIniciales } from '../../engine/diseno';
import { recursoQueFalta } from '../../engine/turno';
import type { EfectosTurno, Estado, Recursos } from '../../engine/tipos';
import { useEstado } from '../comun/EstadoContext';
import { numero, porcentajeDosis, RECURSOS } from '../comun/formato';
import { Icono } from '../comun/Icono';
import { Alertas } from '../salud/Alertas';
import { Tendencias } from '../salud/Tendencias';
import { Tripulacion } from '../salud/Tripulacion';
import estilos from './Juego.module.css';

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

// Línea de consecuencia de una opción (UX Brief: BotonDecision).
function consecuencia(efectos: EfectosTurno): string {
  const partes: string[] = [];
  for (const { id, unidad } of RECURSOS) {
    const cambio = efectos.recursos?.[id];
    if (cambio) partes.push(`${conSigno(cambio)}${unidad ? ` ${unidad}` : ''} de ${NOMBRE_RECURSO[id]}`);
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

export function Juego({ partida }: { partida: Estado }) {
  const { dispatch } = useEstado();
  const evento = partida.eventoActual;
  // Cambio que dejó el último turno: se compara con el final del turno anterior (o con el inicio).
  const jugados = partida.historial.length;
  const antes = partida.historial[jugados - 2];
  const recursosAntes = antes?.recursos ?? reservasIniciales(partida.config);
  const dosis = porcentajeDosis(partida.tripulacion);
  const dosisAntes = antes ? porcentajeDosis(antes.tripulacion) : 0;

  return (
    <main className={estilos.pagina}>
      <header className={estilos.barra}>
        <h1>
          Día {partida.turno} <span>de {partida.config.turnos}</span>
        </h1>
        <ul className={estilos.recursos} aria-label="Recursos de la base">
          {RECURSOS.map(({ id, nombre, unidad, icono }) => {
            const cambio = jugados > 0 ? partida.recursos[id] - recursosAntes[id] : 0;
            return (
              <li key={id}>
                <Icono nombre={icono} />
                <span className={estilos.recursoNombre}>{nombre}</span>
                <strong>
                  {numero(partida.recursos[id])}
                  {unidad && <small> {unidad}</small>}
                </strong>
                {Math.abs(cambio) >= 0.05 && (
                  <span className={estilos.cambio} data-baja={cambio < 0}>
                    {conSigno(cambio)}
                    <span className="solo-lectores"> desde ayer</span>
                  </span>
                )}
              </li>
            );
          })}
          <li>
            <Icono nombre="radiacion" />
            <span className={estilos.recursoNombre}>Radiación</span>
            <strong>
              {dosis}
              <small> % del límite</small>
            </strong>
            {jugados > 0 && dosis !== dosisAntes && (
              <span className={estilos.cambio} data-baja="true">
                +{dosis - dosisAntes}
                <span className="solo-lectores"> desde ayer</span>
              </span>
            )}
          </li>
        </ul>
      </header>

      <div className={estilos.columnas}>
        {evento && (
          <section className={estilos.evento} aria-live="polite" aria-labelledby="t-evento">
            <h2 id="t-evento">{evento.titulo}</h2>
            <p className={estilos.eventoTexto}>{evento.texto}</p>
            <ul className={estilos.opciones}>
              {evento.opciones.map((opcion) => {
                const falta = recursoQueFalta(partida, opcion.id);
                return (
                  <li key={opcion.id}>
                    <button
                      type="button"
                      className={estilos.opcion}
                      disabled={Boolean(falta)}
                      onClick={() => dispatch({ tipo: 'ELEGIR_OPCION', opcionId: opcion.id })}
                    >
                      <strong>{opcion.texto}</strong>
                      <span>{consecuencia(opcion.efectos)}</span>
                    </button>
                    {falta && <p className={estilos.motivo}>No tienes suficiente {NOMBRE_RECURSO[falta]} para esto.</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className={estilos.tripulacion} aria-labelledby="t-tripulacion">
          <h2 id="t-tripulacion">Tripulación</h2>
          <Alertas partida={partida} />
          <Tripulacion tripulacion={partida.tripulacion} />
          <p className={estilos.ciencia}>
            Ciencia: <strong>{partida.ciencia}</strong> puntos
          </p>
          <details className={estilos.tendencia}>
            <summary>Ver tendencia</summary>
            <Tendencias partida={partida} />
          </details>
        </section>
      </div>
    </main>
  );
}
