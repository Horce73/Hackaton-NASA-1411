// Iconos propios, un solo trazo de 2 px. Siempre decorativos: el texto de al lado dice lo mismo.
const TRAZOS = {
  estrella: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z',
  ok: 'M5 12.5l4.5 4.5L19 7.5',
  alerta: 'M12 4L2.8 19.5h18.4zM12 10v4.5M12 17.2v.3',
  quitar: 'M6 6l12 12M18 6L6 18',
  mas: 'M12 5v14M5 12h14',
  energia: 'M13 3L5 13.5h5.5L10 21l8-10.5h-5.5z',
  alimento: 'M12 8c-2.5-2-6.5-.5-6.5 4 0 4 3 8 6.5 7 3.5 1 6.5-3 6.5-7 0-4.5-4-6-6.5-4zM12 8c0-2 1-3.5 2.5-4',
  oxigeno: 'M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5M3 14h14.5a2.5 2.5 0 1 1-2.5 2.5',
  agua: 'M12 3.5c3.5 4.5 6 7.5 6 10.5a6 6 0 0 1-12 0c0-3 2.5-6 6-10.5z',
  radiacion:
    'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
};

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre }: { nombre: NombreIcono }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
