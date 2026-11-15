// Textos de los avisos previos al lanzamiento (UX Brief 5.2, TRD 6.1).
// `dato` resume lo que dice la página de la NASA enlazada en `fuente`, leída el 2026-11-14.
// Contrastado con cada fuente y confirmado por el equipo el 2026-11-14.
// Los datos explican el porqué del aviso; el cálculo del juego usa valores PROVISIONALES de parametros.ts.
// `historia`: un caso real que explica el porqué. Sale en el «¿Por qué?» de cada módulo del diseño y en la bitácora
// cuando la misión se aborta por ese indicador. Llevan `verificada: false` hasta que el equipo los contraste.

import type { AvisoId, TextoAviso } from '../engine/tipos';

export const AVISOS: Record<AvisoId, TextoAviso> = {
  energia: {
    nombre: 'Energía',
    ok: 'La energía alcanza para toda la misión.',
    riesgo: 'La energía se agota antes de terminar. Añade paneles o un reactor.',
    dato: 'En 2018 una tormenta de polvo tapó el Sol en Marte y el rover Opportunity, que usaba paneles solares, no pudo recargar sus baterías.',
    fuente: 'https://science.nasa.gov/solar-system/planets/mars/10-things-massive-dust-storm-on-mars/',
    verificada: true,
    historia: {
      dato: 'Los astronautas de los Apolo 15, 16 y 17 condujeron por la Luna un vehículo eléctrico con baterías que no se podían recargar: solo servía mientras durara la carga.',
      fuente: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html',
      verificada: true, // resume la historia del vehículo lunar, ya confirmada
    },
  },
  soporteVital: {
    nombre: 'Aire y agua',
    ok: 'Hay aire y agua para toda la misión.',
    riesgo: 'El aire o el agua no llegan al último día. Añade un reciclador.',
    dato: 'Según la NASA, cada astronauta consume cerca de 1 kg de oxígeno al día si hace ejercicio (0,77 kg en reposo).',
    fuente: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-002-eclss.pdf',
    verificada: true,
    historia: {
      dato: 'En 1970 explotó un tanque de oxígeno del Apolo 13 camino de la Luna. La misión se abortó y la tripulación volvió a salvo; para limpiar el aire tuvieron que improvisar un filtro con bolsas, cartón y cinta.',
      fuente: 'https://www.nasa.gov/missions/apollo/apollo-13-the-successful-failure/',
      verificada: false,
    },
  },
  alimento: {
    nombre: 'Comida',
    ok: 'Hay comida para toda la misión.',
    riesgo: 'La comida no llega al último día. Añade un invernadero.',
    dato: 'En la Estación Espacial, el huerto Veggie cultiva plantas para añadir comida fresca a la dieta de los astronautas.',
    fuente: 'https://science.nasa.gov/mission/veggie/',
    verificada: true,
    historia: {
      dato: 'Antes ya se habían cultivado plantas en el espacio, pero se enviaban a la Tierra para estudiarlas. En 2015, en la Estación Espacial, unos astronautas comieron por primera vez algo cultivado allí: una lechuga roja del huerto Veggie.',
      fuente: 'https://blogs.nasa.gov/kennedy/2015/08/11/veggie-success-benefits-journey-to-mars-and-eaters-on-earth/',
      verificada: false,
    },
  },
  radiacion: {
    nombre: 'Radiación',
    ok: 'El blindaje reduce la radiación que recibe tu equipo.',
    riesgo: 'Sin blindaje, tu equipo recibe toda la radiación. Añade blindaje.',
    dato: 'El instrumento RAD del rover Curiosity midió en Marte unos 210 microgray de radiación al día durante sus primeros 10 meses.',
    fuente: 'https://science.nasa.gov/resource/radiation-measurements-on-mars/',
    verificada: true,
    historia: {
      dato: 'La radiación del espacio se conoce desde 1958: el contador Geiger del satélite Explorer 1 se saturó y así se descubrieron los cinturones de radiación de la Tierra. Lejos de ella no hay atmósfera ni campo magnético que proteja. En agosto de 1972, entre el Apolo 16 y el 17, una gran tormenta solar habría puesto en peligro a una tripulación en la Luna.',
      fuente: 'https://www.jpl.nasa.gov/missions/explorer-1/',
      verificada: false,
    },
  },
  musculoHueso: {
    nombre: 'Músculos y huesos',
    ok: 'Los músculos y huesos aguantan. Haz ejercicio los días tranquilos.',
    riesgo: 'Con poca gravedad los músculos y huesos se debilitan. Añade un gimnasio.',
    dato: 'En microgravedad los astronautas pierden entre un 1 y un 2 % de masa ósea al mes, aunque hagan ejercicio.',
    fuente: 'https://science.nasa.gov/biological-physical/investigations/mabl-a/',
    verificada: true,
    historia: {
      dato: 'Para frenar esa pérdida, en la Estación Espacial cada astronauta hace unas dos horas de ejercicio al día, con cinta de correr, bicicleta y una máquina de pesas.',
      fuente: 'https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/',
      verificada: false,
    },
  },
  suenoEstres: {
    nombre: 'Descanso',
    ok: 'El descanso aguanta. Descansa los días tranquilos.',
    riesgo: 'Muchos días sin descansar bien agotan al equipo. Añade una zona de descanso.',
    dato: 'La NASA estudia cómo cambia el comportamiento de un grupo que vive aislado en un espacio pequeño durante mucho tiempo.',
    fuente: 'https://www.nasa.gov/hrp/hazards/',
    verificada: true,
    historia: {
      dato: 'En 1985 el comandante de la estación soviética Salyut 7 enfermó, con fiebre alta, y la misión volvió a la Tierra meses antes de lo previsto. Los médicos creyeron después que el problema era en parte psicológico.',
      fuente: 'https://humanresearchroadmap.nasa.gov/evidence/reports/BMed.pdf',
      verificada: false,
    },
  },
};
