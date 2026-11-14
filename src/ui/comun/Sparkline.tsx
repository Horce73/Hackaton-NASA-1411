import estilos from './Sparkline.module.css';

interface Props {
  titulo: string;
  valores: number[]; // al menos 2
  resumen: string; // la misma información en texto (UX Brief, sección 10)
  min?: number;
  max?: number;
}

// Línea de tendencia en SVG propio (TRD: sin librería de gráficas).
export function Sparkline({ titulo, valores, resumen, min = Math.min(...valores), max = Math.max(...valores) }: Props) {
  const rango = max - min || 1;
  const puntos = valores
    .map((v, i) => `${(i / (valores.length - 1)) * 100},${28 - ((v - min) / rango) * 26}`)
    .join(' ');
  return (
    <figure className={estilos.figura}>
      <figcaption>
        <span>{titulo}</span>
        <span className={estilos.resumen}>{resumen}</span>
      </figcaption>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" role="img" aria-label={`${titulo}: ${resumen}`}>
        <polyline points={puntos} />
      </svg>
    </figure>
  );
}
