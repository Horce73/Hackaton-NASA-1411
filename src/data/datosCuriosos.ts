// Datos curiosos: uno tras el resumen de cada día (se pueden desactivar). Cada uno lleva un diagrama propio o una
// imagen, su fuente y `verificada: false` hasta que el equipo lo contraste. Los equipos históricos elegidos
// también entran en la rotación, con su foto y su historia (RF-08).

import type { Archivo, Destino } from '../engine/tipos';
import { HISTORIAS_POR_ID } from './historias';

export type Diagrama = 'crateres' | 'cara-visible' | 'eclipse' | 'temperatura-luna' | 'olympus' | 'fobos';

export interface DatoCurioso {
  id: string;
  titulo: string;
  imagen?: { src: string; alt: string; credito: string };
  diagrama?: Diagrama;
  texto: Archivo;
}

const FUENTE_LUNA = 'https://science.nasa.gov/moon/facts/';

const CRATERES: DatoCurioso = {
  id: 'crateres',
  titulo: 'Los nombres de la cara visible',
  diagrama: 'crateres',
  texto: {
    dato: 'Las manchas oscuras se llaman mares, pero no tienen agua: son cuencas de impactos que se llenaron de lava. Los cráteres llevan nombres de científicos y pensadores, como Tycho, Copérnico, Kepler o Platón. Tycho mide más de 85 km de ancho, y el Apolo 11 alunizó en el mar de la Tranquilidad.',
    fuente: FUENTE_LUNA,
    verificada: false,
  },
};

const CARA_VISIBLE: DatoCurioso = {
  id: 'cara-visible',
  titulo: '¿Por qué vemos siempre la misma cara?',
  diagrama: 'cara-visible',
  texto: {
    dato: 'La Luna tarda unos 27 días en dar la vuelta a la Tierra y lo mismo en girar sobre sí misma. Por eso siempre nos enseña la misma cara: se llama rotación sincrónica. La cara oculta no está a oscuras: también tiene día y noche.',
    fuente: 'https://science.nasa.gov/moon/tidal-locking/',
    verificada: false,
  },
};

const ECLIPSE: DatoCurioso = {
  id: 'eclipse',
  titulo: 'La casualidad de los eclipses',
  diagrama: 'eclipse',
  texto: {
    dato: 'El Sol es unas 400 veces más ancho que la Luna, pero también está unas 400 veces más lejos. Por eso los dos se ven casi del mismo tamaño en el cielo y la Luna puede tapar el Sol justo en un eclipse total. La Luna se aleja unos 2,5 cm al año: dentro de muchos millones de años ya no lo tapará entera.',
    fuente: 'https://science.nasa.gov/eclipses/geometry/',
    verificada: false,
  },
};

const TEMPERATURA_LUNA: DatoCurioso = {
  id: 'temperatura-luna',
  titulo: 'Sin aire no hay abrigo',
  diagrama: 'temperatura-luna',
  texto: {
    dato: 'La Luna casi no tiene atmósfera que guarde el calor. Al sol, el suelo llega a unos 127 °C; de noche baja hasta unos −173 °C. Por eso tu hábitat y los trajes necesitan aislar y calentar tanto como enfriar.',
    fuente: FUENTE_LUNA,
    verificada: false,
  },
};

const OLYMPUS: DatoCurioso = {
  id: 'olympus',
  titulo: 'El volcán más grande',
  diagrama: 'olympus',
  texto: {
    dato: 'Olympus Mons, en Marte, mide más de 40 km desde la base hasta la cima. El Everest se eleva 8.848 m. Marte es rojo por el óxido, como el de un clavo oxidado: el hierro de sus rocas, su suelo y su polvo.',
    fuente: 'https://science.nasa.gov/mars/facts/',
    verificada: false,
  },
};

const FOBOS: DatoCurioso = {
  id: 'fobos',
  titulo: 'Una luna que se acerca',
  diagrama: 'fobos',
  texto: {
    dato: 'Fobos, la mayor de las dos lunas de Marte, da tres vueltas al planeta cada día. Se acerca 1,8 m cada siglo: dentro de unos 50 millones de años chocará con Marte o se romperá en un anillo.',
    fuente: 'https://science.nasa.gov/mars/moons/phobos/',
    verificada: false,
  },
};

const HABITAT: DatoCurioso = {
  id: 'habitat',
  titulo: 'Tu hábitat',
  imagen: {
    src: 'img/habitat-corte.webp',
    alt: 'Corte de un hábitat de superficie: abajo la esclusa, arriba el volumen habitable con dos plantas.',
    credito: 'Imagen: concepto de hábitat de superficie de la NASA (documento ASCEND 2023).',
  },
  texto: {
    dato: 'Tu hábitat sigue el que estudia la NASA para la superficie: abajo, una parte metálica de 4,4 m con la esclusa por la que sale la tripulación; encima, una parte inflable de 6,5 m de ancho y 5,2 m de alto con dos plantas para vivir.',
    fuente:
      'https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf',
    verificada: false,
  },
};

const BASE_LUNAR: DatoCurioso = {
  id: 'base-luna',
  titulo: 'Una base en la Luna',
  imagen: {
    src: 'img/base-luna.webp',
    alt: 'Ilustración de una base lunar: varios módulos, paneles y vehículos sobre el suelo gris.',
    credito: 'Imagen: NASA.',
  },
  texto: {
    dato: 'Así imagina la NASA una base en la Luna: varios hábitats, energía y vehículos trabajando juntos. Tu misión empieza más pequeña: un hábitat y los módulos que elegiste.',
    fuente: 'https://www.nasa.gov/moonbase-solicitations/',
    verificada: false,
  },
};

export const DATOS_DESTINO: Record<Destino, DatoCurioso[]> = {
  luna: [CRATERES, CARA_VISIBLE, ECLIPSE, BASE_LUNAR, TEMPERATURA_LUNA, HABITAT],
  marte: [OLYMPUS, FOBOS, HABITAT],
};

function datoDeHistoria(id: string): DatoCurioso | null {
  const h = HISTORIAS_POR_ID[id];
  if (!h) return null;
  return {
    id: `historia:${h.id}`,
    titulo: `${h.anio} · ${h.nombre}`,
    imagen: { src: h.imagen.src, alt: h.imagen.alt, credito: 'Imagen: NASA.' },
    texto: { dato: h.texto, fuente: h.fuente, verificada: h.verificada },
  };
}

// Rotación de la misión: alterna los datos del destino con los equipos históricos elegidos.
export function datosDeLaMision(destino: Destino, historias: string[]): DatoCurioso[] {
  const propios = DATOS_DESTINO[destino];
  const deHistorias = historias.flatMap((id) => datoDeHistoria(id) ?? []);
  const total = Math.max(propios.length, deHistorias.length);
  return Array.from({ length: total }, (_, i) => [propios[i], deHistorias[i]]).flat().filter((d) => d !== undefined);
}

// El siguiente sin ver; cuando ya se vieron todos, la rotación vuelve a empezar.
export function siguienteDato(datos: DatoCurioso[], vistos: string[]): { id: string; vistos: string[] } | null {
  if (datos.length === 0) return null;
  const nuevo = datos.find((d) => !vistos.includes(d.id));
  return nuevo ? { id: nuevo.id, vistos: [...vistos, nuevo.id] } : { id: datos[0].id, vistos: [datos[0].id] };
}
