import type { ReactNode } from 'react';
import type { Diagrama } from '../../data/datosCuriosos';

// Diagramas propios de los datos curiosos: esquemas, no a escala salvo donde se indica.
const TEXTO = { fill: 'var(--color-text)', fontSize: 14 } as const;
const TENUE = { fill: 'var(--color-text-muted)', fontSize: 12 } as const;

function Lienzo({ ancho, alto, titulo, children }: { ancho: number; alto: number; titulo: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={titulo} className="h-full w-full max-w-3xl">
      {children}
    </svg>
  );
}

// Cara visible en proyección ortográfica: norte arriba y este a la derecha, como se ve desde la Tierra.
const R = 170;
function proyectar(lat: number, lon: number): [number, number] {
  const a = (lat * Math.PI) / 180;
  const b = (lon * Math.PI) / 180;
  return [200 + R * Math.cos(a) * Math.sin(b), 200 - R * Math.sin(a)];
}
// Mares: latitud, longitud y radio aproximado (fracción del radio lunar).
const MARES: [string, number, number, number][] = [
  ['Mar de la Lluvia', 32.8, -15.6, 0.33],
  ['Mar de la Serenidad', 28, 17.5, 0.19],
  ['Mar de la Tranquilidad', 8.5, 31.4, 0.25],
  ['Mar de las Crisis', 17, 59.1, 0.16],
  ['Mar de las Nubes', -21.3, -16.6, 0.21],
  ['Mar de la Fecundidad', -7.8, 51.3, 0.24],
];
// Cráteres: latitud, longitud y si la etiqueta va a la izquierda para no pisar a otro.
const CRATERES: [string, number, number, boolean][] = [
  ['Tycho', -43.3, -11.2, false],
  ['Copérnico', 9.6, -20.1, false],
  ['Kepler', 8.1, -38, true],
  ['Aristarco', 23.7, -47.4, true],
  ['Platón', 51.6, -9.4, false],
];

function Crateres() {
  const [xa, ya] = proyectar(0.67, 23.47);
  const [xt, yt] = proyectar(-43.3, -11.2);
  return (
    <Lienzo ancho={400} alto={400} titulo="Mapa de la cara visible de la Luna con sus mares y cráteres principales">
      <circle cx={200} cy={200} r={R} fill="#8d95a6" />
      {/* Océano de las Tormentas: irregular, aquí como una elipse */}
      <ellipse cx={proyectar(15, -55)[0]} cy={proyectar(15, -55)[1]} rx={R * 0.2} ry={R * 0.42} fill="#4b5262" />
      {MARES.map(([nombre, lat, lon, r]) => {
        const [x, y] = proyectar(lat, lon);
        const escalaX = Math.cos((lon * Math.PI) / 180);
        const escalaY = Math.cos((lat * Math.PI) / 180);
        return <ellipse key={nombre} cx={x} cy={y} rx={R * r * escalaX} ry={R * r * escalaY} fill="#4b5262" />;
      })}
      {[0, 40, 80, 130, 170, 215, 260, 300].map((g) => {
        const a = (g * Math.PI) / 180;
        return (
          <line key={g} x1={xt} y1={yt} x2={xt + Math.cos(a) * 60} y2={yt + Math.sin(a) * 60} stroke="#c9d3e8" strokeOpacity={0.45} />
        );
      })}
      {CRATERES.map(([nombre, lat, lon, izquierda]) => {
        const [x, y] = proyectar(lat, lon);
        return (
          <g key={nombre}>
            <circle cx={x} cy={y} r={5} fill="#c9d3e8" stroke="#0b1020" />
            <text x={izquierda ? x - 8 : x + 8} y={y + 4} textAnchor={izquierda ? 'end' : 'start'} {...TEXTO} fontWeight={600} stroke="#0b1020" strokeWidth={3} paintOrder="stroke">
              {nombre}
            </text>
          </g>
        );
      })}
      <circle cx={xa} cy={ya} r={5} fill="var(--color-warn)" />
      <text x={xa + 8} y={ya + 4} {...TEXTO} fill="var(--color-warn)" stroke="#0b1020" strokeWidth={3} paintOrder="stroke">
        Apolo 11
      </text>
      <text x={proyectar(8.5, 31.4)[0] - 50} y={proyectar(8.5, 31.4)[1] - 24} {...TENUE} fill="#e5e9f2">
        Mar de la Tranquilidad
      </text>
      <text x={proyectar(32.8, -15.6)[0] - 46} y={proyectar(32.8, -15.6)[1] + 4} {...TENUE} fill="#e5e9f2">
        Mar de la Lluvia
      </text>
      <text x={200} y={396} textAnchor="middle" {...TENUE}>
        Esquema aproximado · norte arriba
      </text>
    </Lienzo>
  );
}

function CaraVisible() {
  const posiciones = [0, 90, 180, 270];
  return (
    <Lienzo ancho={400} alto={400} titulo="La Luna en cuatro puntos de su órbita, siempre con la misma cara hacia la Tierra">
      <circle cx={200} cy={200} r={140} fill="none" stroke="var(--color-border-strong)" strokeDasharray="4 6" />
      {/* Vista desde encima del polo norte: la Luna gira en sentido antihorario */}
      <path d="M 330 135 A 140 140 0 0 0 300 90" fill="none" stroke="var(--color-text-muted)" strokeWidth={2} markerEnd="url(#flecha)" />
      <defs>
        <marker id="flecha" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--color-text-muted)" />
        </marker>
      </defs>
      <circle cx={200} cy={200} r={34} fill="#2f6fb5" />
      <path d="M 180 186 q 12 -10 26 -2 q 6 12 -6 18 q -14 4 -20 -16 z" fill="#4cae6a" />
      <text x={200} y={256} textAnchor="middle" {...TEXTO}>Tierra</text>
      {posiciones.map((g) => {
        const a = (g * Math.PI) / 180;
        const x = 200 + Math.cos(a) * 140;
        const y = 200 + Math.sin(a) * 140;
        // La cara visible (marcada) siempre mira al centro: la Luna gira una vez por vuelta.
        const hacia = a + Math.PI;
        return (
          <g key={g}>
            <circle cx={x} cy={y} r={20} fill="#8d95a6" />
            <path
              d={`M ${x + Math.cos(hacia - Math.PI / 2) * 20} ${y + Math.sin(hacia - Math.PI / 2) * 20} A 20 20 0 0 1 ${x + Math.cos(hacia + Math.PI / 2) * 20} ${y + Math.sin(hacia + Math.PI / 2) * 20} Z`}
              fill="var(--color-warn)"
            />
          </g>
        );
      })}
      <rect x={18} y={366} width={14} height={14} fill="var(--color-warn)" />
      <text x={40} y={378} {...TENUE}>Cara visible: siempre mira a la Tierra</text>
    </Lienzo>
  );
}

function Eclipse() {
  return (
    <Lienzo ancho={600} alto={320} titulo="El Sol es 400 veces más ancho que la Luna y está 400 veces más lejos: se ven del mismo tamaño">
      <circle cx={-60} cy={150} r={170} fill="var(--color-warn)" />
      <text x={20} y={150} {...TEXTO} fill="#0b1020" fontWeight={700}>Sol</text>
      <polygon points="40,20 540,150 40,280" fill="var(--color-warn)" fillOpacity={0.08} />
      <line x1={40} y1={20} x2={540} y2={150} stroke="var(--color-warn)" strokeOpacity={0.5} />
      <line x1={40} y1={280} x2={540} y2={150} stroke="var(--color-warn)" strokeOpacity={0.5} />
      <circle cx={420} cy={150} r={31} fill="#8d95a6" />
      <text x={420} y={102} textAnchor="middle" {...TEXTO}>Luna</text>
      <circle cx={556} cy={150} r={14} fill="#2f6fb5" />
      <text x={556} y={186} textAnchor="middle" {...TEXTO}>Tierra</text>
      <text x={300} y={300} textAnchor="middle" {...TENUE}>
        Desde la Tierra, el disco de la Luna tapa justo el del Sol · no a escala
      </text>
      <text x={150} y={40} {...TEXTO}>400 veces más ancho</text>
      <text x={150} y={58} {...TEXTO}>y 400 veces más lejos</text>
    </Lienzo>
  );
}

function TemperaturaLuna() {
  // Escala: 1 °C = 0,7 px, con 0 °C en y = 140.
  const y = (c: number) => 140 - c * 0.7;
  return (
    <Lienzo ancho={400} alto={320} titulo="Temperatura del suelo lunar: unos 127 grados al sol y unos menos 173 de noche">
      <line x1={60} y1={y(0)} x2={360} y2={y(0)} stroke="var(--color-border-strong)" />
      <text x={52} y={y(0) + 4} textAnchor="end" {...TENUE}>0 °C</text>
      <rect x={110} y={y(127)} width={70} height={y(0) - y(127)} fill="var(--color-danger)" rx={4} />
      <text x={145} y={y(127) - 8} textAnchor="middle" {...TEXTO} fontWeight={700}>127 °C</text>
      <text x={145} y={y(127) - 26} textAnchor="middle" {...TENUE}>Día, al sol</text>
      <rect x={230} y={y(0)} width={70} height={y(-173) - y(0)} fill="#5b8def" rx={4} />
      <text x={265} y={y(-173) + 22} textAnchor="middle" {...TEXTO} fontWeight={700}>−173 °C</text>
      <text x={265} y={y(-173) + 40} textAnchor="middle" {...TENUE}>Noche</text>
    </Lienzo>
  );
}

function Olympus() {
  // A escala vertical: 1 km = 6 px; el ancho está muy comprimido.
  const suelo = 280;
  return (
    <Lienzo ancho={600} alto={320} titulo="Perfil de Olympus Mons, más de 40 km, junto al Everest, 8,8 km">
      <line x1={20} y1={suelo} x2={580} y2={suelo} stroke="var(--color-border-strong)" />
      <path d={`M 40 ${suelo} Q 160 ${suelo - 230} 250 ${suelo - 240} Q 340 ${suelo - 230} 460 ${suelo} Z`} fill="var(--color-mars)" />
      <text x={250} y={suelo - 252} textAnchor="middle" {...TEXTO} fontWeight={700}>Olympus Mons · más de 40 km</text>
      <path d={`M 500 ${suelo} L 530 ${suelo - 53} L 560 ${suelo} Z`} fill="#c9d3e8" />
      <text x={530} y={suelo - 62} textAnchor="middle" {...TEXTO}>Everest · 8,8 km</text>
      <text x={300} y={308} textAnchor="middle" {...TENUE}>Altura a escala · anchura muy comprimida</text>
    </Lienzo>
  );
}

function Fobos() {
  // Radios a escala: Marte 3.390 km, órbita de Fobos unos 9.400 km, de Deimos unos 23.500 km (1 px = 120 km).
  return (
    <Lienzo ancho={420} alto={420} titulo="Marte con las órbitas de Fobos, muy cerca, y de Deimos, más lejos">
      <circle cx={210} cy={210} r={196} fill="none" stroke="var(--color-border-strong)" strokeDasharray="4 6" />
      <circle cx={210} cy={210} r={78} fill="none" stroke="var(--color-warn)" strokeDasharray="4 4" />
      <circle cx={210} cy={210} r={28} fill="var(--color-mars)" />
      <text x={210} y={215} textAnchor="middle" {...TENUE} fill="#0b1020" fontWeight={700}>Marte</text>
      <circle cx={265} cy={155} r={6} fill="#c9a98a" />
      <text x={276} y={150} {...TEXTO} fill="var(--color-warn)">Fobos: 3 vueltas al día</text>
      <circle cx={210 - 196} cy={210} r={4} fill="#c9a98a" />
      <text x={24} y={240} {...TEXTO}>Deimos</text>
      <text x={210} y={410} textAnchor="middle" {...TENUE}>Distancias a escala · lunas agrandadas</text>
    </Lienzo>
  );
}

const DIAGRAMAS: Record<Diagrama, () => ReactNode> = {
  crateres: Crateres,
  'cara-visible': CaraVisible,
  eclipse: Eclipse,
  'temperatura-luna': TemperaturaLuna,
  olympus: Olympus,
  fobos: Fobos,
};

export function DiagramaDato({ diagrama }: { diagrama: Diagrama }) {
  const Componente = DIAGRAMAS[diagrama];
  return <Componente />;
}
