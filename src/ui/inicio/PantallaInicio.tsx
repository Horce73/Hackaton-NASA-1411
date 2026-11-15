import { useEffect, useState, type Dispatch } from 'react';
import { ArrowRight, Calendar, Compass, RotateCcw, Users } from 'lucide-react';
import { PREAJUSTES, TURNOS_MAX, TURNOS_MIN } from '../../data/parametros';
import type { Configuracion, Destino } from '../../engine/tipos';
import { cargarPartida } from '../../state/guardado';
import type { Accion } from '../../state/reducer';
import { EmblemaMision } from '../comun/EmblemaMision';

interface PantallaInicioProps {
  config: Configuracion;
  dispatch: Dispatch<Accion>;
}

const DESTINOS_INFO: Record<Destino, { titulo: string; gravedad: string; contexto: string }> = {
  luna: {
    titulo: 'La Luna',
    gravedad: '1.62 m/s² · 1/6 g',
    contexto: 'Saltos altos en baja gravedad y sin atmósfera frente a tormentas solares.',
  },
  marte: {
    titulo: 'Marte',
    gravedad: '3.72 m/s² · 0.38 g',
    contexto: 'Tormentas de polvo rojizo, mayor radiación y vuelos con Ingenuity.',
  },
};

export function PantallaInicio({ config, dispatch }: PantallaInicioProps) {
  const [guardada] = useState(cargarPartida); // RF-12: se lee una vez al entrar al inicio

  useEffect(() => {
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'A') return;
      e.preventDefault();
      dispatch({ tipo: 'INICIAR' });
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [dispatch]);

  const infoActual = DESTINOS_INFO[config.destino];

  return (
    <main className="relative z-10 min-h-screen pointer-events-none flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto max-w-lg rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/90 p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="space-y-2 border-b border-[var(--color-border)] pb-4">
            <div className="flex items-center gap-3">
              <EmblemaMision />
              <span className="text-xs font-mono text-[var(--color-moon)] tracking-wide">
                Simulador espacial 3D en tercera persona
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text)]">
              Misión Legado
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              Diseña tu base en 3D, explora a pie en la gravedad real y descubre equipo histórico de la NASA.
            </p>
          </div>

          <section aria-labelledby="titulo-preajustes" className="space-y-2">
            <h2 id="titulo-preajustes" className="text-xs font-semibold text-[var(--color-text-muted)]">
              Preajustes rápidos
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {PREAJUSTES.map((pre) => {
                const activo =
                  config.destino === pre.destino &&
                  config.tripulantes === pre.tripulantes &&
                  config.turnos === pre.turnos;
                return (
                  <button
                    key={pre.id}
                    type="button"
                    onClick={() => dispatch({ tipo: 'APLICAR_PREAJUSTE', preajusteId: pre.id })}
                    aria-pressed={activo}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-colors min-h-[44px] cursor-pointer ${
                      activo
                        ? 'bg-[var(--color-surface-elevated)] border-[var(--color-warn)] text-[var(--color-text)]'
                        : 'bg-[#111830] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-semibold text-[var(--color-text)] leading-tight">
                      {pre.nombre}
                    </div>
                    <div className="text-[11px] font-mono mt-0.5 text-[var(--color-text-muted)]">
                      {pre.tripulantes} trip. · {pre.turnos} días
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="titulo-destino" className="space-y-2">
            <h2 id="titulo-destino" className="text-xs font-semibold text-[var(--color-text-muted)]">
              1. Destino planetario (vista 3D en vivo)
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {(['luna', 'marte'] as Destino[]).map((dest) => {
                const info = DESTINOS_INFO[dest];
                const seleccionado = config.destino === dest;
                return (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => dispatch({ tipo: 'CAMBIAR_DESTINO', destino: dest })}
                    aria-pressed={seleccionado}
                    className={`text-left p-3 rounded-xl border transition-colors min-h-[48px] cursor-pointer ${
                      seleccionado
                        ? dest === 'marte'
                          ? 'border-[var(--color-mars)] bg-[#28181a]'
                          : 'border-[var(--color-moon)] bg-[#192342]'
                        : 'border-[var(--color-border)] bg-[#111830] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-base text-[var(--color-text)]">{info.titulo}</span>
                      <span className="text-[11px] font-mono text-[var(--color-warn)]">
                        {seleccionado ? 'Activo' : 'Elegir'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
                      {info.gravedad}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{infoActual.contexto}</p>
          </section>

          <section aria-labelledby="titulo-parametros" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text)]">
                <Users className="w-3.5 h-3.5 text-[var(--color-moon)]" aria-hidden="true" />
                <span>Tripulación (2–4)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Número de astronautas">
                {([2, 3, 4] as const).map((num) => {
                  const activo = config.tripulantes === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => dispatch({ tipo: 'CAMBIAR_TRIPULANTES', tripulantes: num })}
                      aria-pressed={activo}
                      className={`min-h-[44px] rounded-lg border font-mono tabular-nums font-semibold text-sm transition-colors cursor-pointer ${
                        activo
                          ? 'bg-[var(--color-moon)] text-[var(--color-on-accent)] border-[var(--color-moon)]'
                          : 'bg-[#111830] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="selector-duracion"
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text)]"
                >
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-moon)]" aria-hidden="true" />
                  <span>Duración</span>
                </label>
                <span className="font-mono tabular-nums font-bold text-sm text-[var(--color-warn)]">
                  {config.turnos} días
                </span>
              </div>
              <input
                id="selector-duracion"
                type="range"
                min={TURNOS_MIN}
                max={TURNOS_MAX}
                step={1}
                value={config.turnos}
                onChange={(e) => dispatch({ tipo: 'CAMBIAR_TURNOS', turnos: Number(e.target.value) })}
                className="w-full h-11 accent-[#e2674a] cursor-pointer"
              />
            </div>
          </section>

          <button
            type="button"
            data-start="true"
            onClick={() => dispatch({ tipo: 'INICIAR' })}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] text-[var(--color-on-accent)] font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Empezar</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>

          {guardada && (
            <button
              type="button"
              onClick={() => dispatch({ tipo: 'CONTINUAR_PARTIDA', guardada })}
              className="w-full inline-flex flex-wrap items-center justify-center gap-x-2 min-h-[48px] rounded-xl border border-[var(--color-border-strong)] bg-[#111830] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text)] font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Continuar partida</span>
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                {DESTINOS_INFO[guardada.partida.config.destino].titulo} · Día {guardada.partida.turno} /{' '}
                {guardada.partida.config.turnos}
              </span>
            </button>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[#0b1020]/85 px-3.5 py-2 text-xs text-[var(--color-text-muted)]">
          <Compass className="w-4 h-4 text-[var(--color-warn)]" aria-hidden="true" />
          <span>Arrastra para rotar la base 3D · Enter o Espacio para comenzar</span>
        </div>
      </div>

      <div className="pointer-events-none hidden sm:block text-xs text-[var(--color-text-muted)]">
        <span className="inline-block rounded-lg border border-[var(--color-border)] bg-[#0b1020]/85 px-3 py-1.5">
          Controles en superficie: WASD mover · Espacio saltar · E interactuar · Ratón rotar cámara
        </span>
      </div>
    </main>
  );
}
