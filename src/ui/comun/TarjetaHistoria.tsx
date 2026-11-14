import { useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { HISTORIAS_POR_ID } from '../../data/historias';
import { ImagenSegura } from './EmblemaMision';

interface TarjetaHistoriaProps {
  historiaId: string;
  pendientes?: number;
  onCerrar: () => void;
}

// Modal de historia (UX Brief 5.4). <dialog> con showModal deja el resto de la página inerte,
// mantiene el foco dentro y se cierra con Esc.
export function TarjetaHistoria({ historiaId, pendientes = 0, onCerrar }: TarjetaHistoriaProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
    botonCerrarRef.current?.focus();
  }, [historiaId]);

  // La historia se busca en el índice de datos, no se recibe resuelta.
  const historia = HISTORIAS_POR_ID[historiaId];
  if (!historia) return null;

  return (
    <dialog
      ref={dialogo}
      className="fixed inset-0 z-50 m-auto w-[min(100%-2rem,42rem)] max-h-[92dvh] overflow-y-auto rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-0 text-[var(--color-text)] shadow-2xl backdrop:bg-black/75"
      aria-labelledby="titulo-tarjeta-historia"
      onCancel={(e) => {
        e.preventDefault(); // Esc: cerramos desde el estado, no desde el navegador
        onCerrar();
      }}
    >
      <div className="relative aspect-[4/3] max-h-64 w-full overflow-hidden bg-[#0b1020]">
        <ImagenSegura
          src={`${import.meta.env.BASE_URL}${historia.imagen.src}`}
          alt={historia.imagen.alt}
          className="h-full w-full object-cover scale-[1.08]"
        />
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar tarjeta histórica"
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0b1020]/85 text-[#f2f5ff] border border-[var(--color-border-strong)] hover:bg-[#1b2444] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <div className="text-xs font-mono text-[var(--color-warn)] mb-1">
            Equipo real de la NASA · {historia.anio} · {historia.lugar}
          </div>
          <h2
            id="titulo-tarjeta-historia"
            className="text-2xl font-bold text-[var(--color-text)] leading-tight"
          >
            {historia.nombre}
          </h2>
        </div>

        <p className="text-[var(--color-text)] text-base leading-relaxed">{historia.texto}</p>

        <div className="rounded-lg border border-[var(--color-border)] bg-[#0b1020]/60 p-4">
          <div className="text-xs font-semibold text-[var(--color-moon)] mb-1">Dato curioso</div>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            {historia.datoCurioso}
          </p>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={historia.fuente}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--color-moon)] underline underline-offset-4 hover:text-white"
          >
            Fuente: NASA
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href={historia.imagen.fuente}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--color-moon)] underline underline-offset-4 hover:text-white"
          >
            Imagen: NASA
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          {!historia.verificada && <span>Texto pendiente de revisión por el equipo.</span>}
        </p>

        <div className="flex justify-end pt-2">
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={onCerrar}
            className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] text-[var(--color-on-accent)] font-semibold text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {pendientes > 0 ? `Entendido (${pendientes} más)` : 'Entendido'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
