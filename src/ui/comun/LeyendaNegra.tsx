import { useEffect, useId, useState } from 'react';

interface LeyendaNegraProps {
  titulo: string;
  texto: string;
  fuente?: string;
  principal: string;
  onPrincipal: () => void;
  secundario?: string;
  onSecundario?: () => void;
  onEscape?: () => void; // por defecto, lo del secundario
}

// Diálogo negro en la parte inferior: primeros planos, la pantalla de llegada y los datos curiosos.
// El texto se escribe poco a poco salvo con movimiento reducido; el lector de pantalla recibe el texto entero.
// El primer clic en el botón principal completa el texto; el segundo, sigue. Escape hace lo del secundario, salvo que se indique otra cosa.
export function LeyendaNegra({
  titulo,
  texto,
  fuente,
  principal,
  onPrincipal,
  secundario,
  onSecundario,
  onEscape,
}: LeyendaNegraProps) {
  const idTitulo = useId();
  const reducido = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const [letras, setLetras] = useState(reducido ? texto.length : 0);
  const completo = letras >= texto.length;

  useEffect(() => {
    if (completo) return;
    const t = window.setTimeout(() => setLetras((n) => n + 2), 24);
    return () => window.clearTimeout(t);
  }, [letras, completo]);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (onEscape ?? onSecundario ?? onPrincipal)();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onPrincipal, onSecundario, onEscape]);

  return (
    <div
      role="dialog"
      aria-labelledby={idTitulo}
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 bg-black/92 border-t border-white/15 px-4 py-4 sm:px-8 sm:py-5"
    >
      <div className="mx-auto max-w-3xl space-y-2">
        <h2 id={idTitulo} className="text-xs font-semibold tracking-wide text-[var(--color-warn)]">
          {titulo}
        </h2>
        <p className="sr-only">{texto}</p>
        <p aria-hidden="true" className="min-h-[3.5em] text-sm sm:text-base leading-relaxed text-white">
          {texto.slice(0, letras)}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {fuente ? (
            <a href={fuente} target="_blank" rel="noreferrer" className="text-xs underline text-white/70">
              Fuente NASA
            </a>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {secundario && onSecundario && (
              <button
                type="button"
                onClick={onSecundario}
                className="min-h-[44px] rounded-lg border border-white/30 px-4 text-sm text-white/85 hover:bg-white/10 cursor-pointer"
              >
                {secundario}
              </button>
            )}
            <button
              type="button"
              autoFocus
              onClick={() => (completo ? onPrincipal() : setLetras(texto.length))}
              className="min-h-[44px] rounded-lg bg-[var(--color-mars)] px-4 font-semibold text-[var(--color-on-accent)] cursor-pointer"
            >
              {completo ? principal : 'Ver todo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
