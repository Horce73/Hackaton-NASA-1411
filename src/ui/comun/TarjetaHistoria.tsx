import { useEffect, useRef, type ReactNode } from 'react';
import type { Historia } from '../../engine/tipos';
import { Icono } from './Icono';
import estilos from './TarjetaHistoria.module.css';

// Modal de historia (UX Brief 5.4). <dialog> con showModal deja el resto de la página inerte,
// mantiene el foco dentro y se cierra con Esc.
export function TarjetaHistoria({ historia, onCerrar }: { historia: Historia; onCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, [historia.id]);

  return (
    <dialog
      ref={dialogo}
      className={estilos.tarjeta}
      aria-labelledby="t-historia"
      onCancel={(e) => {
        e.preventDefault(); // Esc: cerramos desde el estado, no desde el navegador
        onCerrar();
      }}
    >
      <ContenidoHistoria historia={historia} titulo={<h2 id="t-historia">{historia.nombre}</h2>} />
      <button type="button" className={estilos.entendido} onClick={onCerrar} autoFocus>
        Entendido
      </button>
    </dialog>
  );
}

// También se usa en la bitácora, sin modal.
export function ContenidoHistoria({ historia, titulo }: { historia: Historia; titulo: ReactNode }) {
  return (
    <article className={estilos.contenido}>
      <img
        src={`${import.meta.env.BASE_URL}${historia.imagen.src}`}
        alt={historia.imagen.alt}
        width={historia.imagen.ancho}
        height={historia.imagen.alto}
        loading="lazy"
      />
      <div className={estilos.texto}>
        <p className={estilos.real}>
          <Icono nombre="estrella" /> Equipo real de la NASA
        </p>
        {titulo}
        <p className={estilos.cuando}>
          {historia.lugar}, {historia.anio}
        </p>
        <p>{historia.texto}</p>
        <p className={estilos.dato}>
          <strong>Dato curioso:</strong> {historia.datoCurioso}
        </p>
        <p className={estilos.fuentes}>
          <a href={historia.fuente} target="_blank" rel="noreferrer">
            Fuente: NASA<span className="solo-lectores"> (se abre en otra pestaña)</span>
          </a>
          {' · '}
          <a href={historia.imagen.fuente} target="_blank" rel="noreferrer">
            Imagen: NASA<span className="solo-lectores"> (se abre en otra pestaña)</span>
          </a>
        </p>
        {!historia.verificada && <p className={estilos.pendiente}>Texto pendiente de revisión por el equipo.</p>}
      </div>
    </article>
  );
}
