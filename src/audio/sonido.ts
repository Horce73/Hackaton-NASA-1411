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

  // Homenaje a «2001: Odisea del espacio»: el inicio de «Así habló Zaratustra» (Richard Strauss, 1896, dominio
  // público), sintetizado aquí; no se usa ninguna grabación. Do–Sol–Do agudo y el acorde mayor que pasa a menor,
  // con golpes de timbal.
  fanfarria(): void {
    const ctx = this.obtenerCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.05;
    const metal = (frecuencia: number, inicio: number, duracion: number, volumen: number) => {
      const osc = ctx.createOscillator();
      const filtro = ctx.createBiquadFilter();
      const ganancia = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = frecuencia;
      filtro.type = 'lowpass';
      filtro.frequency.setValueAtTime(500, t0 + inicio);
      filtro.frequency.linearRampToValueAtTime(2200, t0 + inicio + 0.35);
      ganancia.gain.setValueAtTime(0.0001, t0 + inicio);
      ganancia.gain.exponentialRampToValueAtTime(volumen, t0 + inicio + 0.25);
      ganancia.gain.setValueAtTime(volumen, t0 + inicio + duracion - 0.3);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, t0 + inicio + duracion);
      osc.connect(filtro);
      filtro.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start(t0 + inicio);
      osc.stop(t0 + inicio + duracion);
    };
    const timbal = (frecuencia: number, inicio: number) => {
      const osc = ctx.createOscillator();
      const ganancia = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frecuencia * 1.15, t0 + inicio);
      osc.frequency.exponentialRampToValueAtTime(frecuencia, t0 + inicio + 0.12);
      ganancia.gain.setValueAtTime(0.16, t0 + inicio);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, t0 + inicio + 0.45);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start(t0 + inicio);
      osc.stop(t0 + inicio + 0.5);
    };
    metal(130.81, 0, 1.6, 0.05); // Do
    metal(196.0, 1.6, 1.4, 0.05); // Sol
    metal(261.63, 3.0, 1.2, 0.055); // Do agudo
    metal(329.63, 4.2, 0.5, 0.05); // Mi: acorde mayor…
    metal(311.13, 4.7, 1.8, 0.05); // …que pasa a menor (Mi bemol)
    [261.63, 392.0].forEach((f) => metal(f, 4.2, 2.3, 0.03));
    [5.4, 5.75, 6.1, 6.45].forEach((inicio, i) => timbal(i % 2 === 0 ? 65.41 : 98.0, inicio));
  }

  exito(): void {
    [440, 554, 659, 880].forEach((frecuencia, indice) => {
      setTimeout(() => this.tono(frecuencia, frecuencia * 1.02, 0.22, 'triangle', 0.07), indice * 95);
    });
  }
}

export const sonido = new GestorSonido();
