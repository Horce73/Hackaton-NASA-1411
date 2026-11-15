# TRD: Misión Legado

Documento técnico. Responde a [PRD.md](PRD.md); el diseño está en [UX-Design-Brief.md](UX-Design-Brief.md).
Todos los valores numéricos son **iniciales y provisionales**: se calibran en la fase de bucle de
juego, y se anotan como tales en `src/data/parametros.ts`.

## 1. Principios

1. **El motor no sabe que existe una interfaz.** Es TypeScript puro y determinista.
2. **Lo mínimo que funcione.** Sin backend, sin router, sin estado global de terceros.
3. **Los datos van fuera del código.** Catálogo, eventos, historias y parámetros se editan sin tocar el motor.
4. **La demo no puede fallar.** Nada depende de la red.

## 2. Decisiones de stack

| Tema | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| Framework | React 18 + Vite + TypeScript estricto | Phaser | Juego por turnos con mucha interfaz. |
| Escena 3D | Three.js, solo en `three/` (PR #2, fase 5) | Motor de juego completo | Exploración del planeta en 3D; el motor por turnos sigue siendo TypeScript puro. |
| Estado | `useReducer` + Context | Zustand, Redux | Una sola pantalla activa; el estado de partida cabe en un reducer. |
| Navegación | Máquina de fases en el reducer | React Router | Solo 4 pantallas y ninguna necesita URL propia. |
| Estilos | Tailwind v4 junto a CSS Modules y variables CSS (PR #2) | Solo CSS Modules | Las pantallas del PR #2 usan Tailwind; los tokens siguen en `styles/tokens.css`. |
| Iconos | `lucide-react` (PR #2) | Iconos SVG propios | Usado por las pantallas del PR #2. |
| Gráficas | SVG propio (sparklines) | Recharts, D3 | Evitar dependencia y peso para 2 gráficas simples. |
| Pruebas | Vitest | Jest | Viene con Vite, arranque inmediato. |
| Despliegue | GitHub Pages | Netlify, servidor propio | Sitio estático, sin variables secretas. |
| Aleatoriedad | PRNG con semilla (mulberry32, 10 líneas) | `Math.random` | Partidas reproducibles y demo estable. |

Dependencias de ejecución: `react`, `react-dom`, `three` y `lucide-react` (las dos últimas, del PR #2). Todo lo
demás es de desarrollo: `vite`, `typescript`, `vitest`, `eslint`, `tailwindcss` y `@tailwindcss/vite`, y lo que
necesitan para React y TypeScript (`@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `@types/three`,
`typescript-eslint`). TypeScript se fija en la 6.0 porque `typescript-eslint` todavía no
admite la 7. Añadir cualquier otra requiere acuerdo del equipo.

## 3. Arquitectura

```
┌───────────────────────────── navegador ─────────────────────────────┐
│  ui/  (React)                                                       │
│   Inicio → Diseño → Juego → Bitácora        tarjetas, panel salud   │
│        │  acciones (dispatch)        ▲ estado (lectura)             │
│        ▼                             │                              │
│  state/ reducer de fases ────────────┘                              │
│        │ llama funciones puras                                      │
│        ▼                                                            │
│  engine/ siguienteTurno · validarDiseno · puntuar · prng            │
│        │ lee                                                        │
│        ▼                                                            │
│  data/ catalogo · eventos · historias · parametros  (TS/JSON)       │
└─────────────────────────────────────────────────────────────────────┘
```

Regla de dependencias: `ui → state → engine → data`. Nunca hacia atrás. `engine` no importa de `react`.
La escena 3D cuelga de `ui`: `ui → three → physics → engine → data`, y `three` usa también `audio`.
`engine`, `physics` y `audio` no importan de `react` ni de `three`.
Única excepción: `data/` usa `import type` de `engine/tipos.ts` para tipar sus datos. Es solo de tipos, se
borra al compilar y no crea dependencia en ejecución.

## 4. Estructura del repositorio

```
src/
  engine/
    tipos.ts          # tipos del dominio
    prng.ts           # generador con semilla
    diseno.ts         # validarDiseno, presupuestoRestante, reservasIniciales, avisosDiseno
    turno.ts          # iniciarMision, siguienteTurno (orden de resolución)
    tareas.ts         # tareasDelDia, ritmoTrabajo (RF-14 a RF-16)
    salud.ts          # actualizarSalud, semaforo, alertasSalud
    puntuacion.ts     # puntuar
    *.test.ts
  data/
    parametros.ts     # constantes de balance (única fuente)
    catalogo.ts       # módulos y equipo histórico
    eventos.ts        # eventos y opciones
    historias.ts      # tarjetas de historia con fuente
    avisos.ts         # textos de los avisos previos, con dato real y fuente
    *.test.ts         # integridad de los datos
  state/
    reducer.ts        # fases + acciones
    guardado.ts       # partida en curso en localStorage (RF-12)
  physics/
    fisica3d.ts       # controlador del astronauta con gravedad lunar y marciana
  three/
    EscenaPlaneta.ts  # escena, cámara y nodos interactivos
    modelos3d.ts      # astronauta, base y equipo NASA
    texturas.ts       # texturas procedurales
    Vista3D.tsx       # puente con React
  audio/
    sonido.ts         # efectos sintetizados con Web Audio (RF-11)
  ui/
    inicio/ diseno/ juego/ salud/ bitacora/ comun/
  styles/
    tokens.css        # variables de diseño
    base.css          # tipografías, reinicio mínimo, foco y cursor
    tailwind.css      # entrada de Tailwind v4
public/img/           # imágenes de respaldo (RNF-02)
public/fonts/         # tipografías autoalojadas (UX Brief, sección 7)
docs/
```

Convenciones: identificadores y archivos de código en español, tal como aparecen en las secciones 5 y 6
(decidido en la fase 0); textos visibles al usuario en español y solo en `data/` y `ui/`.

## 5. Modelo de datos

```ts
type Destino = 'luna' | 'marte';
type Fase = 'inicio' | 'diseno' | 'juego' | 'bitacora';

interface Configuracion {
  destino: Destino;
  tripulantes: 2 | 3 | 4;
  turnos: number;            // 10..20
  semilla: number;
}

interface Item {              // módulo o equipo histórico
  id: string;
  nombre: string;
  tipo: 'modulo' | 'historico';
  coste: number;              // puntos de misión
  destinos: Destino[];
  efectos: Efectos;           // ver abajo
  historiaId?: string;        // solo históricos
}

interface Efectos {
  energiaProduccion?: number;   // por turno, no depende del sol (reactor)
  energiaSolar?: number;        // por turno, se multiplica por factorSolar (paneles)
  energiaConsumo?: number;      // por turno
  alimentoProduccion?: number;
  soporteVital?: number;        // tripulantes cuyo consumo de oxígeno y agua recicla
  blindaje?: number;            // reduce dosis de radiación
  saludBonus?: Partial<Record<Indicador, number>>;  // por turno; `radiacion` se ignora (se deriva de la dosis)
  ciencia?: number;             // puntos por turno
  resistenciaPolvo?: number;    // reduce penalización de tormenta de polvo
  alertaRadiacion?: boolean;    // avisa de la radiación desde ámbar, no solo en rojo (Curiosity)
}

type Indicador = 'radiacion' | 'nutricion' | 'suenoEstres' | 'musculoHueso';

interface Astronauta {
  id: string;
  nombre: string;
  salud: Record<Indicador, number>;   // 0..100
  dosis: number;                      // acumulada, en mSv
}

interface Recursos {
  energia: number;          // 0..CAPACIDAD_ENERGIA (parametros.ts), puntos abstractos
  alimento: number;         // kg
  oxigeno: number;          // kg
  agua: number;             // litros
}

interface Evento {
  id: string;
  titulo: string;
  texto: string;
  destinos: Destino[];
  peso: number;               // probabilidad relativa
  opciones: Opcion[];         // 2..3
  historiaId?: string;        // eventos educativos (ej. Surveyor 3)
}

interface Opcion {
  id: string;
  texto: string;
  efectos: EfectosTurno;      // cambios puntuales en recursos, dosis, salud, ciencia
}

interface EfectosTurno {      // solo valen para el turno en que se elige la opción
  recursos?: Partial<Recursos>;                 // suma o resta directa al almacén
  dosis?: number;                               // dosis extra para cada astronauta
  salud?: Partial<Record<Indicador, number>>;   // suma o resta directa; `radiacion` se ignora
  ciencia?: number;
  factorSolar?: number;                         // 0..1, por defecto 1 (paso 2)
  multiplicadorRadiacion?: number;              // por defecto 1 (paso 4)
}

interface Instantanea {       // foto del final de un turno
  turno: number;
  recursos: Recursos;
  tripulacion: Astronauta[];
}

interface Historia {
  id: string;
  nombre: string;
  lugar: string;
  anio: string;               // texto: admite rangos como "1969–72"
  texto: string;              // 2–3 frases para 8–14 años
  datoCurioso: string;
  fuente: string;             // URL de la NASA de la que salen texto y dato
  imagen: {
    src: string;              // public/img/*.webp
    alt: string;
    ancho: number;
    alto: number;
    fuente: string;           // página de la imagen en images.nasa.gov
  };
  verificada: boolean;
}

interface Estado {
  fase: Fase;
  config: Configuracion;
  diseno: { itemIds: string[]; presupuestoUsado: number };
  turno: number;
  recursos: Recursos;
  tripulacion: Astronauta[];
  historial: Instantanea[];   // una por turno, para gráficas (RF-06)
  eventoActual?: Evento;
  historiasDesbloqueadas: string[];
  ciencia: number;
  rng: number;                // estado del PRNG
  resultado?: 'exito' | 'abortada';
}
```

## 6. Motor de simulación

### 6.1 Contrato

```ts
function validarDiseno(config: Configuracion, itemIds: string[]): ResultadoDiseno
function iniciarMision(config: Configuracion, itemIds: string[]): Estado
function siguienteTurno(estado: Estado, opcionId: string, pendientes?: Tarea[]): Estado
function tareasDelDia(estado: Estado, opcionId: string): Tarea[]
function ritmoTrabajo(astronauta: Astronauta, tarea: Tarea): number
```

**Tareas del día (RF-13 a RF-16).** `tareasDelDia` lista lo que hay que hacer tras elegir una opción: las
`tareas` de la opción (en `data/eventos.ts`), un muestreo geológico opcional (`tipo: 'ciencia'`, exterior, 2 personas;
si se termina suma `CIENCIA_MUESTREO`) y la revisión de los módulos a los que les toca hoy: cada módulo se revisa cada
`Item.mantenimiento.cadaDias` días (en `data/catalogo.ts`), desfasado por su posición en el diseño. Cada `Tarea` tiene `id`, `estacion` (`habitat`, `exterior` o
`item:<índice en itemIds>`), `tipo` (`evento` o `mantenimiento`), `especialidad`, `trabajo` (segundos de un
no especialista) y `etiqueta`. `trabajo` se multiplica por `cargaDelDia`: `tripulantes / 2` por una carga que sube
lineal de `CARGA_PRIMER_DIA` a `CARGA_ULTIMO_DIA`. Con los preajustes, el trabajo ideal ocupa el 42–69 % del día 1 y el
72–119 % del último, así que al final hay que elegir qué dejar sin hacer. Una tarea de opción que apunta a un módulo que no está en el diseño se hace en
el hábitat. `ritmoTrabajo` vale `RITMO_ESPECIALISTA` si la especialidad coincide y 1 si no. Una tarea con `personas: 2` (todas
las del exterior) solo avanza con dos tripulantes trabajando a la vez; `ritmoEquipo` da la media de sus ritmos. El reloj y el
progreso viven en la interfaz y la escena 3D; al terminar el día, el reducer pasa a `siguienteTurno` las
tareas que quedaron `pendientes`. Sin `pendientes` el turno se resuelve como antes, así que las pruebas y el
balance de la fase 6 siguen valiendo cuando se completa todo.

`siguienteTurno` es pura: mismo estado y misma opción producen el mismo resultado. El azar sale de `estado.rng`.

- `validarDiseno` devuelve `{ valido, presupuestoUsado, errores }`. Rechaza: turnos fuera de 10–20, un ítem
  que no existe o no es del destino, un equipo histórico repetido y superar el presupuesto. Los módulos sí se
  pueden repetir (dos paneles solares).
- `avisosDiseno(config, itemIds)` devuelve los avisos previos al lanzamiento (UX Brief 5.2): una lista de
  `{ id, ok }` para `energia`, `soporteVital`, `alimento`, `radiacion`, `musculoHueso` y `suenoEstres`. Proyecta
  la misión sin eventos con las mismas fórmulas del turno: avisa si la energía se agota, si las reservas de
  aire, agua o alimento no llegan al último turno, si no hay blindaje y si músculo o sueño acabarían en rojo (sin contar el descanso y el ejercicio que elija el jugador).
  Los textos, el dato real que lo explica y su fuente NASA están en `data/avisos.ts` (`verificada: false`
  hasta que alguien los confirme). Un aviso no impide lanzar.
- `iniciarMision` crea el estado del turno 1: reservas iniciales, tripulación con salud 100, primer evento
  sorteado y las historias de los equipos históricos del diseño ya desbloqueadas. Lanza un error si el diseño
  no es válido.
- `siguienteTurno` lanza un error si la opción no existe en el evento actual o está bloqueada, y devuelve el
  mismo estado si la misión ya terminó.
- `recursoQueFalta(estado, opcionId)` dice qué recurso impide elegir una opción: una opción que resta de un
  almacén más de lo que hay queda bloqueada y la interfaz la deshabilita con el motivo. Si todas las opciones
  del evento estuvieran bloqueadas, ninguna lo está (el almacén queda en 0), para que la partida no se atasque.
- `iniciarMision` devuelve el estado con `fase: 'juego'`. Después el motor no cambia `fase`: solo fija
  `resultado`. La fase la mueve el reducer.

### 6.2 Orden de resolución de un turno

0. **Tareas pendientes:** si queda alguna tarea de tipo `evento`, se usan los efectos de
   `Evento.opcionSinAtender` (o ninguno si el evento no la define) en lugar de los de la opción elegida. Cada
   módulo con su mantenimiento pendiente no cuenta en los pasos 2 a 6 de este turno.
1. Aplicar los `efectos` de la opción elegida al evento actual: cambios directos en recursos, dosis, salud y
   ciencia. Tras aplicarlos, recursos e indicadores se acotan a su rango (un descanso con la salud a 100 no
   evita el desgaste del turno; una opción con coste no deja un almacén en negativo). Un evento no tiene efectos propios: `factorSolar` y `multiplicadorRadiacion` vienen de la opción
   y valen solo para este turno.
2. **Energía:** `balance = energiaProduccion + energiaSolar × factorSolarEfectivo − consumo`, con
   `factorSolarEfectivo = 1 − (1 − factorSolar) × (1 − resistenciaPolvo)`. `factorSolar` baja con tormenta de
   polvo (Marte). El consumo es el de la base por tripulante más el de los ítems. El almacén queda entre 0 y
   `CAPACIDAD_ENERGIA`. `coberturaEnergia` es la parte del consumo que se pudo cubrir (0..1).
3. **Soporte vital y alimento:** consumo por tripulante y turno. El reciclado cubre el consumo de oxígeno y
   de agua de hasta `soporteVital` tripulantes, y el invernadero produce alimento; ambos se multiplican por
   `coberturaEnergia`, así que sin energía rinden menos. Si un almacén no alcanza, queda en 0 y se anota qué
   parte del consumo se cubrió.
4. **Radiación:** `dosisTurno = base(destino) × multiplicadorRadiacion × (1 − blindaje)`; se suma a cada
   astronauta. El blindaje total se limita a `BLINDAJE_MAX`.
5. **Salud** (6.3).
6. **Ciencia:** suma de `ciencia` de los ítems, multiplicada por `coberturaEnergia`. La ciencia total no baja de 0.
7. **Historias:** las de los equipos históricos se desbloquean al lanzar la misión (`iniciarMision`); la de un
   evento educativo (`Evento.historiaId`), al resolver ese evento, con cualquier opción.
8. **Siguiente evento:** se sortea entre los de `destinos` compatibles, ponderado por `peso`.
9. **Fin:** `abortada` si algún indicador de algún astronauta llega a 0; `exito` si se completan los turnos.

Invariantes que se prueban: ningún recurso es negativo, ningún indicador sale de 0–100, y la
función no modifica el estado de entrada.

### 6.3 Salud por astronauta (RF-05)

| Indicador | Baja cuando | Se compensa con |
|---|---|---|
| `radiacion` | La dosis acumulada se acerca al límite de la misión. | Blindaje, refugio en tormenta solar. |
| `nutricion` | No se cubre el alimento del turno. | Invernadero, reservas. |
| `suenoEstres` | Pasan los turnos y hay eventos duros. | Zona de descanso, acción de descanso. |
| `musculoHueso` | Pasa el tiempo con gravedad baja (Luna ≈ 0,17 g, Marte ≈ 0,38 g). | Gimnasio, acción de ejercicio. |

Semáforo: **verde ≥ 70**, **ámbar 40–69**, **rojo < 40**. El factor de pérdida por destino está en
`parametros.ts`; la gravedad no se usa como número en el cálculo.

- `radiacion` no se suma ni se resta: se calcula como `100 × (1 − dosis / LIMITE_DOSIS)`.
- Ningún indicador representa el aire o el agua. Si falta oxígeno o agua, `nutricion`, `suenoEstres` y
  `musculoHueso` pierden una penalización fuerte, proporcional a la parte que faltó.
- Con el alimento cubierto, `nutricion` se recupera un poco cada turno.
- `alertasSalud(estado)` devuelve las alertas del panel (RF-05): una por astronauta e indicador en rojo,
  ordenadas de peor a mejor. Si algún ítem del diseño tiene `alertaRadiacion` (Curiosity, que en la realidad
  mide la radiación con su instrumento RAD), la radiación también avisa en ámbar, marcada como `temprana`.
  Es solo un aviso: no cambia la simulación.

### 6.4 Puntuación

`puntuacion = ciencia + round(saludMediaFinal) + 10 × historiasDesbloqueadas`. Es provisional.

### 6.5 Parámetros

**Calibración (fase 3).** Cinco valores usan cifras de la NASA, con su fuente en `parametros.ts` y sin
verificar todavía por el equipo: oxígeno 1,08 kg por persona y día, agua potable 2,5 L, comida 1,8 kg (con
envase), dosis en Marte 0,67 mSv al día (instrumento RAD de Curiosity) y dosis en una misión de superficie
0,5 mSv al día (usada para la Luna). El resto sigue siendo balance de juego y se marca `// PROVISIONAL`: la
energía (puntos abstractos), las reservas, el desgaste de sueño y músculo y los efectos de los eventos.
Radiación realista (2026-11-15): el indicador llega a 0 con 250 mSv, el límite de la NASA para la dosis de una
tormenta solar (Radiation Protection Technical Brief, OCHMO). La dosis diaria real apenas se nota; lo peligroso es
trabajar fuera durante una tormenta solar (130 mSv, PROVISIONAL): una deja la radiación en ámbar y dos la agotan.

Las constantes globales del balance viven en `data/parametros.ts` con comentarios de procedencia; los costes
y efectos de cada ítem están en `data/catalogo.ts` y los pesos y efectos de cada evento en `data/eventos.ts`. Ahí están también el
presupuesto, la capacidad y la carga inicial de energía, y las reservas iniciales de alimento, oxígeno y
agua, que cubren solo una parte de la misión y crecen con la tripulación y los turnos. Los valores de radiación
se calibran con fuentes públicas de la NASA (por ejemplo, las mediciones del instrumento RAD de Curiosity)
cuando haya tiempo; hasta entonces son plausibles y se marcan `// PROVISIONAL`.

## 7. Estado de interfaz

El reducer maneja las acciones: `INICIAR`, `AÑADIR_ITEM`, `QUITAR_ITEM`, `CONFIRMAR_DISENO`,
`ELEGIR_OPCION`, `CERRAR_TARJETA`, `REPETIR` (misma misión y misma semilla), `REINICIAR`. La interfaz no calcula reglas del juego: solo lee `Estado`.

Antes de lanzar todavía no existe un `Estado` de partida, así que el reducer guarda un `EstadoApp` con cuatro
formas: `{ fase: 'inicio' }`, `{ fase: 'diseno', config, itemIds }`, `{ fase: 'juego', partida, tarjetas }` y
`{ fase: 'bitacora', partida }`, donde `partida` es el `Estado` del motor y `tarjetas` la cola de historias
recién desbloqueadas que aún no se han mostrado (RF-08). Mientras quede una tarjeta abierta, `ELEGIR_OPCION`
no hace nada; `CERRAR_TARJETA` la quita de la cola. `REPETIR` no vuelve a mostrar tarjetas ya vistas. Si la
misión termina con una tarjeta pendiente, la bitácora muestra la historia completa. `AÑADIR_ITEM` no hace nada si `validarDiseno` rechaza el resultado.

Fase de jugabilidad: el estado `juego` añade `plan: { opcionId, hechas: string[] } | null`. `ELEGIR_OPCION`
crea el plan del día en lugar de resolver el turno; `COMPLETAR_TAREA` anota una tarea hecha y `TERMINAR_DIA`
resuelve el turno con las pendientes. La selección de astronauta, su posición y el progreso parcial de cada
tarea viven en la escena 3D; el reloj (60 s, ×2 o sin reloj), en la interfaz.

La semilla se toma de `?seed=` en la URL y, si no existe, de la hora; la demo usa una semilla fija.

## 8. Datos y contenido

- Formato: archivos TypeScript tipados (`data/*.ts`), que dan validación en compilación.
- Cada `Historia` incluye `fuente` (URL NASA) y `verificada: boolean`. Todas nacen con `verificada: false` y
  solo una persona del equipo las pasa a `true`.
- Desde la fase 5, `texto` y `datoCurioso` se redactan solo con lo que dice la página de `fuente`. La imagen
  sale de la biblioteca de imágenes de la NASA (images.nasa.gov), en WebP de 800 px como máximo.
- Mientras una historia tenga `verificada: false`, su tarjeta lo dice en pantalla ("Texto pendiente de
  revisión"), para no presentar como confirmado lo que nadie ha revisado.
- Prueba de entrega: `npm run test:entrega` falla si queda alguna historia o aviso con `verificada: false`.
  Va aparte de `npm run test` porque hasta la revisión del equipo fallaría siempre; se pasa antes de la demo.
- Contenido mínimo actual: 7 módulos (panel solar, reactor, invernadero, reciclador, blindaje, zona de
  descanso, gimnasio), 7 equipos históricos (tabla del README, sin Surveyor 3) y 6 eventos (tormenta solar,
  tormenta de polvo, fallo de equipo, fuga de agua, día tranquilo y Surveyor 3 como evento educativo).
- Los nombres de la tripulación (Lucía, Marco, Aiko y un cuarto provisional) están en `parametros.ts`.
- Imágenes: `public/img/`, formato WebP, máximo ~150 kB cada una, con texto alternativo obligatorio en el dato.
- Hábitat central de la escena 3D: a escala real del Surface Habitat de referencia de la NASA (parte metálica de
  4,4 m × 2,6 m con la esclusa; inflable de 6,5 m × 5,2 m con dos plantas), el mismo que el artículo ASCEND 2023
  del hábitat de Marte da como "casi idéntico". Medidas en `HABITAT` (`three/modelos3d.ts`), con la fuente:
  https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf.
  Los planos de referencia están en `RAW/` (render de base lunar de la NASA, de
  https://www.nasa.gov/general/nextstep-3-b-moon-base-demonstrations/; corte del hábitat del documento ASCEND).
- Licencia: confirmar las condiciones de uso de los medios de la NASA antes de publicar (supuesto abierto).
- RF-10 (opcional): no se hace (sección 13). Las fotos de las historias ya salen de images.nasa.gov y van en el repo.

## 9. Pruebas

| Nivel | Qué | Herramienta |
|---|---|---|
| Unidad | `siguienteTurno`, `validarDiseno`, `actualizarSalud`, `puntuar`, `prng`. | Vitest |
| Propiedades simples | 1 000 partidas con semillas distintas: sin recursos negativos ni indicadores fuera de rango. | Vitest |
| Reproducibilidad | Misma semilla y mismas decisiones dan el mismo resultado. | Vitest |
| Datos | Todas las referencias `historiaId` existen; todo ítem histórico tiene historia y fuente. | Vitest |
| Arquitectura | Ningún archivo de `engine/` importa React, `ui/` ni `state/`. | Vitest |
| Manual | Guion de demo completo en móvil y portátil, sin red. | Persona del equipo |

No se hacen pruebas de interfaz automatizadas en el MVP.

## 10. Rendimiento, accesibilidad y compatibilidad

| ID | Meta |
|---|---|
| RNF-05 | Carga inicial menor de 300 kB comprimidos (sin imágenes), interacción inmediata (< 100 ms por turno). |
| RNF-03 | WCAG 2.1 AA: contraste 4,5:1, foco visible, todo con teclado, `prefers-reduced-motion` respetado, `aria-live` para eventos y alertas, sin información solo por color. |
| Compatibilidad | Últimas 2 versiones de Chrome, Firefox, Safari y Edge; móvil desde 360 px de ancho. |

## 11. Construcción y despliegue

- `npm run dev`, `npm run test`, `npm run build`. Salida estática en `dist/`.
- Despliegue en GitHub Pages con `.github/workflows/deploy.yml` (lanzamiento manual). `base: './'` en
  `vite.config.ts` evita depender del nombre del repo.
- Sin variables de entorno ni secretos. Sin cookies ni analítica. Solo `localStorage` para RF-12.
- Despliegue de prueba en la fase 0 y despliegue final con tiempo de reserva (ver fases del README).

## 12. Trazabilidad

| RF/RNF | Módulo |
|---|---|
| RF-01, RF-02 | `engine/diseno.ts`, `ui/inicio`, `ui/diseno` |
| RF-03, RF-04 | `engine/turno.ts`, `data/eventos.ts`, `ui/juego` |
| RF-05, RF-06 | `engine/salud.ts`, `ui/salud`, `ui/comun/Sparkline` |
| RF-07, RF-08 | `data/catalogo.ts`, `data/historias.ts`, `ui/comun/TarjetaHistoria` |
| RF-09 | `engine/puntuacion.ts`, `ui/bitacora` |
| RF-12 | `state/guardado.ts`, `ui/comun/EstadoContext.tsx`, `ui/inicio` |
| RF-13 a RF-16 | `engine/tareas.ts`, `data/catalogo.ts`, `data/eventos.ts`, `state/reducer.ts`, `three/`, `ui/juego` |
| RF-17 | `Historia.medicion` en `data/historias.ts`, `Evento.archivo` y `Evento.notaDe` en `data/eventos.ts`; `notas`, `closeUp`, `eventosConocidos` y `conocimientoDelDia` en `state/reducer.ts` (guardado versión 4); `enfocarHistoria` en `three/EscenaPlaneta.ts`; `ArchivoNasa` y `DialogoCloseUp` en `ui/juego` |
| RNF-01, RNF-02 | Sin backend; recursos en `public/` |
| RNF-04 | Carpeta `engine/` sin importar React |

## 13. Decisiones abiertas

| Tema | Opción por defecto | Se decide |
|---|---|---|
| Idioma del código | Español en identificadores | Decidido en la fase 0 |
| Netlify o GitHub Pages | GitHub Pages | Decidido; despliegue de prueba hecho en la fase 0 |
| Preajustes de partida y dificultad | Solo rellenan RF-01: Luna fácil 2 tripulantes y 10 turnos, Luna difícil 4 y 14, Marte 3 y 10 (acortados el 2026-11-15) (provisionales, en `parametros.ts`) | Decidido en la fase 2 |
| Eventos de varios turnos | No: cada evento afecta a su turno | Fase 3 |
| Opción con coste y almacén vacío | La opción queda bloqueada con el motivo visible | Decidido en la fase 3 |
| Efecto de Curiosity en la alerta de dosis | Alerta temprana de radiación (`alertaRadiacion`); no cambia la simulación | Decidido en la fase 4 |
| Valores de balance | Los de `parametros.ts`; cinco calibrados con cifras de la NASA en la fase 3. Objetivo de la fase 6, en victorias con decisiones al azar sobre el diseño sugerido: Luna fácil 70–85 %, Luna difícil 20–35 %, Marte 35–55 %; decidiendo bien, los tres se ganan casi siempre. Las cifras de la NASA no se tocan | Decidido en la fase 6 |
| RF-10 (API de imágenes) | No se hace: las 8 historias ya tienen su foto de images.nasa.gov en el repo, y los resultados en vivo no pasarían la revisión de textos e imágenes para niños | Decidido tras la fase 6 |
| Jugabilidad (RF-13 a RF-16) | Control con WASD del astronauta elegido (1–4); día de 60 s con ×2 y sin reloj (WCAG 2.2.1); tarea de evento sin hacer → `opcionSinAtender`; mantenimiento sin hacer → el módulo no rinde ese día; especialidades fijas por nombre (Lucía ingeniería, Marco biología, Aiko geología, Dani medicina) | Decidido el 2026-11-14 |
| Dificultad del día | El trabajo crece con la tripulación y del primer al último día (`cargaDelDia`); día de 60 s y misiones más cortas | Decidido el 2026-11-14 y el 2026-11-15 |
| Cuaderno de misión (RF-17) | Sin la nota de la misión que lo midió, el evento muestra el riesgo sin cifras; la nota se anota al inspeccionar el equipo en 3D, con primer plano y diálogo | Decidido el 2026-11-15 |
| Radiación y porqués | Límite de 250 mSv por tormenta de la NASA en vez de 12 mSv; Luna fácil sugiere blindaje; cada aviso tiene un caso real (`TextoAviso.historia`) que sale en el «¿Por qué hace falta?» del diseño y en la bitácora (`Estado.causaFin`) | Decidido el 2026-11-15 |
| Movimiento | Sin jetpack; salto con traje de unos 0,44 m en la Luna (saludo con salto del Apolo 16), postura de piernas juntas en el aire | Decidido el 2026-11-15 |
| Insignia de la NASA en el hábitat | Lista en `modelos3d.ts` tras `MOSTRAR_LOGO_NASA = false`; la imagen no se publica hasta tener permiso por escrito | Pendiente de permiso |
| RF-12 (guardado) | Se guarda solo la partida en curso; el inicio ofrece "Continuar partida" y nunca se reanuda sola. Al terminar la misión se borra | Decidido tras la fase 6 |
