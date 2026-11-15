# UI/UX Design Brief: Misión Legado

Guía de diseño para quien dibuje y quien programe la interfaz. Producto en [PRD.md](PRD.md), técnica en
[TRD.md](TRD.md). Es un brief de hackatón: define lo necesario para construir rápido y con coherencia, no un
sistema de diseño completo.

## 1. Audiencia y contexto

- **Principal:** 8–14 años, en el móvil o en el portátil del colegio, a veces con mala conexión.
- **Secundaria:** docentes y jurado, que ven una demo de 3 minutos en pantalla grande.
- Sesión corta (3–5 min), sin tutorial largo: se aprende jugando.

## 2. Objetivos de experiencia

1. **Sentirse al mando.** Una misión de verdad, con decisiones que importan.
2. **Entender de un vistazo.** Qué falta, qué sobra y qué está en peligro, sin leer párrafos.
3. **Curiosidad, no examen.** La historia real aparece como recompensa.

## 3. Principios

| Principio | En la práctica |
|---|---|
| Un vistazo | Cada recurso y cada astronauta se lee en menos de 2 segundos: icono, número y semáforo. |
| Una decisión a la vez | Una pantalla, una pregunta. Máximo 3 opciones. |
| Consecuencia visible | Tras elegir, se anima el cambio de los valores afectados. |
| Nunca solo color | Todo estado lleva icono y texto además de color. |
| Texto corto | Frases de máximo ~15 palabras; términos técnicos con una explicación breve la primera vez. |

## 4. Tono y copy

- Voz de **jefa/jefe de misión** que acompaña: cercana, clara, con un punto de épica. Habla de "tú".
- Verbos de acción en los botones: "Lanzar misión", "Reforzar blindaje", "Seguir".
- Los errores no culpan: "No hay presupuesto para esto. Quita algo y prueba de nuevo."
- La tragedia se cuenta con suavidad: "La misión se aborta. Tu equipo vuelve a casa a salvo".

| Contexto | Ejemplo |
|---|---|
| Evento | "Tormenta de polvo. Tus paneles solares producen menos hoy." |
| Alerta de salud | "Lucía necesita descansar. Su sueño está bajo." |
| Tarjeta de historia | "En 1971, los astronautas del Apolo 15 condujeron por primera vez este vehículo en la Luna." (dato a verificar antes de publicar) |

## 5. Flujo y pantallas

```
Inicio → Diseño de misión → Juego (turnos) → Bitácora
                              ↑      │
                              │      └→ Tarjeta de historia (modal)
                              └── repetir hasta el último turno
```

### 5.1 Inicio
Título, frase de una línea, botón **Empezar**. Elección de destino (Luna/Marte) con ilustración y
una línea de contexto ("Gravedad 1/6: cuesta mantener los músculos"). Selectores de tripulación y duración.
Tres preajustes (Luna fácil, Luna difícil, Marte) rellenan esos selectores y se pueden cambiar (supuesto abierto en el README).

### 5.2 Diseño de misión

```
┌──────────────────────────────────────────────────────────┐
│ Presupuesto: 37 / 100 puntos              [ Lanzar ▶ ]   │
├───────────────────────────┬──────────────────────────────┤
│ CATÁLOGO                  │ TU MISIÓN                    │
│ [Módulos] [Equipo real]   │  • Panel solar          -8   │
│ ┌────────┐ ┌────────┐     │  • Invernadero         -15   │
│ │ Panel  │ │ Reactor│     │  • Curiosity ★         -14   │
│ │ -8     │ │ -22    │     │                              │
│ └────────┘ └────────┘     │ Resumen: energía ✔ comida ✔  │
│ ┌────────┐ ┌────────┐     │ aire ✔ radiación ⚠ (sin      │
│ │ ★ LRV  │ │ ★ ALSEP│     │ blindaje)                    │
│ └────────┘ └────────┘     │                              │
└───────────────────────────┴──────────────────────────────┘
```
- El **★** marca el equipo histórico real.
- Un resumen de **avisos previos** al lanzamiento ayuda a decidir sin saber de ingeniería. Cada aviso se
  calcula en el motor y lleva un dato real de la NASA con enlace a su fuente (TRD 6.1). Avisar no impide lanzar.
- Elementos que superan el presupuesto: deshabilitados con el motivo visible.

### 5.3 Juego (pantalla principal)

```
┌──────────────────────────────────────────────────────────┐
│ Día 7 / 14        ⚡ 64   🍎 41   💨 78   💧 55   ☢ 32%   │
├──────────────────────────────────────┬───────────────────┤
│  EVENTO                              │ TRIPULACIÓN       │
│  Tormenta de polvo                   │ Lucía      ● ● ▲ ●│
│  Tus paneles solares producen        │ Marco      ● ● ● ●│
│  menos hoy.                          │ Aiko       ▲ ● ● ■│
│                                      │ (toca para ver)   │
│  [ Ahorrar energía ]                 │                   │
│  [ Seguir con todo ]                 │ Tendencia ╱╲_╱    │
│  [ Sacar el rover a explorar ]       │                   │
└──────────────────────────────────────┴───────────────────┘
```
- Barra superior fija con los 5 indicadores globales: los 4 recursos y ☢, la dosis media de la tripulación como
  porcentaje del límite de la misión (más alto es peor). El indicador de salud `radiacion` va al revés: 100 es sano.
- Cada evento afecta solo al día en que ocurre; el texto no promete efectos de varios días.
- Zona central: **evento y opciones**, con letra grande.
- Lateral: tripulación con 4 indicadores cada uno (radiación, nutrición, sueño, huesos).
- En móvil: el lateral pasa a una pestaña inferior o a una hoja deslizable.

**Fase de jugabilidad (RF-13 a RF-16).** Elegir una opción abre el plan del día:
- Barra de tripulación: número de tecla (1–4), nombre, icono y nombre de la especialidad, y estado
  ("Libre" o "Reparando el reactor 60 %"). El seleccionado se marca con borde y texto, no solo color; en el
  3D lleva un anillo a sus pies.
- Aviso flotante sobre cada estación con tarea: icono, nombre corto, especialidad recomendada y barra de
  progreso. Se resalta cuando el astronauta está al alcance ("E para trabajar").
- Lista de tareas en el panel, con el mismo progreso, para quien no ve bien el 3D, y reloj del día con el
  tiempo en texto. Botón "Terminar día". Ajuste del reloj: 90 s, ×2 o sin reloj.
- En el diseño, cada módulo indica que pide mantenimiento diario y el total de tareas al día.

### 5.4 Tarjeta de historia (modal)
Imagen, nombre, **año y lugar**, 2–3 frases, "Dato curioso" y enlace a la fuente. Botón **Entendido**.
Foco atrapado dentro del modal y cierre con Esc.

### 5.5 Bitácora
Resultado (éxito/abortada), puntuación, salud final, galería de las historias desbloqueadas y el botón **Jugar otra vez**
(con otro destino o la misma semilla).

## 6. Estados a diseñar

| Pantalla | Estados |
|---|---|
| Diseño | Vacío (sin elementos), presupuesto agotado, elemento bloqueado, avisos activos. |
| Juego | Turno normal, evento crítico, indicador en rojo, fin de misión. |
| Salud | Verde, ámbar, rojo; astronauta en peligro. |
| Contenido | Imagen no disponible: se muestra ilustración de respaldo. |

## 7. Dirección visual

**Panel de control de misión**, moderno y cálido, no militar ni frío. Fondo oscuro de baja fatiga, tarjetas con
bordes suaves, números grandes y pocas decoraciones. Ilustraciones simples en SVG y fotos reales de la NASA solo
en las tarjetas de historia.

### Color (propuesta; validar contrastes con el verificador de `antislop-human`)

| Rol | Valor | Uso |
|---|---|---|
| Fondo | `#0B1020` | Fondo de la app |
| Superficie | `#141B34` | Tarjetas y paneles |
| Texto | `#F2F5FF` | Texto principal |
| Marte / acento | `#E2674A` | Botón principal, destino Marte |
| Luna / acento 2 | `#C9D3E8` | Destino Luna, bordes |
| OK | `#4CD7A1` | Semáforo verde |
| Aviso | `#F5B942` | Semáforo ámbar |
| Peligro | `#FF6B6B` | Semáforo rojo |

Texto sobre botón de acento: `#0B1020`. Los pares texto/fondo propuestos superan 4,5:1; confirmar con la
herramienta antes de fijarlos.

### Tipografía
- Títulos: **Space Grotesk**. Cuerpo: **Atkinson Hyperlegible** (pensada para legibilidad). Ambas con licencia abierta.
- Autoalojadas en `public/fonts/` (sin depender de la red). Cuerpo mínimo 16 px, botones de decisión 18 px.

### Forma y espacio
Rejilla de 8 px. Radios de 12 px. Áreas táctiles de al menos 44 × 44 px. Máximo 2 niveles de sombra.

## 8. Componentes clave

| Componente | Notas |
|---|---|
| `Indicador` | Icono + número + barra + estado en texto accesible. |
| `AstronautaCard` | 4 indicadores con semáforo (icono distinto por estado: ● ▲ ■). |
| `BotonDecision` | Grande, con una línea de consecuencia opcional ("-10 energía"). |
| `ItemCatalogo` | Coste visible, ★ si es histórico, estado deshabilitado explicado. |
| `TarjetaHistoria` | Modal accesible con imagen, texto y fuente. |
| `Sparkline` | SVG con título y resumen en texto para lectores de pantalla. |

## 9. Movimiento

- Duración de 150–300 ms, con suavizado de salida. Solo `transform` y `opacity`.
- Cambio de valor: el número cuenta hacia el nuevo valor y el indicador destella una vez.
- Cambio de turno: entrada suave del siguiente evento.
- **`prefers-reduced-motion`:** sin conteo ni destellos; cambios instantáneos.

## 10. Accesibilidad

- Contraste mínimo 4,5:1 en texto y 3:1 en componentes.
- Todo el juego se maneja con teclado y el foco siempre se ve.
- Estados de salud con **icono + texto + color**.
- Evento nuevo y alertas anunciados con `aria-live="polite"`.
- Imágenes con texto alternativo; gráficas con resumen en texto.
- Texto escalable hasta 200 % sin pérdida de funciones.
- Sin parpadeos ni sonido automático.
- El reloj del día se puede alargar (×2) o quitar (WCAG 2.2.1), y se para con una tarjeta o un panel abierto.

## 11. Responsive

| Ancho | Diseño |
|---|---|
| < 600 px | Una columna; tripulación en pestaña inferior; catálogo y misión en pestañas. |
| 600–1024 px | Dos columnas en juego; catálogo reducido. |
| > 1024 px | Layout completo de los bocetos. |

## 12. Lo que no se diseña en el MVP

Tema claro, menú de ajustes, animaciones de cohete o aterrizaje, música, idioma alternativo, tutorial interactivo.

## 13. Skills para la interfaz

`taste-skill` o `impeccable` (dirección visual), `antislop-ui` y `antislop-human` (contraste, foco, estados),
`dataviz` (sparklines), `animate` (movimiento).

## 14. Entregables de diseño

1. Tokens en `src/styles/tokens.css` (colores, tipografía, espaciado, radios).
2. Los 5 bocetos de pantalla (pueden ser los de este documento refinados, no hace falta Figma).
3. Lista de componentes con sus estados.
4. Comprobación final: contraste, teclado y `prefers-reduced-motion`.
