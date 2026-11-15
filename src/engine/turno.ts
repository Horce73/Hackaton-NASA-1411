import { EVENTOS } from '../data/eventos';
import {
  BLINDAJE_MAX,
  CAPACIDAD_ENERGIA,
  CIENCIA_MUESTREO,
  CONSUMO_AGUA,
  CONSUMO_ALIMENTO,
  CONSUMO_ENERGIA_POR_TRIPULANTE,
  CONSUMO_OXIGENO,
  DOSIS_BASE,
  ESPECIALIDADES_TRIPULACION,
  NOMBRES_TRIPULACION,
} from '../data/parametros';
import { itemsDe, reservasIniciales, validarDiseno } from './diseno';
import { siguiente } from './prng';
import { modulosParados } from './tareas';
import { actualizarSalud, limitar } from './salud';
import type {
  Astronauta,
  Configuracion,
  DeltaTurno,
  Destino,
  Efectos,
  Estado,
  Evento,
  Indicador,
  Opcion,
  Recursos,
  Tarea,
} from './tipos';

type EfectoNumerico = Exclude<keyof Efectos, 'saludBonus' | 'alertaRadiacion'>;

// Sorteo ponderado del evento del día.
// - Un evento educativo no vuelve a salir cuando su historia ya está desbloqueada.
// - No repite el evento anterior si hay alternativa, para que la partida no se estanque.
function sortearEvento(
  destino: Destino,
  rng: number,
  historiasDesbloqueadas: string[] = [],
  eventoAnteriorId?: string,
): { evento: Evento; rng: number } {
  const delDestino = EVENTOS.filter((e) => e.destinos.includes(destino));
  const sinHistoriaVista = delDestino.filter(
    (e) => !e.historiaId || !historiasDesbloqueadas.includes(e.historiaId),
  );
  const disponibles = sinHistoriaVista.length > 0 ? sinHistoriaVista : delDestino;
  const sinRepetir = disponibles.filter((e) => e.id !== eventoAnteriorId);
  const pool = sinRepetir.length > 0 ? sinRepetir : disponibles;

  const pesoTotal = pool.reduce((suma, e) => suma + e.peso, 0);
  const paso = siguiente(rng);
  let restante = paso.valor * pesoTotal;
  for (const evento of pool) {
    restante -= evento.peso;
    if (restante < 0) return { evento, rng: paso.rng };
  }
  // Solo se llega aquí por redondeo de coma flotante.
  return { evento: pool[pool.length - 1], rng: paso.rng };
}

// Estado del turno 1 a partir de un diseño válido. Lanza un error si no lo es.
export function iniciarMision(config: Configuracion, itemIds: string[]): Estado {
  const diseno = validarDiseno(config, itemIds);
  if (!diseno.valido) throw new Error(`Diseño no válido: ${diseno.errores.join(' ')}`);

  const tripulacion: Astronauta[] = NOMBRES_TRIPULACION.slice(0, config.tripulantes).map(
    (nombre, i) => ({
      id: `astronauta-${i + 1}`,
      nombre,
      especialidad: ESPECIALIDADES_TRIPULACION[i],
      salud: { radiacion: 100, nutricion: 100, suenoEstres: 100, musculoHueso: 100 },
      dosis: 0,
    }),
  );
  const historias = [...new Set(itemsDe(itemIds).flatMap((item) => (item.historiaId ? [item.historiaId] : [])))];
  const recursos = reservasIniciales(config);
  const sorteo = sortearEvento(config.destino, config.semilla >>> 0, historias);

  return {
    fase: 'juego',
    config,
    diseno: { itemIds: [...itemIds], presupuestoUsado: diseno.presupuestoUsado },
    turno: 1,
    recursos,
    tripulacion,
    historial: [
      {
        turno: 0,
        recursos: { ...recursos },
        tripulacion: tripulacion.map((a) => ({ ...a, salud: { ...a.salud } })),
      },
    ],
    eventoActual: sorteo.evento,
    historiasDesbloqueadas: historias,
    ciencia: 0,
    rng: sorteo.rng,
  };
}

function recursoInsuficiente(recursos: Recursos, opcion: Opcion): keyof Recursos | undefined {
  const cambios = opcion.efectos.recursos ?? {};
  return (Object.keys(cambios) as (keyof Recursos)[]).find((r) => recursos[r] + (cambios[r] ?? 0) < 0);
}

// Recurso que impide elegir una opción. Si todas las opciones del evento estuvieran bloqueadas,
// ninguna lo está: la partida no se puede atascar.
export function recursoQueFalta(estado: Estado, opcionId: string): keyof Recursos | undefined {
  const opciones = estado.eventoActual?.opciones ?? [];
  if (opciones.every((o) => recursoInsuficiente(estado.recursos, o))) return undefined;
  const opcion = opciones.find((o) => o.id === opcionId);
  return opcion && recursoInsuficiente(estado.recursos, opcion);
}

// Resuelve un turno en el orden del TRD 6.2. Pura: no modifica `estado`.
// `pendientes`: tareas del día sin terminar (RF-15, RF-16); vacío resuelve el turno como si se hicieran todas.
export function siguienteTurno(estado: Estado, opcionId: string, pendientes: Tarea[] = []): Estado {
  if (estado.resultado) return estado;
  const evento = estado.eventoActual;
  if (!evento) throw new Error('No hay evento que resolver.');
  const opcion = evento.opciones.find((o) => o.id === opcionId);
  if (!opcion) throw new Error(`La opción "${opcionId}" no existe en el evento "${evento.id}".`);
  const falta = recursoQueFalta(estado, opcionId);
  if (falta) throw new Error(`La opción "${opcionId}" está bloqueada: falta ${falta}.`);

  const { config } = estado;
  const tripulantes = config.tripulantes;
  // 0. Tareas pendientes: módulos sin mantenimiento no cuentan; tarea del evento sin hacer, opción de riesgo.
  const parados = modulosParados(pendientes);
  const items = itemsDe(estado.diseno.itemIds.filter((_, i) => !parados.has(i)));
  const sinAtender = pendientes.some((t) => t.tipo === 'evento');
  const opcionRiesgo = evento.opciones.find((o) => o.id === evento.opcionSinAtender);
  const total = (campo: EfectoNumerico) =>
    items.reduce((suma, item) => suma + (item.efectos[campo] ?? 0), 0);
  const bonus = (indicador: Indicador) =>
    items.reduce((suma, item) => suma + (item.efectos.saludBonus?.[indicador] ?? 0), 0);
  const efectos = sinAtender ? (opcionRiesgo?.efectos ?? {}) : opcion.efectos;
  const recursosPrevios = estado.recursos;
  const dosisMediaPrevia =
    estado.tripulacion.reduce((suma, a) => suma + a.dosis, 0) / estado.tripulacion.length;

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
  // Parte de la tripulación cuyo consumo cubre el reciclado (0..1).
  const reciclado = Math.min(1, (total('soporteVital') * coberturaEnergia) / tripulantes);
  const usoOxigeno = consumoOxigeno * (1 - reciclado);
  const usoAgua = consumoAgua * (1 - reciclado);
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

  // 6. Ciencia. El muestreo diario suma si no quedó pendiente; si la tripulación se queda dentro, no hay muestreo.
  const muestreo = opcion.dentro || pendientes.some((t) => t.tipo === 'ciencia') ? 0 : CIENCIA_MUESTREO;
  const ciencia = Math.max(
    0,
    estado.ciencia + (efectos.ciencia ?? 0) + muestreo + Math.round(total('ciencia') * coberturaEnergia),
  );

  // 7. Historias de eventos educativos.
  const historiasDesbloqueadas =
    evento.historiaId && !estado.historiasDesbloqueadas.includes(evento.historiaId)
      ? [...estado.historiasDesbloqueadas, evento.historiaId]
      : estado.historiasDesbloqueadas;

  const recursos = { energia, alimento, oxigeno, agua };
  const dosisMediaFinal = tripulacion.reduce((suma, a) => suma + a.dosis, 0) / tripulacion.length;
  const ultimoDelta: DeltaTurno = {
    energia: energia - recursosPrevios.energia,
    alimento: alimento - recursosPrevios.alimento,
    oxigeno: oxigeno - recursosPrevios.oxigeno,
    agua: agua - recursosPrevios.agua,
    dosisMedia: dosisMediaFinal - dosisMediaPrevia,
    ciencia: ciencia - estado.ciencia,
    opcionTexto: sinAtender
      ? `${opcion.texto}: sin terminar, ${opcionRiesgo ? `se aplicó «${opcionRiesgo.texto}»` : 'no tuvo efecto'}`
      : opcion.texto,
    ...(sinAtender && { sinAtender }),
    ...(parados.size > 0 && { modulosParados: parados.size }),
  };
  const base = {
    fase: estado.fase,
    config,
    diseno: estado.diseno,
    recursos,
    tripulacion,
    historial: [...estado.historial, { turno: estado.turno, recursos: { ...recursos }, tripulacion }],
    historiasDesbloqueadas,
    ciencia,
    ultimoDelta,
  };

  // 9. Fin: la misión se aborta si algún indicador llega a 0.
  const critico = tripulacion.find((a) => Object.values(a.salud).some((valor) => valor <= 0));
  if (critico || estado.turno >= config.turnos) {
    return {
      ...base,
      turno: estado.turno,
      rng: estado.rng,
      resultado: critico ? 'abortada' : 'exito',
      ...(critico && {
        causaFin: (Object.keys(critico.salud) as Indicador[]).find((indicador) => critico.salud[indicador] <= 0),
      }),
      motivoFin: critico
        ? `La salud de ${critico.nombre} llegó al límite de seguridad. La misión se aborta y el equipo vuelve a casa.`
        : `Misión cumplida: el equipo completó los ${config.turnos} días previstos.`,
    };
  }

  // 8. Siguiente evento.
  const sorteo = sortearEvento(config.destino, estado.rng, historiasDesbloqueadas, evento.id);
  return { ...base, turno: estado.turno + 1, eventoActual: sorteo.evento, rng: sorteo.rng };
}
