import { EVENTOS } from '../data/eventos';
import {
  BLINDAJE_MAX,
  CAPACIDAD_ENERGIA,
  CONSUMO_AGUA,
  CONSUMO_ALIMENTO,
  CONSUMO_ENERGIA_POR_TRIPULANTE,
  CONSUMO_OXIGENO,
  DOSIS_BASE,
  ENERGIA_INICIAL,
  NOMBRES_TRIPULACION,
  RESERVA_AGUA,
  RESERVA_ALIMENTO,
  RESERVA_OXIGENO,
} from '../data/parametros';
import { itemsDe, validarDiseno } from './diseno';
import { siguiente } from './prng';
import { actualizarSalud, limitar } from './salud';
import type { Astronauta, Configuracion, Destino, Efectos, Estado, Evento, Indicador } from './tipos';

type EfectoNumerico = Exclude<keyof Efectos, 'saludBonus'>;

function sortearEvento(destino: Destino, rng: number): { evento: Evento; rng: number } {
  const candidatos = EVENTOS.filter((e) => e.destinos.includes(destino));
  const pesoTotal = candidatos.reduce((suma, e) => suma + e.peso, 0);
  const paso = siguiente(rng);
  let restante = paso.valor * pesoTotal;
  for (const evento of candidatos) {
    restante -= evento.peso;
    if (restante < 0) return { evento, rng: paso.rng };
  }
  // Solo se llega aquí por redondeo de coma flotante.
  return { evento: candidatos[candidatos.length - 1], rng: paso.rng };
}

// Estado del turno 1 a partir de un diseño válido. Lanza un error si no lo es.
export function iniciarMision(config: Configuracion, itemIds: string[]): Estado {
  const diseno = validarDiseno(config, itemIds);
  if (!diseno.valido) throw new Error(`Diseño no válido: ${diseno.errores.join(' ')}`);

  const consumoMision = config.tripulantes * config.turnos;
  const tripulacion: Astronauta[] = NOMBRES_TRIPULACION.slice(0, config.tripulantes).map(
    (nombre, i) => ({
      id: `astronauta-${i + 1}`,
      nombre,
      salud: { radiacion: 100, nutricion: 100, suenoEstres: 100, musculoHueso: 100 },
      dosis: 0,
    }),
  );
  const historias = itemsDe(itemIds).flatMap((item) => (item.historiaId ? [item.historiaId] : []));
  const sorteo = sortearEvento(config.destino, config.semilla >>> 0);

  return {
    fase: 'juego',
    config,
    diseno: { itemIds: [...itemIds], presupuestoUsado: diseno.presupuestoUsado },
    turno: 1,
    recursos: {
      energia: ENERGIA_INICIAL,
      alimento: Math.ceil(consumoMision * CONSUMO_ALIMENTO * RESERVA_ALIMENTO),
      oxigeno: Math.ceil(consumoMision * CONSUMO_OXIGENO * RESERVA_OXIGENO),
      agua: Math.ceil(consumoMision * CONSUMO_AGUA * RESERVA_AGUA),
    },
    tripulacion,
    historial: [],
    eventoActual: sorteo.evento,
    historiasDesbloqueadas: [...new Set(historias)],
    ciencia: 0,
    rng: sorteo.rng,
  };
}

// Resuelve un turno en el orden del TRD 6.2. Pura: no modifica `estado`.
export function siguienteTurno(estado: Estado, opcionId: string): Estado {
  if (estado.resultado) return estado;
  const evento = estado.eventoActual;
  if (!evento) throw new Error('No hay evento que resolver.');
  const opcion = evento.opciones.find((o) => o.id === opcionId);
  if (!opcion) throw new Error(`La opción "${opcionId}" no existe en el evento "${evento.id}".`);

  const { config } = estado;
  const tripulantes = config.tripulantes;
  const items = itemsDe(estado.diseno.itemIds);
  const total = (campo: EfectoNumerico) =>
    items.reduce((suma, item) => suma + (item.efectos[campo] ?? 0), 0);
  const bonus = (indicador: Indicador) =>
    items.reduce((suma, item) => suma + (item.efectos.saludBonus?.[indicador] ?? 0), 0);
  const efectos = opcion.efectos;

  // 1. Efectos directos de la opción elegida.
  let energia = limitar(estado.recursos.energia + (efectos.recursos?.energia ?? 0), 0, CAPACIDAD_ENERGIA);
  let alimento = Math.max(0, estado.recursos.alimento + (efectos.recursos?.alimento ?? 0));
  let oxigeno = Math.max(0, estado.recursos.oxigeno + (efectos.recursos?.oxigeno ?? 0));
  let agua = Math.max(0, estado.recursos.agua + (efectos.recursos?.agua ?? 0));

  // 2. Energía.
  const resistenciaPolvo = limitar(total('resistenciaPolvo'), 0, 1);
  const factorSolar = 1 - (1 - limitar(efectos.factorSolar ?? 1, 0, 1)) * (1 - resistenciaPolvo);
  const consumoEnergia = CONSUMO_ENERGIA_POR_TRIPULANTE * tripulantes + total('energiaConsumo');
  const energiaDisponible = energia + total('energiaProduccion') + total('energiaSolar') * factorSolar;
  const coberturaEnergia = consumoEnergia > 0 ? Math.min(1, energiaDisponible / consumoEnergia) : 1;
  energia = limitar(energiaDisponible - consumoEnergia, 0, CAPACIDAD_ENERGIA);

  // 3. Soporte vital y alimento. Sin energía, el reciclado y el invernadero rinden menos.
  const consumoOxigeno = CONSUMO_OXIGENO * tripulantes;
  const consumoAgua = CONSUMO_AGUA * tripulantes;
  const consumoAlimento = CONSUMO_ALIMENTO * tripulantes;
  const reciclado = total('soporteVital') * coberturaEnergia;
  const usoOxigeno = Math.max(0, consumoOxigeno - reciclado);
  const usoAgua = Math.max(0, consumoAgua - reciclado);
  // Parte del consumo que no se pudo cubrir (0 = todo cubierto).
  const faltaOxigeno = Math.max(0, usoOxigeno - oxigeno) / consumoOxigeno;
  const faltaAgua = Math.max(0, usoAgua - agua) / consumoAgua;
  oxigeno = Math.max(0, oxigeno - usoOxigeno);
  agua = Math.max(0, agua - usoAgua);
  alimento += total('alimentoProduccion') * coberturaEnergia;
  const coberturaAlimento = Math.min(1, alimento / consumoAlimento);
  alimento = Math.max(0, alimento - consumoAlimento);

  // 4. Radiación.
  const blindaje = limitar(total('blindaje'), 0, BLINDAJE_MAX);
  const dosisTurno =
    Math.max(0, efectos.dosis ?? 0) +
    DOSIS_BASE[config.destino] * Math.max(0, efectos.multiplicadorRadiacion ?? 1) * (1 - blindaje);

  // 5. Salud: primero el efecto directo de la opción, luego el desgaste del turno.
  const contexto = {
    destino: config.destino,
    coberturaAlimento,
    coberturaSoporteVital: 1 - Math.max(faltaOxigeno, faltaAgua),
    bonus: {
      nutricion: bonus('nutricion'),
      suenoEstres: bonus('suenoEstres'),
      musculoHueso: bonus('musculoHueso'),
    },
  };
  const tripulacion = estado.tripulacion.map((astronauta) =>
    actualizarSalud(
      {
        ...astronauta,
        dosis: astronauta.dosis + dosisTurno,
        salud: {
          ...astronauta.salud,
          nutricion: limitar(astronauta.salud.nutricion + (efectos.salud?.nutricion ?? 0)),
          suenoEstres: limitar(astronauta.salud.suenoEstres + (efectos.salud?.suenoEstres ?? 0)),
          musculoHueso: limitar(astronauta.salud.musculoHueso + (efectos.salud?.musculoHueso ?? 0)),
        },
      },
      contexto,
    ),
  );

  // 6. Ciencia.
  const ciencia = Math.max(
    0,
    estado.ciencia + (efectos.ciencia ?? 0) + Math.round(total('ciencia') * coberturaEnergia),
  );

  // 7. Historias de eventos educativos.
  const historiasDesbloqueadas =
    evento.historiaId && !estado.historiasDesbloqueadas.includes(evento.historiaId)
      ? [...estado.historiasDesbloqueadas, evento.historiaId]
      : estado.historiasDesbloqueadas;

  const recursos = { energia, alimento, oxigeno, agua };
  const base = {
    fase: estado.fase,
    config,
    diseno: estado.diseno,
    recursos,
    tripulacion,
    historial: [...estado.historial, { turno: estado.turno, recursos, tripulacion }],
    historiasDesbloqueadas,
    ciencia,
  };

  // 9. Fin: la misión se aborta si algún indicador llega a 0.
  const abortada = tripulacion.some((a) => Object.values(a.salud).some((valor) => valor <= 0));
  if (abortada || estado.turno >= config.turnos) {
    return { ...base, turno: estado.turno, rng: estado.rng, resultado: abortada ? 'abortada' : 'exito' };
  }

  // 8. Siguiente evento.
  const sorteo = sortearEvento(config.destino, estado.rng);
  return { ...base, turno: estado.turno + 1, eventoActual: sorteo.evento, rng: sorteo.rng };
}
