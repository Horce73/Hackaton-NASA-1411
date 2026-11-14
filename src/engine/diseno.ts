import { CATALOGO } from '../data/catalogo';
import {
  CONSUMO_AGUA,
  CONSUMO_ALIMENTO,
  CONSUMO_ENERGIA_POR_TRIPULANTE,
  CONSUMO_OXIGENO,
  DESGASTE_SUENO,
  ENERGIA_INICIAL,
  PERDIDA_MUSCULO,
  PRESUPUESTO,
  RESERVA_AGUA,
  RESERVA_ALIMENTO,
  RESERVA_OXIGENO,
  TURNOS_MAX,
  TURNOS_MIN,
  UMBRAL_VERDE,
} from '../data/parametros';
import type { AvisoDiseno, Configuracion, Item, Recursos, ResultadoDiseno } from './tipos';

// Lanza un error si el id no existe: quien la llama ya validó el diseño.
export function itemsDe(itemIds: string[]): Item[] {
  return itemIds.map((id) => {
    const item = CATALOGO.find((i) => i.id === id);
    if (!item) throw new Error(`Ítem desconocido: ${id}`);
    return item;
  });
}

export function validarDiseno(config: Configuracion, itemIds: string[]): ResultadoDiseno {
  const errores: string[] = [];
  let presupuestoUsado = 0;

  if (!Number.isInteger(config.turnos) || config.turnos < TURNOS_MIN || config.turnos > TURNOS_MAX) {
    errores.push(`La duración debe estar entre ${TURNOS_MIN} y ${TURNOS_MAX} turnos.`);
  }

  const vistos = new Set<string>();
  for (const id of itemIds) {
    const item = CATALOGO.find((i) => i.id === id);
    if (!item) {
      errores.push(`El elemento "${id}" no existe en el catálogo.`);
      continue;
    }
    presupuestoUsado += item.coste;
    if (!item.destinos.includes(config.destino)) {
      errores.push(`${item.nombre} no se puede llevar a este destino.`);
    }
    if (item.tipo === 'historico' && vistos.has(id)) {
      errores.push(`${item.nombre} solo se puede llevar una vez.`);
    }
    vistos.add(id);
  }

  if (presupuestoUsado > PRESUPUESTO) {
    errores.push(`El diseño cuesta ${presupuestoUsado} puntos y el presupuesto es de ${PRESUPUESTO}.`);
  }

  return { valido: errores.length === 0, presupuestoUsado, errores };
}

export function presupuestoRestante(itemIds: string[]): number {
  return PRESUPUESTO - itemsDe(itemIds).reduce((suma, item) => suma + item.coste, 0);
}

// Lo que ya viaja en la nave al empezar: cubre solo una parte de la misión.
export function reservasIniciales(config: Configuracion): Recursos {
  const consumoMision = config.tripulantes * config.turnos;
  return {
    energia: ENERGIA_INICIAL,
    alimento: Math.ceil(consumoMision * CONSUMO_ALIMENTO * RESERVA_ALIMENTO),
    oxigeno: Math.ceil(consumoMision * CONSUMO_OXIGENO * RESERVA_OXIGENO),
    agua: Math.ceil(consumoMision * CONSUMO_AGUA * RESERVA_AGUA),
  };
}

// Avisos previos al lanzamiento: proyecta la misión sin eventos con las fórmulas del turno.
// Los ids que no existen en el catálogo se ignoran; eso lo rechaza validarDiseno.
export function avisosDiseno(config: Configuracion, itemIds: string[]): AvisoDiseno[] {
  const efectos = itemIds.flatMap((id) => CATALOGO.find((i) => i.id === id)?.efectos ?? []);
  const { tripulantes, turnos } = config;
  const reservas = reservasIniciales(config);

  const energiaPorTurno = efectos.reduce(
    (suma, e) => suma + (e.energiaProduccion ?? 0) + (e.energiaSolar ?? 0) - (e.energiaConsumo ?? 0),
    -CONSUMO_ENERGIA_POR_TRIPULANTE * tripulantes,
  );
  const reciclado = efectos.reduce((suma, e) => suma + (e.soporteVital ?? 0), 0);
  const alimentoProducido = efectos.reduce((suma, e) => suma + (e.alimentoProduccion ?? 0), 0);
  const bonusMusculo = efectos.reduce((suma, e) => suma + (e.saludBonus?.musculoHueso ?? 0), 0);
  const bonusSueno = efectos.reduce((suma, e) => suma + (e.saludBonus?.suenoEstres ?? 0), 0);
  const usoMision = (consumo: number) => Math.max(0, consumo * tripulantes - reciclado) * turnos;

  return [
    { id: 'energia', ok: ENERGIA_INICIAL + energiaPorTurno * turnos >= 0 },
    {
      id: 'soporteVital',
      ok: reservas.oxigeno >= usoMision(CONSUMO_OXIGENO) && reservas.agua >= usoMision(CONSUMO_AGUA),
    },
    {
      id: 'alimento',
      ok: reservas.alimento + alimentoProducido * turnos >= CONSUMO_ALIMENTO * tripulantes * turnos,
    },
    { id: 'radiacion', ok: efectos.some((e) => (e.blindaje ?? 0) > 0) },
    { id: 'musculoHueso', ok: 100 - (PERDIDA_MUSCULO[config.destino] - bonusMusculo) * turnos >= UMBRAL_VERDE },
    { id: 'suenoEstres', ok: 100 - (DESGASTE_SUENO - bonusSueno) * turnos >= UMBRAL_VERDE },
  ];
}
