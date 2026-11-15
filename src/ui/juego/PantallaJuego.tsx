import { useEffect, useRef, useState, type Dispatch } from 'react';
import {
  Apple,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flag,
  FlaskConical,
  Hammer,
  HeartPulse,
  HelpCircle,
  Radio,
  Rocket,
  Sparkles,
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
import { DURACION_DIA } from '../../data/parametros';
import { semaforo } from '../../engine/salud';
import { recursoQueFalta } from '../../engine/turno';
import type { Especialidad, Recursos, Tarea } from '../../engine/tipos';
import type { Accion, EstadoApp } from '../../state/reducer';
import type { EntradaTactil3D, EstadoTelemetria3D } from '../../three/EscenaPlaneta';
import { describirConsecuencia } from '../comun/efectos';
import { porcentajeDosis } from '../comun/formato';
import { PanelSalud } from '../salud/PanelSalud';

type EstadoJuego = Extract<EstadoApp, { fase: 'juego' }>;

const NOMBRE_RECURSO: Record<keyof Recursos, string> = {
  energia: 'energía',
  alimento: 'comida',
  oxigeno: 'aire',
  agua: 'agua',
};

const NOMBRE_ESPECIALIDAD: Record<Especialidad, string> = {
  ingenieria: 'Ingeniería',
  biologia: 'Biología',
  geologia: 'Geología',
  medicina: 'Medicina',
};

// Reloj del día (RF-15, UX Brief 10): ajustable porque WCAG 2.2.1 pide poder alargar o quitar un límite de tiempo.
type AjusteReloj = 'normal' | 'doble' | 'sin';
const SEGUNDOS_RELOJ: Record<AjusteReloj, number> = { normal: DURACION_DIA, doble: DURACION_DIA * 2, sin: Infinity };

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
  const [mostrarTripulacion, setMostrarTripulacion] = useState(false);
  const [mostrarHistorias, setMostrarHistorias] = useState(false);
  const [mostrarControles, setMostrarControles] = useState(false);
  const [confirmarAborto, setConfirmarAborto] = useState(false);
  const [silenciado, setSilenciado] = useState(sonido.silenciado);
  const [ajusteReloj, setAjusteReloj] = useState<AjusteReloj>('normal');
  const [restante, setRestante] = useState(SEGUNDOS_RELOJ.normal);

  // El reloj arranca con cada plan nuevo y se para con una tarjeta o un panel abierto.
  const relojPausado = estado.tarjetas.length > 0 || mostrarTripulacion || mostrarHistorias;
  const claveDia = plan ? `${partida.turno}-${plan.opcionId}` : null;
  const claveAnterior = useRef<string | null>(null);
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
      <header className="pointer-events-auto rounded-xl border border-[var(--color-border-strong)] bg-[#0b1020]/90 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xl">
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
          <div className="hidden md:flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-mono">
            <span>
              {partida.config.destino === 'luna' ? 'Luna' : 'Marte'} ({telemetria.gravedad} m/s²)
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[var(--color-moon)]">
              <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
              {Math.round(partida.ciencia)} ciencia
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[var(--color-ok)]">
              <Rocket className="w-3.5 h-3.5" aria-hidden="true" />
              Jetpack {telemetria.combustibleJetpack}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {indicadoresGlobales.map(({ id, etiqueta, valor, delta, Icono, critico }) => (
            <div
              key={id}
              title={etiqueta}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${
                critico
                  ? 'border-[var(--color-danger)] bg-[#2a1520] text-[var(--color-danger)]'
                  : 'border-[var(--color-border)] bg-[#141b34] text-[var(--color-text)]'
              }`}
            >
              <Icono className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline text-[var(--color-text-muted)]">{etiqueta}</span>
              <span className="font-mono tabular-nums font-bold">{valor}</span>
              {delta !== undefined && delta !== 0 && (
                <span
                  className={`hidden xl:inline font-mono tabular-nums text-[11px] ${
                    delta > 0 ? 'text-[var(--color-ok)]' : 'text-[var(--color-warn)]'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
          ))}

          <div
            title="Dosis de radiación"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[#141b34] px-2 py-1 text-xs"
          >
            <Radio className={`w-3.5 h-3.5 ${colorDosis}`} aria-hidden="true" />
            <span className="hidden sm:inline text-[var(--color-text-muted)]">Rad</span>
            <span className={`font-mono tabular-nums font-bold ${colorDosis}`}>{dosisMediaPct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
      </header>

      <div className="relative flex-1 pointer-events-none">
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
              <h2 className="text-sm font-bold text-[var(--color-warn)]">Archivo NASA desbloqueado</h2>
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
                    ★ {hist.nombre}
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
                <strong className="text-[var(--color-text)]">Espacio (mantener):</strong> Salto + Jetpack
              </li>
              <li>
                <strong className="text-[var(--color-text)]">1–4:</strong> Elegir astronauta
              </li>
              <li>
                <strong className="text-[var(--color-text)]">E:</strong> Trabajar en una tarea, extraer hielo, reparar o inspeccionar NASA
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

        {telemetria.tareaCercana && (
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

        {!telemetria.tareaCercana && telemetria.objetivoCercano && (
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

      <div className="pointer-events-none flex flex-col md:flex-row md:items-end justify-between gap-2">
        {evento && (
          <section
            aria-live="polite"
            aria-labelledby="titulo-evento-actual"
            className="pointer-events-auto w-full md:max-w-lg rounded-2xl border border-[var(--color-border-strong)] bg-[#0b1020]/92 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#141b34] border-b border-[var(--color-border)]">
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-[var(--color-warn)] truncate">
                  Parte diario · Día {partida.turno} ·{' '}
                  {plan ? `${tareasHechasCount}/${tareas.length} tareas` : `${telemetria.nodosRestantes} extras 3D`}
                </div>
                <h1
                  id="titulo-evento-actual"
                  className="text-sm sm:text-base font-bold text-[var(--color-text)] truncate"
                >
                  {evento.titulo}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setPanelEventoAbierto((v) => !v)}
                aria-expanded={panelEventoAbierto}
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg border border-[var(--color-border)] bg-[#0b1020] text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-moon)] cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>{panelEventoAbierto ? 'Explorar 3D [H]' : 'Decidir [H]'}</span>
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
                            {describirConsecuencia(op.efectos)}
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
                )}
              </div>
            )}
          </section>
        )}

        <BarraTripulacion
          tripulacion={partida.tripulacion.map((a) => ({ nombre: a.nombre, especialidad: a.especialidad }))}
          seleccionado={telemetria.seleccionado}
          trabajo={telemetria.trabajoTripulacion}
          tareas={tareas}
          progreso={telemetria.progresoTareas}
          onSeleccionar={onSeleccionarTripulante}
        />

        {!panelEventoAbierto && (
          <div className="pointer-events-auto flex md:hidden items-end justify-between w-full gap-2 shrink-0">
            <div className="grid grid-cols-3 gap-1 bg-[#0b1020]/90 p-1.5 rounded-xl border border-[var(--color-border)]">
              <div />
              <button
                type="button"
                aria-label="Avanzar"
                onPointerDown={() => onCambiarEntradaTactil({ adelante: 1 })}
                onPointerUp={() => onCambiarEntradaTactil({ adelante: 0 })}
                onPointerLeave={() => onCambiarEntradaTactil({ adelante: 0 })}
                className="w-11 h-11 rounded-lg bg-[#1b2444] flex items-center justify-center text-white active:bg-[var(--color-mars)]"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />
              <button
                type="button"
                aria-label="Izquierda"
                onPointerDown={() => onCambiarEntradaTactil({ derecha: -1 })}
                onPointerUp={() => onCambiarEntradaTactil({ derecha: 0 })}
                onPointerLeave={() => onCambiarEntradaTactil({ derecha: 0 })}
                className="w-11 h-11 rounded-lg bg-[#1b2444] flex items-center justify-center text-white active:bg-[var(--color-mars)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Retroceder"
                onPointerDown={() => onCambiarEntradaTactil({ adelante: -1 })}
                onPointerUp={() => onCambiarEntradaTactil({ adelante: 0 })}
                onPointerLeave={() => onCambiarEntradaTactil({ adelante: 0 })}
                className="w-11 h-11 rounded-lg bg-[#1b2444] flex items-center justify-center text-white active:bg-[var(--color-mars)]"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Derecha"
                onPointerDown={() => onCambiarEntradaTactil({ derecha: 1 })}
                onPointerUp={() => onCambiarEntradaTactil({ derecha: 0 })}
                onPointerLeave={() => onCambiarEntradaTactil({ derecha: 0 })}
                className="w-11 h-11 rounded-lg bg-[#1b2444] flex items-center justify-center text-white active:bg-[var(--color-mars)]"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              aria-label="Saltar y Jetpack"
              onPointerDown={() => onCambiarEntradaTactil({ saltar: true })}
              onPointerUp={() => onCambiarEntradaTactil({ saltar: false })}
              onPointerLeave={() => onCambiarEntradaTactil({ saltar: false })}
              className="h-14 px-5 rounded-xl bg-[var(--color-mars)] text-[var(--color-on-accent)] font-bold text-sm shadow-xl active:scale-95"
            >
              Saltar
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

interface MiembroTripulacion {
  nombre: string;
  especialidad: Especialidad;
}

// Plan del día (RF-15): tareas con su progreso, reloj ajustable y botón para terminar.
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
  const faltanClave = tareas.some((t) => t.tipo === 'evento' && !hechas.has(t.id));
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--color-text)]">
        Plan: <strong>{opcionTexto}</strong>
      </p>
      <ul className="space-y-1" aria-label="Tareas del día">
        {tareas.map((t) => {
          const hecha = hechas.has(t.id);
          const pct = hecha ? 100 : Math.round((progreso[t.id] ?? 0) * 100);
          const quienes = tripulacion.filter((_, i) => trabajo[i] === t.id).map((a) => a.nombre);
          const especialista = tripulacion.find((a) => a.especialidad === t.especialidad);
          return (
            <li
              key={t.id}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                hecha ? 'border-[var(--color-ok)] bg-[#0f241f]' : 'border-[var(--color-border)] bg-[#141b34]'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-semibold text-[var(--color-text)]">
                  {hecha ? '✓ ' : ''}
                  {t.etiqueta}
                  {t.tipo === 'evento' && <span className="text-[var(--color-warn)]"> · clave</span>}
                </span>
                <span className="font-mono tabular-nums text-[var(--color-text-muted)]">{pct}%</span>
              </div>
              <div className="text-[var(--color-text-muted)]">
                {nombreEstacion(t.estacion, itemIds)} · {NOMBRE_ESPECIALIDAD[t.especialidad]}
                {especialista ? ` (${especialista.nombre} va el doble de rápido)` : ''}
                {quienes.length > 0 && ` · Trabajando: ${quienes.join(', ')}`}
              </div>
              <div className="mt-1 h-1.5 rounded bg-white/10" aria-hidden="true">
                <div className="h-full rounded bg-[var(--color-ok)]" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {faltanClave && (
        <p className="text-xs text-[var(--color-warn)]">
          Si una tarea clave queda sin hacer, el plan no funciona y pasa lo peor del evento.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
          Reloj
          <select
            value={ajusteReloj}
            onChange={(e) => onAjusteReloj(e.target.value as AjusteReloj)}
            className="min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[#0b1020] px-2 text-xs text-[var(--color-text)]"
          >
            <option value="normal">{DURACION_DIA} s</option>
            <option value="doble">×2</option>
            <option value="sin">Sin reloj</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onTerminar}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-xl bg-[var(--color-mars)] hover:bg-[var(--color-mars-hover)] text-[var(--color-on-accent)] text-sm font-bold cursor-pointer"
        >
          Terminar día
        </button>
      </div>
    </div>
  );
}

// Barra de tripulación (RF-13): elegir astronauta con clic o con las teclas 1–4.
function BarraTripulacion({
  tripulacion,
  seleccionado,
  trabajo,
  tareas,
  progreso,
  onSeleccionar,
}: {
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
        const tarea = tareas.find((t) => t.id === trabajo[i]);
        const activo = i === seleccionado;
        return (
          <button
            key={a.nombre}
            type="button"
            onClick={() => onSeleccionar(i)}
            aria-pressed={activo}
            className={`text-left min-h-[44px] rounded-xl border-2 px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
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
              {NOMBRE_ESPECIALIDAD[a.especialidad]} ·{' '}
              {tarea ? `${tarea.etiqueta} ${Math.round((progreso[tarea.id] ?? 0) * 100)}%` : 'Libre'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
