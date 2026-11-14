import { useState } from 'react';
import { Rocket } from 'lucide-react';

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

export function EmblemaMision() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10 shrink-0" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="21" stroke="#C9D3E8" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="15" fill="#141B34" stroke="#E2674A" strokeWidth="1.5" />
      <path d="M12 31C18 22 27 17 37 15" stroke="#F5B942" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="18" r="3" fill="#F2F5FF" />
      <circle cx="17" cy="27" r="2" fill="#E2674A" />
    </svg>
  );
}
