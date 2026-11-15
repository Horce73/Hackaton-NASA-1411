// Física del astronauta en la superficie (RF-09).
// Módulo sin dependencias de React ni de three.js: se puede probar con Vitest y lo usan
// tanto el motor de la escena como las pruebas de balance.

import {
  ALTURA_JUGADOR,
  GRAVEDAD,
  IMPULSO_SALTO,
  RADIO_ARENA,
  RADIO_JUGADOR,
  TIEMPO_BUFFER_SALTO,
  TIEMPO_COYOTE,
  VELOCIDAD_CAMINAR,
  VELOCIDAD_SPRINT,
} from '../data/parametros';
import type { Destino } from '../engine/tipos';

export { ALTURA_JUGADOR, IMPULSO_SALTO, RADIO_ARENA, RADIO_JUGADOR };

export interface ObstaculoCilindro {
  id: string;
  x: number;
  z: number;
  radio: number;
  altura: number;
}

export interface EstadoJugadorFisica {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  enSuelo: boolean;
  tiempoCoyote: number;
  bufferSalto: number;
  distanciaRecorrida: number;
}

export interface EntradaMovimiento {
  adelante: number; // -1..1
  derecha: number; // -1..1
  camaraYaw: number;
  saltarPresionado: boolean;
  saltarMantenido: boolean;
  sprint: boolean;
}

// Altura del terreno en un punto. La base ocupa una plataforma plana y el resto ondula.
export function groundHeightAt(x: number, z: number, destino: Destino): number {
  const r = Math.hypot(x, z);
  // Plataforma nivelada para la base central y los módulos (r <= 13 m).
  const factorPlataforma = Math.max(0, Math.min(1, (r - 13) / 6));

  const amplitud = destino === 'luna' ? 1.35 : 1.75;
  const ondas =
    Math.sin(x * 0.085) * Math.cos(z * 0.075) * amplitud + Math.sin(x * 0.21 + z * 0.17) * 0.35;

  // Cráteres suaves fuera del área central.
  const crater1 = Math.max(0, 1 - Math.hypot(x - 24, z + 18) / 10);
  const crater2 = Math.max(0, 1 - Math.hypot(x + 26, z - 20) / 12);
  const depresionCrateres = -(crater1 * crater1 * 1.4 + crater2 * crater2 * 1.6);

  // Borde natural suave del cráter exterior desde r > 46 m.
  const bordeExterior = r > 46 ? Math.min(2.4, Math.pow((r - 46) / 10, 1.4) * 1.15) : 0;

  return (ondas + depresionCrateres) * factorPlataforma + bordeExterior;
}

// Normal del terreno por diferencias finitas, para inclinar al astronauta y la cámara.
export function groundNormalAt(
  x: number,
  z: number,
  destino: Destino,
): { nx: number; ny: number; nz: number } {
  const eps = 0.25;
  const hIzquierda = groundHeightAt(x - eps, z, destino);
  const hDerecha = groundHeightAt(x + eps, z, destino);
  const hAbajo = groundHeightAt(x, z - eps, destino);
  const hArriba = groundHeightAt(x, z + eps, destino);

  const dx = (hDerecha - hIzquierda) / (2 * eps);
  const dz = (hArriba - hAbajo) / (2 * eps);
  const largo = Math.hypot(-dx, 1, -dz);
  return {
    nx: -dx / largo,
    ny: 1 / largo,
    nz: -dz / largo,
  };
}

export function crearEstadoJugadorInicial(destino: Destino): EstadoJugadorFisica {
  const x = 0;
  const z = 10.5;
  return {
    x,
    y: groundHeightAt(x, z, destino),
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: Math.PI, // Mirando hacia el domo, en el centro de la base.
    enSuelo: true,
    tiempoCoyote: 0,
    bufferSalto: 0,
    distanciaRecorrida: 0,
  };
}

function acotarAngulo(angulo: number): number {
  let a = angulo;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Un paso de simulación. Pura: no modifica el estado que recibe.
export function pasoFisicaJugador(
  estado: EstadoJugadorFisica,
  entrada: EntradaMovimiento,
  destino: Destino,
  obstaculos: ObstaculoCilindro[],
  rawDt: number,
): EstadoJugadorFisica {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  if (dt === 0) return estado;

  const gravedad = GRAVEDAD[destino];

  // Dirección de avance relativa a la cámara.
  const magnitud = Math.hypot(entrada.adelante, entrada.derecha);
  const normAdelante = magnitud > 1 ? entrada.adelante / magnitud : entrada.adelante;
  const normDerecha = magnitud > 1 ? entrada.derecha / magnitud : entrada.derecha;

  const sinY = Math.sin(entrada.camaraYaw);
  const cosY = Math.cos(entrada.camaraYaw);
  // La cámara mira hacia (-sinY, -cosY) en el plano XZ.
  const dirX = -sinY * normAdelante + cosY * normDerecha;
  const dirZ = -cosY * normAdelante - sinY * normDerecha;

  const velocidadObjetivo = entrada.sprint ? VELOCIDAD_SPRINT : VELOCIDAD_CAMINAR;
  const objetivoVx = dirX * velocidadObjetivo;
  const objetivoVz = dirZ * velocidadObjetivo;

  const aceleracion = estado.enSuelo ? 16 : 6.5;
  const factor = 1 - Math.exp(-aceleracion * dt);

  let vx = estado.vx + (objetivoVx - estado.vx) * factor;
  let vz = estado.vz + (objetivoVz - estado.vz) * factor;
  let vy = estado.vy;

  // Rotar al personaje suavemente hacia su dirección de avance.
  let yaw = estado.yaw;
  if (magnitud > 0.08) {
    const objetivoYaw = Math.atan2(dirX, dirZ);
    const diferencia = acotarAngulo(objetivoYaw - yaw);
    yaw = acotarAngulo(yaw + diferencia * Math.min(1, 12 * dt));
  }

  // Coyote time y buffer de salto: el salto se siente justo sin ser injusto.
  let tiempoCoyote = estado.enSuelo ? TIEMPO_COYOTE : Math.max(0, estado.tiempoCoyote - dt);
  let bufferSalto = entrada.saltarPresionado
    ? TIEMPO_BUFFER_SALTO
    : Math.max(0, estado.bufferSalto - dt);

  let enSuelo = estado.enSuelo;

  if (bufferSalto > 0 && tiempoCoyote > 0) {
    vy = IMPULSO_SALTO;
    enSuelo = false;
    tiempoCoyote = 0;
    bufferSalto = 0;
  }

  // Gravedad real del destino.
  vy -= gravedad * dt;

  let x = estado.x + vx * dt;
  let y = estado.y + vy * dt;
  let z = estado.z + vz * dt;

  // Colisión con obstáculos cilíndricos: domo, módulos y rocas.
  for (const obstaculo of obstaculos) {
    const dx = x - obstaculo.x;
    const dz = z - obstaculo.z;
    const distancia = Math.hypot(dx, dz);
    const distanciaMinima = obstaculo.radio + RADIO_JUGADOR;
    if (distancia < distanciaMinima) {
      const techoObstaculo = groundHeightAt(obstaculo.x, obstaculo.z, destino) + obstaculo.altura;
      if (y < techoObstaculo - 0.15) {
        if (distancia > 0.0001) {
          const empuje = (distanciaMinima - distancia) / distancia;
          x += dx * empuje;
          z += dz * empuje;
        } else {
          x += distanciaMinima;
        }
        // Cancelar la componente de velocidad que entra al obstáculo.
        const nx = (x - obstaculo.x) / distanciaMinima;
        const nz = (z - obstaculo.z) / distanciaMinima;
        const vn = vx * nx + vz * nz;
        if (vn < 0) {
          vx -= vn * nx;
          vz -= vn * nz;
        }
      } else if (y >= techoObstaculo - 0.15 && y <= techoObstaculo + 0.12 && vy <= 0) {
        // Se puede aterrizar encima de módulos bajos y rocas.
        y = techoObstaculo;
        vy = 0;
        enSuelo = true;
      }
    }
  }

  // Límite circular de la zona de exploración.
  const distanciaOrigen = Math.hypot(x, z);
  if (distanciaOrigen > RADIO_ARENA) {
    const escala = RADIO_ARENA / distanciaOrigen;
    x *= escala;
    z *= escala;
    const nx = x / RADIO_ARENA;
    const nz = z / RADIO_ARENA;
    const vn = vx * nx + vz * nz;
    if (vn > 0) {
      vx -= vn * nx;
      vz -= vn * nz;
    }
  }

  // Colisión con el terreno.
  const alturaSuelo = groundHeightAt(x, z, destino);
  if (y <= alturaSuelo) {
    y = alturaSuelo;
    if (vy < 0) vy = 0;
    enSuelo = true;
  } else if (y > alturaSuelo + 0.08) {
    // Sigue en el aire salvo que esté apoyado en un obstáculo.
    const sobreObstaculo = obstaculos.some((obstaculo) => {
      const distancia = Math.hypot(x - obstaculo.x, z - obstaculo.z);
      const techoObstaculo = groundHeightAt(obstaculo.x, obstaculo.z, destino) + obstaculo.altura;
      return distancia < obstaculo.radio + RADIO_JUGADOR && Math.abs(y - techoObstaculo) <= 0.12;
    });
    if (!sobreObstaculo) enSuelo = false;
  }

  const avanceHorizontal = Math.hypot(x - estado.x, z - estado.z);
  const distanciaRecorrida = estado.distanciaRecorrida + (enSuelo ? avanceHorizontal : 0);

  return {
    x,
    y,
    z,
    vx,
    vy,
    vz,
    yaw,
    enSuelo,
    tiempoCoyote,
    bufferSalto,
    distanciaRecorrida,
  };
}
