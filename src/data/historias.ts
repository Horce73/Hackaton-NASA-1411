// Tarjetas de historia (RF-08).
// `texto` y `datoCurioso` resumen solo lo que dice la página de `fuente`, leída el 2026-11-14.
// Imágenes de la biblioteca de la NASA (images.nasa.gov), en public/img/ como WebP de 800 px como máximo.
// Revisado y confirmado por el equipo el 2026-11-14 (`verificada: true`).

import type { Historia } from '../engine/tipos';
import { AVISOS } from './avisos';

// `medicion` (RF-17): lo que midió cada misión, la nota que se anota al inspeccionar el equipo en 3D.
// Las que vienen de avisos.ts ya están verificadas; las demás llevan `verificada: false` hasta contrastarlas.

export const HISTORIAS: Historia[] = [
  {
    id: 'retrorreflector',
    medicion: {
      dato: 'Disparando un láser a estos espejos desde la Tierra se midió que la Luna se aleja de nosotros unos 3,8 centímetros cada año.',
      fuente: 'https://www.nasa.gov/missions/apollo/apollo-11/the-apollo-experiment-that-keeps-on-giving/',
      verificada: false,
    },
    nombre: 'Retrorreflector láser (Apolo 11)',
    lugar: 'Luna',
    anio: '1969',
    texto:
      'En 1969, los astronautas del Apolo 11 dejaron en la Luna un panel de espejos especiales. Desde la Tierra se lanza un rayo láser y los espejos lo devuelven al mismo sitio. Así se mide con mucha precisión la distancia entre la Tierra y la Luna.',
    datoCurioso: 'Los espejos son cubos de un cristal llamado sílice fundida.',
    fuente: 'https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=1969-059C-04',
    imagen: {
      src: 'img/retrorreflector.webp',
      alt: 'Buzz Aldrin en la Luna, junto a los experimentos que acaba de instalar en el Apolo 11.',
      ancho: 800,
      alto: 800,
      fuente: 'https://images.nasa.gov/details/as11-40-5948',
    },
    verificada: true,
  },
  {
    id: 'alsep',
    medicion: {
      dato: 'Entre 1969 y 1976, el espectrómetro del ALSEP del Apolo 12 midió las partículas del viento solar que llegaban a la superficie de la Luna.',
      fuente: 'https://pds-geosciences.wustl.edu/Lunar/urn-nasa-pds-a12sws_solar_wind_28s_1hr/document/a12a_sws.txt',
      verificada: false,
    },
    nombre: 'ALSEP (estaciones de ciencia, Apolo 12–17)',
    lugar: 'Luna',
    anio: '1969–72',
    texto:
      'Los astronautas del Apolo 12 montaron en la Luna una estación de ciencia llamada ALSEP, y otras misiones Apolo dejaron más. Su sismómetro medía los temblores de la Luna. La electricidad venía de un pequeño generador nuclear.',
    datoCurioso: 'Todas las estaciones ALSEP se apagaron el 30 de septiembre de 1977.',
    fuente: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C',
    imagen: {
      src: 'img/alsep.webp',
      alt: 'Alan Bean coloca en la Luna las piezas de la estación ALSEP durante el Apolo 12.',
      ancho: 800,
      alto: 800,
      fuente: 'https://images.nasa.gov/details/as12-47-6919',
    },
    verificada: true,
  },
  {
    id: 'lrv',
    medicion: {
      dato: 'En el Apolo 17 se rompió un guardabarros del rover y el polvo cubrió a los astronautas. La cinta no pegaba con tanto polvo: hicieron uno nuevo con cuatro mapas y pinzas.',
      fuente: 'https://www.hq.nasa.gov/alsj/a17/A17NewFender.html',
      verificada: false,
    },
    nombre: 'Vehículo lunar (LRV, Apolo 15–17)',
    lugar: 'Luna',
    anio: '1971–72',
    texto:
      'Los astronautas de los Apolo 15, 16 y 17 condujeron por la Luna un vehículo eléctrico. Viajaba plegado dentro del módulo lunar y se desplegaba al llegar. Sus baterías no se podían recargar.',
    datoCurioso: 'En el Apolo 17 el vehículo recorrió 35,9 km en total.',
    fuente: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html',
    imagen: {
      src: 'img/lrv.webp',
      alt: 'James Irwin trabaja junto al vehículo lunar en el Apolo 15, con montañas lunares al fondo.',
      ancho: 800,
      alto: 800,
      fuente: 'https://images.nasa.gov/details/as15-86-11603',
    },
    verificada: true,
  },
  {
    id: 'surveyor-3',
    medicion: {
      dato: 'Los astronautas del Apolo 12 se llevaron su cámara a la Tierra. Tras más de dos años en la Luna había aguantado bien, pero el polvo y la radiación habían cambiado el color de sus materiales.',
      fuente: 'https://ntrs.nasa.gov/citations/19710024418',
      verificada: false,
    },
    nombre: 'Surveyor 3',
    lugar: 'Luna',
    anio: '1967',
    texto:
      'En 1967, la sonda Surveyor 3 se posó sola en la Luna y rebotó dos veces antes de quedarse quieta. Llevaba una pala para escarbar el suelo. Dos años después, los astronautas del Apolo 12 aterrizaron a unos 180 metros de ella.',
    datoCurioso: 'Los astronautas del Apolo 12 se llevaron a la Tierra piezas de la sonda, entre ellas la pala y la cámara.',
    fuente: 'https://science.nasa.gov/mission/surveyor-3/',
    imagen: {
      src: 'img/surveyor-3.webp',
      alt: 'Un astronauta del Apolo 12 junto a la sonda Surveyor 3, con el módulo lunar al fondo.',
      ancho: 800,
      alto: 800,
      fuente: 'https://images.nasa.gov/details/AS12-48-7133',
    },
    verificada: true,
  },
  {
    id: 'sojourner',
    medicion: {
      dato: 'Mars Pathfinder, la nave que llevó a Sojourner, detectó remolinos de polvo: cuando pasaba uno, la presión del aire bajaba de golpe.',
      fuente: 'https://nssdc.gsfc.nasa.gov/planetary/marspath/dustdevil.html',
      verificada: false,
    },
    nombre: 'Sojourner',
    lugar: 'Marte',
    anio: '1997',
    texto:
      'En 1997, Sojourner fue el primer rover que llegó a Marte. Viajó dentro de la nave Mars Pathfinder, que aterrizó envuelta en bolsas de aire para amortiguar el golpe. Medía unos 30 centímetros de alto.',
    datoCurioso: 'Pesaba solo 10,6 kilos.',
    fuente: 'https://science.nasa.gov/mission/mars-pathfinder/',
    imagen: {
      src: 'img/sojourner.webp',
      alt: 'El pequeño rover Sojourner entre las rocas de Marte, en una foto en blanco y negro.',
      ancho: 800,
      alto: 405,
      fuente: 'https://images.nasa.gov/details/PIA04318',
    },
    verificada: true,
  },
  {
    id: 'spirit-opportunity',
    medicion: AVISOS.energia,
    nombre: 'Spirit y Opportunity',
    lugar: 'Marte',
    anio: '2004',
    texto:
      'En enero de 2004 llegaron a Marte dos rovers gemelos, Spirit y Opportunity. Confirmaron que hace mucho tiempo hubo agua en la superficie de Marte. Spirit terminó su misión en 2010.',
    datoCurioso: 'Opportunity llegó a tener el récord de distancia recorrida fuera de la Tierra: 45,16 km.',
    fuente: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    imagen: {
      src: 'img/spirit-opportunity.webp',
      alt: 'Ilustración de uno de los rovers gemelos sobre el suelo rojizo de Marte.',
      ancho: 800,
      alto: 600,
      fuente: 'https://images.nasa.gov/details/PIA04239',
    },
    verificada: true,
  },
  {
    id: 'curiosity',
    medicion: AVISOS.radiacion,
    nombre: 'Curiosity',
    lugar: 'Marte',
    anio: '2012',
    texto:
      'El 6 de agosto de 2012, Curiosity aterrizó en el cráter Gale, en Marte. Es del tamaño de un coche todoterreno pequeño. Su misión es averiguar si Marte pudo tener vida microscópica alguna vez.',
    datoCurioso: 'Mide unos 3 metros de largo sin contar su brazo.',
    fuente: 'https://science.nasa.gov/mission/msl-curiosity/',
    imagen: {
      src: 'img/curiosity.webp',
      alt: 'Autorretrato del rover Curiosity en Marte, hecho con la cámara de su brazo.',
      ancho: 558,
      alto: 800,
      fuente: 'https://images.nasa.gov/details/PIA16764',
    },
    verificada: true,
  },
  {
    id: 'perseverance-ingenuity',
    medicion: {
      dato: 'En 2021 el instrumento MOXIE de Perseverance sacó oxígeno del aire de Marte, que es casi todo dióxido de carbono.',
      fuente: 'https://www.nasa.gov/news-release/nasas-perseverance-mars-rover-extracts-first-oxygen-from-red-planet/',
      verificada: false,
    },
    nombre: 'Perseverance e Ingenuity',
    lugar: 'Marte',
    anio: '2021',
    texto:
      'El 18 de febrero de 2021, Perseverance aterrizó en el cráter Jezero, en Marte. Guarda muestras de rocas para que una misión futura pueda traerlas a la Tierra. Con él viajó Ingenuity, un pequeño helicóptero.',
    datoCurioso: 'Ingenuity fue la primera aeronave en hacer un vuelo con motor y controlado en otro planeta. Hizo 72 vuelos.',
    fuente: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    imagen: {
      src: 'img/perseverance-ingenuity.webp',
      alt: 'Autorretrato de Perseverance en Marte, con el helicóptero Ingenuity en el suelo detrás.',
      ancho: 800,
      alto: 588,
      fuente: 'https://images.nasa.gov/details/PIA24542',
    },
    verificada: true,
  },
];

// Índice por id: el HUD, la bitácora y la escena resuelven historias por identificador.
export const HISTORIAS_POR_ID: Record<string, Historia> = Object.fromEntries(
  HISTORIAS.map((historia) => [historia.id, historia]),
);
