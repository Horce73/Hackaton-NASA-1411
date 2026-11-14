# PRD: Misión Legado

Documento de producto. Define **qué** se construye y **para quién**. El **cómo** está en [TRD.md](TRD.md)
y el diseño de la experiencia en [UX-Design-Brief.md](UX-Design-Brief.md). Los IDs `RF-` y `RNF-`
son los de [../README.md](../README.md).

## 1. Problema y oportunidad

Los jóvenes conocen la exploración espacial como imágenes sueltas. Pocos entienden **por qué**
una misión es difícil (energía, comida, aire, radiación y salud a la vez) ni que en la Luna y en Marte
hay equipo real de la NASA todavía allí.

Un juego corto convierte esas restricciones en decisiones propias y la historia del equipo real en
una recompensa, no en una lección.

## 2. Usuarios

| Persona | Perfil | Qué necesita |
|---|---|---|
| **Exploradora/explorador junior** (principal) | 8–14 años, juega en el móvil o en el portátil del colegio. | Entender qué pasa sin leer mucho, ver consecuencias claras y sentir que sus decisiones importan. |
| **Docente o monitor** (secundaria) | Usa el juego en una actividad de 10 minutos. | Partidas cortas, contenido fiable con fuente y nada que instalar. |
| **Jurado de la hackatón** (evaluación) | Ve una demo de 3 minutos. | Idea clara, ciclo completo funcionando y rigor con la NASA. |

## 3. Objetivos y no-objetivos

**Objetivos**
1. Una partida completa (diseñar → jugar → bitácora) en menos de 5 minutos.
2. Que cada decisión tenga una consecuencia visible en recursos o salud.
3. Que quien juegue una partida pueda contar al menos una historia real de equipo de la NASA.
4. Contenido histórico y científico **con fuente verificable**.

**No-objetivos (en esta hackatón)**
- Cuentas de usuario, ranking en línea o multijugador.
- Backend, base de datos o analítica.
- Simulación científicamente exacta: es un modelo educativo simplificado.
- Datos de NASA en vivo (RF-10 es opcional y con respaldo local).
- Realidad virtual, 3D o motor de juego.

## 4. Historias de usuario

| ID | Historia | RF |
|---|---|---|
| HU-01 | Como explorador, elijo Luna o Marte y cuánta gente va, para empezar mi propia misión. | RF-01 |
| HU-02 | Como explorador, gasto un presupuesto limitado en módulos, para decidir qué es más importante llevar. | RF-02 |
| HU-03 | Como explorador, veo cómo cambian energía, comida, aire, agua y radiación cada día. | RF-03 |
| HU-04 | Como explorador, resuelvo un evento (tormenta, fallo) eligiendo entre pocas opciones. | RF-04 |
| HU-05 | Como explorador, veo la salud de cada astronauta con semáforo y avisos, para saber a quién cuidar. | RF-05, RF-06 |
| HU-06 | Como explorador, llevo equipo histórico real y descubro su historia en una tarjeta. | RF-07, RF-08 |
| HU-07 | Como explorador, al terminar veo mi puntuación y las historias que desbloqueé. | RF-09 |
| HU-08 | Como docente, juego sin instalar nada ni necesitar internet en el aula. | RNF-01, RNF-02 |

## 5. Alcance

### Dentro del MVP (prioridad M)
RF-01 a RF-05, RF-07, RF-08 y RF-09. RNF-01 a RNF-05.

### Después del MVP (S y C)
RF-06 (gráfica de tendencia), RF-10 (imágenes de la API de la NASA), RF-11 (sonido), RF-12 (guardado).

### Contenido mínimo del MVP

| Elemento | Cantidad mínima |
|---|---|
| Destinos | 2 (Luna, Marte) |
| Módulos de base | 6 |
| Equipo histórico | 6 (3 de la Luna, 3 de Marte) |
| Eventos | 6 |
| Indicadores de salud | 4 por astronauta |
| Configuraciones de partida fijas | 3 (Luna fácil, Luna difícil, Marte) |

## 6. Criterios de aceptación (MVP)

| RF | Criterio |
|---|---|
| RF-01 | **Dado** la pantalla inicial, **cuando** elijo destino, tripulación (2–4) y duración (10–20), **entonces** puedo continuar al diseño; valores fuera de rango no son seleccionables. |
| RF-02 | **Dado** un presupuesto de 100 puntos, **cuando** intento añadir un elemento que lo supera, **entonces** el botón queda desactivado y se explica por qué. |
| RF-03 | **Dado** una partida en curso, **cuando** termina un turno, **entonces** se actualizan los 4 recursos y nunca quedan por debajo de 0. |
| RF-04 | **Dado** un turno, **cuando** aparece un evento, **entonces** hay 2 o 3 opciones y la elegida cambia el resultado. |
| RF-05 | **Dado** el panel de salud, **cuando** un indicador baja de 40, **entonces** su color pasa a rojo **y** aparece un icono y un texto, no solo color. |
| RF-07 | **Dado** el catálogo, **cuando** añado un equipo histórico y juego, **entonces** su efecto de juego se aplica en la simulación. |
| RF-08 | **Dado** un equipo histórico usado, **cuando** se desbloquea, **entonces** se muestra una tarjeta con año, lugar, 2–3 frases y fuente. |
| RF-09 | **Dado** el fin de la misión (por turnos o aborto), **entonces** se muestra victoria o derrota, puntuación y las historias desbloqueadas. |

## 7. Métricas de éxito

Es una hackatón: las métricas son de entrega, no de uso.

| Métrica | Meta |
|---|---|
| Partida completa de principio a fin sin errores | 100 % de los intentos de demo |
| Duración de una partida | 3–5 minutos |
| Equipo histórico con fuente NASA citada | 100 % |
| Demo sin internet | Funciona |
| Accesibilidad (Lighthouse) | 90 o más |

## 8. Dependencias y supuestos

Los supuestos abiertos (duración de la hackatón, equipo, reglas de imágenes, datos reales) están en la tabla
de supuestos del [README](../README.md#supuestos-y-preguntas-abiertas).

Dependencias externas: ninguna obligatoria. Solo RF-10 usaría la API de imágenes de la NASA.

## 9. Riesgos de producto

| Riesgo | Mitigación |
|---|---|
| El juego resulta demasiado difícil o aburrido. | 3 configuraciones fijas, semilla aleatoria fija para la demo y una ronda de prueba con alguien ajeno al equipo. |
| Se percibe como juego sin contenido real. | Tarjetas de historia con fuente y equipo real en el núcleo de la mecánica. |
| Se pasa el tiempo en el diseño y no se llega a jugar. | La partida jugable (fase 3) tiene prioridad sobre el pulido visual. |

## 10. Entrega

- Sitio estático desplegado y repositorio.
- Guion de demo de 3 minutos (en el README).
- Bitácora de fuentes de los datos históricos.
