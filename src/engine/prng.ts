// mulberry32 sin estado oculto: recibe el estado y devuelve el valor y el estado siguiente.
export function siguiente(rng: number): { valor: number; rng: number } {
  const estado = (rng + 0x6d2b79f5) | 0;
  let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { valor: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: estado };
}
