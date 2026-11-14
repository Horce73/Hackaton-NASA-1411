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
| Framework | React 18 + Vite + TypeScript estricto | Phaser, Three.js | Juego por turnos con mucha interfaz; un motor gráfico sería más trabajo. |
| Estado | `useReducer` + Context | Zustand, Redux | Una sola pantalla activa; el estado de partida cabe en un reducer. |
| Navegación | Máquina de fases en el reducer | React Router | Solo 4 pantallas y ninguna necesita URL propia. |
| Estilos | CSS Modules + variables CSS | Tailwind | Menos configuración y tokens centralizados. |
| Gráficas | SVG propio (sparklines) | Recharts, D3 | Evitar dependencia y peso para 2 gráficas simples. |
| Pruebas | Vitest | Jest | Viene con Vite, arranque inmediato. |
| Despliegue | Netlify o GitHub Pages | Servidor propio | Sitio estático, sin variables secretas. |
| Aleatoriedad | PRNG con semilla (mulberry32, 10 líneas) | `Math.random` | Partidas reproducibles y demo estable. |

Dependencias de ejecución: `react`, `react-dom`. Todo lo demás es de desarrollo (`vite`, `typescript`,
`vitest`, `eslint`). Añadir cualquier otra requiere acuerdo del equipo.

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

## 4. Estructura del repositorio

```
src/
  engine/
    tipos.ts          # tipos del dominio
    prng.ts           # generador con semilla
    diseno.ts         # validarDiseno, presupuestoRestante
    turno.ts          # siguienteTurno (orden de resolución)
    salud.ts          # actualizarSalud
    puntuacion.ts     # puntuar
    *.test.ts
  data/
    parametros.ts     # constantes de balance (única fuente)
    catalogo.ts       # módulos y equipo histórico
    eventos.ts        # eventos y opciones
    historias.ts      # tarjetas de historia con fuente
  state/
    reducer.ts        # fases + acciones
  ui/
    inicio/ diseno/ juego/ salud/ bitacora/ comun/
  styles/
    tokens.css        # variables de diseño
public/img/           # imágenes de respaldo (RNF-02)
docs/
```

Convenciones: identificadores y archivos de código en inglés si el equipo lo prefiere (ver supuestos del README);
textos visibles al usuario en español y solo en `data/` y `ui/`.

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
  energiaProduccion?: number;   // por turno
  energiaConsumo?: number;      // por turno
  alimentoProduccion?: number;
  soporteVital?: number;        // capacidad de reciclado
  blindaje?: number;            // reduce dosis de radiación
  saludBonus?: Partial<Record<Indicador, number>>;
  ciencia?: number;             // puntos por turno
  resistenciaPolvo?: number;    // reduce penalización de tormenta de polvo
}

type Indicador = 'radiacion' | 'nutricion' | 'suenoEstres' | 'musculoHueso';

interface Astronauta {
  id: string;
  nombre: string;
  salud: Record<Indicador, number>;   // 0..100
  dosis: number;                      // acumulada, unidad abstracta
}

interface Recursos {
  energia: number;          // 0..capacidad
  alimento: number;
  oxigeno: number;
  agua: number;
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
function siguienteTurno(estado: Estado, opcionId: string): Estado
```

Pura: mismo estado y misma opción producen el mismo resultado. El azar sale de `estado.rng`.

### 6.2 Orden de resolución de un turno

1. Aplicar los `efectos` de la opción elegida al evento actual.
2. **Energía:** `balance = produccion × factorSolar − consumo`. `factorSolar` baja con tormenta de polvo
   (Marte), reducido por `resistenciaPolvo`. Se actualiza el almacén y no baja de 0.
3. **Soporte vital y alimento:** consumo por tripulante y turno; la producción y el reciclado compensan en parte.
   Si falta energía, la eficiencia del soporte vital baja.
4. **Radiación:** `dosisTurno = base(destino) × multiplicadorEvento × (1 − blindaje)`; se suma a cada astronauta.
5. **Salud** (6.3).
6. **Ciencia:** suma de `ciencia` de los ítems activos, con la penalización si hay déficit de energía.
7. **Historias:** si la opción o el ítem desbloquea una historia, se añade a `historiasDesbloqueadas`.
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

Semáforo: **verde ≥ 70**, **ámbar 40–69**, **rojo < 40**. La gravedad y el factor de pérdida por destino
están en `parametros.ts`.

### 6.4 Puntuación

`puntuacion = ciencia + round(saludMediaFinal) + 10 × historiasDesbloqueadas`. Es provisional.

### 6.5 Parámetros

Todo el balance vive en `data/parametros.ts` con comentarios de procedencia. Los valores de radiación
se calibran con fuentes públicas de la NASA (por ejemplo, las mediciones del instrumento RAD de Curiosity)
cuando haya tiempo; hasta entonces son plausibles y se marcan `// PROVISIONAL`.

## 7. Estado de interfaz

El reducer maneja las acciones: `INICIAR`, `AÑADIR_ITEM`, `QUITAR_ITEM`, `CONFIRMAR_DISENO`,
`ELEGIR_OPCION`, `CERRAR_TARJETA`, `REINICIAR`. La interfaz no calcula reglas del juego: solo lee `Estado`.

La semilla se toma de `?seed=` en la URL y, si no existe, de la hora; la demo usa una semilla fija.

## 8. Datos y contenido

- Formato: archivos TypeScript tipados (`data/*.ts`), que dan validación en compilación.
- Cada `Historia` incluye `fuente` (URL NASA) y `verificada: boolean`.
- Prueba automática: ninguna historia con `verificada: false` se incluye en la compilación de entrega.
- Imágenes: `public/img/`, formato WebP, máximo ~150 kB cada una, con texto alternativo obligatorio en el dato.
- Licencia: confirmar las condiciones de uso de los medios de la NASA antes de publicar (supuesto abierto).
- RF-10 (opcional): consulta a la API de imágenes de la NASA con tiempo límite y respaldo local; sin clave, a
  verificar. Si falla, no se muestra error al usuario.

## 9. Pruebas

| Nivel | Qué | Herramienta |
|---|---|---|
| Unidad | `siguienteTurno`, `validarDiseno`, `actualizarSalud`, `puntuar`, `prng`. | Vitest |
| Propiedades simples | 1 000 partidas con semillas distintas: sin recursos negativos ni indicadores fuera de rango. | Vitest |
| Reproducibilidad | Misma semilla y mismas decisiones dan el mismo resultado. | Vitest |
| Datos | Todas las referencias `historiaId` existen; todo ítem histórico tiene historia y fuente. | Vitest |
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
- Despliegue en Netlify (arrastrar `dist/`) o GitHub Pages (ajustar `base` en `vite.config.ts`).
- Sin variables de entorno ni secretos. Sin cookies ni analítica. Solo `localStorage` para RF-12.
- Despliegue de prueba en la fase 0 y despliegue final con tiempo de reserva (ver fases del README).

## 12. Trazabilidad

| RF/RNF | Módulo |
|---|---|
| RF-01, RF-02 | `engine/diseno.ts`, `ui/inicio`, `ui/diseno` |
| RF-03, RF-04 | `engine/turno.ts`, `data/eventos.ts`, `ui/juego` |
| RF-05, RF-06 | `engine/salud.ts`, `ui/salud` |
| RF-07, RF-08 | `data/catalogo.ts`, `data/historias.ts`, `ui/comun/TarjetaHistoria` |
| RF-09 | `engine/puntuacion.ts`, `ui/bitacora` |
| RNF-01, RNF-02 | Sin backend; recursos en `public/` |
| RNF-04 | Carpeta `engine/` sin importar React |

## 13. Decisiones abiertas

| Tema | Opción por defecto | Se decide |
|---|---|---|
| Idioma del código | Inglés en identificadores | Fase 0 |
| Netlify o GitHub Pages | Netlify | Fase 0 |
| Valores de balance | Los de `parametros.ts` | Fase 3 |
| RF-10 (API de imágenes) | No hacer | Tras fase 5 |
