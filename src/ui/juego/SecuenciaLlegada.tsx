import { useEffect, useRef } from 'react';
import { sonido } from '../../audio/sonido';
import { AMANECER } from '../../data/llegada';
import type { Destino } from '../../engine/tipos';
import { LeyendaNegra } from '../comun/LeyendaNegra';

// Llegada: una sola pantalla, el amanecer en 3D con el título y un dato sobre el día del destino.
// Al terminar, la tripulación espera dentro hasta que se decide el día.
export function SecuenciaLlegada({ destino, onTerminar }: { destino: Destino; onTerminar: () => void }) {
  const pantalla = AMANECER[destino];
  const sonado = useRef(false);

  // La fanfarria suena una vez, con el amanecer (respeta el silenciado).
  useEffect(() => {
    if (sonado.current) return;
    sonado.current = true;
    sonido.fanfarria();
  }, []);

  return (
    <div className="fixed inset-0 z-40 pointer-events-auto">
      {/* Franja negra de cine y el título; detrás se ve la escena 3D. */}
      <div className="absolute inset-x-0 top-0 h-[16vh] bg-black" />
      <div className="absolute inset-x-0 top-[22vh] text-center px-4">
        <p className="text-3xl sm:text-5xl font-bold tracking-[0.35em] text-white drop-shadow-lg">MISIÓN LEGADO</p>
        <p className="mt-3 text-sm sm:text-base tracking-[0.25em] text-white/80">
          DÍA 1 · {destino === 'luna' ? 'LA LUNA' : 'MARTE'}
        </p>
      </div>
      <LeyendaNegra
        titulo={pantalla.titulo}
        texto={pantalla.texto.dato}
        fuente={pantalla.texto.fuente}
        principal="Empezar la misión"
        onPrincipal={onTerminar}
      />
    </div>
  );
}
