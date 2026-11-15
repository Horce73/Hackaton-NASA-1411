import { expect, test } from 'vitest';
import { EVENTOS } from '../data/eventos';
import { tareasDelDia } from '../engine/tareas';
import { recursoQueFalta } from '../engine/turno';
import { PREAJUSTES, TURNOS_MAX, TURNOS_MIN } from '../data/parametros';
import type { Configuracion } from '../engine/tipos';
import { conocimientoDelDia, crearEstadoInicial, ESTADO_INICIAL, reducer, type Accion, type EstadoApp } from './reducer';

const marte: Configuracion = { destino: 'marte', tripulantes: 3, turnos: 14, semilla: 5 };

type EstadoDiseno = Extract<EstadoApp, { fase: 'diseno' }>;
type EstadoJuego = Extract<EstadoApp, { fase: 'juego' }>;

const anadir = (itemId: string): Accion => ({ tipo: 'AÑADIR_ITEM', itemId });
const quitar = (itemId: string): Accion => ({ tipo: 'QUITAR_ITEM', itemId });

function enDiseno(config: Configuracion): EstadoDiseno {
  const inicio = reducer(crearEstadoInicial(config.semilla), { tipo: 'INICIAR', config });
  const limpio = reducer(inicio, { tipo: 'LIMPIAR_DISENO' });
  if (limpio.fase !== 'diseno') throw new Error('esperaba la fase de diseño');
  return limpio;
}

function disenar(itemIds: string[], config: Configuracion = marte): EstadoDiseno {
  return itemIds.reduce<EstadoDiseno>((estado, itemId) => {
    const siguiente = reducer(estado, anadir(itemId));
    if (siguiente.fase !== 'diseno') throw new Error('esperaba la fase de diseño');
    return siguiente;
  }, enDiseno(config));
}

function lanzar(itemIds: string[], config: Configuracion = marte): EstadoJuego {
  const estado = reducer(disenar(itemIds, config), { tipo: 'CONFIRMAR_DISENO' });
  if (estado.fase !== 'juego') throw new Error('no se lanzó la misión');
  return estado;
}

// Un día completo: elegir, hacer todas las tareas (o ninguna) y terminar el día (RF-15).
function jugarDia(estado: EstadoJuego, opcionId: string, hacerTareas = true): EstadoApp {
  let actual: EstadoApp = reducer(estado, { tipo: 'ELEGIR_OPCION', opcionId });
  if (actual.fase !== 'juego' || !actual.plan) return actual;
  if (hacerTareas) {
    for (const t of tareasDelDia(actual.partida, opcionId)) actual = reducer(actual, { tipo: 'COMPLETAR_TAREA', tareaId: t.id });
  }
  return reducer(actual, { tipo: 'TERMINAR_DIA' });
}

function jugarHastaElFinal(estado: EstadoApp): EstadoApp {
  let actual = estado;
  // Tope defensivo: una partida nunca debería superar los turnos más las tarjetas.
  for (let pasos = 0; pasos < 200 && actual.fase === 'juego'; pasos++) {
    if (actual.resumen) {
      actual = reducer(actual, { tipo: 'CERRAR_RESUMEN', conDato: true });
      continue;
    }
    if (actual.dato) {
      actual = reducer(actual, { tipo: 'CERRAR_DATO' });
      continue;
    }
    if (actual.tarjetas.length > 0) {
      actual = reducer(actual, { tipo: 'CERRAR_TARJETA' });
      continue;
    }
    const opcion = actual.partida.eventoActual!.opciones.find(
      (o) => reducer(actual, { tipo: 'ELEGIR_OPCION', opcionId: o.id }) !== actual,
    )!;
    actual = jugarDia(actual, opcion.id);
  }
  return actual;
}

test('el estado inicial arranca en el preajuste base con su diseño sugerido', () => {
  const preajuste = PREAJUSTES[0];
  expect(crearEstadoInicial(5)).toMatchObject({
    fase: 'inicio',
    config: {
      destino: preajuste.destino,
      tripulantes: preajuste.tripulantes,
      turnos: preajuste.turnos,
      semilla: 5,
    },
    itemIds: preajuste.itemsSugeridos,
  });
});

test('INICIAR pasa al diseño conservando la configuración', () => {
  const estado = reducer(crearEstadoInicial(5), { tipo: 'INICIAR', config: marte });
  expect(estado).toMatchObject({ fase: 'diseno', config: marte, errorDiseno: null });
});

test('cambiar de destino descarta el equipo histórico que no sirve', () => {
  const enMarte = reducer(crearEstadoInicial(5), { tipo: 'CAMBIAR_DESTINO', destino: 'marte' });
  if (enMarte.fase !== 'inicio') throw new Error('esperaba la fase de inicio');
  expect(enMarte.config.destino).toBe('marte');
  expect(enMarte.itemIds).not.toContain('retrorreflector');
  expect(reducer(enMarte, { tipo: 'CAMBIAR_DESTINO', destino: 'marte' })).toBe(enMarte);
});

test('aplicar un preajuste carga destino, tripulación, duración y diseño', () => {
  const preajuste = PREAJUSTES.find((p) => p.id === 'marte')!;
  const estado = reducer(crearEstadoInicial(5), { tipo: 'APLICAR_PREAJUSTE', preajusteId: 'marte' });
  expect(estado).toMatchObject({
    config: {
      destino: preajuste.destino,
      tripulantes: preajuste.tripulantes,
      turnos: preajuste.turnos,
    },
    itemIds: preajuste.itemsSugeridos,
  });
});

test('cambiar la duración la acota al rango permitido (RF-01)', () => {
  expect(reducer(crearEstadoInicial(5), { tipo: 'CAMBIAR_TURNOS', turnos: 99 })).toMatchObject({
    config: { turnos: TURNOS_MAX },
  });
  expect(reducer(crearEstadoInicial(5), { tipo: 'CAMBIAR_TURNOS', turnos: 1 })).toMatchObject({
    config: { turnos: TURNOS_MIN },
  });
});

test('añadir y quitar elementos en el diseño', () => {
  const estado = disenar(['panel-solar', 'panel-solar', 'curiosity']);
  expect(estado.itemIds).toEqual(['panel-solar', 'panel-solar', 'curiosity']);

  const quitado = reducer(estado, quitar('panel-solar'));
  if (quitado.fase !== 'diseno') throw new Error('esperaba la fase de diseño');
  expect(quitado.itemIds).toEqual(['panel-solar', 'curiosity']);
});

test('no deja añadir lo que supera el presupuesto ni lo que no es del destino (RF-02)', () => {
  const base = disenar(['reactor', 'reactor', 'reactor', 'reactor']); // 88 puntos

  const conInvernadero = reducer(base, anadir('invernadero')); // 88 + 15 = 103
  expect(conInvernadero).toMatchObject({
    fase: 'diseno',
    itemIds: base.itemIds,
    errorDiseno: expect.any(String),
  });

  const conLrv = reducer(base, anadir('lrv')); // equipo lunar en Marte
  expect(conLrv).toMatchObject({ fase: 'diseno', itemIds: base.itemIds });

  const conReciclador = reducer(base, anadir('reciclador')); // 88 + 12 = 100
  expect(conReciclador).toMatchObject({ fase: 'diseno', itemIds: { length: 5 }, errorDiseno: null });
});

test('CONFIRMAR_DISENO lanza la misión con el diseño elegido', () => {
  const estado = reducer(disenar(['reciclador', 'curiosity']), { tipo: 'CONFIRMAR_DISENO' });
  expect(estado).toMatchObject({
    fase: 'juego',
    partida: {
      turno: 1,
      config: marte,
      diseno: { itemIds: ['reciclador', 'curiosity'] },
      historiasDesbloqueadas: ['curiosity'],
    },
  });
});

test('las acciones de diseño no hacen nada fuera del diseño y REINICIAR vuelve al inicio', () => {
  expect(reducer(ESTADO_INICIAL, anadir('reactor'))).toBe(ESTADO_INICIAL);
  expect(reducer(ESTADO_INICIAL, { tipo: 'CONFIRMAR_DISENO' })).toBe(ESTADO_INICIAL);
  expect(reducer(enDiseno(marte), { tipo: 'REINICIAR' })).toEqual(crearEstadoInicial(5));
});

test('ELEGIR_OPCION avanza el turno y al terminar pasa a la bitácora (RF-04, RF-09)', () => {
  const lanzada = lanzar(['reciclador', 'panel-solar']);
  const opcionId = lanzada.partida.eventoActual!.opciones[0].id;
  expect(jugarDia(lanzada, opcionId)).toMatchObject({ fase: 'juego', partida: { turno: 2 }, plan: null });
  expect(reducer(lanzada, { tipo: 'ELEGIR_OPCION', opcionId: 'no-existe' })).toBe(lanzada);

  const final = jugarHastaElFinal(lanzada);
  expect(final.fase).toBe('bitacora');
  expect(final).toMatchObject({ partida: { resultado: expect.stringMatching(/exito|abortada/) } });
});

test('REPETIR vuelve a lanzar la misma misión con la misma semilla', () => {
  const lanzada = lanzar(['reciclador']);
  const repetida = reducer(jugarHastaElFinal(lanzada), { tipo: 'REPETIR' });
  expect(repetida).toEqual(lanzada);
  expect(reducer(lanzada, { tipo: 'REPETIR' })).toBe(lanzada);
});

test('al lanzar, la llegada muestra el equipo histórico y la tripulación espera dentro (RF-08)', () => {
  const lanzada = lanzar(['curiosity', 'sojourner']);
  expect(lanzada).toMatchObject({ fase: 'juego', llegada: true, tarjetas: [], tripulacionFuera: false });
  expect(lanzada.partida.historiasDesbloqueadas).toEqual(['curiosity', 'sojourner']);
  const llegada = reducer(lanzada, { tipo: 'TERMINAR_LLEGADA' });
  expect(llegada).toMatchObject({ llegada: false });
  expect(reducer(llegada, { tipo: 'TERMINAR_LLEGADA' })).toBe(llegada);

  // Con una tarjeta abierta no se puede jugar el turno; se cierran una a una.
  const conTarjetas = reducer(reducer(llegada, { tipo: 'ABRIR_HISTORIA', historiaId: 'curiosity' }), {
    tipo: 'ABRIR_HISTORIA',
    historiaId: 'sojourner',
  });
  const opcionId = lanzada.partida.eventoActual!.opciones[0].id;
  expect(reducer(conTarjetas, { tipo: 'ELEGIR_OPCION', opcionId })).toBe(conTarjetas);
  const sinTarjetas = reducer(reducer(conTarjetas, { tipo: 'CERRAR_TARJETA' }), { tipo: 'CERRAR_TARJETA' });
  expect(sinTarjetas).toMatchObject({ fase: 'juego', tarjetas: [] });
  expect(reducer(sinTarjetas, { tipo: 'CERRAR_TARJETA' })).toBe(sinTarjetas);
});

test('la tripulación sale al decidir o al explorar, y vuelve a entrar al terminar el día', () => {
  const lanzada = lanzar(['reciclador']);
  const explorando = reducer(lanzada, { tipo: 'SALIR_TRIPULACION' });
  expect(explorando).toMatchObject({ tripulacionFuera: true });
  expect(reducer(explorando, { tipo: 'SALIR_TRIPULACION' })).toBe(explorando);

  const opcion = lanzada.partida.eventoActual!.opciones.find((o) => !recursoQueFalta(lanzada.partida, o.id))!;
  expect(reducer(lanzada, { tipo: 'ELEGIR_OPCION', opcionId: opcion.id })).toMatchObject({ tripulacionFuera: true });
  expect(jugarDia(lanzada, opcion.id)).toMatchObject({ tripulacionFuera: false });
});

test('al terminar el día sale el resumen y luego un dato curioso, que no se repite (RF-08)', () => {
  const lanzada = lanzar(['reciclador', 'panel-solar']);
  const opcion = lanzada.partida.eventoActual!.opciones.find((o) => !recursoQueFalta(lanzada.partida, o.id))!;
  const conResumen = jugarDia(lanzada, opcion.id, false) as EstadoJuego;
  expect(conResumen.resumen?.dia).toBe(1);
  expect(conResumen.resumen?.tareas.length).toBeGreaterThan(0);
  expect(conResumen.resumen?.tareas.every((t) => !t.hecha)).toBe(true);
  // Con el resumen abierto no se puede decidir el día siguiente.
  const otra = conResumen.partida.eventoActual!.opciones[0].id;
  expect(reducer(conResumen, { tipo: 'ELEGIR_OPCION', opcionId: otra })).toBe(conResumen);

  const conDato = reducer(conResumen, { tipo: 'CERRAR_RESUMEN', conDato: true }) as EstadoJuego;
  expect(conDato).toMatchObject({ resumen: null, dato: 'olympus', datosVistos: ['olympus'] });
  const sinDato = reducer(conDato, { tipo: 'CERRAR_DATO' }) as EstadoJuego;
  expect(sinDato).toMatchObject({ fase: 'juego', dato: null });
  const opcion2 = sinDato.partida.eventoActual!.opciones.find((o) => !recursoQueFalta(sinDato.partida, o.id))!;
  const segundo = reducer(jugarDia(sinDato, opcion2.id), { tipo: 'CERRAR_RESUMEN', conDato: true });
  expect(segundo).toMatchObject({ dato: 'fobos' });

  // Desactivados, el resumen lleva directo al día siguiente.
  expect(reducer(conResumen, { tipo: 'CERRAR_RESUMEN', conDato: false })).toMatchObject({ resumen: null, dato: null });
});

test('al terminar la misión, la bitácora llega después del resumen y del dato', () => {
  const lanzada = lanzar(['reciclador']);
  const terminada: EstadoJuego = {
    ...lanzada,
    partida: { ...lanzada.partida, resultado: 'exito' },
    resumen: { dia: 10, tareas: [] },
  };
  const conDato = reducer(terminada, { tipo: 'CERRAR_RESUMEN', conDato: true });
  expect(conDato).toMatchObject({ fase: 'juego' });
  expect(reducer(conDato, { tipo: 'CERRAR_DATO' })).toMatchObject({ fase: 'bitacora' });
  expect(reducer(terminada, { tipo: 'CERRAR_RESUMEN', conDato: false })).toMatchObject({ fase: 'bitacora' });
});

test('al cerrar la última tarjeta de una misión terminada se pasa a la bitácora', () => {
  const lanzada = reducer(lanzar(['curiosity']), { tipo: 'ABRIR_HISTORIA', historiaId: 'curiosity' }) as EstadoJuego;
  const terminada: EstadoJuego = {
    ...lanzada,
    partida: { ...lanzada.partida, resultado: 'exito' },
  };
  expect(reducer(terminada, { tipo: 'CERRAR_TARJETA' })).toMatchObject({ fase: 'bitacora' });
});

test('un evento educativo abre su tarjeta al resolverse', () => {
  const lanzada = lanzar(['reciclador'], { ...marte, destino: 'luna' });
  const surveyor = EVENTOS.find((e) => e.id === 'surveyor-3')!;
  const conEvento: EstadoJuego = {
    ...lanzada,
    partida: { ...lanzada.partida, eventoActual: surveyor },
  };
  expect(jugarDia(conEvento, 'seguir-plan')).toMatchObject({
    tarjetas: ['surveyor-3'],
  });
});

test('completar una tarea de exploración 3D da la recompensa, avisa y no se repite', () => {
  const lanzada = lanzar(['panel-solar', 'reciclador']);
  const antes = lanzada.partida;

  const reparada = reducer(lanzada, { tipo: 'COMPLETAR_TAREA_3D', tarea: 'averia', nodoId: 'averia-1' });
  expect(reparada).toMatchObject({ fase: 'juego', nodos3dCompletados: ['averia-1'] });
  if (reparada.fase !== 'juego') throw new Error('esperaba la fase de juego');

  expect(reparada.partida.ciencia).toBe(antes.ciencia + 4);
  expect(reparada.avisoCampo).toContain('+4');

  // El mismo nodo no se cobra dos veces.
  expect(reducer(reparada, { tipo: 'COMPLETAR_TAREA_3D', tarea: 'averia', nodoId: 'averia-1' })).toBe(reparada);
});

test('inspeccionar un equipo NASA abre su primer plano y suma ciencia', () => {
  const lanzada = lanzar(['panel-solar']);
  const antes = lanzada.partida;
  const conHistoria = reducer(lanzada, {
    tipo: 'COMPLETAR_TAREA_3D',
    tarea: 'historia',
    nodoId: 'nodo-equipo-curiosity',
    historiaId: 'curiosity',
  });
  if (conHistoria.fase !== 'juego') throw new Error('esperaba la fase de juego');

  expect(conHistoria.closeUp).toBe('curiosity');
  expect(conHistoria.partida.historiasDesbloqueadas).toContain('curiosity');
  expect(conHistoria.partida.ciencia).toBe(antes.ciencia + 3);
});

test('el aviso de campo se limpia a pedido', () => {
  const conAviso = reducer(lanzar(['panel-solar']), {
    tipo: 'COMPLETAR_TAREA_3D',
    tarea: 'averia',
    nodoId: 'averia-1',
  });
  const limpio = reducer(conAviso, { tipo: 'LIMPIAR_AVISO_CAMPO' });
  if (limpio.fase !== 'juego') throw new Error('esperaba la fase de juego');
  expect(limpio.avisoCampo).toBeNull();
});

test('ABORTAR_MISION cierra la partida como abortada', () => {
  const abortada = reducer(lanzar(['panel-solar']), { tipo: 'ABORTAR_MISION' });
  expect(abortada).toMatchObject({
    fase: 'bitacora',
    partida: { resultado: 'abortada', motivoFin: expect.stringContaining('abortar') },
  });
  expect(reducer(ESTADO_INICIAL, { tipo: 'ABORTAR_MISION' })).toBe(ESTADO_INICIAL);
});

test('ELEGIR_OPCION abre el plan del día sin avanzar el turno (RF-15)', () => {
  const lanzada = lanzar(['reciclador', 'panel-solar']);
  const opcionId = lanzada.partida.eventoActual!.opciones[0].id;
  const conPlan = reducer(lanzada, { tipo: 'ELEGIR_OPCION', opcionId });
  expect(conPlan).toMatchObject({ partida: { turno: 1 }, plan: { opcionId, hechas: [] } });
  // Con un plan en marcha no se puede cambiar de opción.
  const otra = lanzada.partida.eventoActual!.opciones[1].id;
  expect(reducer(conPlan, { tipo: 'ELEGIR_OPCION', opcionId: otra })).toBe(conPlan);

  const [primera] = tareasDelDia(lanzada.partida, opcionId);
  const hecha = reducer(conPlan, { tipo: 'COMPLETAR_TAREA', tareaId: primera.id });
  expect(hecha).toMatchObject({ plan: { hechas: [primera.id] } });
  expect(reducer(hecha, { tipo: 'COMPLETAR_TAREA', tareaId: primera.id })).toBe(hecha);
  expect(reducer(hecha, { tipo: 'COMPLETAR_TAREA', tareaId: 'no-existe' })).toBe(hecha);
  expect(reducer(lanzada, { tipo: 'TERMINAR_DIA' })).toBe(lanzada);
});

test('terminar el día con tareas sin hacer aplica la opción de riesgo y para los módulos (RF-15, RF-16)', () => {
  const lanzada = lanzar(['reciclador', 'panel-solar']);
  const solar = EVENTOS.find((e) => e.id === 'tormenta-solar')!;
  const conEvento: EstadoJuego = { ...lanzada, partida: { ...lanzada.partida, eventoActual: solar } };

  const bien = jugarDia(conEvento, 'refugiarse');
  const mal = jugarDia(conEvento, 'refugiarse', false);
  if (bien.fase !== 'juego' || mal.fase !== 'juego') throw new Error('esperaba seguir en juego');
  expect(bien.partida.ultimoDelta).toMatchObject({ opcionTexto: 'Refugiarse en la base' });
  // El día 1 solo le toca revisión al reciclador: el panel, en segunda posición, la tiene mañana.
  expect(mal.partida.ultimoDelta).toMatchObject({ sinAtender: true, modulosParados: 1 });
  expect(mal.partida.ultimoDelta!.dosisMedia).toBeGreaterThan(bien.partida.ultimoDelta!.dosisMedia);
});

test('cuaderno: sin la nota de la misión que lo midió, el evento no muestra cifras (RF-17)', () => {
  const lanzada = lanzar(['reciclador', 'curiosity']);
  const solar = EVENTOS.find((e) => e.id === 'tormenta-solar')!;
  const conSolar: EstadoJuego = { ...lanzada, partida: { ...lanzada.partida, eventoActual: solar } };
  // En Marte la explica Curiosity; el ALSEP es de la Luna.
  expect(conocimientoDelDia(conSolar)).toEqual({ conocido: false, misiones: ['curiosity'] });

  const inspeccion = reducer(conSolar, {
    tipo: 'COMPLETAR_TAREA_3D',
    tarea: 'historia',
    nodoId: 'nodo-equipo-curiosity',
    historiaId: 'curiosity',
  });
  if (inspeccion.fase !== 'juego') throw new Error('esperaba seguir en juego');
  expect(inspeccion.closeUp).toBe('curiosity');
  expect(inspeccion.notas).toEqual(['curiosity']);
  expect(conocimientoDelDia(inspeccion).conocido).toBe(true);
  expect(reducer(inspeccion, { tipo: 'CERRAR_CLOSEUP' })).toMatchObject({ closeUp: null, notas: ['curiosity'] });

  // Releerlo vuelve a abrir el primer plano sin repetir la recompensa.
  const cerrada = reducer(inspeccion, { tipo: 'CERRAR_CLOSEUP' });
  const relectura = reducer(cerrada, { tipo: 'COMPLETAR_TAREA_3D', tarea: 'historia', nodoId: 'nodo-equipo-curiosity', historiaId: 'curiosity' });
  expect(relectura).toMatchObject({ closeUp: 'curiosity' });
  if (relectura.fase !== 'juego') throw new Error('esperaba seguir en juego');
  expect(relectura.partida.ciencia).toBe(inspeccion.partida.ciencia);
});

test('cuaderno: los eventos de conocimiento general se ven desde el primer día y lo vivido se recuerda', () => {
  const lanzada = lanzar(['reciclador']);
  const fuga = EVENTOS.find((e) => e.id === 'fuga-agua')!;
  expect(conocimientoDelDia({ ...lanzada, partida: { ...lanzada.partida, eventoActual: fuga } }).conocido).toBe(true);
  // El fallo de aire lo explica Perseverance, que solo existe en Marte: en la Luna es conocimiento general.
  const fallo = EVENTOS.find((e) => e.id === 'fallo-equipo')!;
  const enLuna = lanzar(['reciclador'], { ...marte, destino: 'luna' });
  expect(conocimientoDelDia({ ...enLuna, partida: { ...enLuna.partida, eventoActual: fallo } }).conocido).toBe(true);
  expect(conocimientoDelDia({ ...lanzada, partida: { ...lanzada.partida, eventoActual: fallo } }).conocido).toBe(false);

  const evento = lanzada.partida.eventoActual!;
  const opcion = evento.opciones.find((o) => !recursoQueFalta(lanzada.partida, o.id))!;
  const manana = jugarDia(lanzada, opcion.id);
  if (manana.fase !== 'juego') throw new Error('esperaba seguir en juego');
  expect(manana.eventosConocidos).toContain(evento.id);
});
