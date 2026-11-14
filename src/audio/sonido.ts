// Efectos de sonido sintetizados con WebAudio (RNF-01).
// No hay archivos de audio: cada efecto es un oscilador con envolvente.
// Todo falla en silencio si el navegador bloquea el audio o no lo soporta.

class GestorSonido {
  private ctx: AudioContext | null = null;
  public silenciado = false;

  private obtenerCtx(): AudioContext | null {
    if (this.silenciado || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tono(
    frecuenciaInicio: number,
    frecuenciaFin: number,
    duracion: number,
    tipo: OscillatorType,
    volumen = 0.08,
  ): void {
    const ctx = this.obtenerCtx();
    if (!ctx) return;

    const ahora = ctx.currentTime;
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();

    osc.type = tipo;
    osc.frequency.setValueAtTime(frecuenciaInicio, ahora);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, frecuenciaFin), ahora + duracion);

    ganancia.gain.setValueAtTime(volumen, ahora);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);

    osc.connect(ganancia);
    ganancia.connect(ctx.destination);
    osc.start(ahora);
    osc.stop(ahora + duracion);
  }

  paso(): void {
    const variacion = 0.92 + Math.random() * 0.16;
    this.tono(110 * variacion, 70 * variacion, 0.055, 'triangle', 0.04);
  }

  salto(): void {
    this.tono(180, 420, 0.16, 'sine', 0.08);
  }

  aterrizaje(): void {
    this.tono(130, 55, 0.11, 'triangle', 0.06);
  }

  reparacion(): void {
    this.tono(320, 640, 0.14, 'square', 0.06);
    setTimeout(() => this.tono(520, 880, 0.16, 'triangle', 0.06), 90);
  }

  escaneo(): void {
    this.tono(540, 810, 0.12, 'sine', 0.08);
    setTimeout(() => this.tono(810, 1080, 0.18, 'sine', 0.08), 110);
  }

  alerta(): void {
    this.tono(440, 320, 0.18, 'sawtooth', 0.05);
  }

  exito(): void {
    [440, 554, 659, 880].forEach((frecuencia, indice) => {
      setTimeout(() => this.tono(frecuencia, frecuencia * 1.02, 0.22, 'triangle', 0.07), indice * 95);
    });
  }
}

export const sonido = new GestorSonido();
