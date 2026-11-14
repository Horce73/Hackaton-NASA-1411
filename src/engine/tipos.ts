// Modelo de datos del TRD, sección 5.

export type Destino = 'luna' | 'marte';
export type Fase = 'inicio' | 'diseno' | 'juego' | 'bitacora';
export type Indicador = 'radiacion' | 'nutricion' | 'suenoEstres' | 'musculoHueso';

export interface Configuracion {
  destino: Destino;
  tripulantes: 2 | 3 | 4;
  turnos: number; // 10..20
  semilla: number;
}

export interface Efectos {
  energiaProduccion?: number; // por turno, no depende del sol (reactor)
  energiaSolar?: number; // por turno, se multiplica por factorSolar (paneles)
  energiaConsumo?: number; // por turno
  alimentoProduccion?: number;
  soporteVital?: number; // tripulantes cuyo consumo de oxígeno y agua recicla
  blindaje?: number; // reduce dosis de radiación
  saludBonus?: Partial<Record<Indicador, number>>; // por turno; `radiacion` se ignora
  ciencia?: number; // puntos por turno
  resistenciaPolvo?: number; // reduce penalización de tormenta de polvo
  alertaRadiacion?: boolean; // la radiación avisa desde ámbar (Curiosity)
}

export interface Item {
  id: string;
  nombre: string;
  tipo: 'modulo' | 'historico';
  coste: number; // puntos de misión
  destinos: Destino[];
  efectos: Efectos;
  historiaId?: string; // solo históricos
}

export interface Astronauta {
  id: string;
  nombre: string;
  salud: Record<Indicador, number>; // 0..100
  dosis: number; // acumulada, en mSv
}

export interface Recursos {
  energia: number; // 0..CAPACIDAD_ENERGIA
  alimento: number; // kg
  oxigeno: number; // kg
  agua: number; // litros
}

// Solo valen para el turno en que se elige la opción.
export interface EfectosTurno {
  recursos?: Partial<Recursos>; // suma o resta directa al almacén
  dosis?: number; // dosis extra para cada astronauta
  salud?: Partial<Record<Indicador, number>>; // suma o resta directa; `radiacion` se ignora
  ciencia?: number;
  factorSolar?: number; // 0..1, por defecto 1
  multiplicadorRadiacion?: number; // por defecto 1
}

export interface Opcion {
  id: string;
  texto: string;
  efectos: EfectosTurno;
}

export interface Evento {
  id: string;
  titulo: string;
  texto: string;
  destinos: Destino[];
  peso: number; // probabilidad relativa
  opciones: Opcion[]; // 2..3
  historiaId?: string; // eventos educativos
}

export interface Instantanea {
  turno: number;
  recursos: Recursos;
  tripulacion: Astronauta[];
}

export interface Historia {
  id: string;
  nombre: string;
  lugar: string;
  anio: string; // texto: admite rangos
  texto: string;
  fuente: string; // URL de la NASA
  verificada: boolean;
}

export type AvisoId =
  | 'energia'
  | 'soporteVital'
  | 'alimento'
  | 'radiacion'
  | 'musculoHueso'
  | 'suenoEstres';

// Aviso previo al lanzamiento: ok = false significa que hay riesgo.
export interface AvisoDiseno {
  id: AvisoId;
  ok: boolean;
}

// Texto de un aviso, con el dato real que lo explica.
export interface TextoAviso {
  nombre: string;
  ok: string;
  riesgo: string;
  dato: string;
  fuente: string; // URL de la NASA
  verificada: boolean;
}

export interface Preajuste {
  id: string;
  nombre: string;
  destino: Destino;
  tripulantes: 2 | 3 | 4;
  turnos: number;
}

export interface AlertaSalud {
  astronauta: string; // nombre
  indicador: Indicador;
  valor: number;
  temprana: boolean; // aviso en ámbar gracias a alertaRadiacion
}

export interface ResultadoDiseno {
  valido: boolean;
  presupuestoUsado: number;
  errores: string[];
}

export interface Estado {
  fase: Fase;
  config: Configuracion;
  diseno: { itemIds: string[]; presupuestoUsado: number };
  turno: number;
  recursos: Recursos;
  tripulacion: Astronauta[];
  historial: Instantanea[]; // una por turno, para gráficas (RF-06)
  eventoActual?: Evento;
  historiasDesbloqueadas: string[];
  ciencia: number;
  rng: number; // estado del PRNG
  resultado?: 'exito' | 'abortada';
}
