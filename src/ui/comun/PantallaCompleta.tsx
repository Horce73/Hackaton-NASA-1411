import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

// Prefijos de Safari (iPad) para la API de pantalla completa.
type DocumentoConPrefijo = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type ElementoConPrefijo = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function elementoCompleto(): Element | null {
  const doc = document as DocumentoConPrefijo;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

// Botón de pantalla completa, solo en pantallas táctiles (RNF de uso en móvil). Android y iPad permiten poner la
// página a pantalla completa; el iPhone no: ahí se explica cómo añadir el juego a la pantalla de inicio, que lo abre
// sin las barras del navegador (ver las etiquetas de index.html). Instalado así, el botón no hace falta.
export function BotonPantallaCompleta({ className = '' }: { className?: string }) {
  const [activa, setActiva] = useState(() => elementoCompleto() !== null);
  const [aviso, setAviso] = useState(false);

  useEffect(() => {
    const cambio = () => setActiva(elementoCompleto() !== null);
    document.addEventListener('fullscreenchange', cambio);
    document.addEventListener('webkitfullscreenchange', cambio);
    return () => {
      document.removeEventListener('fullscreenchange', cambio);
      document.removeEventListener('webkitfullscreenchange', cambio);
    };
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(false), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const tactil = window.matchMedia?.('(pointer: coarse)').matches === true;
  const instalada =
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!tactil || instalada) return null;

  const doc = document as DocumentoConPrefijo;
  const soportada = document.fullscreenEnabled || doc.webkitFullscreenEnabled === true;

  const alternar = async () => {
    if (!soportada) {
      setAviso(true);
      return;
    }
    try {
      if (elementoCompleto()) {
        await (document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(document))?.();
      } else {
        const raiz = document.documentElement as ElementoConPrefijo;
        await (raiz.requestFullscreen?.bind(raiz) ?? raiz.webkitRequestFullscreen?.bind(raiz))?.();
      }
    } catch {
      // El navegador puede negarlo: el juego sigue igual.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={alternar}
        aria-pressed={activa}
        aria-label={activa ? 'Salir de pantalla completa' : 'Pantalla completa'}
        title={activa ? 'Salir de pantalla completa' : 'Pantalla completa'}
        className={`pointer-events-auto min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[#141b34] text-[var(--color-text)] cursor-pointer ${className}`}
      >
        {activa ? <Minimize2 className="w-5 h-5" aria-hidden="true" /> : <Maximize2 className="w-5 h-5" aria-hidden="true" />}
      </button>
      {aviso && (
        <p
          role="status"
          className="pointer-events-auto fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-xl border border-[var(--color-border-strong)] bg-[#0b1020]/95 px-4 py-3 text-sm leading-snug text-[var(--color-text)] shadow-2xl"
        >
          Este navegador no deja usar la pantalla completa. En iPhone, pulsa <strong>Compartir</strong> y luego{' '}
          <strong>«Añadir a pantalla de inicio»</strong>: el juego se abrirá sin las barras del navegador.
        </p>
      )}
    </>
  );
}
