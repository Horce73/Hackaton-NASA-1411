import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sonido } from '../audio/sonido';
import { CATALOGO_POR_ID } from '../data/catalogo';
import { EVENTOS_REPARABLES, EVENTO_SURVEYOR } from '../data/eventos';
import { ESPECIALIDADES, GRAVEDAD } from '../data/parametros';
import { ritmoEquipo } from '../engine/tareas';
import type { Destino, Especialidad, Tarea } from '../engine/tipos';
import {
  crearEstadoJugadorInicial,
  groundHeightAt,
  pasoFisicaJugador,
  type EntradaMovimiento,
  type EstadoJugadorFisica,
  type ObstaculoCilindro,
} from '../physics/fisica3d';
import { crearConjuntoTexturas, type ConjuntoTexturas } from './texturas';
import {
  crearAstronauta3D,
  crearBaseCentral3D,
  HABITAT,
  crearModulo3D,
  crearNodoInteractivo3D,
  type AstronautaRig,
} from './modelos3d';

export type ModoCamara3D = 'orbita' | 'tercera_persona' | 'pausa';

export interface ObjetivoCercano {
  id: string;
  tipo: 'hielo' | 'averia' | 'historia' | 'domo';
  etiqueta: string;
  subetiqueta: string;
  historiaId?: string;
}

export interface EventoAccion3D {
  tipo: 'hielo' | 'averia' | 'historia' | 'domo';
  nodoId: string;
  etiqueta: string;
  historiaId?: string;
}

export interface EstadoTelemetria3D {
  objetivoCercano: ObjetivoCercano | null;
  enSuelo: boolean;
  enDomo: boolean;
  altura: number;
  velocidad: number;
  gravedad: number;
  nodosRestantes: number;
  softwareGl: boolean;
  // Tripulación y tareas del día (RF-13 a RF-15)
  seleccionado: number;
  trabajoTripulacion: (string | null)[]; // tarea en la que trabaja cada tripulante
  progresoTareas: Record<string, number>; // 0..1
  tareaCercana: { id: string; etiqueta: string } | null; // tarea pendiente al alcance del seleccionado
}

export interface EntradaTactil3D {
  adelante: number;
  derecha: number;
  saltar: boolean;
  sprint: boolean;
}

interface NodoEscena {
  id: string;
  tipo: 'hielo' | 'averia' | 'historia' | 'domo';
  etiqueta: string;
  subetiqueta: string;
  historiaId?: string;
  x: number;
  y: number;
  z: number;
  radio: number;
  completado: boolean;
  grupo?: THREE.Group;
}

interface ParticulaEstado {
  activa: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  vida: number;
  vidaMax: number;
  escala: number;
  color: THREE.Color;
}

interface OpcionesEscena {
  contenedor: HTMLElement;
  destinoInicial: Destino;
  itemsIniciales: string[];
  onTelemetria: (estado: EstadoTelemetria3D) => void;
  onAccionCompletada: (accion: EventoAccion3D) => void;
  onTareaCompletada: (tareaId: string) => void;
}

interface Tripulante3D {
  rig: AstronautaRig;
  fisica: EstadoJugadorFisica;
  fasePaso: number;
  tareaId: string | null;
  etiqueta: HTMLDivElement;
}

const ENTRADA_QUIETA: EntradaMovimiento = {
  adelante: 0,
  derecha: 0,
  camaraYaw: 0,
  saltarPresionado: false,
  saltarMantenido: false,
  sprint: false,
};
const ALCANCE_TAREA = 3.4; // metros desde la estación

function detectarSoftwareWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const rendererName = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '');
      if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererName)) {
        return true;
      }
    }
    const baseRenderer = String(gl.getParameter(gl.RENDERER) ?? '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(baseRenderer);
  } catch {
    return false;
  }
}

export class EscenaPlaneta {
  private contenedor: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl = false;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private pmremGenerator: THREE.PMREMGenerator;
  private envRenderTarget: THREE.WebGLRenderTarget;

  private destino: Destino;
  private modo: ModoCamara3D = 'orbita';
  private itemIds: string[] = [];
  private eventoActualId: string | null = null;
  private turnoActual = 0;

  private tex!: ConjuntoTexturas;
  private luzSol!: THREE.DirectionalLight;
  private luzHemi!: THREE.HemisphereLight;
  private niebla!: THREE.FogExp2;

  private grupoMundo = new THREE.Group();
  private grupoBase = new THREE.Group();
  private grupoRocas = new THREE.Group();
  private grupoNodos = new THREE.Group();
  private grupoCielo = new THREE.Group();

  private terrenoMesh: THREE.Mesh | null = null;
  // Tripulación (RF-13): `astronauta` y `fisica` son siempre los del tripulante seleccionado.
  private tripulantes: Tripulante3D[] = [];
  private seleccionado = 0;
  private especialidades: Especialidad[] = [];
  private get astronauta(): AstronautaRig {
    return this.tripulantes[this.seleccionado].rig;
  }
  private get fisica(): EstadoJugadorFisica {
    return this.tripulantes[this.seleccionado].fisica;
  }
  private set fisica(f: EstadoJugadorFisica) {
    this.tripulantes[this.seleccionado].fisica = f;
  }

  // Tareas del día (RF-15): progreso en segundos de trabajo hechos / trabajo de la tarea.
  private tareas: Tarea[] = [];
  private tareasHechas = new Set<string>();
  private trabajoActivo = false;
  private progreso = new Map<string, number>();
  private posEstaciones = new Map<string, THREE.Vector3>();
  // Primer plano del cuaderno de misión (RF-17): dónde está cada equipo histórico y a cuál mira la cámara.
  private posHistorias = new Map<string, { centro: THREE.Vector3; tamano: number }>();
  private enfoque: { pos: THREE.Vector3; mira: THREE.Vector3 } | null = null;
  private capaPops: HTMLDivElement;
  private pops = new Map<string, { raiz: HTMLDivElement; barra: HTMLElement; aviso: HTMLElement }>();
  private anilloSeleccion!: THREE.Mesh;
  private obstaculos: ObstaculoCilindro[] = [];
  private nodos: NodoEscena[] = [];
  private historiasInspeccionadas = new Set<string>();
  private nodosCompletadosTurno = new Set<string>();

  // Cámara orbital / tercera persona
  private camYaw = 0.25;
  private camPitch = 0.21;
  private camDistancia = 7.4;
  private camPosSuave = new THREE.Vector3(0, 4.8, 18);
  private camTargetSuave = new THREE.Vector3(-2.4, 2.5, 0);
  private orbitaAngulo = 0.55;
  private trauma = 0;
  // UX Brief 9 y 10: sin giro automático, sacudidas ni animaciones decorativas si el usuario pide menos movimiento.
  private readonly movimientoReducido =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  // Entrada teclado / ratón / táctil
  private teclas = new Set<string>();
  private saltoPendiente = false;
  private arrastrando = false;
  // Dedo o ratón que gira la cámara: en móvil, el otro pulgar está en el joystick y no debe girarla.
  private punteroCamara: number | null = null;
  private ultimoPunteroX = 0;
  private ultimoPunteroY = 0;
  private entradaTactil: EntradaTactil3D = {
    adelante: 0,
    derecha: 0,
    saltar: false,
    sprint: false,
  };
  private saltoTactilPrev = false;

  // Partículas pooled (InstancedMesh)
  private readonly maxParticulas = 120;
  private particulas: ParticulaEstado[] = [];
  private indiceParticula = 0;
  private particulasMesh!: THREE.InstancedMesh;
  private polvoTimer = 0;

  // Temporizadores y objetos pre-alocados (cero GC por frame)
  private destruido = false;
  private perdido = false;
  private rafId: number | null = null;
  private timerId: number | null = null;
  private ultimoTiempo = performance.now();
  private ultimaTelemetria = 0;

  private readonly tmpVecA = new THREE.Vector3();
  private readonly tmpVecB = new THREE.Vector3();
  private readonly tmpVecC = new THREE.Vector3();
  private readonly tmpMat4 = new THREE.Matrix4();
  private readonly tmpQuat = new THREE.Quaternion();
  private readonly tmpScale = new THREE.Vector3();
  private readonly raycaster = new THREE.Raycaster();
  private readonly mallasColisionCam: THREE.Object3D[] = [];

  private onTelemetria: (estado: EstadoTelemetria3D) => void;
  private onAccionCompletada: (accion: EventoAccion3D) => void;
  private onTareaCompletada: (tareaId: string) => void;

  // Listeners guardados para limpieza
  private onResizeBound: () => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onContextLostBound: (e: Event) => void;
  private onContextRestoredBound: () => void;

  constructor(opciones: OpcionesEscena) {
    this.contenedor = opciones.contenedor;
    this.destino = opciones.destinoInicial;
    this.itemIds = [...opciones.itemsIniciales];
    this.onTelemetria = opciones.onTelemetria;
    this.onAccionCompletada = opciones.onAccionCompletada;
    this.onTareaCompletada = opciones.onTareaCompletada;

    // Capa HTML de avisos flotantes y nombres. Es solo visual: la lista de tareas del HUD la repite en texto.
    this.capaPops = document.createElement('div');
    this.capaPops.setAttribute('aria-hidden', 'true');
    this.capaPops.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1';

    // Detectar software WebGL en un contexto de prueba o usando el propio renderer
    const probeCanvas = document.createElement('canvas');
    const probeGl =
      probeCanvas.getContext('webgl2') ||
      (probeCanvas.getContext('webgl') as WebGLRenderingContext | null);
    this.isSoftwareGl = probeGl ? detectarSoftwareWebGL(probeGl) : false;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(
      Math.max(1, this.contenedor.clientWidth),
      Math.max(1, this.contenedor.clientHeight),
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.setAttribute('aria-label', 'Escena espacial 3D interactiva');
    // Sin esto, arrastrar en un móvil desplaza o amplía la página en lugar de girar la cámara.
    this.renderer.domElement.style.touchAction = 'none';
    this.contenedor.appendChild(this.renderer.domElement);
    this.contenedor.appendChild(this.capaPops);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      54,
      Math.max(1, this.contenedor.clientWidth) / Math.max(1, this.contenedor.clientHeight),
      0.2,
      260,
    );

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = this.pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();

    // Iluminación base
    this.luzHemi = new THREE.HemisphereLight(0x88a8d8, 0x1e2230, 0.75);
    this.scene.add(this.luzHemi);

    this.luzSol = new THREE.DirectionalLight(0xfff5e4, 2.5);
    this.luzSol.position.set(28, 38, 22);
    if (!this.isSoftwareGl) {
      this.luzSol.castShadow = true;
      this.luzSol.shadow.mapSize.set(1024, 1024);
      this.luzSol.shadow.camera.near = 5;
      this.luzSol.shadow.camera.far = 120;
      const d = 34;
      this.luzSol.shadow.camera.left = -d;
      this.luzSol.shadow.camera.right = d;
      this.luzSol.shadow.camera.top = d;
      this.luzSol.shadow.camera.bottom = -d;
      this.luzSol.shadow.bias = -0.0005;
    }
    this.scene.add(this.luzSol);

    this.niebla = new THREE.FogExp2(0x070b17, 0.0085);
    this.scene.fog = this.niebla;

    this.scene.add(this.grupoCielo, this.grupoMundo, this.grupoBase, this.grupoRocas, this.grupoNodos);

    // Pool de partículas
    this.inicializarParticulas();

    // Construir planeta inicial
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.tex = crearConjuntoTexturas(this.destino, maxAniso);
    this.anilloSeleccion = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5b942, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.anilloSeleccion.rotation.x = -Math.PI / 2;
    this.scene.add(this.anilloSeleccion);
    this.crearTripulacion(1);

    this.construirPlaneta();
    this.reconstruirBase();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Bindings de eventos
    this.onResizeBound = () => this.actualizarTamano();
    this.onKeyDownBound = (e: KeyboardEvent) => this.manejarKeyDown(e);
    this.onKeyUpBound = (e: KeyboardEvent) => this.manejarKeyUp(e);
    this.onPointerDownBound = (e: PointerEvent) => this.manejarPointerDown(e);
    this.onPointerMoveBound = (e: PointerEvent) => this.manejarPointerMove(e);
    this.onPointerUpBound = (e: PointerEvent) => {
      if (e.pointerId !== this.punteroCamara) return;
      this.arrastrando = false;
      this.punteroCamara = null;
    };
    this.onWheelBound = (e: WheelEvent) => this.manejarWheel(e);
    this.onContextLostBound = (e: Event) => {
      e.preventDefault();
      this.perdido = true;
    };
    this.onContextRestoredBound = () => {
      this.perdido = false;
      this.programarFrame();
    };

    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('pointercancel', this.onPointerUpBound);
    this.renderer.domElement.addEventListener('wheel', this.onWheelBound, { passive: true });
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLostBound);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestoredBound);

    this.ultimoTiempo = performance.now();
    this.programarFrame();
  }

  private inicializarParticulas() {
    const geo = new THREE.SphereGeometry(0.11, 6, 5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particulasMesh = new THREE.InstancedMesh(geo, mat, this.maxParticulas);
    this.particulasMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particulasMesh.frustumCulled = false;

    const cero = new THREE.Matrix4().makeScale(0, 0, 0);
    const blanco = new THREE.Color(0xffffff);
    for (let i = 0; i < this.maxParticulas; i++) {
      this.particulas.push({
        activa: false,
        x: 0,
        y: -50,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        vida: 0,
        vidaMax: 1,
        escala: 1,
        color: new THREE.Color(0xffffff),
      });
      this.particulasMesh.setMatrixAt(i, cero);
      this.particulasMesh.setColorAt(i, blanco);
    }
    this.particulasMesh.instanceMatrix.needsUpdate = true;
    if (this.particulasMesh.instanceColor) {
      this.particulasMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.particulasMesh);
  }

  private emitirParticula(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    vidaMax: number,
    escala: number,
    hexColor: number,
  ) {
    const p = this.particulas[this.indiceParticula];
    this.indiceParticula = (this.indiceParticula + 1) % this.maxParticulas;
    p.activa = true;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    p.vida = 0;
    p.vidaMax = vidaMax;
    p.escala = escala;
    p.color.setHex(hexColor);
  }

  private limpiarGrupo(grupo: THREE.Group) {
    while (grupo.children.length > 0) {
      const hijo = grupo.children[0];
      grupo.remove(hijo);
      hijo.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    }
  }

  private construirPlaneta() {
    this.limpiarGrupo(this.grupoMundo);
    this.limpiarGrupo(this.grupoRocas);
    this.limpiarGrupo(this.grupoCielo);
    this.mallasColisionCam.length = 0;

    // Atmósfera e iluminación por destino
    if (this.destino === 'luna') {
      this.scene.background = new THREE.Color(0x060914);
      this.niebla.color.setHex(0x060914);
      this.niebla.density = 0.0065;
      this.luzSol.color.setHex(0xfff6e5);
      this.luzSol.intensity = 2.75;
      this.luzHemi.color.setHex(0x7c97c4);
      this.luzHemi.groundColor.setHex(0x161a24);
      this.luzHemi.intensity = 0.72;
    } else {
      this.scene.background = new THREE.Color(0x3a1c15);
      this.niebla.color.setHex(0x4d2318);
      this.niebla.density = 0.0135;
      this.luzSol.color.setHex(0xffdfc2);
      this.luzSol.intensity = 2.45;
      this.luzHemi.color.setHex(0xf2a57c);
      this.luzHemi.groundColor.setHex(0x301710);
      this.luzHemi.intensity = 0.85;
    }

    // Campo de estrellas
    const numEstrellas = this.destino === 'luna' ? 520 : 180;
    const posEstrellas = new Float32Array(numEstrellas * 3);
    let seed = this.destino === 'luna' ? 777 : 999;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < numEstrellas; i++) {
      const theta = rnd() * Math.PI * 2;
      const phi = rnd() * Math.PI * 0.44;
      const rad = 115;
      posEstrellas[i * 3] = Math.cos(theta) * Math.cos(phi) * rad;
      posEstrellas[i * 3 + 1] = Math.sin(phi) * rad + 8;
      posEstrellas[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * rad;
    }
    const geoEstrellas = new THREE.BufferGeometry();
    geoEstrellas.setAttribute('position', new THREE.BufferAttribute(posEstrellas, 3));
    const estrellas = new THREE.Points(
      geoEstrellas,
      new THREE.PointsMaterial({
        color: 0xe6eeff,
        size: this.destino === 'luna' ? 0.55 : 0.35,
        fog: false,
      }),
    );
    this.grupoCielo.add(estrellas);

    // Tierra en el cielo lunar o Fobos en el cielo marciano
    if (this.destino === 'luna') {
      const tierra = new THREE.Mesh(
        new THREE.SphereGeometry(5.8, 32, 24),
        new THREE.MeshStandardMaterial({
          map: this.tex.tierraAlbedo,
          roughnessMap: this.tex.tierraRoughness,
          emissiveMap: this.tex.tierraAlbedo,
          emissive: 0xffffff,
          emissiveIntensity: 0.25,
          roughness: 0.72,
          metalness: 0.05,
          fog: false,
        }),
      );
      tierra.position.set(-44, 34, -68);
      tierra.rotation.y = -0.6;
      this.grupoCielo.add(tierra);
    } else {
      const fobos = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.6, 2),
        new THREE.MeshStandardMaterial({
          map: this.tex.fobosAlbedo,
          normalMap: this.tex.fobosNormal,
          normalScale: new THREE.Vector2(1.3, 1.3),
          roughness: 0.92,
          fog: false,
        }),
      );
      fobos.position.set(42, 32, -64);
      this.grupoCielo.add(fobos);
    }

    // Terreno desplazado por groundHeightAt
    const geoTerreno = new THREE.PlaneGeometry(160, 160, 96, 96);
    geoTerreno.rotateX(-Math.PI / 2);
    const pos = geoTerreno.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, groundHeightAt(x, z, this.destino));
    }
    geoTerreno.computeVertexNormals();

    const matTerreno = new THREE.MeshStandardMaterial({
      map: this.tex.terrenoAlbedo,
      normalMap: this.tex.terrenoNormal,
      normalScale: new THREE.Vector2(1.25, 1.25),
      roughnessMap: this.tex.terrenoRoughness,
      roughness: this.destino === 'luna' ? 0.94 : 0.88,
      metalness: 0.03,
    });
    this.terrenoMesh = new THREE.Mesh(geoTerreno, matTerreno);
    this.terrenoMesh.receiveShadow = true;
    this.grupoMundo.add(this.terrenoMesh);
    this.mallasColisionCam.push(this.terrenoMesh);

    // Rocas instanciadas en cráteres exteriores con textura basáltica PBR
    const numRocas = 46;
    const geoRoca = new THREE.DodecahedronGeometry(1, 1);
    const matRoca = new THREE.MeshStandardMaterial({
      map: this.tex.rocaAlbedo,
      normalMap: this.tex.rocaNormal,
      normalScale: new THREE.Vector2(1.3, 1.3),
      roughnessMap: this.tex.rocaRoughness,
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.06,
    });
    const instRocas = new THREE.InstancedMesh(geoRoca, matRoca, numRocas);
    instRocas.castShadow = !this.isSoftwareGl;
    instRocas.receiveShadow = true;

    const colorBaseRoca = new THREE.Color(0xffffff);
    const colorTmp = new THREE.Color();
    this.rocasObstaculos = [];

    for (let i = 0; i < numRocas; i++) {
      const ang = i * 2.39996 + (this.destino === 'luna' ? 0.2 : 1.1);
      const radio = 19 + (i / numRocas) * 26;
      const rx = Math.cos(ang) * radio;
      const rz = Math.sin(ang) * radio;
      const ry = groundHeightAt(rx, rz, this.destino);

      const s = 0.55 + ((i * 37) % 100) / 100 * 1.15;
      const sx = s * (0.85 + ((i * 13) % 30) / 100);
      const sy = s * (0.58 + ((i * 19) % 30) / 100);
      const sz = s * (0.85 + ((i * 23) % 30) / 100);

      this.tmpQuat.setFromEuler(new THREE.Euler(0, ang, (i % 5) * 0.12));
      this.tmpVecA.set(rx, ry + sy * 0.35, rz);
      this.tmpScale.set(sx, sy, sz);
      this.tmpMat4.compose(this.tmpVecA, this.tmpQuat, this.tmpScale);
      instRocas.setMatrixAt(i, this.tmpMat4);

      const brillo = 0.85 + ((i * 17) % 30) / 100;
      colorTmp.copy(colorBaseRoca).multiplyScalar(brillo);
      instRocas.setColorAt(i, colorTmp);

      if (s > 1.05) {
        this.rocasObstaculos.push({
          id: `roca-${i}`,
          x: rx,
          z: rz,
          radio: Math.max(sx, sz) * 0.78,
          altura: sy * 1.1,
        });
      }
    }
    instRocas.instanceMatrix.needsUpdate = true;
    if (instRocas.instanceColor) instRocas.instanceColor.needsUpdate = true;
    instRocas.computeBoundingSphere();
    this.grupoRocas.add(instRocas);
  }

  private rocasObstaculos: ObstaculoCilindro[] = [];

  private reconstruirBase() {
    this.limpiarGrupo(this.grupoBase);
    this.limpiarGrupo(this.grupoNodos);
    this.obstaculos = [...this.rocasObstaculos];
    this.nodos = [];
    this.posEstaciones.clear();
    this.posHistorias.clear();
    this.mallasColisionCam.length = 0;
    if (this.terrenoMesh) {
      this.mallasColisionCam.push(this.terrenoMesh);
    }

    // 1. Base central en (0, y, 0)
    const yBase = groundHeightAt(0, 0, this.destino);
    const baseCentral = crearBaseCentral3D(this.destino, this.tex, this.isSoftwareGl);
    baseCentral.position.set(0, yBase, 0);
    this.grupoBase.add(baseCentral);
    this.mallasColisionCam.push(baseCentral);
    this.obstaculos.push({
      id: 'habitat-central',
      x: 0,
      z: 0,
      radio: HABITAT.radioInflable + 0.15, // no se puede caminar bajo el inflable
      altura: HABITAT.alturaPlataforma + HABITAT.altoMetal + HABITAT.altoInflable,
    });

    // Nodo de entrada al hábitat (para recuperar energía/sueño o abrir panel si está cerca)
    this.nodos.push({
      id: 'domo-esclusa',
      tipo: 'domo',
      etiqueta: 'Esclusa del Hábitat Central',
      subetiqueta: 'Pulsa [E] para revisar sistemas internos',
      x: 0,
      y: yBase,
      z: HABITAT.radioInflable + 0.9,
      radio: 2.3,
      completado: false,
    });

    // 2. Módulos y equipo histórico del diseño actual
    this.posEstaciones.set('habitat', new THREE.Vector3(0, yBase, HABITAT.radioInflable + 0.9));
    const ex = 3;
    const ez = 18;
    this.posEstaciones.set('exterior', new THREE.Vector3(ex, groundHeightAt(ex, ez, this.destino), ez));

    // Cada módulo guarda su índice en itemIds: las tareas de mantenimiento lo usan como estación ('item:<i>').
    const modulos = this.itemIds
      .map((id, indice) => ({ id, indice }))
      .filter(({ id }) => CATALOGO_POR_ID[id]?.tipo === 'modulo');
    const historicos = this.itemIds.filter((id) => CATALOGO_POR_ID[id]?.tipo === 'historico');

    modulos.forEach(({ id, indice }, idx) => {
      const total = Math.max(1, modulos.length);
      // Evitar el frente directo (+Z donde aparece el jugador)
      const angulo = Math.PI * 0.72 + (idx / total) * Math.PI * 1.56;
      const dist = 10.2 + (idx % 2) * 1.8;
      const mx = Math.cos(angulo) * dist;
      const mz = Math.sin(angulo) * dist;
      const my = groundHeightAt(mx, mz, this.destino);

      const modelo = crearModulo3D(id, this.tex, this.isSoftwareGl);
      modelo.position.set(mx, my, mz);
      modelo.rotation.y = Math.atan2(-mx, -mz);
      this.grupoBase.add(modelo);
      this.posEstaciones.set(`item:${indice}`, new THREE.Vector3(mx, my, mz));

      this.obstaculos.push({
        id: `mod-${id}-${idx}`,
        x: mx,
        z: mz,
        radio: 1.55,
        altura: 2.1,
      });
    });

    historicos.forEach((id, idx) => {
      const total = Math.max(1, historicos.length);
      // Arco que evita el corredor de cámara frontal (+Z, ángulo ~PI/2)
      const angulo = -Math.PI * 0.85 + (idx / total) * Math.PI * 1.1;
      const dist = 14.2 + (idx % 2) * 2.0;
      const hx = Math.cos(angulo) * dist;
      const hz = Math.sin(angulo) * dist;
      const hy = groundHeightAt(hx, hz, this.destino);

      const modelo = crearModulo3D(id, this.tex, this.isSoftwareGl);
      modelo.position.set(hx, hy, hz);
      modelo.rotation.y = Math.atan2(-hx, -hz);
      this.grupoBase.add(modelo);

      this.obstaculos.push({
        id: `equipo-${id}`,
        x: hx,
        z: hz,
        radio: 1.25,
        altura: 1.8,
      });

      const info = CATALOGO_POR_ID[id];
      if (info?.historiaId) {
        this.posHistorias.set(info.historiaId, { centro: new THREE.Vector3(hx, hy, hz), tamano: id === 'sojourner' ? 0.5 : 1.6 });
      }
      const yaInspeccionado = info?.historiaId
        ? this.historiasInspeccionadas.has(info.historiaId)
        : false;
      const baliza = crearNodoInteractivo3D('historia', this.tex);
      baliza.position.set(hx, hy, hz);
      baliza.visible = !yaInspeccionado;
      this.grupoNodos.add(baliza);

      this.nodos.push({
        id: `nodo-equipo-${id}`,
        tipo: 'historia',
        etiqueta: info ? `Inspeccionar ${info.nombre}` : 'Inspeccionar equipo NASA',
        subetiqueta: yaInspeccionado
          ? 'Ya está en tu cuaderno: pulsa [E] para releerlo'
          : 'Pulsa [E] para anotar lo que midió su misión (+3 ciencia)',
        historiaId: info?.historiaId,
        x: hx,
        y: hy,
        z: hz,
        radio: 2.8,
        completado: false, // siempre se puede volver a abrir su ficha
        grupo: baliza,
      });
    });

    // 3. Nodos dinámicos de campo (hielo en cráteres + avería si aplica + Surveyor 3 en Luna)
    const vetasHielo = [
      { id: `hielo-1-t${this.turnoActual}`, x: 7.5, z: 12.2 },
      { id: `hielo-2-t${this.turnoActual}`, x: -19, z: 15 },
    ];
    vetasHielo.forEach((veta, idx) => {
      if (this.nodosCompletadosTurno.has(veta.id)) return;
      const vy = groundHeightAt(veta.x, veta.z, this.destino);
      const grupoHielo = crearNodoInteractivo3D('hielo', this.tex);
      grupoHielo.position.set(veta.x, vy, veta.z);
      this.grupoNodos.add(grupoHielo);

      this.nodos.push({
        id: veta.id,
        tipo: 'hielo',
        etiqueta: `Veta de hielo subterráneo #${idx + 1}`,
        subetiqueta: 'Pulsa [E] para extraer (+6 Agua, +4 Oxígeno, +4 Ciencia)',
        x: veta.x,
        y: vy,
        z: veta.z,
        radio: 2.8,
        completado: false,
        grupo: grupoHielo,
      });
    });

    // Si es un evento con avería o tormenta, colocar baliza de reparación de campo.
    // La lista de eventos vive en data/eventos.ts: la capa 3D no conoce ids de contenido.
    const esAveria = EVENTOS_REPARABLES.includes(this.eventoActualId ?? '');
    const averiaId = `averia-t${this.turnoActual}`;
    if (esAveria && !this.nodosCompletadosTurno.has(averiaId)) {
      const ax = -7.5;
      const az = 8.2;
      const ay = groundHeightAt(ax, az, this.destino);
      const grupoAveria = crearNodoInteractivo3D('averia', this.tex);
      grupoAveria.position.set(ax, ay, az);
      this.grupoNodos.add(grupoAveria);

      this.nodos.push({
        id: averiaId,
        tipo: 'averia',
        etiqueta: 'Conducto exterior con alerta',
        subetiqueta: 'Pulsa [E] para calibración de campo (+6 Energía, +4 Ciencia)',
        x: ax,
        y: ay,
        z: az,
        radio: 2.8,
        completado: false,
        grupo: grupoAveria,
      });
    }

    // Sonda Surveyor 3 en Luna cuando salga el evento o como hito en el cráter cercano
    if (this.destino === 'luna' && this.eventoActualId === EVENTO_SURVEYOR) {
      const sx = 17;
      const sz = 19;
      const sy = groundHeightAt(sx, sz, this.destino);
      const sonda = crearModulo3D('surveyor-3', this.tex, this.isSoftwareGl);
      sonda.position.set(sx, sy, sz);
      this.posHistorias.set(EVENTO_SURVEYOR, { centro: new THREE.Vector3(sx, sy, sz), tamano: 2 });
      this.grupoBase.add(sonda);

      const baliza = crearNodoInteractivo3D('historia', this.tex);
      baliza.position.set(sx, sy, sz);
      this.grupoNodos.add(baliza);

      this.nodos.push({
        id: 'nodo-surveyor-3',
        tipo: 'historia',
        etiqueta: 'Sonda histórica Surveyor 3',
        subetiqueta: 'Pulsa [E] para inspeccionar la sonda (+5 Ciencia)',
        historiaId: EVENTO_SURVEYOR,
        x: sx,
        y: sy,
        z: sz,
        radio: 3.1,
        completado: false,
        grupo: baliza,
      });
    }
  }

  public setDestino(destino: Destino) {
    if (this.destino === destino) return;
    this.destino = destino;
    this.tex.dispose();
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.tex = crearConjuntoTexturas(destino, maxAniso);

    this.construirPlaneta();
    this.reconstruirBase();
    this.crearTripulacion(this.tripulantes.length);
  }

  public setMisionItems(itemIds: string[]) {
    const iguales =
      itemIds.length === this.itemIds.length &&
      itemIds.every((v, idx) => v === this.itemIds[idx]);
    if (iguales) return;
    this.itemIds = [...itemIds];
    this.reconstruirBase();
  }

  public setEventoYTurno(eventoId: string | null, turno: number) {
    if (this.eventoActualId === eventoId && this.turnoActual === turno) return;
    const cambioTurno = turno !== this.turnoActual;
    this.eventoActualId = eventoId;
    this.turnoActual = turno;
    if (cambioTurno) {
      this.nodosCompletadosTurno.clear();
    }
    this.reconstruirBase();
  }

  public setModo(modo: ModoCamara3D) {
    if (this.modo === modo) return;
    // Cerrar una tarjeta (pausa) no mueve a nadie: la tripulación sigue donde estaba trabajando.
    const veniaDeOrbita = this.modo === 'orbita';
    this.modo = modo;
    if (modo === 'tercera_persona' && veniaDeOrbita) {
      this.colocarTripulacion();
      this.camYaw = 0;
      this.camPitch = 0.21;
    }
  }

  public setEntradaTactil(entrada: Partial<EntradaTactil3D>) {
    this.entradaTactil = { ...this.entradaTactil, ...entrada };
    if (entrada.saltar && !this.saltoTactilPrev) {
      this.saltoPendiente = true;
    }
    this.saltoTactilPrev = Boolean(this.entradaTactil.saltar);
  }

  public registrarTrauma(cantidad: number) {
    if (this.movimientoReducido) return;
    this.trauma = Math.min(1, this.trauma + cantidad);
  }

  public ejecutarAccionCercana(): boolean {
    if (this.empezarTareaCercana()) return true;
    const cercano = this.obtenerNodoCercano();
    if (!cercano) return false;

    if (cercano.tipo === 'hielo') {
      this.nodosCompletadosTurno.add(cercano.id);
      cercano.completado = true;
      if (cercano.grupo) cercano.grupo.visible = false;
      this.lanzarRafaga(cercano.x, cercano.y + 0.7, cercano.z, 0x7be0ff, 20);
      sonido.escaneo();
      this.onAccionCompletada({
        tipo: 'hielo',
        nodoId: cercano.id,
        etiqueta: cercano.etiqueta,
      });
      this.emitirTelemetria(true);
      return true;
    }

    if (cercano.tipo === 'averia') {
      this.nodosCompletadosTurno.add(cercano.id);
      cercano.completado = true;
      if (cercano.grupo) cercano.grupo.visible = false;
      this.lanzarRafaga(cercano.x, cercano.y + 1.0, cercano.z, 0x4cd7a1, 22);
      sonido.reparacion();
      this.registrarTrauma(0.22);
      this.onAccionCompletada({
        tipo: 'averia',
        nodoId: cercano.id,
        etiqueta: cercano.etiqueta,
      });
      this.emitirTelemetria(true);
      return true;
    }

    if (cercano.tipo === 'historia' && cercano.historiaId) {
      const primeraVez = !this.historiasInspeccionadas.has(cercano.historiaId);
      this.historiasInspeccionadas.add(cercano.historiaId);
      if (cercano.grupo) {
        const baliza = cercano.grupo.getObjectByName('baliza-flotante');
        if (baliza) baliza.visible = false;
      }
      this.lanzarRafaga(cercano.x, cercano.y + 1.2, cercano.z, 0xf5b942, 18);
      sonido.escaneo();
      this.onAccionCompletada({
        tipo: 'historia',
        nodoId: primeraVez ? cercano.id : `relectura-${cercano.id}`,
        etiqueta: cercano.etiqueta,
        historiaId: cercano.historiaId,
      });
      this.emitirTelemetria(true);
      return true;
    }

    if (cercano.tipo === 'domo') {
      sonido.escaneo();
      this.onAccionCompletada({
        tipo: 'domo',
        nodoId: cercano.id,
        etiqueta: cercano.etiqueta,
      });
      return true;
    }

    return false;
  }

  // ---- Tripulación y tareas del día (RF-13 a RF-15) ----

  public setTripulacion(especialidades: Especialidad[]) {
    const iguales =
      especialidades.length === this.especialidades.length && especialidades.every((e, i) => e === this.especialidades[i]);
    this.especialidades = [...especialidades];
    if (!iguales) this.crearTripulacion(especialidades.length);
  }

  public setTareas(tareas: Tarea[], hechas: string[], activo: boolean) {
    this.tareas = tareas;
    this.tareasHechas = new Set(hechas);
    this.trabajoActivo = activo;
    const ids = new Set(tareas.map((t) => t.id));
    for (const id of [...this.progreso.keys()]) if (!ids.has(id)) this.progreso.delete(id);
    for (const [id, pop] of this.pops) {
      if (!ids.has(id) || this.tareasHechas.has(id)) {
        pop.raiz.remove();
        this.pops.delete(id);
      }
    }
    for (const t of this.tripulantes) {
      if (t.tareaId && (!ids.has(t.tareaId) || this.tareasHechas.has(t.tareaId))) t.tareaId = null;
    }
    this.emitirTelemetria(true);
  }

  // Acerca la cámara a un equipo histórico (o la devuelve al astronauta con null). Mira desde el lado de la base,
  // que es hacia donde está girado cada modelo.
  public enfocarHistoria(historiaId: string | null) {
    const destino = historiaId ? this.posHistorias.get(historiaId) : undefined;
    // En el primer plano solo se ve el equipo: la tripulación y los avisos flotantes se apartan.
    this.tripulantes.forEach((t) => (t.rig.root.visible = !destino));
    this.capaPops.style.visibility = destino ? 'hidden' : '';
    if (!destino) {
      this.enfoque = null;
      return;
    }
    const { centro, tamano } = destino;
    const haciaBase = new THREE.Vector3(-centro.x, 0, -centro.z).normalize();
    const lateral = new THREE.Vector3(haciaBase.z, 0, -haciaBase.x);
    const pos = centro
      .clone()
      .addScaledVector(haciaBase, tamano * 1.9)
      .addScaledVector(lateral, tamano * 0.8)
      .setY(centro.y + tamano * 0.9);
    this.enfoque = { pos, mira: centro.clone().setY(centro.y + tamano * 0.35) };
  }

  public seleccionar(indice: number) {
    if (indice < 0 || indice >= this.tripulantes.length || indice === this.seleccionado) return;
    this.seleccionado = indice;
    sonido.escaneo();
    this.emitirTelemetria(true);
  }

  private crearTripulacion(n: number) {
    for (const t of this.tripulantes) {
      this.limpiarGrupo(t.rig.root);
      this.scene.remove(t.rig.root);
      t.etiqueta.remove();
    }
    this.tripulantes = Array.from({ length: Math.max(1, n) }, (_, i) => {
      const especialidad = this.especialidades[i];
      const rig = crearAstronauta3D(this.tex, especialidad && ESPECIALIDADES[especialidad].color);
      this.scene.add(rig.root);
      const etiqueta = document.createElement('div');
      etiqueta.style.cssText =
        'position:absolute;left:0;top:0;padding:2px 8px;border-radius:999px;font:600 12px/1.4 system-ui,sans-serif;' +
        'white-space:nowrap;background:rgba(11,16,32,.85);color:#e8ecf6;border:1px solid rgba(255,255,255,.25);will-change:transform';
      if (especialidad) etiqueta.style.boxShadow = `inset 6px 0 0 ${ESPECIALIDADES[especialidad].color}`;
      this.capaPops.appendChild(etiqueta);
      return { rig, fisica: crearEstadoJugadorInicial(this.destino), fasePaso: 0, tareaId: null, etiqueta };
    });
    this.seleccionado = Math.min(this.seleccionado, this.tripulantes.length - 1);
    this.colocarTripulacion();
  }

  // Coloca a la tripulación en fila frente al hábitat.
  private colocarTripulacion() {
    const n = this.tripulantes.length;
    this.tripulantes.forEach((t, i) => {
      const inicial = crearEstadoJugadorInicial(this.destino);
      const x = inicial.x + (i - (n - 1) / 2) * 1.8;
      t.fisica = { ...inicial, x, y: groundHeightAt(x, inicial.z, this.destino) };
      t.tareaId = null;
    });
  }

  private moverTripulante(t: Tripulante3D, entrada: EntradaMovimiento, dt: number, esSeleccionado: boolean) {
    const prevEnSuelo = t.fisica.enSuelo;
    const prevVy = t.fisica.vy;
    t.fisica = pasoFisicaJugador(t.fisica, entrada, this.destino, this.obstaculos, dt);
    const f = t.fisica;

    if (esSeleccionado) {
      // Sonidos de salto, aterrizaje y pasos, solo del astronauta que manejas
      if (prevEnSuelo && !f.enSuelo && f.vy > 0.8) {
        sonido.salto();
      } else if (!prevEnSuelo && f.enSuelo && prevVy < -0.8) {
        sonido.aterrizaje();
        this.lanzarRafaga(f.x, f.y + 0.15, f.z, this.destino === 'luna' ? 0x9aa4b8 : 0xc46b45, 8);
      }
    }

    const velH = Math.hypot(f.vx, f.vz);
    if (f.enSuelo && velH > 0.6) {
      const prevCiclo = Math.floor(t.fasePaso / Math.PI);
      t.fasePaso += velH * dt * 1.65;
      if (esSeleccionado && Math.floor(t.fasePaso / Math.PI) !== prevCiclo) sonido.paso();
    } else {
      t.fasePaso = 0;
    }

    const rig = t.rig;
    rig.root.position.set(f.x, f.y, f.z);
    rig.cuerpo.rotation.y = f.yaw;

    const amplitudPaso = f.enSuelo ? Math.min(0.65, velH / 10) : 0;
    const swing = Math.sin(t.fasePaso) * amplitudPaso;
    // En el aire, el salto de canguro de los astronautas del Apolo: piernas juntas y flexionadas hacia delante.
    const flexion = f.enSuelo ? 0 : -0.45;
    rig.piernaIzq.rotation.x = swing + flexion;
    rig.piernaDer.rotation.x = -swing + flexion;
    rig.brazoIzq.rotation.x = -swing * 0.85;
    // Trabajando: el brazo derecho se mueve como si usara una herramienta.
    const trabajando = t.tareaId !== null && this.trabajoActivo;
    rig.brazoDer.rotation.x =
      trabajando && !this.movimientoReducido ? -1.1 + Math.sin(performance.now() / 120) * 0.35 : swing * 0.85;
    rig.brazoIzq.rotation.z = f.enSuelo ? 0.08 : 0.35;
    rig.brazoDer.rotation.z = f.enSuelo ? -0.08 : -0.35;


    // Sombra de contacto proyectada en el suelo bajo el astronauta
    const alturaSobreSuelo = Math.max(0, f.y - groundHeightAt(f.x, f.z, this.destino));
    rig.sombra.position.y = -alturaSobreSuelo + 0.03;
    const escalaSombra = Math.max(0.4, 1 - alturaSobreSuelo * 0.12);
    rig.sombra.scale.set(escalaSombra, escalaSombra, 1);
    (rig.sombra.material as THREE.MeshBasicMaterial).opacity = 0.48 * escalaSombra;
  }

  private tareasPendientes(): Tarea[] {
    return this.tareas.filter((t) => !this.tareasHechas.has(t.id));
  }

  private distanciaAEstacion(f: EstadoJugadorFisica, tarea: Tarea): number {
    const pos = this.posEstaciones.get(tarea.estacion) ?? this.posEstaciones.get('habitat');
    return pos ? Math.hypot(f.x - pos.x, f.z - pos.z) : Infinity;
  }

  // Tarea pendiente más cercana al alcance de un tripulante.
  private tareaAlAlcance(f: EstadoJugadorFisica): Tarea | null {
    if (!this.trabajoActivo) return null;
    let mejor: Tarea | null = null;
    let mejorDist = ALCANCE_TAREA;
    for (const tarea of this.tareasPendientes()) {
      const d = this.distanciaAEstacion(f, tarea);
      if (d <= mejorDist) {
        mejor = tarea;
        mejorDist = d;
      }
    }
    return mejor;
  }

  private empezarTareaCercana(): boolean {
    const t = this.tripulantes[this.seleccionado];
    const tarea = this.tareaAlAlcance(t.fisica);
    if (!tarea || t.tareaId === tarea.id) return Boolean(tarea);
    t.tareaId = tarea.id;
    sonido.escaneo();
    this.emitirTelemetria(true);
    return true;
  }

  private avanzarTrabajo(dt: number) {
    if (!this.trabajoActivo) return;
    // Alejarse de la estación deja la tarea a medias: el progreso se conserva.
    for (const t of this.tripulantes) {
      const tarea = t.tareaId ? this.tareas.find((x) => x.id === t.tareaId) : undefined;
      if (t.tareaId && (!tarea || this.tareasHechas.has(tarea.id) || this.distanciaAEstacion(t.fisica, tarea) > ALCANCE_TAREA)) {
        t.tareaId = null;
      }
    }
    // Cada tarea avanza con todos los que trabajan en ella a la vez (las de 2 personas no avanzan con 1).
    for (const tarea of this.tareasPendientes()) {
      const equipo = this.tripulantes.flatMap((t, i) => (t.tareaId === tarea.id ? [this.especialidades[i] ?? 'ingenieria'] : []));
      const ritmo = ritmoEquipo(equipo, tarea);
      if (ritmo === 0) continue;
      const avance = (this.progreso.get(tarea.id) ?? 0) + (dt * ritmo) / tarea.trabajo;
      if (avance < 1) {
        this.progreso.set(tarea.id, avance);
        continue;
      }
      this.progreso.set(tarea.id, 1);
      this.tareasHechas.add(tarea.id);
      for (const otro of this.tripulantes) if (otro.tareaId === tarea.id) otro.tareaId = null;
      const pos = this.posEstaciones.get(tarea.estacion) ?? this.posEstaciones.get('habitat')!;
      this.lanzarRafaga(pos.x, pos.y + 1.2, pos.z, 0x4cd7a1, 18);
      sonido.reparacion();
      this.onTareaCompletada(tarea.id);
      this.emitirTelemetria(true);
    }
  }

  // Avisos flotantes sobre las estaciones y nombre sobre cada tripulante (UX Brief 5.3).
  private actualizarPops(ahoraSec: number) {
    const ancho = this.contenedor.clientWidth;
    const alto = this.contenedor.clientHeight;
    const enJuego = this.modo === 'tercera_persona';
    // `dy`: píxeles hacia arriba, para apilar avisos de la misma estación sin que se tapen a ninguna distancia.
    const proyectar = (v: THREE.Vector3, el: HTMLElement, dy = 0) => {
      this.tmpVecA.copy(v).project(this.camera);
      const visible = enJuego && this.tmpVecA.z < 1 && Math.abs(this.tmpVecA.x) < 1.2 && Math.abs(this.tmpVecA.y) < 1.2;
      el.style.display = visible ? 'block' : 'none';
      if (visible) {
        const x = (this.tmpVecA.x * 0.5 + 0.5) * ancho;
        const y = (-this.tmpVecA.y * 0.5 + 0.5) * alto - dy;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
        el.style.zIndex = String(Math.round((1 - this.tmpVecA.z) * 100000)); // el más cercano, encima
      }
    };

    // Nombres de la tripulación
    this.tripulantes.forEach((t, i) => {
      const nombre = `${i + 1} · ${ESPECIALIDADES[this.especialidades[i] ?? 'ingenieria'].nombre}`;
      if (t.etiqueta.textContent !== nombre) t.etiqueta.textContent = nombre;
      const esSel = i === this.seleccionado;
      t.etiqueta.style.borderColor = esSel ? '#f5b942' : 'rgba(255,255,255,.25)';
      t.etiqueta.style.fontWeight = esSel ? '800' : '600';
      this.tmpVecB.copy(t.rig.root.position).setY(t.rig.root.position.y + 2.3);
      proyectar(this.tmpVecB, t.etiqueta);
    });

    // Avisos de tareas pendientes
    const alcanceSel = this.trabajoActivo ? this.tareaAlAlcance(this.fisica) : null;
    const pendientes = this.trabajoActivo ? this.tareasPendientes() : [];
    for (const tarea of pendientes) {
      let pop = this.pops.get(tarea.id);
      if (!pop) {
        const raiz = document.createElement('div');
        raiz.style.cssText =
          'position:absolute;left:0;top:0;min-width:120px;max-width:180px;padding:6px 8px;border-radius:10px;' +
          'font:12px/1.3 system-ui,sans-serif;color:#e8ecf6;background:rgba(11,16,32,.9);border:2px solid rgba(255,255,255,.3);will-change:transform';
        raiz.innerHTML =
          '<div data-t style="font-weight:700"></div><div data-e style="opacity:.85"></div>' +
          '<div style="height:6px;margin-top:4px;border-radius:3px;background:rgba(255,255,255,.18)"><div data-p style="height:100%;border-radius:3px;background:#4cd7a1;width:0"></div></div>' +
          '<div data-k style="margin-top:3px;font-weight:700;color:#f5b942"></div>';
        raiz.querySelector<HTMLElement>('[data-t]')!.textContent = tarea.etiqueta;
        const rol = raiz.querySelector<HTMLElement>('[data-e]')!;
        rol.textContent = `● ${ESPECIALIDADES[tarea.especialidad].nombre}`;
        rol.style.color = ESPECIALIDADES[tarea.especialidad].color;
        if (ancho < 640) {
          // Pantalla pequeña: solo título y barra, para no tapar el juego.
          raiz.style.minWidth = '0';
          raiz.style.maxWidth = '130px';
          raiz.style.padding = '3px 6px';
          raiz.style.fontSize = '11px';
          rol.style.display = 'none';
        }
        this.capaPops.appendChild(raiz);
        // Referencias guardadas: nada de buscar en el DOM en cada fotograma.
        pop = { raiz, barra: raiz.querySelector<HTMLElement>('[data-p]')!, aviso: raiz.querySelector<HTMLElement>('[data-k]')! };
        this.pops.set(tarea.id, pop);
      }
      const anchoBarra = `${Math.round((this.progreso.get(tarea.id) ?? 0) * 100)}%`;
      if (pop.barra.style.width !== anchoBarra) pop.barra.style.width = anchoBarra;
      const enTarea = this.tripulantes.filter((t) => t.tareaId === tarea.id).length;
      const personas = tarea.personas ?? 1;
      const trabajando = enTarea >= personas;
      const alAlcance = alcanceSel?.id === tarea.id;
      const aviso =
        enTarea > 0 && !trabajando
          ? `Falta ${personas - enTarea} persona`
          : trabajando
            ? 'Trabajando…'
            : alAlcance
              ? 'E para trabajar'
              : personas > 1
                ? `${personas} personas`
                : '';
      if (pop.aviso.textContent !== aviso) pop.aviso.textContent = aviso;
      pop.raiz.style.borderColor = alAlcance ? '#f5b942' : trabajando ? '#4cd7a1' : 'rgba(255,255,255,.3)';
      const pos = this.posEstaciones.get(tarea.estacion) ?? this.posEstaciones.get('habitat')!;
      // Varias tareas en la misma estación (el hábitat) se apilan.
      const pila = pendientes.filter((x) => x.estacion === tarea.estacion).indexOf(tarea);
      const flotar = this.movimientoReducido ? 0 : Math.sin(ahoraSec * 2 + pila) * 0.08;
      this.tmpVecB.set(pos.x, pos.y + 3.4 + flotar, pos.z);
      proyectar(this.tmpVecB, pop.raiz, pila * (ancho < 640 ? 38 : 66));
    }
  }

  private lanzarRafaga(x: number, y: number, z: number, colorHex: number, cantidad: number) {
    for (let i = 0; i < cantidad; i++) {
      const ang = (i / cantidad) * Math.PI * 2 + Math.random() * 0.4;
      const vel = 1.8 + Math.random() * 2.8;
      this.emitirParticula(
        x,
        y,
        z,
        Math.cos(ang) * vel,
        1.5 + Math.random() * 2.6,
        Math.sin(ang) * vel,
        0.55 + Math.random() * 0.35,
        1.1,
        colorHex,
      );
    }
  }

  private obtenerNodoCercano(): NodoEscena | null {
    let mejor: NodoEscena | null = null;
    let mejorDist = Infinity;
    for (const nodo of this.nodos) {
      if (nodo.completado) continue;
      const d = Math.hypot(this.fisica.x - nodo.x, this.fisica.z - nodo.z);
      if (d <= nodo.radio && d < mejorDist) {
        mejorDist = d;
        mejor = nodo;
      }
    }
    return mejor;
  }

  private actualizarTamano() {
    if (this.destruido) return;
    const w = Math.max(1, this.contenedor.clientWidth);
    const h = Math.max(1, this.contenedor.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private manejarKeyDown(e: KeyboardEvent) {
    if (this.modo !== 'tercera_persona') return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const code = e.code;
    if (code === 'Space') {
      if (!this.teclas.has('Space')) {
        this.saltoPendiente = true;
      }
    }
    if (code === 'KeyE') {
      this.ejecutarAccionCercana();
    }
    const digito = /^Digit([1-4])$/.exec(code);
    if (digito) this.seleccionar(Number(digito[1]) - 1);
    this.teclas.add(code);
  }

  private manejarKeyUp(e: KeyboardEvent) {
    this.teclas.delete(e.code);
  }

  private manejarPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 2) return;
    if (this.punteroCamara !== null) return;
    this.punteroCamara = e.pointerId;
    this.arrastrando = true;
    this.ultimoPunteroX = e.clientX;
    this.ultimoPunteroY = e.clientY;
  }

  private manejarPointerMove(e: PointerEvent) {
    if (!this.arrastrando || e.pointerId !== this.punteroCamara || this.modo === 'pausa') return;
    const dx = e.clientX - this.ultimoPunteroX;
    const dy = e.clientY - this.ultimoPunteroY;
    this.ultimoPunteroX = e.clientX;
    this.ultimoPunteroY = e.clientY;

    if (this.modo === 'tercera_persona') {
      this.camYaw -= dx * 0.0055;
      this.camPitch = Math.max(0.08, Math.min(1.1, this.camPitch + dy * 0.0045));
    } else if (this.modo === 'orbita') {
      this.orbitaAngulo -= dx * 0.005;
    }
  }

  private manejarWheel(e: WheelEvent) {
    if (this.modo !== 'tercera_persona') return;
    this.camDistancia = Math.max(4.5, Math.min(15, this.camDistancia + e.deltaY * 0.006));
  }

  private construirEntradaMovimiento(): EntradaMovimiento {
    let adelante = 0;
    let derecha = 0;
    if (this.teclas.has('KeyW') || this.teclas.has('ArrowUp')) adelante += 1;
    if (this.teclas.has('KeyS') || this.teclas.has('ArrowDown')) adelante -= 1;
    if (this.teclas.has('KeyD') || this.teclas.has('ArrowRight')) derecha += 1;
    if (this.teclas.has('KeyA') || this.teclas.has('ArrowLeft')) derecha -= 1;

    adelante = Math.max(-1, Math.min(1, adelante + this.entradaTactil.adelante));
    derecha = Math.max(-1, Math.min(1, derecha + this.entradaTactil.derecha));

    const saltarMantenido = this.teclas.has('Space') || this.entradaTactil.saltar;
    const saltarPresionado = this.saltoPendiente;
    this.saltoPendiente = false;

    const sprint =
      this.teclas.has('ShiftLeft') ||
      this.teclas.has('ShiftRight') ||
      this.entradaTactil.sprint;

    return {
      adelante,
      derecha,
      camaraYaw: this.camYaw,
      saltarPresionado,
      saltarMantenido,
      sprint,
    };
  }

  private animarEscena(dt: number, ahoraSec: number, dtReal: number) {
    // Animar antena de la base central y hélices del helicóptero Ingenuity
    if (!this.movimientoReducido) this.grupoBase.traverse((obj) => {
      if (obj.name === 'antena-rotatoria') {
        obj.rotation.y += dt * 0.7;
      } else if (obj.name === 'rotores-ingenuity') {
        obj.rotation.y += dt * 26;
      } else if (obj.name === 'item-perseverance-ingenuity') {
        const baseY = groundHeightAt(obj.position.x, obj.position.z, this.destino);
        obj.position.y = baseY + Math.sin(ahoraSec * 2.2) * 0.25 + 0.28;
      }
    });

    // Animar balizas y cristales de nodos interactivos
    for (const nodo of this.nodos) {
      if (!nodo.grupo || nodo.completado || this.movimientoReducido) continue;
      if (nodo.tipo === 'hielo') {
        nodo.grupo.rotation.y += dt * 0.55;
      } else {
        const baliza = nodo.grupo.getObjectByName('baliza-flotante');
        if (baliza) {
          baliza.rotation.y += dt * 1.8;
          baliza.position.y = 2.4 + Math.sin(ahoraSec * 3.1) * 0.22;
        }
      }
    }

    // Tormentas dinámicas en Marte / polvo ambiental
    this.polvoTimer += dt;
    const esTormentaPolvo = this.eventoActualId === 'tormenta-polvo';
    const esTormentaSolar = this.eventoActualId === 'tormenta-solar';
    if (this.destino === 'marte') {
      const densidadObj = esTormentaPolvo ? 0.032 : 0.0135;
      this.niebla.density += (densidadObj - this.niebla.density) * Math.min(1, dt * 2);
      if (this.polvoTimer > (esTormentaPolvo ? 0.05 : 0.16)) {
        this.polvoTimer = 0;
        const px = this.fisica.x + (Math.random() - 0.5) * 24;
        const pz = this.fisica.z + (Math.random() - 0.5) * 24;
        const py = groundHeightAt(px, pz, this.destino) + 0.4 + Math.random() * 2.6;
        this.emitirParticula(
          px,
          py,
          pz,
          esTormentaPolvo ? 5.2 : 1.6,
          0.15,
          esTormentaPolvo ? 1.4 : 0.4,
          1.4,
          esTormentaPolvo ? 1.4 : 0.85,
          0xd97d54,
        );
      }
    } else if (esTormentaSolar && this.polvoTimer > 0.12) {
      this.polvoTimer = 0;
      const px = this.fisica.x + (Math.random() - 0.5) * 20;
      const pz = this.fisica.z + (Math.random() - 0.5) * 20;
      this.emitirParticula(
        px,
        groundHeightAt(px, pz, this.destino) + 5 + Math.random() * 4,
        pz,
        (Math.random() - 0.5) * 1.2,
        -2.5,
        (Math.random() - 0.5) * 1.2,
        1.1,
        0.75,
        0xf5b942,
      );
    }

    // Física y animación de la tripulación: solo el seleccionado recibe la entrada (RF-13).
    if (this.modo === 'tercera_persona') {
      // Durante el primer plano nadie se mueve: el jugador lee.
      const entrada = this.enfoque ? { ...ENTRADA_QUIETA, camaraYaw: this.camYaw } : this.construirEntradaMovimiento();
      this.tripulantes.forEach((t, i) => {
        this.moverTripulante(t, i === this.seleccionado ? entrada : { ...ENTRADA_QUIETA, camaraYaw: this.camYaw }, dt, i === this.seleccionado);
      });
      this.avanzarTrabajo(dtReal);
    } else {
      // En modo órbita, la tripulación espera de pie frente al hábitat.
      this.tripulantes.forEach((t, i) => {
        const x = (i - (this.tripulantes.length - 1) / 2) * 1.8;
        t.rig.root.position.set(x, groundHeightAt(x, 8.2, this.destino), 8.2);
        t.rig.cuerpo.rotation.y = this.movimientoReducido ? 0 : Math.sin(ahoraSec * 0.6 + i) * 0.25;
        t.rig.piernaIzq.rotation.x = 0;
        t.rig.piernaDer.rotation.x = 0;
        t.rig.brazoIzq.rotation.set(0, 0, 0.1);
        t.rig.brazoDer.rotation.set(0, 0, -0.1);
        t.rig.sombra.position.y = 0.03;
        t.rig.sombra.scale.set(1, 1, 1);
      });
    }
    const sel = this.astronauta.root.position;
    this.anilloSeleccion.visible = this.modo === 'tercera_persona' && this.tripulantes.length > 1 && !this.enfoque;
    this.anilloSeleccion.position.set(sel.x, groundHeightAt(sel.x, sel.z, this.destino) + 0.05, sel.z);
    this.actualizarPops(ahoraSec);

    // Actualizar pool de partículas
    let hayParticulas = false;
    for (let i = 0; i < this.maxParticulas; i++) {
      const p = this.particulas[i];
      if (!p.activa) continue;
      hayParticulas = true;
      p.vida += dt;
      if (p.vida >= p.vidaMax) {
        p.activa = false;
        this.tmpMat4.makeScale(0, 0, 0);
        this.particulasMesh.setMatrixAt(i, this.tmpMat4);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const progreso = p.vida / p.vidaMax;
      const s = p.escala * (1 - progreso);
      this.tmpQuat.identity();
      this.tmpVecA.set(p.x, p.y, p.z);
      this.tmpScale.set(s, s, s);
      this.tmpMat4.compose(this.tmpVecA, this.tmpQuat, this.tmpScale);
      this.particulasMesh.setMatrixAt(i, this.tmpMat4);
      this.particulasMesh.setColorAt(i, p.color);
    }
    if (hayParticulas) {
      this.particulasMesh.instanceMatrix.needsUpdate = true;
      if (this.particulasMesh.instanceColor) {
        this.particulasMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private actualizarCamara(dt: number) {
    const k = 1 - Math.exp(-9.5 * dt);

    if (this.modo === 'orbita') {
      if (!this.movimientoReducido) this.orbitaAngulo += dt * 0.14;
      const radio = 19.5;
      this.tmpVecA.set(
        Math.sin(this.orbitaAngulo) * radio,
        4.6,
        Math.cos(this.orbitaAngulo) * radio,
      );
      this.tmpVecB.set(-2.4, 2.5, 0); // Desplaza el foco para equilibrar el panel izquierdo y ver horizonte/cielo
      this.camPosSuave.lerp(this.tmpVecA, k * 0.6);
      this.camTargetSuave.lerp(this.tmpVecB, k * 0.6);
      this.camera.position.copy(this.camPosSuave);
      this.camera.lookAt(this.camTargetSuave);
      return;
    }

    if (this.enfoque) {
      const suave = this.movimientoReducido ? 1 : k * 0.45;
      this.camPosSuave.lerp(this.enfoque.pos, suave);
      this.camTargetSuave.lerp(this.enfoque.mira, suave);
      this.camera.position.copy(this.camPosSuave);
      this.camera.lookAt(this.camTargetSuave);
      return;
    }

    // Tercera persona con pull-in contra terreno y obstáculos
    this.tmpVecB.set(this.fisica.x, this.fisica.y + 1.68, this.fisica.z);
    const cosPitch = Math.cos(this.camPitch);
    const dirX = Math.sin(this.camYaw) * cosPitch;
    const dirY = Math.sin(this.camPitch);
    const dirZ = Math.cos(this.camYaw) * cosPitch;

    this.tmpVecC.set(dirX, dirY, dirZ).normalize();
    let distFinal = this.camDistancia;

    if (this.mallasColisionCam.length > 0) {
      this.raycaster.set(this.tmpVecB, this.tmpVecC);
      this.raycaster.far = this.camDistancia;
      const impactos = this.raycaster.intersectObjects(this.mallasColisionCam, true);
      if (impactos.length > 0 && impactos[0].distance > 1.2) {
        distFinal = Math.min(distFinal, impactos[0].distance - 0.35);
      }
    }

    this.tmpVecA.copy(this.tmpVecB).addScaledVector(this.tmpVecC, distFinal);
    const sueloCamY = groundHeightAt(this.tmpVecA.x, this.tmpVecA.z, this.destino) + 0.7;
    if (this.tmpVecA.y < sueloCamY) {
      this.tmpVecA.y = sueloCamY;
    }

    this.camPosSuave.lerp(this.tmpVecA, k);
    this.camTargetSuave.lerp(this.tmpVecB, k);

    // Trauma decay
    if (this.trauma > 0) {
      const shake = this.trauma * this.trauma * 0.25;
      this.camera.position.set(
        this.camPosSuave.x + (Math.random() - 0.5) * shake,
        this.camPosSuave.y + (Math.random() - 0.5) * shake,
        this.camPosSuave.z + (Math.random() - 0.5) * shake,
      );
      this.trauma = Math.max(0, this.trauma - dt * 1.4);
    } else {
      this.camera.position.copy(this.camPosSuave);
    }

    this.camera.lookAt(this.camTargetSuave);
  }

  private emitirTelemetria(forzar = false) {
    const ahora = performance.now();
    if (!forzar && ahora - this.ultimaTelemetria < 110) return;
    this.ultimaTelemetria = ahora;

    const cercano = this.obtenerNodoCercano();
    const distDomo = Math.hypot(this.fisica.x, this.fisica.z);
    const restantes = this.nodos.filter(
      (n) => (n.tipo === 'hielo' || n.tipo === 'averia') && !n.completado,
    ).length;

    this.onTelemetria({
      objetivoCercano: cercano
        ? {
            id: cercano.id,
            tipo: cercano.tipo,
            etiqueta: cercano.etiqueta,
            subetiqueta: cercano.subetiqueta,
            historiaId: cercano.historiaId,
          }
        : null,
      enSuelo: this.fisica.enSuelo,
      enDomo: distDomo <= 6.5,
      altura: Math.max(0, Number((this.fisica.y - groundHeightAt(this.fisica.x, this.fisica.z, this.destino)).toFixed(1))),
      velocidad: Number(Math.hypot(this.fisica.vx, this.fisica.vz).toFixed(1)),
      gravedad: GRAVEDAD[this.destino],
      nodosRestantes: restantes,
      softwareGl: this.isSoftwareGl,
      seleccionado: this.seleccionado,
      trabajoTripulacion: this.tripulantes.map((t) => t.tareaId),
      progresoTareas: Object.fromEntries(this.progreso),
      tareaCercana: (() => {
        const t = this.tareaAlAlcance(this.fisica);
        return t ? { id: t.id, etiqueta: t.etiqueta } : null;
      })(),
    });
  }

  private programarFrame() {
    if (this.destruido || this.perdido) return;

    const ejecutar = (now: number) => {
      if (this.destruido || this.perdido) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - this.ultimoTiempo) / 1000));
      // El trabajo usa tiempo real, como el reloj del día: en un equipo lento la física va más despacio,
      // pero una tarea no debe tardar más en terminarse.
      const dtReal = Math.min(0.5, Math.max(0, (now - this.ultimoTiempo) / 1000));
      this.ultimoTiempo = now;

      if (this.modo !== 'pausa') {
        this.animarEscena(dt, now / 1000, dtReal);
        this.actualizarCamara(dt);
        this.renderer.render(this.scene, this.camera);
        if (this.modo === 'tercera_persona') {
          this.emitirTelemetria(false);
        }
      }

      if (this.isSoftwareGl) {
        this.esperarFenceSoftware(() => {
          this.rafId = requestAnimationFrame(ejecutar);
        });
      } else {
        this.rafId = requestAnimationFrame(ejecutar);
      }
    };

    this.rafId = requestAnimationFrame(ejecutar);
  }

  private esperarFenceSoftware(cb: () => void) {
    const gl = this.renderer.getContext();
    if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
      const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (fence) {
        gl.flush();
        const verificar = () => {
          if (this.destruido || this.perdido) {
            gl.deleteSync(fence);
            return;
          }
          const status = gl.clientWaitSync(fence, 0, 0);
          if (status === gl.WAIT_FAILED || status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
            gl.deleteSync(fence);
            this.timerId = window.setTimeout(cb, 75);
          } else {
            this.timerId = window.setTimeout(verificar, 16);
          }
        };
        this.timerId = window.setTimeout(verificar, 24);
        return;
      }
    }
    this.timerId = window.setTimeout(cb, 80);
  }

  public dispose() {
    this.destruido = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.timerId !== null) clearTimeout(this.timerId);

    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    window.removeEventListener('pointercancel', this.onPointerUpBound);
    this.renderer.domElement.removeEventListener('wheel', this.onWheelBound);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLostBound);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestoredBound);

    this.limpiarGrupo(this.grupoMundo);
    this.limpiarGrupo(this.grupoBase);
    this.limpiarGrupo(this.grupoRocas);
    this.limpiarGrupo(this.grupoNodos);
    this.limpiarGrupo(this.grupoCielo);
    for (const t of this.tripulantes) this.limpiarGrupo(t.rig.root);
    this.capaPops.remove();
    this.particulasMesh.geometry.dispose();
    (this.particulasMesh.material as THREE.Material).dispose();
    this.tex.dispose();
    this.envRenderTarget.dispose();
    this.pmremGenerator.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.contenedor) {
      this.contenedor.removeChild(this.renderer.domElement);
    }
  }
}
