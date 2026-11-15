import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { PREAJUSTES } from '../../data/parametros';
import type { Configuracion, Destino } from '../../engine/tipos';

interface ImagenSeguraProps {
  src: string;
  alt: string;
  className?: string;
}

// Las imágenes vienen de la biblioteca de la NASA: si una no carga, se muestra el pie en su lugar.
export function ImagenSegura({ src, alt, className = '' }: ImagenSeguraProps) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#1b2444] text-[#a6b2d0] p-6 text-center ${className}`}
      >
        <Rocket className="w-8 h-8 mb-2 text-[#e2674a]" aria-hidden="true" />
        <span className="text-xs leading-snug">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFallo(true)}
      className={className}
    />
  );
}

// Parche de misión: el emblema del juego con el disco del destino (gris lunar o rojizo marciano). Diseño propio:
// no imita la insignia de la NASA. Códigos de misión ML-01..03 para los tres preajustes.
export const CODIGO_MISION: Record<string, string> = { 'luna-facil': 'ML-01', 'luna-dificil': 'ML-02', marte: 'ML-03' };

export function codigoMision(config: Configuracion): string {
  const pre = PREAJUSTES.find(
    (p) => p.destino === config.destino && p.tripulantes === config.tripulantes && p.turnos === config.turnos,
  );
  return pre ? CODIGO_MISION[pre.id] : 'ML-00';
}

export function ParcheMision({ destino, className = 'w-10 h-10' }: { destino: Destino; className?: string }) {
  const luna = destino === 'luna';
  return (
    <svg viewBox="0 0 48 48" className={`${className} shrink-0`} fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22.5" fill="#0B1020" stroke="#C9D3E8" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="19" stroke="#F5B942" strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray="1.4 2.6" />
      <circle cx="26.5" cy="27" r="11.5" fill={luna ? '#8D95A6' : '#C4623F'} />
      {luna ? (
        <>
          <circle cx="23" cy="24" r="2.6" fill="#6E7687" />
          <circle cx="30.5" cy="30.5" r="1.8" fill="#6E7687" />
          <circle cx="24.5" cy="32" r="1.2" fill="#6E7687" />
        </>
      ) : (
        <>
          <path d="M16.5 25.5c4-1.5 8-1 12 0s6 .8 8.5 0" stroke="#E2864F" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M18 31c3.5-1 7-.6 10.5.2s5.5.5 7-.2" stroke="#8E3F27" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      <path d="M8.5 31C14 19.5 25 13 39.5 11.5" stroke="#F5B942" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="12.4" r="2.6" fill="#F2F5FF" />
    </svg>
  );
}
