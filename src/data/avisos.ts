// Textos de los avisos previos al lanzamiento (UX Brief 5.2, TRD 6.1).
// `dato` resume lo que dice la página de la NASA enlazada en `fuente`, leída el 2026-11-14.
// Contrastado con cada fuente y confirmado por el equipo el 2026-11-14.
// Los datos explican el porqué del aviso; el cálculo del juego usa valores PROVISIONALES de parametros.ts.

import type { AvisoId, TextoAviso } from '../engine/tipos';

export const AVISOS: Record<AvisoId, TextoAviso> = {
  energia: {
    nombre: 'Energía',
    ok: 'La energía alcanza para toda la misión.',
    riesgo: 'La energía se agota antes de terminar. Añade paneles o un reactor.',
    dato: 'En 2018 una tormenta de polvo tapó el Sol en Marte y el rover Opportunity, que usaba paneles solares, no pudo recargar sus baterías.',
    fuente: 'https://science.nasa.gov/solar-system/planets/mars/10-things-massive-dust-storm-on-mars/',
    verificada: true,
  },
  soporteVital: {
    nombre: 'Aire y agua',
    ok: 'Hay aire y agua para toda la misión.',
    riesgo: 'El aire o el agua no llegan al último día. Añade un reciclador.',
    dato: 'Según la NASA, cada astronauta consume cerca de 1 kg de oxígeno al día si hace ejercicio (0,77 kg en reposo).',
    fuente: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-002-eclss.pdf',
    verificada: true,
  },
  alimento: {
    nombre: 'Comida',
    ok: 'Hay comida para toda la misión.',
    riesgo: 'La comida no llega al último día. Añade un invernadero.',
    dato: 'En la Estación Espacial, el huerto Veggie cultiva plantas para añadir comida fresca a la dieta de los astronautas.',
    fuente: 'https://science.nasa.gov/mission/veggie/',
    verificada: true,
  },
  radiacion: {
    nombre: 'Radiación',
    ok: 'El blindaje reduce la radiación que recibe tu equipo.',
    riesgo: 'Sin blindaje, tu equipo recibe toda la radiación. Añade blindaje.',
    dato: 'El instrumento RAD del rover Curiosity midió en Marte unos 210 microgray de radiación al día durante sus primeros 10 meses.',
    fuente: 'https://science.nasa.gov/resource/radiation-measurements-on-mars/',
    verificada: true,
  },
  musculoHueso: {
    nombre: 'Músculos y huesos',
    ok: 'Los músculos y huesos aguantan. Haz ejercicio los días tranquilos.',
    riesgo: 'Con poca gravedad los músculos y huesos se debilitan. Añade un gimnasio.',
    dato: 'En microgravedad los astronautas pierden entre un 1 y un 2 % de masa ósea al mes, aunque hagan ejercicio.',
    fuente: 'https://science.nasa.gov/biological-physical/investigations/mabl-a/',
    verificada: true,
  },
  suenoEstres: {
    nombre: 'Descanso',
    ok: 'El descanso aguanta. Descansa los días tranquilos.',
    riesgo: 'Muchos días sin descansar bien agotan al equipo. Añade una zona de descanso.',
    dato: 'La NASA estudia cómo cambia el comportamiento de un grupo que vive aislado en un espacio pequeño durante mucho tiempo.',
    fuente: 'https://www.nasa.gov/hrp/hazards/',
    verificada: true,
  },
};
