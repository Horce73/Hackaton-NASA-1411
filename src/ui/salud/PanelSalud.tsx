import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { alertasSalud, semaforo } from '../../engine/salud';
import type { Indicador, Estado } from '../../engine/tipos';
import { Sparkline } from '../comun/Sparkline';
import { numero } from '../comun/formato';

interface PanelSaludProps {
  partida: Estado;
}

const ORDEN_INDICADORES: Indicador[] = ['radiacion', 'nutricion', 'suenoEstres', 'musculoHueso'];

const NOMBRES_INDICADORES: Record<Indicador, string> = {
  radiacion: 'Radiación',
  nutricion: 'Nutrición',
  suenoEstres: 'Sueño y estrés',
  musculoHueso: 'Músculos y huesos',
};

function estiloSemaforo(estado: 'verde' | 'ambar' | 'rojo') {
  switch (estado) {
    case 'verde':
      return { textoColor: 'text-[var(--color-ok)]', barraColor: 'bg-[var(--color-ok)]', Icono: CheckCircle2 };
    case 'ambar':
      return { textoColor: 'text-[var(--color-warn)]', barraColor: 'bg-[var(--color-warn)]', Icono: AlertTriangle };
    case 'rojo':
      return { textoColor: 'text-[var(--color-danger)]', barraColor: 'bg-[var(--color-danger)]', Icono: ShieldAlert };
  }
}

const ETIQUETA_SEMAFORO = { verde: 'bien', ambar: 'atención', rojo: 'crítico' } as const;

// Monitor biomédico (RF-05): semáforo por indicador y alertas del motor, de peor a mejor.
// Borde de cada tripulante con el color de su indicador más bajo: se ve de un vistazo quién está en riesgo.
// El color nunca va solo: cada barra sigue diciendo su estado con texto.
const BORDE_SALUD = {
  verde: 'border-[var(--color-ok)]/70',
  ambar: 'border-[var(--color-warn)]',
  rojo: 'border-[var(--color-danger)]',
} as const;

function peorSemaforo(salud: Record<Indicador, number>): keyof typeof BORDE_SALUD {
  return semaforo(Math.min(...Object.values(salud)));
}

export function PanelSalud({ partida }: PanelSaludProps) {
  const alertas = alertasSalud(partida);

  return (
    <aside
      aria-labelledby="titulo-panel-salud"
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5"
    >
      <h2 id="titulo-panel-salud" className="text-lg font-semibold text-[var(--color-text)]">
        Salud de la tripulación
      </h2>

      <div className="space-y-4">
        {partida.tripulacion.map((astro) => (
          <section
            key={astro.id}
            aria-label={`Estado de ${astro.nombre}`}
            className={`rounded-lg border-2 bg-[#0b1020]/55 p-3.5 space-y-2.5 ${BORDE_SALUD[peorSemaforo(astro.salud)]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-base text-[var(--color-text)]">{astro.nombre}</h3>
              <span className="text-xs font-mono tabular-nums text-[var(--color-text-muted)]">
                Dosis {numero(astro.dosis)} mSv
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {ORDEN_INDICADORES.map((ind) => {
                const valor = Math.round(astro.salud[ind]);
                const estado = semaforo(valor);
                const visual = estiloSemaforo(estado);
                const Icono = visual.Icono;

                return (
                  <div key={ind} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[var(--color-text-muted)]">{NOMBRES_INDICADORES[ind]}</span>
                      <span className={`inline-flex items-center gap-1 font-medium ${visual.textoColor}`}>
                        <Icono className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="font-mono tabular-nums">{valor}</span>
                        <span>· {ETIQUETA_SEMAFORO[estado]}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#1b2444] overflow-hidden" aria-hidden="true">
                      <div
                        className={`h-full ${visual.barraColor} transition-all duration-200`}
                        style={{ width: `${valor}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {alertas.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-[var(--color-danger)]/50 bg-[#2a1520] px-2.5 py-2 text-xs text-[var(--color-text)] space-y-1"
        >
          <p className="flex items-center gap-2 font-semibold text-[var(--color-danger)]">
            <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Alertas de salud</span>
          </p>
          <ul className="space-y-0.5 text-[var(--color-text-muted)]">
            {alertas.slice(0, 4).map((alerta) => (
              <li key={`${alerta.astronauta}-${alerta.indicador}`}>
                <strong className="text-[var(--color-text)]">{alerta.astronauta}</strong>
                {': '}
                {NOMBRES_INDICADORES[alerta.indicador].toLowerCase()} al {Math.round(alerta.valor)}%
                {alerta.temprana ? ' (aviso temprano por Curiosity)' : ''}
              </li>
            ))}
            {alertas.length > 4 && <li>y {alertas.length - 4} más.</li>}
          </ul>
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-4">
        <Sparkline historial={partida.historial} />
      </div>
    </aside>
  );
}
