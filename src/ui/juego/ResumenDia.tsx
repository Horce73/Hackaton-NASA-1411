import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { DeltaTurno } from '../../engine/tipos';
import type { ResumenDia as Resumen } from '../../state/reducer';
import { numero } from '../comun/formato';

const RECURSOS: { clave: 'energia' | 'alimento' | 'oxigeno' | 'agua'; nombre: string }[] = [
  { clave: 'energia', nombre: 'Energía' },
  { clave: 'alimento', nombre: 'Alimento' },
  { clave: 'oxigeno', nombre: 'Oxígeno' },
  { clave: 'agua', nombre: 'Agua' },
];

function conSigno(valor: number): string {
  return `${valor > 0 ? '+' : ''}${numero(valor)}`;
}

// Resumen del día (RF-15): sale cuando la tripulación ya entró en el hábitat. Lo hecho, lo que quedó y lo que
// cambió. Desde aquí se activan o desactivan los datos curiosos. Vive dentro del <main> de PantallaJuego, que no
// recibe el ratón (pointer-events-none para la escena 3D): por eso el diálogo lo vuelve a activar.
export function ResumenDia({
  resumen,
  delta,
  terminada,
  datosActivos,
  onDatosActivos,
  onContinuar,
}: {
  resumen: Resumen;
  delta: DeltaTurno | undefined;
  terminada: boolean;
  datosActivos: boolean;
  onDatosActivos: (activos: boolean) => void;
  onContinuar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
    boton.current?.focus();
  }, []);

  const hechas = resumen.tareas.filter((t) => t.hecha).length;

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-resumen-dia"
      onCancel={(e) => {
        e.preventDefault();
        onContinuar();
      }}
      className="pointer-events-auto fixed inset-0 z-50 m-auto w-[min(100%-2rem,32rem)] max-h-[92dvh] overflow-y-auto rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-0 text-[var(--color-text)] shadow-2xl backdrop:bg-black/60"
    >
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs font-mono text-[var(--color-warn)]">
            {terminada ? 'Fin de la misión' : 'La tripulación está dentro'}
          </p>
          <h2 id="titulo-resumen-dia" className="text-xl font-bold">
            Resumen del día {resumen.dia}
          </h2>
          {delta?.opcionTexto && <p className="text-sm text-[var(--color-text-muted)]">{delta.opcionTexto}</p>}
        </div>

        {resumen.tareas.length > 0 && (
          <section aria-label="Tareas del día">
            <h3 className="text-sm font-semibold mb-1.5">
              Tareas: {hechas} de {resumen.tareas.length}
            </h3>
            <ul className="space-y-1">
              {resumen.tareas.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {t.hecha ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ok)]" aria-label="Hecha" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" aria-label="Sin hacer" />
                  )}
                  <span className={t.hecha ? '' : 'text-[var(--color-text-muted)]'}>
                    {t.etiqueta}
                    {t.tipo === 'ciencia' && ' (opcional)'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {delta && (
          <section aria-label="Cambios del día" className="space-y-2">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {RECURSOS.map(({ clave, nombre }) => (
                <div key={clave} className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">{nombre}</dt>
                  <dd className={`font-mono ${delta[clave] < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-ok)]'}`}>
                    {conSigno(delta[clave])}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Ciencia</dt>
                <dd className="font-mono text-[var(--color-ok)]">{conSigno(delta.ciencia)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Radiación</dt>
                <dd className="font-mono text-[var(--color-warn)]">+{numero(delta.dosisMedia)} mSv</dd>
              </div>
            </dl>
            {delta.modulosParados ? (
              <p className="text-xs text-[var(--color-warn)] leading-snug">
                {delta.modulosParados} módulo(s) sin mantenimiento no rindieron.
              </p>
            ) : null}
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={datosActivos}
              onChange={(e) => onDatosActivos(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-mars)]"
            />
            Mostrar datos curiosos
          </label>
          <button
            ref={boton}
            type="button"
            onClick={onContinuar}
            className="min-h-[44px] rounded-lg bg-[var(--color-mars)] px-5 font-semibold text-[var(--color-on-accent)] cursor-pointer"
          >
            {terminada && !datosActivos ? 'Ver la bitácora' : 'Continuar'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
