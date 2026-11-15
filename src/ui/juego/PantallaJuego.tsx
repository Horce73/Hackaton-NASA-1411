import { useEffect, useRef, useState, type Dispatch, type PointerEvent as EventoPuntero } from 'react';
import {
  Apple,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flag,
  FlaskConical,
  Hammer,
  HeartPulse,
  HelpCircle,
  Menu,
  Radio,
  Sparkles,
  Star,
  Timer,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { sonido } from '../../audio/sonido';
import { CATALOGO_POR_ID } from '../../data/catalogo';
import { HISTORIAS_POR_ID } from '../../data/historias';
import { CIENCIA_MUESTREO, DURACION_DIA, ESPECIALIDADES } from '../../data/parametros';
import { semaforo } from '../../engine/salud';
import { recursoQueFalta } from '../../engine/turno';
import type { Archivo, Especialidad, Historia, Recursos, Tarea } from '../../engine/tipos';
import { datosDeLaMision } from '../../data/datosCuriosos';
import { conocimientoDelDia, type Accion, type EstadoApp } from '../../state/reducer';
import { LeyendaNegra } from '../comun/LeyendaNegra';
import { BotonPantallaCompleta } from '../comun/PantallaCompleta';
import { PantallaDato } from './PantallaDato';
import { ResumenDia } from './ResumenDia';
import { SecuenciaLlegada } from './SecuenciaLlegada';
import type { EntradaTactil3D, EstadoTelemetria3D } from '../../three/EscenaPlaneta';
import { describirConsecuencia, describirRiesgo } from '../comun/efectos';
import { numero, porcentajeDosis } from '../comun/formato';
import { PanelSalud } from '../salud/PanelSalud';

type EstadoJuego = Extract<EstadoApp, { fase: 'juego' }>;

const NOMBRE_RECURSO: Record<keyof Recursos, string> = {
  energia: 'energía',
  alimento: 'comida',
  oxigeno: 'aire',
  agua: 'agua',
};

// Reloj del día (RF-15, UX Brief 10): ajustable porque WCAG 2.2.1 pide poder alargar o quitar un límite de tiempo.
type AjusteReloj = 'normal' | 'doble' | 'sin';
const SEGUNDOS_RELOJ: Record<AjusteReloj, number> = { normal: DURACION_DIA, doble: DURACION_DIA * 2, sin: Infinity };

// Lo que tarda la tripulación en entrar por la compuerta (EscenaPlaneta) antes de mostrar el resumen.
const ESPERA_ENTRADA_MS = 3200;
const CLAVE_DATOS = 'mision-legado:datos-curiosos';

function movimientoReducido(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

// Preferencia de los datos curiosos: activados salvo que el jugador los apague. Falla en silencio sin almacenamiento.
function leerDatosActivos(): boolean {
  try {
    return localStorage.getItem(CLAVE_DATOS) !== 'no';
  } catch {
    return true;
  }
}

function guardarDatosActivos(activos: boolean): void {
  try {
    localStorage.setItem(CLAVE_DATOS, activos ? 'si' : 'no');
  } catch {
    // sin permiso: la preferencia dura lo que la sesión
  }
}

function formatoReloj(segundos: number): string {
  const s = Math.max(0, Math.ceil(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function nombreEstacion(estacion: string, itemIds: string[]): string {
  if (estacion === 'habitat') return 'Hábitat';
  if (estacion === 'exterior') return 'Exterior';
  const id = itemIds[Number(estacion.slice('item:'.length))];
  return CATALOGO_POR_ID[id]?.nombre ?? 'Hábitat';
}

// Pantalla táctil (móvil o tableta), en cualquier orientación: decide los controles, no el ancho.
function useEsTactil(): boolean {
  const [tactil] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true,
  );
  return tactil;
}

interface PantallaJuegoProps {
  estado: EstadoJuego;
  telemetria: EstadoTelemetria3D;
  mostrarSaludExterno: boolean;
  onCerrarSaludExterno: () => void;
  onEjecutarAccionCercana: () => void;
  onCambiarEntradaTactil: (entrada: Partial<EntradaTactil3D>) => void;
  onSeleccionarTripulante: (indice: number) => void;
  tareas: Tarea[]; // tareas del día del plan en curso (RF-15)
  dispatch: Dispatch<Accion>;
}

// HUD sobre el lienzo 3D: deja libre el centro de la pantalla y agrupa las decisiones abajo.
export function PantallaJuego({
  estado,
  telemetria,
  mostrarSaludExterno,
  onCerrarSaludExterno,
  onEjecutarAccionCercana,
  onCambiarEntradaTactil,
  onSeleccionarTripulante,
  tareas,
  dispatch,
}: PantallaJuegoProps) {
  const { partida, plan } = estado;
  const [panelEventoAbierto, setPanelEventoAbierto] = useState(true);
  const esTactil = useEsTactil();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarTripulacion, setMostrarTripulacion] = useState(false);
  const [mostrarHistorias, setMostrarHistorias] = useState(false);
  const [mostrarControles, setMostrarControles] = useState(false);
  const [confirmarAborto, setConfirmarAborto] = useState(false);
  const [silenciado, setSilenciado] = useState(sonido.silenciado);
  const [ajusteReloj, setAjusteReloj] = useState<AjusteReloj>('normal');
  const [restante, setRestante] = useState(SEGUNDOS_RELOJ.normal);

  // El reloj arranca con cada plan nuevo y se para con una tarjeta o un panel abierto.
  const primerPlano = estado.closeUp !== null;
  // Fin del día: la tripulación entra (unos 3 s), luego el resumen y, si están activados, un dato curioso.
  const cierreDia = estado.resumen !== null || estado.dato !== null;
  const [resumenListo, setResumenListo] = useState(false);
  useEffect(() => {
    setResumenListo(false);
    if (!estado.resumen) return;
    // Sin tareas (se quedó dentro) la tripulación no salió: el resumen sale sin esperar a la entrada.
    const sinEntrada = movimientoReducido() || estado.resumen.tareas.length === 0;
    const t = window.setTimeout(() => setResumenListo(true), sinEntrada ? 0 : ESPERA_ENTRADA_MS);
    return () => window.clearTimeout(t);
  }, [estado.resumen]);
  const [datosActivos, setDatosActivos] = useState(leerDatosActivos);
  const cambiarDatosActivos = (activos: boolean) => {
    setDatosActivos(activos);
    guardarDatosActivos(activos);
  };
  const datoActual = estado.dato
    ? datosDeLaMision(partida.config.destino, partida.historiasDesbloqueadas).find((d) => d.id === estado.dato)
    : undefined;
  const relojPausado =
    estado.tarjetas.length > 0 || primerPlano || estado.llegada || mostrarTripulacion || mostrarHistorias;
  const claveDia = plan ? `${partida.turno}-${plan.opcionId}` : null;
  const claveAnterior = useRef<string | null>(null);
  // En táctil, el panel se pliega al empezar el plan (para ver y moverse) y se abre para decidir el día siguiente.
  useEffect(() => {
    if (esTactil) setPanelEventoAbierto(!claveDia);
    else if (!claveDia) setPanelEventoAbierto(true); // cada día empieza decidiendo, con la tripulación dentro
  }, [claveDia, esTactil]);
  // Antes de decidir, la tripulación solo sale con «Salir a explorar» (para tomar notas del equipo histórico);
  // plegar el panel solo lo oculta.
  const salirAExplorar = () => {
    dispatch({ tipo: 'SALIR_TRIPULACION' });
    setPanelEventoAbierto(false);
  };
  // Guiño a HAL 9000: el ordenador de la base anuncia la salida por la compuerta.
  const [vozCompuerta, setVozCompuerta] = useState<string | null>(null);
  const fueraAntes = useRef(estado.tripulacionFuera);
  useEffect(() => {
    const salen = estado.tripulacionFuera && !fueraAntes.current;
    fueraAntes.current = estado.tripulacionFuera;
    if (!salen) return;
    setVozCompuerta(`Abriendo la compuerta, ${partida.tripulacion[0]?.nombre ?? 'equipo'}.`);
    const t = window.setTimeout(() => setVozCompuerta(null), 3500);
    return () => window.clearTimeout(t);
  }, [estado.tripulacionFuera, partida.tripulacion]);
  useEffect(() => {
    if (claveDia && claveDia !== claveAnterior.current) setRestante(SEGUNDOS_RELOJ[ajusteReloj]);
    claveAnterior.current = claveDia;
  }, [claveDia, ajusteReloj]);
  useEffect(() => {
    if (!claveDia || relojPausado || ajusteReloj === 'sin') return;
    const id = window.setInterval(() => setRestante((r) => r - 0.25), 250);
    return () => clearInterval(id);
  }, [claveDia, relojPausado, ajusteReloj]);
  useEffect(() => {
    if (!claveDia || ajusteReloj === 'sin' || restante > 0) return;
    setRestante(SEGUNDOS_RELOJ[ajusteReloj]); // listo para el día siguiente
    dispatch({ tipo: 'TERMINAR_DIA' });
  }, [restante, claveDia, ajusteReloj, dispatch]);

  const cambiarAjusteReloj = (ajuste: AjusteReloj) => {
    // Cambiar el ajuste a media jornada conserva lo gastado: ×2 suma el tiempo que falta.
    setRestante((r) => {
      if (ajuste === 'sin') return r;
      if (ajusteReloj === 'sin') return SEGUNDOS_RELOJ[ajuste];
      return Math.max(10, r + SEGUNDOS_RELOJ[ajuste] - SEGUNDOS_RELOJ[ajusteReloj]);
    });
    setAjusteReloj(ajuste);
  };
  const hechas = new Set(plan?.hechas ?? []);
  const tareasHechasCount = tareas.filter((t) => hechas.has(t.id)).length;

  useEffect(() => {
    if (mostrarSaludExterno) {
      setMostrarTripulacion(true);
      onCerrarSaludExterno();
    }
  }, [mostrarSaludExterno, onCerrarSaludExterno]);

  useEffect(() => {
    if (!estado.avisoCampo) return;
    const t = window.setTimeout(() => dispatch({ tipo: 'LIMPIAR_AVISO_CAMPO' }), 4200);
    return () => clearTimeout(t);
  }, [estado.avisoCampo, dispatch]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'KeyH') {
        setPanelEventoAbierto((v) => !v);
      } else if (e.code === 'KeyC') {
        setMostrarTripulacion((v) => !v);
      } else if (e.code === 'KeyM') {
        sonido.silenciado = !sonido.silenciado;
        setSilenciado(sonido.silenciado);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleMute = () => {
    sonido.silenciado = !sonido.silenciado;
    setSilenciado(sonido.silenciado);
  };

  const evento = partida.eventoActual;
  const conocimiento = conocimientoDelDia(estado);
  const dosisMediaPct = porcentajeDosis(partida.tripulacion);

  const alertaCriticaSalud = partida.tripulacion.some((a) =>
    (['radiacion', 'nutricion', 'suenoEstres', 'musculoHueso'] as const).some(
      (ind) => semaforo(a.salud[ind]) === 'rojo',
    ),
  );

  const colorDosis =
    dosisMediaPct >= 60
      ? 'text-[var(--color-danger)]'
      : dosisMediaPct >= 30
        ? 'text-[var(--color-warn)]'
        : 'text-[var(--color-ok)]';

  const indicadoresGlobales = [
    {
      id: 'energia',
      etiqueta: 'Energía',
      valor: Math.round(partida.recursos.energia),
      delta: partida.ultimoDelta?.energia,
      Icono: Zap,
      critico: partida.recursos.energia <= 10,
    },
    {
      id: 'alimento',
      etiqueta: 'Alimento',
      valor: Math.round(partida.recursos.alimento),
      delta: partida.ultimoDelta?.alimento,
      Icono: Apple,
      critico: partida.recursos.alimento <= 10,
    },
    {
      id: 'oxigeno',
      etiqueta: 'Oxígeno',
      valor: Math.round(partida.recursos.oxigeno),
      delta: partida.ultimoDelta?.oxigeno,
      Icono: Wind,
      critico: partida.recursos.oxigeno <= 10,
    },
    {
      id: 'agua',
      etiqueta: 'Agua',
      valor: Math.round(partida.recursos.agua),
      delta: partida.ultimoDelta?.agua,
      Icono: Droplets,
      critico: partida.recursos.agua <= 10,
    },
  ];

  return (
    <main className="relative z-10 h-screen w-screen overflow-hidden pointer-events-none flex flex-col justify-between p-2.5 sm:p-4">
      <header className={`${estado.llegada || estado.dato ? 'invisible' : ''} pointer-events-auto flex flex-wrap items-stretch justify-between gap-2`}>
        {/* Tres grupos: misión, recursos y acciones. En pantallas estrechas, los recursos bajan a su propia fila. */}
        <div role="group" aria-label="Misión" className="rounded-xl border border-[var(--color-border-strong)] bg-[#0b1020]/90 shadow-[0_6px_18px_rgba(0,0,0,0.35)] px-2.5 py-1 flex flex-col justify-center">
          <div className="flex items-center gap-3">
          <div className="font-mono tabular-nums text-sm sm:text-base font-bold text-[var(--color-text)] whitespace-nowrap">
            Día {partida.turno} / {partida.config.turnos}
          </div>
          {plan && (
            <div
              className={`inline-flex items-center gap-1 font-mono tabular-nums text-sm font-bold ${
                ajusteReloj !== 'sin' && restante <= 15 ? 'text-[var(--color-danger)]' : 'text-[var(--color-warn)]'
              }`}
            >
              <Timer className="w-4 h-4" aria-hidden="true" />
              <span>{ajusteReloj === 'sin' ? 'Sin reloj' : formatoReloj(restante)}</span>
              {relojPausado && <span className="text-xs font-normal text-[var(--color-text-muted)]">(pausa)</span>}
            </div>
          )}
          </div>
          <div className={`${esTactil ? 'hidden' : 'hidden md:flex'} items-center gap-2 text-xs text-[var(--color-text-muted)]`}>
            <span title={`Gravedad: ${telemetria.gravedad} m/s²`}>
              {partida.config.destino === 'luna' ? 'La Luna · pesas 6 veces menos' : 'Marte · pesas casi 3 veces menos'}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[var(--color-moon)]">
              <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
              {Math.round(partida.ciencia)} ciencia
            </span>
          </div>
        </div>

        <div
          role="group"
          aria-label="Recursos"
          className="rounded-xl border border-[var(--color-border-strong)] bg-[#0b1020]/90 shadow-[0_6px_18px_rgba(0,0,0,0.35)] px-1.5 py-1 flex flex-wrap items-center gap-1 max-sm:order-last max-sm:basis-full max-sm:justify-between"
        >
          {indicadoresGlobales.map(({ id, etiqueta, valor, delta, Icono, critico }) => (
            <div
              key={id}
              title={etiqueta}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                critico
                  ? 'border-[var(--color-danger)] bg-[#2a1520] text-[var(--color-danger)]'
                  : 'border-transparent text-[var(--color-text)]'
              }`}
            >
              <Icono className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className={`${esTactil ? 'sr-only' : 'sr-only xl:not-sr-only'} text-[var(--color-text-muted)]`}>{etiqueta}</span>
              <span className="font-mono tabular-nums font-bold">{valor}</span>
              {delta !== undefined && delta !== 0 && (
                <span
                  className={`hidden xl:inline font-mono tabular-nums text-xs ${
                    delta > 0 ? 'text-[var(--color-ok)]' : 'text-[var(--color-warn)]'
                  }`}
                >
                  {delta > 0 ? `+${numero(delta)}` : numero(delta)}
                </span>
              )}
            </div>
          ))}

          <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-[var(--color-border-strong)]" />
          <div title="Dosis de radiación" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
            <Radio className={`w-3.5 h-3.5 ${colorDosis}`} aria-hidden="true" />
            <span className="sr-only xl:not-sr-only text-[var(--color-text-muted)]">Rad</span>
            <span className={`font-mono tabular-nums font-bold ${colorDosis}`}>{dosisMediaPct}%</span>
          </div>
        </div>

        {(!esTactil || menuAbierto) && (
        <div role="group" aria-label="Acciones" className="rounded-xl border border-[var(--color-border-strong)] bg-[#0b1020]/90 shadow-[0_6px_18px_rgba(0,0,0,0.35)] p-1 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMostrarTripulacion((v) => !v);
              setMostrarHistorias(false);
              setMostrarControles(false);
            }}
            aria-expanded={mostrarTripulacion}
            className={`inline-flex items-center gap-1.5 min-h-[38px] px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              alertaCriticaSalud
                ? 'border-[var(--color-danger)] bg-[#2a1520] text-[var(--color-danger)]'
                : 'border-[var(--color-border-strong)] bg-[#141b34] text-[var(--color-text)] hover:border-[var(--color-moon)]'
            }`}
          >
            <HeartPulse className="w-4 h-4" aria-hidden="true" />
            <span>Salud ({partida.tripulacion.length})</span>
          </button>

          {partida.historiasDesbloqueadas.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMostrarHistorias((v) => !v);
                setMostrarTripulacion(false);
                setMostrarControles(false);
              }}
              aria-expanded={mostrarHistorias}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-2.5 rounded-lg border border-[var(--color-border-strong)] bg-[#141b34] text-xs font-semibold text-[var(--color-warn)] hover:border-[var(--color-warn)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">NASA ({partida.historiasDesbloqueadas.length})</span>
              <span className="sm:hidden">{partida.historiasDesbloqueadas.length}</span>
            </button>
          )}

          <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-[var(--color-border-strong)]" />
          <button
            type="button"
            onClick={toggleMute}
            aria-label={silenciado ? 'Activar sonido' : 'Silenciar sonido'}
            title={silenciado ? 'Activar sonido [M]' : 'Silenciar sonido [M]'}
            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[#141b34] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            {silenciado ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setMostrarControles((v) => !v);
              setMostrarTripulacion(false);
              setMostrarHistorias(false);
            }}
            aria-label="Controles 3D"
            title="Controles 3D"
            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[#141b34] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {!confirmarAborto ? (
            <button
              type="button"
              onClick={() => setConfirmarAborto(true)}
              aria-label="Abortar misión"
              className="inline-flex items-center gap-1 min-h-[38px] px-2.5 rounded-lg border border-[var(--color-border)] bg-[#141b34] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Abortar</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => dispatch({ tipo: 'ABORTAR_MISION' })}
                className="min-h-[38px] px-2.5 rounded-lg bg-[var(--color-danger)] text-[var(--color-on-accent)] text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                Confirmar regreso
              </button>
              <button
                type="button"
                onClick={() => setConfirmarAborto(false)}
                className="min-h-[38px] px-2.5 rounded-lg border border-[var(--color-border)] bg-[#141b34] text-xs text-[var(--color-text)] cursor-pointer"
              >
                Seguir
              </button>
            </div>
          )}
        </div>
        )}
        {esTactil && (
          <div className="flex items-start gap-2">
          <BotonPantallaCompleta />
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-label="Más opciones: salud, archivo NASA, sonido, ayuda y abortar"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[#141b34] text-[var(--color-text)] cursor-pointer"
          >
            {menuAbierto ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
          </div>
        )}
      </header>

      {/* Durante el primer plano solo quedan la cabecera y el diálogo (RF-17). */}
      <div className={`relative flex-1 pointer-events-none ${primerPlano || estado.llegada || cierreDia ? 'invisible' : ''}`}>
        {vozCompuerta && (
          <p
            role="status"
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/85 px-4 py-2 text-sm text-white shadow-xl"
          >
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_10px_3px_rgba(220,38,38,0.7)]" />
            <span>
              <span className="text-white/60">Ordenador de la base:</span> «{vozCompuerta}»
            </span>
          </p>
        )}
        {estado.avisoCampo && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto mx-auto mt-2 w-fit rounded-xl border border-[var(--color-ok)] bg-[#0f241f] px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--color-ok)] flex items-center gap-2 shadow-lg"
          >
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{estado.avisoCampo}</span>
          </div>
        )}

        {mostrarTripulacion && (
          <div className="pointer-events-auto absolute top-2 right-0 w-full max-w-md max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/96 shadow-2xl p-2">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="text-xs font-mono text-[var(--color-text-muted)]">Monitor biomédico [C]</span>
              <button
                type="button"
                onClick={() => setMostrarTripulacion(false)}
                aria-label="Cerrar panel de salud"
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PanelSalud partida={partida} />
          </div>
        )}

        {mostrarHistorias && partida.historiasDesbloqueadas.length > 0 && (
          <div className="pointer-events-auto absolute top-2 right-0 w-full max-w-sm rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/96 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--color-warn)]">Cuaderno de misión</h2>
              <button
                type="button"
                onClick={() => setMostrarHistorias(false)}
                aria-label="Cerrar lista de historias"
                className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {partida.historiasDesbloqueadas.map((hId) => {
                const hist = HISTORIAS_POR_ID[hId];
                if (!hist) return null;
                return (
                  <button
                    key={hId}
                    type="button"
                    onClick={() => {
                      setMostrarHistorias(false);
                      dispatch({ tipo: 'ABRIR_HISTORIA', historiaId: hId });
                    }}
                    className="text-left min-h-[42px] px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[#141b34] hover:border-[var(--color-warn)] text-sm text-[var(--color-text)] transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 shrink-0 text-[var(--color-warn)]" aria-hidden="true" />
                      {hist.nombre}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {estado.notas.includes(hId)
                        ? hist.medicion.dato
                        : 'Sin anotar: inspecciónalo en la base (E) para saber qué midió.'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mostrarControles && (
          <div className="pointer-events-auto absolute top-2 right-0 w-full max-w-xs rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/96 p-4 shadow-2xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-[var(--color-text)]">Controles de superficie 3D</h2>
              <button
                type="button"
                onClick={() => setMostrarControles(false)}
                aria-label="Cerrar controles"
                className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-1.5 text-[var(--color-text-muted)]">
              <li>
                <strong className="text-[var(--color-text)]">WASD / Flechas:</strong> Caminar en 3ª persona
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Shift:</strong> Correr
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Espacio:</strong> Saltar
              </li>
              <li>
                <strong className="text-[var(--color-text)]">1–4:</strong> Elegir astronauta
              </li>
              <li>
                <strong className="text-[var(--color-text)]">E:</strong> Trabajar en una tarea, reparar o inspeccionar NASA
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Arrastrar ratón / Rueda:</strong> Rotar y acercar cámara
              </li>
              <li>
                <strong className="text-[var(--color-text)]">H / C / M:</strong> Ocultar panel / Salud / Sonido
              </li>
            </ul>
          </div>
        )}

        {!esTactil && telemetria.tareaCercana && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={onEjecutarAccionCercana}
              className="rounded-xl border border-[var(--color-warn)] bg-[#0b1020]/95 px-4 py-2.5 shadow-2xl flex items-center gap-3 hover:bg-[#1b2444] transition-colors cursor-pointer"
            >
              <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-[var(--color-warn)] text-[var(--color-on-accent)]">
                E
              </span>
              <span className="text-left text-sm font-bold text-[var(--color-text)]">
                Trabajar: {telemetria.tareaCercana.etiqueta}
              </span>
            </button>
          </div>
        )}

        {!esTactil && !telemetria.tareaCercana && telemetria.objetivoCercano && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={onEjecutarAccionCercana}
              className="rounded-xl border border-[var(--color-warn)] bg-[#0b1020]/95 px-4 py-2.5 shadow-2xl flex items-center gap-3 hover:bg-[#1b2444] transition-colors cursor-pointer"
            >
              <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-[var(--color-warn)] text-[var(--color-on-accent)]">
                E
              </span>
              <span className="text-left">
                <span className="block text-sm font-bold text-[var(--color-text)] leading-tight">
                  {telemetria.objetivoCercano.etiqueta}
                </span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  {telemetria.objetivoCercano.subetiqueta}
                </span>
              </span>
            </button>
          </div>
        )}
      </div>

      <div
        className={`relative pointer-events-none flex flex-col justify-between gap-2 ${esTactil ? '' : 'md:flex-row md:items-end'} ${primerPlano || estado.llegada || cierreDia ? 'invisible' : ''}`}
      >
        {evento && (
          <section
            aria-live="polite"
            aria-labelledby="titulo-evento-actual"
            className={`pointer-events-auto w-full md:max-w-lg rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/92 shadow-2xl overflow-hidden ${
              // En táctil horizontal, plegado va abajo y en el centro, entre el joystick y los botones de acción.
              esTactil && !panelEventoAbierto
                ? 'landscape:absolute landscape:bottom-0 landscape:left-1/2 landscape:z-10 landscape:-translate-x-1/2 landscape:w-[min(42vw,26rem)]'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#141b34] border-b border-[var(--color-border)]">
              <div className="min-w-0">
                <h1
                  id="titulo-evento-actual"
                  className="text-sm sm:text-base font-bold text-[var(--color-text)] truncate"
                >
                  {evento.titulo}
                </h1>
                <p className="text-xs text-[var(--color-warn)] truncate tabular-nums">
                  {plan
                    ? `${tareasHechasCount} de ${tareas.length} tareas hechas`
                    : telemetria.nodosRestantes > 0
                      ? `Día ${partida.turno} · ${telemetria.nodosRestantes} ${telemetria.nodosRestantes === 1 ? 'cosa' : 'cosas'} por revisar fuera`
                      : `Día ${partida.turno} · elige qué hacer hoy`}
                </p>
              </div>

              {plan && !panelEventoAbierto && (
                <button
                  type="button"
                  onClick={() => dispatch({ tipo: 'TERMINAR_DIA' })}
                  className="min-h-[44px] px-3 rounded-lg bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] text-[var(--color-on-accent)] text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Terminar día
                </button>
              )}
              <button
                type="button"
                onClick={() => setPanelEventoAbierto((v) => !v)}
                aria-expanded={panelEventoAbierto}
                className="inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-lg border border-[var(--color-border)] bg-[#0b1020] text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-moon)] cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>
                  {panelEventoAbierto ? (esTactil ? 'Ocultar' : 'Ocultar [H]') : plan ? 'Ver plan' : esTactil ? 'Decidir' : 'Decidir [H]'}
                </span>
                {panelEventoAbierto ? (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {panelEventoAbierto && (
              <div className="p-3.5 space-y-2.5 max-h-[42vh] overflow-y-auto">
                {partida.ultimoDelta && (partida.ultimoDelta.sinAtender || partida.ultimoDelta.modulosParados) && (
                  <p className="text-xs text-[var(--color-warn)] leading-snug">
                    Ayer:{' '}
                    {partida.ultimoDelta.sinAtender ? `${partida.ultimoDelta.opcionTexto}. ` : ''}
                    {partida.ultimoDelta.modulosParados
                      ? `${partida.ultimoDelta.modulosParados} módulo(s) sin mantenimiento no rindieron.`
                      : ''}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-snug">
                  {evento.texto}
                </p>

                {plan ? (
                  <PlanDelDia
                    opcionTexto={evento.opciones.find((o) => o.id === plan.opcionId)?.texto ?? ''}
                    tareas={tareas}
                    hechas={hechas}
                    progreso={telemetria.progresoTareas}
                    trabajo={telemetria.trabajoTripulacion}
                    tripulacion={partida.tripulacion.map((a) => ({ nombre: a.nombre, especialidad: a.especialidad }))}
                    itemIds={partida.diseno.itemIds}
                    ajusteReloj={ajusteReloj}
                    onAjusteReloj={cambiarAjusteReloj}
                    onTerminar={() => dispatch({ tipo: 'TERMINAR_DIA' })}
                  />
                ) : (
                <>
                <ArchivoNasa
                  archivo={evento.archivo}
                  conocido={conocimiento.conocido}
                  misiones={conocimiento.misiones}
                  itemIds={partida.diseno.itemIds}
                />
                {!estado.tripulacionFuera && (
                  <button
                    type="button"
                    onClick={salirAExplorar}
                    className="w-full min-h-[44px] rounded-lg border border-[var(--color-border-strong)] bg-[#0b1020] px-3 py-2 text-left text-xs text-[var(--color-text-muted)] hover:border-[var(--color-moon)] cursor-pointer"
                  >
                    <span className="block text-sm font-semibold text-[var(--color-text)]">Salir a explorar</span>
                    Antes de decidir: inspecciona el equipo NASA de tu base para anotar lo que midió.
                  </button>
                )}
                <ul className="space-y-1.5">
                  {evento.opciones.map((op) => {
                    const falta = recursoQueFalta(partida, op.id);
                    return (
                      <li key={op.id}>
                        <button
                          type="button"
                          disabled={Boolean(falta)}
                          onClick={() => dispatch({ tipo: 'ELEGIR_OPCION', opcionId: op.id })}
                          className="w-full text-left rounded-xl border border-[var(--color-border-strong)] bg-[#141b34] hover:border-[var(--color-mars)] hover:bg-[#1e294f] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-[var(--color-border-strong)] disabled:hover:bg-[#141b34] px-3.5 py-2.5 transition-colors cursor-pointer"
                        >
                          <div className="text-sm font-semibold text-[var(--color-text)]">{op.texto}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {conocimiento.conocido ? describirConsecuencia(op.efectos) : describirRiesgo(op.efectos)}
                          </div>
                        </button>
                        {falta && (
                          <p className="mt-1 px-1 text-xs text-[var(--color-danger)]">
                            No tienes suficiente {NOMBRE_RECURSO[falta]} para esto.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
                </>
                )}
              </div>
            )}
          </section>
        )}

        {!esTactil && (
          <BarraTripulacion
            tripulacion={partida.tripulacion.map((a) => ({ nombre: a.nombre, especialidad: a.especialidad }))}
            seleccionado={telemetria.seleccionado}
            trabajo={telemetria.trabajoTripulacion}
            tareas={tareas}
            progreso={telemetria.progresoTareas}
            onSeleccionar={onSeleccionarTripulante}
          />
        )}

        {esTactil && !panelEventoAbierto && estado.tripulacionFuera && (
          <div className="pointer-events-auto flex items-end justify-between w-full gap-2 shrink-0">
            <Joystick onCambio={onCambiarEntradaTactil} />
            <div className="flex flex-col items-end gap-2">
              <BarraTripulacion
                compacta
                tripulacion={partida.tripulacion.map((a) => ({ nombre: a.nombre, especialidad: a.especialidad }))}
                seleccionado={telemetria.seleccionado}
                trabajo={telemetria.trabajoTripulacion}
                tareas={tareas}
                progreso={telemetria.progresoTareas}
                onSeleccionar={onSeleccionarTripulante}
              />
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  aria-label="Saltar"
                  onPointerDown={() => onCambiarEntradaTactil({ saltar: true })}
                  onPointerUp={() => onCambiarEntradaTactil({ saltar: false })}
                  onPointerCancel={() => onCambiarEntradaTactil({ saltar: false })}
                  onPointerLeave={() => onCambiarEntradaTactil({ saltar: false })}
                  style={{ touchAction: 'none' }}
                  className="h-14 px-4 rounded-2xl border border-[var(--color-border-strong)] bg-[#141b34] text-[var(--color-text)] font-bold text-sm shadow-xl active:scale-95"
                >
                  Saltar
                </button>
                <button
                  type="button"
                  onClick={onEjecutarAccionCercana}
                  disabled={!telemetria.tareaCercana && !telemetria.objetivoCercano}
                  className="h-20 w-24 rounded-2xl bg-[var(--color-mars)] text-[var(--color-on-accent)] font-bold shadow-xl active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center px-1"
                >
                  <span className="text-base">{telemetria.tareaCercana ? 'Trabajar' : telemetria.objetivoCercano ? 'Usar' : 'Acción'}</span>
                  <span className="text-xs leading-tight line-clamp-2 text-center">
                    {telemetria.tareaCercana?.etiqueta ?? telemetria.objetivoCercano?.etiqueta ?? 'Acércate a una tarea'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {estado.llegada && (
        <SecuenciaLlegada destino={partida.config.destino} onTerminar={() => dispatch({ tipo: 'TERMINAR_LLEGADA' })} />
      )}
      {estado.resumen && resumenListo && (
        <ResumenDia
          resumen={estado.resumen}
          delta={partida.ultimoDelta}
          terminada={partida.resultado !== undefined}
          datosActivos={datosActivos}
          onDatosActivos={cambiarDatosActivos}
          onContinuar={() => dispatch({ tipo: 'CERRAR_RESUMEN', conDato: datosActivos })}
        />
      )}
      {datoActual && (
        <PantallaDato
          key={datoActual.id}
          dato={datoActual}
          continuar={partida.resultado ? 'Ver la bitácora' : 'Siguiente día'}
          onContinuar={() => dispatch({ tipo: 'CERRAR_DATO' })}
          onDesactivar={() => {
            cambiarDatosActivos(false);
            dispatch({ tipo: 'CERRAR_DATO' });
          }}
        />
      )}
      {estado.closeUp && HISTORIAS_POR_ID[estado.closeUp] && (
        <DialogoCloseUp
          key={estado.closeUp}
          historia={HISTORIAS_POR_ID[estado.closeUp]}
          onCerrar={() => dispatch({ tipo: 'CERRAR_CLOSEUP' })}
        />
      )}
    </main>
  );
}

interface MiembroTripulacion {
  nombre: string;
  especialidad: Especialidad;
}

// Cuaderno de misión (RF-17): con la nota de la misión que lo midió (o si es conocimiento general, o ya se vivió),
// el jugador ve el dato y las cifras; sin ella, solo qué cambia cada opción y dónde aprenderlo.
function ArchivoNasa({
  archivo,
  conocido,
  misiones,
  itemIds,
}: {
  archivo: Archivo;
  conocido: boolean;
  misiones: string[];
  itemIds: string[];
}) {
  if (conocido) {
    return (
      <p className="flex gap-2 text-xs leading-snug text-[var(--color-text)]">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-ok)]" aria-hidden="true" />
        <span>
        <strong className="text-[var(--color-ok)]">Archivo NASA:</strong> {archivo.dato}{' '}
        <a href={archivo.fuente} target="_blank" rel="noreferrer" className="underline text-[var(--color-text-muted)]">
          Fuente
        </a>
        </span>
      </p>
    );
  }
  const traidas = misiones.filter((id) => itemIds.some((item) => CATALOGO_POR_ID[item]?.historiaId === id));
  const nombres = (ids: string[]) => ids.map((id) => HISTORIAS_POR_ID[id]?.nombre ?? id).join(' o ');
  return (
    <p className="flex gap-2 text-xs leading-snug text-[var(--color-text-muted)]">
      <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
      <strong className="text-[var(--color-text)]">Sin cifras todavía.</strong>{' '}
      {traidas.length > 0
        ? `Esto se midió con ${nombres(traidas)}: pulsa «Salir a explorar», acércate y pulsa E para anotarlo en tu cuaderno.`
        : `Esto se midió con ${nombres(misiones)}, que no trajiste. Lo sabrás cuando lo vivas.`}
      </span>
    </p>
  );
}

// Primer plano (RF-17): la cámara se acerca al equipo y un diálogo negro abajo cuenta lo que midió su misión.
function DialogoCloseUp({ historia, onCerrar }: { historia: Historia; onCerrar: () => void }) {
  return (
    <LeyendaNegra
      titulo={`${historia.anio} · ${historia.nombre} · Lo que se midió`}
      texto={historia.medicion.dato}
      fuente={historia.medicion.fuente}
      principal="Anotar en el cuaderno"
      onPrincipal={onCerrar}
    />
  );
}

// Plan del día (RF-15): primero las tareas de la opción elegida, después el mantenimiento en líneas cortas.
// El pie con el reloj y "Terminar día" queda fijo abajo: no hace falta desplazarse para terminar.
function PlanDelDia({
  opcionTexto,
  tareas,
  hechas,
  progreso,
  trabajo,
  tripulacion,
  itemIds,
  ajusteReloj,
  onAjusteReloj,
  onTerminar,
}: {
  opcionTexto: string;
  tareas: Tarea[];
  hechas: Set<string>;
  progreso: Record<string, number>;
  trabajo: (string | null)[];
  tripulacion: MiembroTripulacion[];
  itemIds: string[];
  ajusteReloj: AjusteReloj;
  onAjusteReloj: (ajuste: AjusteReloj) => void;
  onTerminar: () => void;
}) {
  const delPlan = tareas.filter((t) => t.tipo !== 'mantenimiento');
  const mantenimiento = tareas.filter((t) => t.tipo === 'mantenimiento');
  const faltanDelPlan = delPlan.some((t) => t.tipo === 'evento' && !hechas.has(t.id));
  const pct = (t: Tarea) => (hechas.has(t.id) ? 100 : Math.round((progreso[t.id] ?? 0) * 100));
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--color-text)]">
        Plan: <strong>{opcionTexto}</strong>
        {delPlan.length === 0 && <span className="text-[var(--color-text-muted)]"> · sin tareas extra, pero arriesgado</span>}
      </p>
      {delPlan.length > 0 && (
        <ul className="space-y-1" aria-label="Tareas del plan">
          {delPlan.map((t) => {
            const quienes = tripulacion.filter((_, i) => trabajo[i] === t.id).map((a) => a.nombre);
            const especialista = tripulacion.find((a) => a.especialidad === t.especialidad);
            return (
              <li
                key={t.id}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                  hechas.has(t.id) ? 'border-[var(--color-ok)] bg-[#0f241f]' : 'border-[var(--color-warn)]/60 bg-[#141b34]'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-semibold text-[var(--color-text)]">
                    {hechas.has(t.id) ? '✓ ' : ''}
                    {t.etiqueta}
                  </span>
                  <span className="font-mono tabular-nums text-[var(--color-text-muted)]">{pct(t)}%</span>
                </div>
                <div className="text-[var(--color-text-muted)]">
                  {nombreEstacion(t.estacion, itemIds)} · {ESPECIALIDADES[t.especialidad].nombre}
                  {(t.personas ?? 1) > 1 && ` · ${t.personas} personas a la vez`}
                  {t.tipo === 'ciencia' && ` · opcional, +${CIENCIA_MUESTREO} ciencia`}
                  {especialista ? ` (${especialista.nombre} va el doble de rápido)` : ''}
                  {quienes.length > 0 && ` · Trabajando: ${quienes.join(', ')}`}
                </div>
                <div className="mt-1 h-1.5 rounded bg-white/10" aria-hidden="true">
                  <div className="h-full rounded bg-[var(--color-ok)]" style={{ width: `${pct(t)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {faltanDelPlan && (
        <p className="text-xs text-[var(--color-warn)]">Si no terminas las tareas del plan, pasa lo peor del evento.</p>
      )}
      {mantenimiento.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-[var(--color-text-muted)]">
            Mantenimiento ({mantenimiento.filter((t) => hechas.has(t.id)).length}/{mantenimiento.length}) · un módulo sin
            revisar no rinde hoy
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1" aria-label="Mantenimiento">
            {mantenimiento.map((t) => (
              <li
                key={t.id}
                className={`rounded-md border px-2 py-1 text-xs ${
                  hechas.has(t.id) ? 'border-[var(--color-ok)] bg-[#0f241f]' : 'border-[var(--color-border)] bg-[#141b34]'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="truncate text-[var(--color-text)]">
                    {hechas.has(t.id) ? '✓ ' : ''}
                    {nombreEstacion(t.estacion, itemIds)}
                  </span>
                  <span className="shrink-0 font-mono tabular-nums" style={{ color: ESPECIALIDADES[t.especialidad].color }}>
                    {ESPECIALIDADES[t.especialidad].nombre.slice(0, 3)} {pct(t)}%
                  </span>
                </div>
                <div className="mt-0.5 h-1 rounded bg-white/10" aria-hidden="true">
                  <div className="h-full rounded bg-[var(--color-ok)]" style={{ width: `${pct(t)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="sticky -bottom-3.5 -mx-3.5 -mb-3.5 px-3.5 py-2 bg-[#0b1020] border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
          Reloj
          <select
            value={ajusteReloj}
            onChange={(e) => onAjusteReloj(e.target.value as AjusteReloj)}
            className="min-h-[40px] rounded-lg border border-[var(--color-border)] bg-[#0b1020] px-2 text-xs text-[var(--color-text)]"
          >
            <option value="normal">{DURACION_DIA} s</option>
            <option value="doble">×2</option>
            <option value="sin">Sin reloj</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onTerminar}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] text-[var(--color-on-accent)] text-sm font-bold cursor-pointer"
        >
          Terminar día
        </button>
      </div>
    </div>
  );
}

// Joystick táctil: un pulgar mueve al astronauta. Solo sigue a su propio dedo, así el otro puede girar la cámara.
function Joystick({ onCambio }: { onCambio: (entrada: Partial<EntradaTactil3D>) => void }) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const puntero = useRef<number | null>(null);
  const [mando, setMando] = useState({ x: 0, y: 0 });
  const mover = (e: EventoPuntero<HTMLDivElement>) => {
    if (e.pointerId !== puntero.current || !baseRef.current) return;
    const caja = baseRef.current.getBoundingClientRect();
    const radio = caja.width / 2;
    let x = (e.clientX - caja.left - radio) / radio;
    let y = (e.clientY - caja.top - radio) / radio;
    const largo = Math.hypot(x, y);
    if (largo > 1) {
      x /= largo;
      y /= largo;
    }
    const activo = largo < 0.15 ? 0 : 1; // zona muerta en el centro
    setMando({ x, y });
    onCambio({ adelante: -y * activo, derecha: x * activo, sprint: largo > 0.95 });
  };
  const soltar = (e: EventoPuntero<HTMLDivElement>) => {
    if (e.pointerId !== puntero.current) return;
    puntero.current = null;
    setMando({ x: 0, y: 0 });
    onCambio({ adelante: 0, derecha: 0, sprint: false });
  };
  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Joystick: arrastra para mover al astronauta"
      onPointerDown={(e) => {
        if (puntero.current !== null) return;
        puntero.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        mover(e);
      }}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      style={{ touchAction: 'none' }}
      className="relative w-32 h-32 shrink-0 rounded-full border-2 border-[var(--color-border-strong)] bg-[#0b1020]/70 select-none"
    >
      <div
        className="absolute left-1/2 top-1/2 -ml-7 -mt-7 w-14 h-14 rounded-full bg-[var(--color-moon)]/80 border border-white/40"
        style={{ transform: `translate(${mando.x * 36}px, ${mando.y * 36}px)` }}
        aria-hidden="true"
      />
    </div>
  );
}

// Barra de tripulación (RF-13): elegir astronauta con clic o con las teclas 1–4.
function BarraTripulacion({
  compacta = false,
  tripulacion,
  seleccionado,
  trabajo,
  tareas,
  progreso,
  onSeleccionar,
}: {
  compacta?: boolean;
  tripulacion: MiembroTripulacion[];
  seleccionado: number;
  trabajo: (string | null)[];
  tareas: Tarea[];
  progreso: Record<string, number>;
  onSeleccionar: (indice: number) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Tripulación: elige a quién mover"
      className="pointer-events-auto flex flex-wrap gap-1.5 md:justify-end"
    >
      {tripulacion.map((a, i) => {
        if (compacta) {
          const ocupado = trabajo[i] !== null;
          return (
            <button
              key={a.nombre}
              type="button"
              onClick={() => onSeleccionar(i)}
              aria-pressed={i === seleccionado}
              aria-label={`${i + 1}: ${a.nombre}, ${ESPECIALIDADES[a.especialidad].nombre}${ocupado ? ', trabajando' : ''}`}
              style={{ boxShadow: `inset 0 -4px 0 ${ESPECIALIDADES[a.especialidad].color}` }}
              className={`min-h-[44px] min-w-[52px] rounded-xl border-2 px-2 text-xs font-bold cursor-pointer ${
                i === seleccionado
                  ? 'border-[var(--color-warn)] bg-[#1e294f] text-[var(--color-text)]'
                  : 'border-[var(--color-border)] bg-[#0b1020]/92 text-[var(--color-text-muted)]'
              }`}
            >
              {a.nombre}
              {ocupado && ' ⚙'}
            </button>
          );
        }
        const tarea = tareas.find((t) => t.id === trabajo[i]);
        const activo = i === seleccionado;
        const esperando = tarea && trabajo.filter((id) => id === tarea.id).length < (tarea.personas ?? 1);
        return (
          <button
            key={a.nombre}
            type="button"
            onClick={() => onSeleccionar(i)}
            aria-pressed={activo}
            style={{ boxShadow: `inset 6px 0 0 ${ESPECIALIDADES[a.especialidad].color}` }}
            className={`text-left min-h-[44px] rounded-xl border-2 pl-3.5 pr-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
              activo
                ? 'border-[var(--color-warn)] bg-[#1e294f]'
                : 'border-[var(--color-border)] bg-[#0b1020]/92 hover:border-[var(--color-border-strong)]'
            }`}
          >
            <span className="block font-bold text-[var(--color-text)]">
              <span className="font-mono">{i + 1}</span> · {a.nombre}
              {activo && <span className="text-[var(--color-warn)]"> (tú)</span>}
            </span>
            <span className="block text-[var(--color-text-muted)]">
              <Hammer className="inline w-3 h-3 mr-1" aria-hidden="true" />
              {ESPECIALIDADES[a.especialidad].nombre} ·{' '}
              {!tarea
                ? 'Libre'
                : esperando
                  ? `${tarea.etiqueta}: espera a otra persona`
                  : `${tarea.etiqueta} ${Math.round((progreso[tarea.id] ?? 0) * 100)}%`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
