import { useEffect, useState, type Dispatch } from 'react';
import { ArrowRight, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { PREAJUSTES, TURNOS_MAX, TURNOS_MIN } from '../../data/parametros';
import type { Configuracion, Destino } from '../../engine/tipos';
import { cargarPartida } from '../../state/guardado';
import type { Accion } from '../../state/reducer';
import { CODIGO_MISION, codigoMision, ParcheMision } from '../comun/EmblemaMision';

interface PantallaInicioProps {
  config: Configuracion;
  dispatch: Dispatch<Accion>;
}

// La gravedad, dicha para 8–14 años: Luna 1,62 m/s² (≈ 1/6 g), Marte 3,72 m/s² (≈ 0,38 g).
const DESTINOS_INFO: Record<Destino, { titulo: string; peso: string }> = {
  luna: { titulo: 'La Luna', peso: 'Pesas unas 6 veces menos que en la Tierra' },
  marte: { titulo: 'Marte', peso: 'Pesas casi 3 veces menos que en la Tierra' },
};

// Qué cambia en cada misión, en una frase.
const RESUMEN_MISION: Record<string, string> = {
  'luna-facil': 'Tu primera base: pocas personas que cuidar y tiempo para aprender.',
  'luna-dificil': 'Más astronautas y más días: más comida, más trabajo y más averías.',
  marte: 'Más lejos y con tormentas de polvo que tapan el Sol.',
};

// Inicio (RF-01): se elige una misión; destino, astronautas y duración quedan en «Personalizar».
export function PantallaInicio({ config, dispatch }: PantallaInicioProps) {
  const [guardada] = useState(cargarPartida); // RF-12: se lee una vez al entrar al inicio

  useEffect(() => {
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'A' || tag === 'SUMMARY') return;
      e.preventDefault();
      dispatch({ tipo: 'INICIAR' });
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [dispatch]);

  const misionActiva = PREAJUSTES.find(
    (pre) => config.destino === pre.destino && config.tripulantes === pre.tripulantes && config.turnos === pre.turnos,
  );

  return (
    <main className="relative z-10 min-h-screen pointer-events-none flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Como mucho, el alto de la pantalla: lo de dentro se desplaza y el botón principal queda siempre a la vista. */}
      <div className="pointer-events-auto w-full max-w-md flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] lg:max-h-[calc(100dvh-7rem)] rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/90 shadow-2xl overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] p-5 sm:p-6 space-y-5">
        <header className="space-y-3">
          <div className="flex items-center gap-4">
            <ParcheMision destino={config.destino} className="w-16 h-16 sm:w-20 sm:h-20" />
            <div className="min-w-0">
              <h1 className="text-[2rem] sm:text-4xl font-bold tracking-tight leading-none whitespace-nowrap text-[var(--color-text)]">
                Misión Legado
              </h1>
              <p className="mt-2 font-mono text-xs tracking-[0.18em] text-[var(--color-warn)]">
                {codigoMision(config)} · {DESTINOS_INFO[config.destino].titulo.toUpperCase()}
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Construye una base en la Luna o en Marte con lo que aprendieron las misiones reales de la NASA.
          </p>
        </header>

        <section aria-labelledby="titulo-misiones" className="space-y-2">
          <h2 id="titulo-misiones" className="text-base font-bold text-[var(--color-text)]">
            Elige tu misión
          </h2>
          <div className="space-y-2">
            {PREAJUSTES.map((pre) => {
              const activa = misionActiva?.id === pre.id;
              return (
                <button
                  key={pre.id}
                  type="button"
                  onClick={() => dispatch({ tipo: 'APLICAR_PREAJUSTE', preajusteId: pre.id })}
                  aria-pressed={activa}
                  className={`w-full text-left flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${
                    activa
                      ? 'border-[var(--color-warn)] bg-[var(--color-surface-elevated)]'
                      : 'border-[var(--color-border)] bg-[#111830] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <span aria-hidden="true" className="relative shrink-0">
                    <ParcheMision destino={pre.destino} className="w-11 h-11" />
                    {activa && (
                      <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-warn)] ring-2 ring-[#0b1020]">
                        <Check className="h-3.5 w-3.5 text-[var(--color-on-accent)]" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-bold text-[var(--color-text)]">
                        {pre.nombre}
                        <span className="ml-2 font-mono text-xs font-normal tracking-wider text-[var(--color-warn)]">
                          {CODIGO_MISION[pre.id]}
                        </span>
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                        {pre.tripulantes} astronautas · {pre.turnos} días
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-[var(--color-text-muted)] leading-snug">
                      {RESUMEN_MISION[pre.id]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <details
          open={!misionActiva}
          onToggle={(e) => {
            // Al abrir, que se vea lo de dentro aunque la tarjeta esté desplazada.
            if (!e.currentTarget.open) return;
            const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
            e.currentTarget.scrollIntoView({ block: 'nearest', behavior: reducido ? 'auto' : 'smooth' });
          }}
          className="group rounded-xl border border-[var(--color-border)] bg-[#111830]"
        >
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-3.5 text-sm font-semibold text-[var(--color-text)] [&::-webkit-details-marker]:hidden">
            <span>
              Personalizar
              {!misionActiva && (
                <span className="ml-2 font-normal text-[var(--color-text-muted)]">
                  {DESTINOS_INFO[config.destino].titulo} · {config.tripulantes} astronautas · {config.turnos} días
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-4 px-3.5 pb-4 pt-1">
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-semibold text-[var(--color-text)]">Destino</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['luna', 'marte'] as Destino[]).map((dest) => {
                  const elegido = config.destino === dest;
                  return (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => dispatch({ tipo: 'CAMBIAR_DESTINO', destino: dest })}
                      aria-pressed={elegido}
                      className={`min-h-[44px] rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                        elegido
                          ? 'border-[var(--color-warn)] bg-[var(--color-surface-elevated)]'
                          : 'border-[var(--color-border)] bg-[#0b1020] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <span className="block text-sm font-bold text-[var(--color-text)]">{DESTINOS_INFO[dest].titulo}</span>
                      <span className="block text-xs text-[var(--color-text-muted)] leading-snug">{DESTINOS_INFO[dest].peso}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-1.5">
              <legend className="text-xs font-semibold text-[var(--color-text)]">Astronautas</legend>
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as const).map((num) => {
                  const activo = config.tripulantes === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => dispatch({ tipo: 'CAMBIAR_TRIPULANTES', tripulantes: num })}
                      aria-pressed={activo}
                      className={`min-h-[44px] rounded-lg border text-sm font-bold tabular-nums transition-colors cursor-pointer ${
                        activo
                          ? 'border-[var(--color-warn)] bg-[var(--color-surface-elevated)] text-[var(--color-text)]'
                          : 'border-[var(--color-border)] bg-[#0b1020] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <label htmlFor="selector-duracion" className="text-xs font-semibold text-[var(--color-text)]">
                  Duración
                </label>
                <span className="text-sm font-bold tabular-nums text-[var(--color-warn)]">{config.turnos} días</span>
              </div>
              <input
                id="selector-duracion"
                type="range"
                min={TURNOS_MIN}
                max={TURNOS_MAX}
                step={1}
                value={config.turnos}
                onChange={(e) => dispatch({ tipo: 'CAMBIAR_TURNOS', turnos: Number(e.target.value) })}
                className="w-full h-9 accent-[#e2674a] cursor-pointer"
              />
              <div aria-hidden="true" className="flex justify-between text-xs text-[var(--color-text-muted)] tabular-nums">
                <span>{TURNOS_MIN} días</span>
                <span>{TURNOS_MAX} días</span>
              </div>
            </div>
          </div>
        </details>
        </div>

        <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-5 py-4 sm:px-6">
          <button
            type="button"
            data-start="true"
            onClick={() => dispatch({ tipo: 'INICIAR' })}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] text-[var(--color-on-accent)] font-bold text-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Diseñar la base</span>
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
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                {DESTINOS_INFO[guardada.partida.config.destino].titulo} · Día {guardada.partida.turno} de{' '}
                {guardada.partida.config.turnos}
              </span>
            </button>
          )}
        </div>
      </div>

      <p className="pointer-events-none hidden lg:block self-start rounded-lg border border-[var(--color-border)] bg-[#0b1020]/85 px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
        Arrastra para girar la base · Enter para empezar
      </p>
    </main>
  );
}
