// Pantalla de carga al lanzar la misión (llegada): el amanecer con un dato sobre el día del destino. La base, el
// hábitat y los equipos históricos salen después como datos curiosos (datosCuriosos.ts). Cada texto lleva su fuente
// y `verificada: false` hasta que el equipo lo contraste.

import type { Archivo, Destino } from '../engine/tipos';

export interface PantallaLlegada {
  id: string;
  titulo: string;
  texto: Archivo;
}

// Primera pantalla: el amanecer en 3D (sin imagen), con un dato sobre el día del destino.
export const AMANECER: Record<Destino, PantallaLlegada> = {
  luna: {
    id: 'amanecer',
    titulo: 'Amanecer en la Luna',
    texto: {
      dato: 'Un día en la Luna, de un mediodía al siguiente, dura unos 29,5 días de la Tierra: unas dos semanas de luz y dos de noche. En el juego, cada día dura un minuto.',
      fuente: 'https://ntrs.nasa.gov/api/citations/20205008686/downloads/Caitlin_Lunar%20Length%20of%20Day_paper.pdf',
      verificada: false,
    },
  },
  marte: {
    id: 'amanecer',
    titulo: 'Amanecer en Marte',
    texto: {
      dato: 'Un día en Marte se llama sol y dura 24 horas, 39 minutos y 35 segundos: casi como uno de la Tierra. En el juego, cada día dura un minuto.',
      fuente: 'https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/quick_facts/',
      verificada: false,
    },
  },
};
