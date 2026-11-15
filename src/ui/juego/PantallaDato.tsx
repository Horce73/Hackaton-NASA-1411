import type { DatoCurioso } from '../../data/datosCuriosos';
import { LeyendaNegra } from '../comun/LeyendaNegra';
import { DiagramaDato } from './DiagramaDato';

// Dato curioso tras el resumen del día: diagrama o imagen arriba y la leyenda negra abajo.
// «No mostrar más» los desactiva; se pueden volver a activar desde el resumen del día.
export function PantallaDato({
  dato,
  continuar,
  onContinuar,
  onDesactivar,
}: {
  dato: DatoCurioso;
  continuar: string;
  onContinuar: () => void;
  onDesactivar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 pointer-events-auto bg-black">
      <figure className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 pt-6 pb-56 sm:pb-48">
        <p className="text-xs font-semibold tracking-[0.25em] text-white/60">DATO CURIOSO</p>
        {dato.imagen ? (
          <>
            <img src={`${import.meta.env.BASE_URL}${dato.imagen.src}`} alt={dato.imagen.alt} className="min-h-0 max-h-full max-w-full object-contain rounded-lg" />
            <figcaption className="text-xs text-white/60">{dato.imagen.credito}</figcaption>
          </>
        ) : (
          dato.diagrama && (
            <div className="min-h-0 flex-1 w-full flex items-center justify-center">
              <DiagramaDato diagrama={dato.diagrama} />
            </div>
          )
        )}
      </figure>
      <LeyendaNegra
        titulo={dato.titulo}
        texto={dato.texto.dato}
        fuente={dato.texto.fuente}
        principal={continuar}
        onPrincipal={onContinuar}
        secundario="No mostrar más"
        onSecundario={onDesactivar}
        onEscape={onContinuar}
      />
    </div>
  );
}
