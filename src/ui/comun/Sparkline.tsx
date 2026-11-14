import { CAPACIDAD_ENERGIA } from '../../data/parametros';
import { saludMedia } from '../../engine/puntuacion';
import type { Instantanea } from '../../engine/tipos';

interface SparklineProps {
  historial: Instantanea[];
}

// Línea de tendencia en SVG propio (TRD: sin librería de gráficas).
export function Sparkline({ historial }: SparklineProps) {
  if (historial.length === 0) return null;

  const ancho = 260;
  const alto = 76;
  const padX = 8;
  const padY = 10;

  const puntosSalud = historial.map((snap) => Math.round(saludMedia(snap.tripulacion)));
  const puntosEnergia = historial.map((snap) =>
    Math.min(100, Math.round((snap.recursos.energia / CAPACIDAD_ENERGIA) * 100)),
  );

  const construirPath = (valores: number[]) => {
    if (valores.length === 1) {
      const y = alto - padY - (valores[0] / 100) * (alto - padY * 2);
      return `M ${padX} ${y.toFixed(1)} L ${ancho - padX} ${y.toFixed(1)}`;
    }
    return valores
      .map((val, idx) => {
        const x = padX + (idx / (valores.length - 1)) * (ancho - padX * 2);
        const y = alto - padY - (Math.max(0, Math.min(100, val)) / 100) * (alto - padY * 2);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const saludActual = puntosSalud[puntosSalud.length - 1];
  const energiaActual = historial[historial.length - 1].recursos.energia;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>Tendencia de salud y energía</span>
        <span className="font-mono tabular-nums">
          Salud {saludActual}% · Energía {energiaActual}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="none"
        className="w-full h-20 rounded-lg border border-[var(--color-border)] bg-[#0b1020]/70"
        role="img"
        aria-label={`Gráfica de tendencia: salud media actual ${saludActual}%, energía actual ${energiaActual}`}
      >
        <title>Tendencia de salud de la tripulación y energía</title>
        <line
          x1={padX}
          y1={alto - padY - 0.4 * (alto - padY * 2)}
          x2={ancho - padX}
          y2={alto - padY - 0.4 * (alto - padY * 2)}
          stroke="#ff6b6b"
          strokeOpacity="0.32"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={construirPath(puntosEnergia)}
          fill="none"
          stroke="#f5b942"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={construirPath(puntosSalud)}
          fill="none"
          stroke="#4cd7a1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-[#4cd7a1]" aria-hidden="true" />
          Salud media
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-[#f5b942]" aria-hidden="true" />
          Energía
        </span>
      </div>
    </div>
  );
}
