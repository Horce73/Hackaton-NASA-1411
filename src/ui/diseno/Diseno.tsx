import { useState } from 'react';
import { AVISOS } from '../../data/avisos';
import { CATALOGO } from '../../data/catalogo';
import { PRESUPUESTO } from '../../data/parametros';
import { avisosDiseno, itemsDe, presupuestoRestante, validarDiseno } from '../../engine/diseno';
import type { Configuracion, Item } from '../../engine/tipos';
import { useEstado } from '../comun/EstadoContext';
import { Icono } from '../comun/Icono';
import { ItemCatalogo } from '../comun/ItemCatalogo';
import estilos from './Diseno.module.css';

const NOMBRE_DESTINO = { luna: 'Luna', marte: 'Marte' };

function motivoBloqueo(config: Configuracion, itemIds: string[], item: Item, restante: number) {
  if (validarDiseno(config, [...itemIds, item.id]).valido) return undefined;
  if (item.coste > restante) return 'No hay presupuesto para esto. Quita algo y prueba de nuevo.';
  return 'Ya lo llevas en tu misión.';
}

export function Diseno({ config, itemIds }: { config: Configuracion; itemIds: string[] }) {
  const { dispatch } = useEstado();
  const [pestana, setPestana] = useState<Item['tipo']>('modulo');
  const [panel, setPanel] = useState<'catalogo' | 'mision'>('catalogo'); // solo cambia algo en móvil

  const restante = presupuestoRestante(itemIds);
  const elegidos = itemsDe(itemIds);
  const avisos = avisosDiseno(config, itemIds);
  const riesgos = avisos.filter((a) => !a.ok).length;
  const catalogo = CATALOGO.filter((i) => i.tipo === pestana && i.destinos.includes(config.destino));

  return (
    <main className={estilos.pagina}>
      <header className={estilos.barra}>
        <div className={estilos.titulo}>
          <h1>Diseña tu misión</h1>
          <p>
            {NOMBRE_DESTINO[config.destino]}, {config.tripulantes} astronautas, {config.turnos} días.{' '}
            <button type="button" className={estilos.enlace} onClick={() => dispatch({ tipo: 'REINICIAR' })}>
              Cambiar misión
            </button>
          </p>
        </div>
        <div className={estilos.presupuesto}>
          <p aria-live="polite">
            Te quedan <strong>{restante}</strong> de {PRESUPUESTO} puntos
          </p>
          <progress max={PRESUPUESTO} value={PRESUPUESTO - restante} aria-label="Presupuesto gastado" />
        </div>
        <button type="button" className={estilos.lanzar} onClick={() => dispatch({ tipo: 'CONFIRMAR_DISENO' })}>
          Lanzar misión
        </button>
      </header>

      <div className={estilos.cambioPanel}>
        <button type="button" aria-pressed={panel === 'catalogo'} onClick={() => setPanel('catalogo')}>
          Catálogo
        </button>
        <button type="button" aria-pressed={panel === 'mision'} onClick={() => setPanel('mision')}>
          Tu misión ({itemIds.length})
        </button>
      </div>

      <div className={estilos.columnas}>
        <section className={estilos.catalogo} data-activo={panel === 'catalogo'} aria-labelledby="t-catalogo">
          <h2 id="t-catalogo">Catálogo</h2>
          <div className={estilos.pestanas}>
            <button type="button" aria-pressed={pestana === 'modulo'} onClick={() => setPestana('modulo')}>
              Módulos
            </button>
            <button type="button" aria-pressed={pestana === 'historico'} onClick={() => setPestana('historico')}>
              <Icono nombre="estrella" /> Equipo real
            </button>
          </div>
          <ul className={estilos.rejilla}>
            {catalogo.map((item) => (
              <ItemCatalogo
                key={item.id}
                item={item}
                motivoBloqueo={motivoBloqueo(config, itemIds, item, restante)}
                onAnadir={() => dispatch({ tipo: 'AÑADIR_ITEM', itemId: item.id })}
              />
            ))}
          </ul>
        </section>

        <section className={estilos.mision} data-activo={panel === 'mision'} aria-labelledby="t-mision">
          <h2 id="t-mision">Tu misión</h2>
          {elegidos.length === 0 ? (
            <p className={estilos.vacio}>
              Tu misión está vacía. Añade módulos del catálogo: tu equipo necesita energía, aire, agua y comida.
            </p>
          ) : (
            <ul className={estilos.elegidos}>
              {elegidos.map((item, i) => (
                <li key={`${item.id}-${i}`}>
                  <span className={estilos.elegidoNombre}>
                    {item.tipo === 'historico' && <Icono nombre="estrella" />}
                    {item.nombre}
                  </span>
                  <span className={estilos.elegidoCoste}>{item.coste}</span>
                  <button
                    type="button"
                    className={estilos.quitar}
                    aria-label={`Quitar ${item.nombre}`}
                    onClick={() => dispatch({ tipo: 'QUITAR_ITEM', itemId: item.id })}
                  >
                    <Icono nombre="quitar" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 className={estilos.avisosTitulo}>
            {riesgos === 0 ? 'Todo listo para lanzar' : `Antes de lanzar: ${riesgos} ${riesgos === 1 ? 'aviso' : 'avisos'}`}
          </h3>
          <ul className={estilos.avisos}>
            {avisos.map(({ id, ok }) => (
              <li key={id} data-ok={ok}>
                <Icono nombre={ok ? 'ok' : 'alerta'} />
                <div>
                  <p>
                    <strong>{AVISOS[id].nombre}:</strong> {ok ? AVISOS[id].ok : AVISOS[id].riesgo}
                  </p>
                  <details>
                    <summary>Dato real</summary>
                    <p>
                      {AVISOS[id].dato}{' '}
                      <a href={AVISOS[id].fuente} target="_blank" rel="noreferrer">
                        Fuente: NASA<span className="solo-lectores"> (se abre en otra pestaña)</span>
                      </a>
                    </p>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
