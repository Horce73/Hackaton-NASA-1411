import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sonido } from '../audio/sonido';
import { GRAVEDAD } from '../data/parametros';
import { tareasDelDia } from '../engine/tareas';
import type { Especialidad, Tarea } from '../engine/tipos';
import type { EstadoTelemetria3D, EventoAccion3D, ModoCamara3D } from '../three/EscenaPlaneta';
import type { Vista3DRef } from '../three/Vista3D';
import { PantallaBitacora } from './bitacora/PantallaBitacora';
import { TarjetaHistoria } from './comun/TarjetaHistoria';
import { useEstado } from './comun/EstadoContext';
import { PantallaDiseno } from './diseno/PantallaDiseno';
import { PantallaInicio } from './inicio/PantallaInicio';
import { PantallaJuego } from './juego/PantallaJuego';

// Three.js se descarga aparte (TRD RNF-05): la interfaz responde enseguida y el fondo 3D aparece al llegar.
const Vista3D = lazy(() => import('../three/Vista3D').then((m) => ({ default: m.Vista3D })));

const SIN_ESPECIALIDADES: Especialidad[] = ['ingenieria'];
const SIN_TAREAS: Tarea[] = [];
const SIN_HECHAS: string[] = [];

const MAPA_ESTADO_BODY = {
  inicio: 'title',
  diseno: 'design',
  juego: 'playing',
  bitacora: 'gameover',
} as const;

export function App() {
  const { estado, dispatch } = useEstado();
  const vista3dRef = useRef<Vista3DRef | null>(null);
  const [mostrarSaludExterno, setMostrarSaludExterno] = useState(false);

  const enPartida = estado.fase === 'juego' || estado.fase === 'bitacora';
  const config = enPartida ? estado.partida.config : estado.config;
  const itemIds = enPartida ? estado.partida.diseno.itemIds : estado.itemIds;

  const [telemetria, setTelemetria] = useState<EstadoTelemetria3D>({
    objetivoCercano: null,
    enSuelo: true,
    enDomo: false,
    altura: 0,
    velocidad: 0,
    gravedad: GRAVEDAD[config.destino],
    nodosRestantes: 2,
    softwareGl: false,
    seleccionado: 0,
    trabajoTripulacion: [],
    progresoTareas: {},
    tareaCercana: null,
  });

  // Tripulación y tareas del día para la escena (RF-13 a RF-15). Memorizadas: la escena las compara por referencia.
  const partidaJuego = estado.fase === 'juego' ? estado.partida : null;
  const plan = estado.fase === 'juego' ? estado.plan : null;
  const especialidades = useMemo<Especialidad[]>(
    () => (partidaJuego ? partidaJuego.tripulacion.map((a) => a.especialidad) : SIN_ESPECIALIDADES),
    [partidaJuego],
  );
  const tareas = useMemo<Tarea[]>(
    () => (partidaJuego && plan ? tareasDelDia(partidaJuego, plan.opcionId) : SIN_TAREAS),
    [partidaJuego, plan],
  );
  const tareasHechas = plan?.hechas ?? SIN_HECHAS;
  const trabajoActivo = plan !== null && estado.fase === 'juego' && estado.tarjetas.length === 0;


  useEffect(() => {
    document.body.dataset.state = MAPA_ESTADO_BODY[estado.fase];
  }, [estado.fase]);

  useEffect(() => {
    if (estado.fase !== 'bitacora') return;
    if (estado.partida.resultado === 'exito') sonido.exito();
    else sonido.alerta();
  }, [estado.fase, estado]);

  // Con una historia abierta o la misión terminada, la escena deja de recibir controles.
  // Las tarjetas esperan a que se cierren el resumen del día y el dato curioso.
  const tarjetasAbiertas =
    estado.fase === 'juego' && estado.tarjetas.length > 0 && !estado.resumen && !estado.dato;
  const modo3d: ModoCamara3D =
    estado.fase === 'bitacora' || tarjetasAbiertas
      ? 'pausa'
      : estado.fase === 'juego'
        ? 'tercera_persona'
        : 'orbita';

  const manejarAccion3D = useCallback(
    (accion: EventoAccion3D) => {
      if (accion.tipo === 'domo') {
        setMostrarSaludExterno(true);
        return;
      }
      dispatch({
        tipo: 'COMPLETAR_TAREA_3D',
        tarea: accion.tipo,
        nodoId: accion.nodoId,
        historiaId: accion.historiaId,
      });
    },
    [dispatch],
  );

  const manejarEntradaTactil = useCallback((entrada: Parameters<Vista3DRef['setEntradaTactil']>[0]) => {
    vista3dRef.current?.setEntradaTactil(entrada);
  }, []);

  const ejecutarAccionCercana = useCallback(() => {
    vista3dRef.current?.ejecutarAccionCercana();
  }, []);

  const cerrarSaludExterno = useCallback(() => setMostrarSaludExterno(false), []);
  const completarTarea = useCallback((tareaId: string) => dispatch({ tipo: 'COMPLETAR_TAREA', tareaId }), [dispatch]);
  const seleccionarTripulante = useCallback((indice: number) => vista3dRef.current?.seleccionar(indice), []);

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-x-hidden">
      {/* Un único lienzo WebGL persistente para toda la experiencia */}
      <Suspense fallback={null}>
        <Vista3D
          ref={vista3dRef}
          destino={config.destino}
          itemIds={itemIds}
          modo={modo3d}
          eventoActualId={estado.fase === 'juego' ? (estado.partida.eventoActual?.id ?? null) : null}
          turno={estado.fase === 'juego' ? estado.partida.turno : 0}
          especialidades={especialidades}
          tareas={tareas}
          tareasHechas={tareasHechas}
          trabajoActivo={trabajoActivo}
          enfoque={estado.fase === 'juego' ? estado.closeUp : null}
          tripulacionFuera={estado.fase === 'juego' ? estado.tripulacionFuera : true}
          amanecer={estado.fase === 'juego' && estado.llegada}
          onTelemetria={setTelemetria}
          onAccionCompletada={manejarAccion3D}
          onTareaCompletada={completarTarea}
        />
      </Suspense>

      {estado.fase === 'inicio' && <PantallaInicio config={estado.config} dispatch={dispatch} />}

      {estado.fase === 'diseno' && (
        <PantallaDiseno
          config={estado.config}
          itemIds={estado.itemIds}
          errorDiseno={estado.errorDiseno}
          dispatch={dispatch}
        />
      )}

      {estado.fase === 'juego' && (
        <PantallaJuego
          estado={estado}
          telemetria={telemetria}
          mostrarSaludExterno={mostrarSaludExterno}
          onCerrarSaludExterno={cerrarSaludExterno}
          onEjecutarAccionCercana={ejecutarAccionCercana}
          onCambiarEntradaTactil={manejarEntradaTactil}
          onSeleccionarTripulante={seleccionarTripulante}
          tareas={tareas}
          dispatch={dispatch}
        />
      )}

      {estado.fase === 'bitacora' && (
        <PantallaBitacora partida={estado.partida} dispatch={dispatch} />
      )}

      {estado.fase === 'juego' && tarjetasAbiertas && (
        <TarjetaHistoria
          key={estado.tarjetas[0]}
          historiaId={estado.tarjetas[0]}
          pendientes={estado.tarjetas.length - 1}
          onCerrar={() => dispatch({ tipo: 'CERRAR_TARJETA' })}
        />
      )}
    </div>
  );
}
