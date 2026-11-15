import { useState, type Dispatch } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  ExternalLink,
  Minus,
  Plus,
  Rocket,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { AVISOS } from '../../data/avisos';
import { CATALOGO, CATALOGO_POR_ID } from '../../data/catalogo';
import { PRESUPUESTO } from '../../data/parametros';
import { avisosDiseno, presupuestoRestante, validarDiseno } from '../../engine/diseno';
import type { Configuracion } from '../../engine/tipos';
import type { Accion } from '../../state/reducer';
import { describirEfectos } from '../comun/efectos';
import { codigoMision, ParcheMision } from '../comun/EmblemaMision';

interface PantallaDisenoProps {
  config: Configuracion;
  itemIds: string[];
  errorDiseno: string | null;
  dispatch: Dispatch<Accion>;
}

export function PantallaDiseno({ config, itemIds, errorDiseno, dispatch }: PantallaDisenoProps) {
  const [pestana, setPestana] = useState<'modulo' | 'historico' | 'resumen'>('modulo');
  const [soloVista3D, setSoloVista3D] = useState(false);

  const restante = presupuestoRestante(itemIds);
  const itemsCompatibles = CATALOGO.filter(
    (item) =>
      (pestana === 'modulo' || pestana === 'historico') &&
      item.tipo === pestana &&
      item.destinos.includes(config.destino),
  );
  const validacion = validarDiseno(config, itemIds);
  const avisos = avisosDiseno(config, itemIds);
  const riesgos = avisos.filter((a) => !a.ok).length;
  const destinoNombre = config.destino === 'luna' ? 'la Luna' : 'Marte';

  return (
    <main className="relative z-10 min-h-screen pointer-events-none flex flex-col justify-between p-3 sm:p-5 gap-3 max-sm:pb-20">
      <header className="pointer-events-auto rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/92 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch({ tipo: 'VOLVER_INICIO' })}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-3 rounded-lg border border-[var(--color-border)] bg-[#141b34] text-xs sm:text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Misión</span>
          </button>
          <ParcheMision destino={config.destino} className="hidden sm:block w-11 h-11" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-text)] leading-tight">
              Tu base en {destinoNombre}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              <span className="block sm:inline font-mono tracking-wider text-[var(--color-warn)]">
                Plan de misión {codigoMision(config)}
              </span>
              <span className="hidden sm:inline"> · </span>
              <span className="whitespace-nowrap">
                {config.tripulantes} astronautas · {config.turnos} días
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={() => setSoloVista3D((v) => !v)}
            aria-pressed={soloVista3D}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-3 rounded-lg border border-[var(--color-border)] bg-[#141b34] text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-moon)] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[var(--color-moon)]" aria-hidden="true" />
            <span>{soloVista3D ? 'Ver el catálogo' : 'Ver la base'}</span>
          </button>

          <div className="text-right">
            <div className="text-xs text-[var(--color-text-muted)]">Te quedan</div>
            <div className="tabular-nums text-base sm:text-lg font-bold text-[var(--color-text)]">
              <span className={restante <= 10 ? 'text-[var(--color-warn)]' : 'text-[var(--color-ok)]'}>
                {restante}
              </span>{' '}
              <span className="text-xs font-normal text-[var(--color-text-muted)]">
                de {PRESUPUESTO} créditos
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!validacion.valido}
            onClick={() => dispatch({ tipo: 'CONFIRMAR_DISENO' })}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-on-accent)] font-bold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:z-30 max-sm:min-h-[52px] max-sm:text-base max-sm:shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
          >
            <Rocket className="w-4 h-4" aria-hidden="true" />
            <span>Lanzar misión</span>
          </button>
        </div>
      </header>

      {errorDiseno && (
        <div
          role="alert"
          className="pointer-events-auto max-w-xl rounded-xl border border-[var(--color-danger)] bg-[#2a1520] px-4 py-2.5 text-sm text-[var(--color-text)] flex items-center gap-2"
        >
          <XCircle className="w-4 h-4 text-[var(--color-danger)] shrink-0" aria-hidden="true" />
          <span>{errorDiseno}</span>
        </div>
      )}

      {!soloVista3D && (
        <div className="pointer-events-auto w-full lg:w-[500px] max-h-[calc(100vh-120px)] max-sm:max-h-[calc(100dvh-15rem)] flex flex-col rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/92 shadow-2xl overflow-hidden">
          <div
            className="grid grid-cols-3 gap-1 p-1.5 border-b border-[var(--color-border)] bg-[#141b34]"
            role="tablist"
            aria-label="Categorías del constructor"
          >
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'modulo'}
              onClick={() => setPestana('modulo')}
              className={`min-h-[40px] px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                pestana === 'modulo'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] shadow-[inset_0_-2px_0_var(--color-warn)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Módulos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'historico'}
              onClick={() => setPestana('historico')}
              className={`min-h-[40px] px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                pestana === 'historico'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] shadow-[inset_0_-2px_0_var(--color-warn)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-[var(--color-warn)]" aria-hidden="true" />
                Equipo NASA
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'resumen'}
              onClick={() => setPestana('resumen')}
              className={`min-h-[40px] px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                pestana === 'resumen'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] shadow-[inset_0_-2px_0_var(--color-warn)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Tu base ({itemIds.length})
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {pestana !== 'resumen' ? (
              <div className="divide-y divide-[var(--color-border)]">
                {itemsCompatibles.map((item) => {
                  const cantidad = itemIds.filter((id) => id === item.id).length;
                  const yaIncluidoHistorico = item.tipo === 'historico' && cantidad > 0;
                  const faltaPresupuesto = item.coste > restante;
                  const deshabilitado = yaIncluidoHistorico || faltaPresupuesto;

                  let motivoBloqueo: string | null = null;
                  if (yaIncluidoHistorico) motivoBloqueo = 'Ya incluido (equipo único)';
                  else if (faltaPresupuesto) motivoBloqueo = `Te faltan ${item.coste - restante} créditos`;

                  return (
                    <article key={item.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="inline-flex items-center gap-1.5 font-semibold text-sm sm:text-base text-[var(--color-text)] leading-snug">
                          {item.tipo === 'historico' && (
                            <Star className="h-3.5 w-3.5 shrink-0 text-[var(--color-warn)]" aria-label="Equipo NASA" />
                          )}
                          {item.nombre}
                        </h2>
                        <span className="tabular-nums text-xs sm:text-sm font-bold text-[var(--color-warn)] whitespace-nowrap shrink-0">
                          {item.coste} créditos
                        </span>
                      </div>
                      <ul className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed space-y-0.5">
                        {describirEfectos(item.efectos).map((linea) => (
                          <li key={linea}>{linea}</li>
                        ))}
                      </ul>
                      {item.tema && (
                        <details className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                          <summary className="cursor-pointer min-h-[32px] inline-flex items-center font-semibold text-[var(--color-moon)]">
                            ¿Por qué hace falta?
                          </summary>
                          <div className="mt-1 space-y-1.5">
                            <p>{AVISOS[item.tema].dato}</p>
                            <p>
                              {AVISOS[item.tema].historia.dato}{' '}
                              <a
                                href={AVISOS[item.tema].historia.fuente}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                Fuente NASA
                              </a>
                            </p>
                          </div>
                        </details>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {cantidad > 0 ? `En tu base: ${cantidad}` : 'No está en tu base'}
                        </span>
                        <div className="flex items-center gap-2">
                          {cantidad > 0 && (
                            <button
                              type="button"
                              onClick={() => dispatch({ tipo: 'QUITAR_ITEM', itemId: item.id })}
                              aria-label={`Quitar ${item.nombre}`}
                              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:border-[var(--color-danger)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                            >
                              <Minus className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={deshabilitado}
                            onClick={() => dispatch({ tipo: 'AÑADIR_ITEM', itemId: item.id })}
                            aria-label={`Añadir ${item.nombre}`}
                            className="inline-flex items-center gap-1 min-h-[38px] px-3.5 rounded-lg bg-[#1b2444] border border-[var(--color-border-strong)] hover:border-[var(--color-moon)] text-xs sm:text-sm font-semibold text-[var(--color-text)] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{yaIncluidoHistorico ? 'Incluido' : 'Añadir'}</span>
                          </button>
                        </div>
                      </div>
                      {motivoBloqueo && <p className="text-xs text-[var(--color-danger)]">{motivoBloqueo}</p>}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[var(--color-text)]">
                    En tu base ({itemIds.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch({ tipo: 'CARGAR_SUGERENCIA' })}
                      className="text-xs font-medium text-[var(--color-moon)] hover:text-white underline underline-offset-4 min-h-[36px] px-2 cursor-pointer"
                    >
                      Sugerencia
                    </button>
                    {itemIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch({ tipo: 'LIMPIAR_DISENO' })}
                        className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] min-h-[36px] px-2 cursor-pointer"
                      >
                        Vaciar
                      </button>
                    )}
                  </div>
                </div>

                {itemIds.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] p-4 text-center space-y-1.5">
                    <p className="text-sm text-[var(--color-text)]">Tu base no lleva módulos todavía.</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Añade módulos en las otras pestañas o carga la sugerencia para verlos en 3D.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--color-border)]">
                    {itemIds.map((id, index) => {
                      const item = CATALOGO_POR_ID[id];
                      if (!item) return null;
                      return (
                        <li key={`${id}-${index}`} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text)] truncate">
                              {item.tipo === 'historico' && (
                                <Star className="h-3.5 w-3.5 shrink-0 text-[var(--color-warn)]" aria-label="Equipo NASA" />
                              )}
                              {item.nombre}
                            </div>
                            <div className="text-xs tabular-nums text-[var(--color-text-muted)]">
                              {item.coste} créditos
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => dispatch({ tipo: 'QUITAR_ITEM', itemId: id })}
                            aria-label={`Quitar ${item.nombre}`}
                            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:border-[var(--color-danger)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                          >
                            <Minus className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {itemIds.some((id) => CATALOGO_POR_ID[id]?.tipo === 'historico') && (
                  <div className="rounded-xl bg-[#141b34] border border-[var(--color-border)] p-3 text-xs text-[var(--color-text-muted)] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--color-warn)] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Al lanzar podrás acercarte a cada equipo real en 3D y abrir su historia NASA.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    {riesgos === 0
                      ? 'Todo listo para lanzar'
                      : `Antes de lanzar: ${riesgos} ${riesgos === 1 ? 'aviso' : 'avisos'}`}
                  </h3>
                  <ul className="space-y-2">
                    {avisos.map(({ id, ok }) => (
                      <li
                        key={id}
                        className={`rounded-xl border p-3 text-xs ${
                          ok
                            ? 'border-[var(--color-border)] bg-[#141b34]'
                            : 'border-[var(--color-danger)]/60 bg-[#2a1520]'
                        }`}
                      >
                        <p className="flex items-start gap-2 text-[var(--color-text)]">
                          {ok ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--color-ok)] shrink-0 mt-0.5" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[var(--color-danger)] shrink-0 mt-0.5" aria-hidden="true" />
                          )}
                          <span>
                            <strong>{AVISOS[id].nombre}:</strong> {ok ? AVISOS[id].ok : AVISOS[id].riesgo}
                          </span>
                        </p>
                        <details className="mt-1.5 pl-6 text-[var(--color-text-muted)]">
                          <summary className="cursor-pointer text-[var(--color-moon)]">Dato real</summary>
                          <p className="mt-1 leading-relaxed">
                            {AVISOS[id].dato}{' '}
                            <a
                              href={AVISOS[id].fuente}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 underline underline-offset-4"
                            >
                              Fuente: NASA
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          </p>
                          {!AVISOS[id].verificada && (
                            <p className="mt-1 text-xs">Texto pendiente de revisión por el equipo.</p>
                          )}
                        </details>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] bg-[#141b34] px-4 py-3 space-y-1.5">
            <div className="text-xs font-semibold text-[var(--color-text)]">Así aguantará tu base</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {avisos.map(({ id, ok }) => (
                <div key={id} className="flex items-center justify-between gap-1.5">
                  <span className="text-[var(--color-text-muted)] truncate">{AVISOS[id].nombre}</span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium shrink-0 ${
                      ok ? 'text-[var(--color-ok)]' : 'text-[var(--color-danger)]'
                    }`}
                  >
                    {ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {ok ? 'Bien' : 'Riesgo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
