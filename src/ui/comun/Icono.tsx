// Iconos propios, un solo trazo de 2 px. Siempre decorativos: el texto de al lado dice lo mismo.
const TRAZOS = {
  estrella: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z',
  ok: 'M5 12.5l4.5 4.5L19 7.5',
  alerta: 'M12 4L2.8 19.5h18.4zM12 10v4.5M12 17.2v.3',
  quitar: 'M6 6l12 12M18 6L6 18',
  mas: 'M12 5v14M5 12h14',
};

export function Icono({ nombre }: { nombre: keyof typeof TRAZOS }) {
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
