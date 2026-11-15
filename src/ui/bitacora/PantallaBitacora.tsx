import { useState, type Dispatch } from 'react';
import { Award, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
import { AVISOS } from '../../data/avisos';
import { HISTORIAS_POR_ID } from '../../data/historias';
import { DOSIS_BASE, LIMITE_DOSIS } from '../../data/parametros';
import { desglosePuntuacion } from '../../engine/puntuacion';
import type { AvisoId, Estado, Indicador } from '../../engine/tipos';
import type { Accion } from '../../state/reducer';
import { ImagenSegura } from '../comun/EmblemaMision';
import { Sparkline } from '../comun/Sparkline';
import { TarjetaHistoria } from '../comun/TarjetaHistoria';

// De qué aviso sale la explicación de cada causa de fin de misión.
const AVISO_DE_INDICADOR: Record<Indicador, AvisoId> = {
  radiacion: 'radiacion',
  nutricion: 'alimento',
  suenoEstres: 'suenoEstres',
  musculoHueso: 'musculoHueso',
};

// Por qué terminó la misión, con un caso real (petición del equipo: aprender también del fracaso).
function CausaFin({ partida }: { partida: Estado }) {
  if (!partida.causaFin) return null;
  const aviso = AVISOS[AVISO_DE_INDICADOR[partida.causaFin]];
  const dosisMaxima = Math.max(...partida.tripulacion.map((a) => a.dosis));
  return (
    <section
      aria-labelledby="titulo-causa-fin"
      className="rounded-xl border border-[var(--color-warn)]/60 bg-[var(--color-surface)] p-5 sm:p-6 space-y-2"
    >
      <h2 id="titulo-causa-fin" className="text-xl font-bold text-[var(--color-text)]">
        Por qué pasó: {aviso.nombre.toLowerCase()}
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{aviso.dato}</p>
      <p className="text-sm text-[var(--color-text)] leading-relaxed">
        {aviso.historia.dato}{' '}
        <a href={aviso.historia.fuente} target="_blank" rel="noreferrer" className="underline text-[var(--color-text-muted)]">
          Fuente NASA
        </a>
      </p>
      {partida.causaFin === 'radiacion' && (
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Tu tripulación llegó a {Math.round(dosisMaxima)} mSv. La NASA limita a {LIMITE_DOSIS} mSv la dosis de una
          tormenta solar. En la superficie se reciben unos {DOSIS_BASE[partida.config.destino].toLocaleString('es')} mSv
          al día: lo que de verdad pone en peligro es salir durante una tormenta.
        </p>
      )}
      <p className="text-sm text-[var(--color-text-muted)]">
        Mira en el diseño el «¿Por qué hace falta?» de cada módulo para la próxima misión.
      </p>
    </section>
  );
}

interface PantallaBitacoraProps {
  partida: Estado;
  dispatch: Dispatch<Accion>;
}

export function PantallaBitacora({ partida, dispatch }: PantallaBitacoraProps) {
  const [historiaAbierta, setHistoriaAbierta] = useState<string | null>(null);
  const exito = partida.resultado === 'exito';
  const puntos = desglosePuntuacion(partida);

  return (
    <div className="relative z-10 min-h-screen bg-[#0b1020]/90">
      <main className="min-h-screen px-4 py-8 sm:px-8 max-w-5xl mx-auto space-y-8">
        <section className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div
                className={`inline-flex items-center gap-2 text-sm font-semibold ${
                  exito ? 'text-[var(--color-ok)]' : 'text-[var(--color-warn)]'
                }`}
              >
                {exito ? (
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                )}
                <span>{exito ? 'Misión completada' : 'Misión abortada'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
                Bitácora de misión · {partida.config.destino === 'luna' ? 'La Luna' : 'Marte'}
              </h1>
              <p className="text-base text-[var(--color-text-muted)] max-w-2xl">
                {partida.motivoFin ??
                  (exito
                    ? 'Completaste todos los días de la expedición.'
                    : 'La misión se abortó y tu equipo regresó a salvo.')}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[#0b1020]/70 px-6 py-4 text-left sm:text-right shrink-0">
              <div className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[var(--color-warn)]" aria-hidden="true" />
                <span>Puntuación total</span>
              </div>
              <div className="font-mono tabular-nums text-4xl font-bold text-[var(--color-warn)]">
                {puntos.total}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border)]">
            <div className="rounded-lg border border-[var(--color-border)] bg-[#0b1020]/55 p-4">
              <div className="text-xs text-[var(--color-text-muted)]">Ciencia recogida</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[var(--color-text)] mt-1">
                +{puntos.ciencia}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[#0b1020]/55 p-4">
              <div className="text-xs text-[var(--color-text-muted)]">Salud media final</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[var(--color-ok)] mt-1">
                +{puntos.saludMedia}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[#0b1020]/55 p-4">
              <div className="text-xs text-[var(--color-text-muted)]">
                Historias NASA ({partida.historiasDesbloqueadas.length})
              </div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[var(--color-warn)] mt-1">
                +{puntos.historiasBonus}
              </div>
            </div>
          </div>

          <Sparkline historial={partida.historial} />
        </section>

        <CausaFin partida={partida} />

        <section aria-labelledby="titulo-historias-bitacora" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-historias-bitacora" className="text-2xl font-bold text-[var(--color-text)]">
              Equipo real de la NASA desbloqueado ({partida.historiasDesbloqueadas.length})
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Toca cualquier tarjeta para leer su historia completa y la fuente.
            </p>
          </div>

          {partida.historiasDesbloqueadas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center space-y-2">
              <p className="text-base text-[var(--color-text)]">
                En esta partida no llevaste equipo histórico de la NASA.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Prueba en la siguiente misión a incluir equipo marcado con ★ en la pestaña «Equipo NASA».
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {partida.historiasDesbloqueadas.map((hId) => {
                const hist = HISTORIAS_POR_ID[hId];
                if (!hist) return null;
                return (
                  <button
                    key={hId}
                    type="button"
                    onClick={() => setHistoriaAbierta(hId)}
                    className="text-left rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-warn)] transition-colors flex flex-col cursor-pointer"
                  >
                    <div className="aspect-[4/3] w-full bg-[#0b1020] overflow-hidden">
                      <ImagenSegura
                        src={`${import.meta.env.BASE_URL}${hist.imagen.src}`}
                        alt={hist.imagen.alt}
                        className="w-full h-full object-cover scale-[1.08]"
                      />
                    </div>
                    <div className="p-4 space-y-1.5 flex-1">
                      <div className="text-xs font-mono text-[var(--color-warn)]">
                        {hist.anio} · {hist.lugar}
                      </div>
                      <h3 className="text-base font-bold text-[var(--color-text)]">{hist.nombre}</h3>
                      <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{hist.texto}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => dispatch({ tipo: 'REPETIR' })}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] text-[var(--color-on-accent)] font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
            <span>Repetir esta misión</span>
          </button>

          <button
            type="button"
            onClick={() => dispatch({ tipo: 'REINICIAR' })}
            className="inline-flex items-center justify-center min-h-[48px] px-5 py-3 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-moon)] text-[var(--color-text)] font-semibold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            Diseñar otra misión
          </button>
        </div>
      </main>

      {historiaAbierta && (
        <TarjetaHistoria historiaId={historiaAbierta} onCerrar={() => setHistoriaAbierta(null)} />
      )}
    </div>
  );
}
