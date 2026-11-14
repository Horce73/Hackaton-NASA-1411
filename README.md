# Misión Legado (nombre provisional)

Juego web educativo para jóvenes exploradores: diseñas una misión a la Luna o a Marte,
gestionas la base y cuidas la salud de la tripulación. Por el camino descubres la historia
real de los equipos que la NASA dejó en esos mundos.

> Proyecto de hackatón con tiempo limitado. Este documento fija un **MVP pequeño y terminable**;
> todo lo demás está marcado como opcional.

## Retos que cubre

Fuente: [Retos Hackatón NASA - completo.txt](RAW/Retos%20Hackatón%20NASA%20-%20completo.txt)

| Reto | Papel en el proyecto |
|---|---|
| 13. Diseña tu misión espacial | Marco del juego: diseño de la misión con presupuesto limitado y simulación. |
| 3. Astronautas junior | Núcleo de la simulación: energía, alimentos, radiación y soporte vital. |
| 5. Salud en órbita | Panel de salud de cada astronauta, alimentado por la simulación. |
| 1. Historias del espacio | Equipo histórico real como piezas del catálogo, con tarjeta de historia. |

## Concepto en un minuto

1. **Diseñar (reto 13):** eliges destino (Luna o Marte), tamaño de tripulación y duración. Gastas un
   presupuesto fijo en módulos y equipo.
2. **Sobrevivir (retos 3 y 5):** la misión avanza por turnos (1 turno = 1 día). Cada turno hay
   un evento y una decisión. Recursos y salud evolucionan según lo que montaste y lo que decides.
3. **Aprender (reto 1):** el equipo histórico que llevas (un rover, un retrorreflector...) se
   desbloquea con una tarjeta de historia y da una ventaja en el juego.
4. **Cierre:** una bitácora final muestra puntuación, salud de la tripulación y las historias
   desbloqueadas.

Una partida dura 3 a 5 minutos, pensada para una demo en vivo.

## Requisitos funcionales

Prioridad: **M** = imprescindible (MVP), **S** = si hay tiempo, **C** = opcional.

| ID | Requisito | Reto | Prio |
|---|---|---|---|
| RF-01 | Elegir destino (Luna/Marte), tripulación (2–4) y duración (10–20 turnos). | 13 | M |
| RF-02 | Presupuesto fijo de puntos de misión; el catálogo de módulos y equipo tiene coste y no se puede exceder. | 13 | M |
| RF-03 | Simular por turnos los 4 recursos almacenados (energía, alimento, oxígeno y agua; estos dos últimos forman el soporte vital) y la radiación (dosis acumulada por astronauta frente a blindaje). | 3 | M |
| RF-04 | Cada turno: un evento (tormenta solar, tormenta de polvo, fallo de equipo) y una decisión entre 2–3 opciones. | 3, 13 | M |
| RF-05 | Panel de salud por astronauta: radiación, nutrición, sueño/estrés y masa muscular/ósea, con semáforo y alertas. | 5 | M |
| RF-06 | Gráfica de tendencia de salud y recursos a lo largo de los turnos. | 5 | S |
| RF-07 | Catálogo con equipo histórico real (ver tabla abajo) que da una ventaja de juego. | 1, 13 | M |
| RF-08 | Tarjeta de historia al desbloquear un equipo: 2–3 frases, año, lugar y una imagen. Texto apto para 8–14 años. | 1 | M |
| RF-09 | Final de partida: misión con éxito o abortada, puntuación y bitácora con las historias desbloqueadas. | 1, 3, 13 | M |
| RF-10 | Fotos desde la API de imágenes de la NASA, con imágenes estáticas de respaldo. | 1 | C |
| RF-11 | Efectos de sonido con Web Audio. | — | C |
| RF-12 | Guardar la última partida en `localStorage`. | — | C |

## Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Todo corre en el navegador, **sin backend**. Se despliega como sitio estático. |
| RNF-02 | La demo no depende de internet: los datos y las imágenes clave van incluidos en el repo. |
| RNF-03 | Interfaz en español, legible para niños: textos cortos, contraste alto, navegable con teclado. |
| RNF-04 | El motor de simulación es TypeScript puro, sin dependencias de UI, para poder probarlo aparte. |
| RNF-05 | Carga rápida y usable en pantalla de portátil y de móvil. |

## Equipo histórico (RF-07, RF-08)

Datos a **verificar contra fuentes NASA antes de mostrarlos**.

| Equipo | Lugar | Año | Efecto en el juego (propuesta) |
|---|---|---|---|
| Retrorreflector láser (Apolo 11) | Luna | 1969 | Barato, da puntos de ciencia. |
| ALSEP (estaciones de ciencia, Apolo 12–17) | Luna | 1969–72 | Ciencia continua, consume energía. |
| Vehículo lunar (LRV, Apolo 15–17) | Luna | 1971–72 | Más ciencia por turno, coste alto. |
| Surveyor 3 | Luna | 1967 | Evento educativo: piezas recuperadas por Apolo 12. |
| Sojourner | Marte | 1997 | Ciencia barata, poca energía. |
| Spirit y Opportunity | Marte | 2004 | Bonus de resistencia al polvo. |
| Curiosity | Marte | 2012 | Ciencia por turno. Mide radiación: el panel de salud avisa de la dosis antes, en ámbar. |
| Perseverance e Ingenuity | Marte | 2021 | Ciencia y exploración, coste alto. |

## Modelo de simulación

Un turno es una función pura: `siguienteTurno(estado, opcionId) → nuevoEstado`. El evento del turno
va dentro del estado (`estado.eventoActual`) y cada evento afecta solo a su turno.

- **Energía:** la producen paneles o reactor; la consumen módulos y equipo. Una tormenta de polvo reduce la solar (Marte).
- **Alimentos:** consumo por tripulante y turno; el invernadero compensa en parte.
- **Soporte vital:** oxígeno y agua; si alguno llega a 0, la tripulación pierde salud rápido
  (nutrición, sueño/estrés y masa muscular/ósea).
- **Radiación:** dosis acumulada por astronauta. El blindaje la reduce. Las tormentas solares la disparan.
- **Salud por astronauta (RF-05):** se calcula a partir de lo anterior. Nutrición baja con la comida, la
  dosis crece con la radiación, y sueño/estrés y masa muscular/ósea dependen de la duración y del descanso.

Los parámetros globales (consumos, dosis por turno, desgaste de salud) viven en un único archivo de datos
(`src/data/parametros.ts`); los costes y efectos de cada ítem y evento, en `catalogo.ts` y `eventos.ts`. Se calibran con fuentes públicas de la NASA (por ejemplo, las
mediciones del instrumento RAD de Curiosity para radiación en Marte). Desde la fase 3, los consumos de oxígeno, agua y comida y la dosis
diaria de radiación usan cifras de la NASA (detalle en el TRD 6.5); el resto son valores de juego y se anotan como tales.

## Arquitectura propuesta

React + Vite + TypeScript, sin backend, sin estado global complejo.

```
src/
  engine/      # motor de simulación (TS puro, con pruebas)
  data/        # catálogo, eventos, parametros.ts, historias
  state/       # reducer de fases
  ui/
    inicio/    # destino, tripulación y duración
    diseno/    # pantalla de diseño de misión
    juego/     # turnos, recursos, eventos
    salud/     # panel de salud
    bitacora/  # resultado final
    comun/     # componentes compartidos
  styles/      # tokens de diseño
public/img/    # imágenes de respaldo
public/fonts/  # tipografías autoalojadas
```

El detalle de archivos está en la sección 4 del [TRD](docs/TRD.md).

## Skills para el desarrollo

Ya instaladas y que se usan: `antislop` y `ponytail` (siempre), `taste-skill` o `impeccable`
(diseño de la interfaz), `antislop-ui` y `antislop-human` (contraste y accesibilidad), `dataviz`
(gráficas de salud), `animate` (transiciones de turno y tarjetas).

Candidatas a instalar (pendientes de aprobación del equipo):

| Skill | Installs | Para qué |
|---|---|---|
| `mindrally/skills@game-development` | 932 | Bucle de juego, estado y balance. |
| `google-labs-code/stitch-skills@react-vite-dashboard` | 6.4K | Base de React + Vite y layout del panel de salud. |
| `martinholovsky/claude-skills-generator@web-audio-api` | 412 | Solo si se hace RF-11. |

Instalación: `npx skills add <paquete> -g -y`.

## Plan por fases

El tiempo total de la hackatón no está confirmado (ver supuestos), así que las fases van en
porcentaje. **A partir del 80 % del tiempo no se añaden funciones, solo pulido y demo.**

| Fase | % del tiempo | Resultado |
|---|---|---|
| 0. Preparación | 5 % | Repo, Vite, estructura, despliegue de prueba. |
| 1. Motor | 20 % | `engine/` con 4 recursos, eventos y pruebas. Sin interfaz. |
| 2. Diseño de misión | 15 % | RF-01, RF-02, catálogo con equipo histórico. |
| 3. Bucle de juego | 20 % | RF-03, RF-04, RF-09: partida jugable de principio a fin. |
| 4. Salud | 10 % | RF-05 (y RF-06 si hay tiempo). |
| 5. Historias | 10 % | RF-07, RF-08: textos revisados e imágenes. |
| 6. Pulido y demo | 15 % | Accesibilidad, balance, guion de demo, despliegue. |
| Reserva | 5 % | Imprevistos. |

Al terminar la fase 3 ya hay un juego completo, aunque feo. Si el tiempo se acaba antes,
se entrega eso con las fases 4 y 5 reducidas.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El balance del juego consume demasiado tiempo. | Parámetros en un solo archivo y 3 preajustes de partida (Luna fácil, Luna difícil, Marte) que rellenan las elecciones de RF-01. |
| Datos históricos o científicos incorrectos. | Cada dato lleva su fuente NASA; una persona revisa todos los textos antes de la demo. |
| La API de imágenes falla en la demo. | Imágenes de respaldo en el repo (RNF-02); RF-10 es opcional. |
| Crece el alcance. | Solo se hace lo marcado M; S y C quedan tras el congelado al 80 %. |

## Supuestos y preguntas abiertas

| Supuesto | Pregunta | Si es falso | Bloquea |
|---|---|---|---|
| **Asumido:** el tiempo es de 24–48 h. | ¿Cuánto dura la hackatón y cuándo es la entrega? | Reducir los M a RF-01 a RF-05 y RF-07 a RF-09. | Plan por fases. |
| **Asumido:** el equipo programa en JavaScript/TypeScript. | ¿Qué lenguajes domina el equipo? | Cambiar el stack. El motor puro se conserva. | Arquitectura. |
| **Asumido:** equipo de 2–4 personas. | ¿Cuántas personas y con qué roles? | Recortar prioridades S. | Reparto de fases. |
| **Asumido:** interfaz y textos en español. Los identificadores del código van en español (decidido, TRD sección 13). | ¿Hay un idioma obligatorio para la entrega? | Traducir la interfaz. | Entrega. |
| **Asumido:** no hay requisito de usar datos reales en vivo. | ¿El jurado exige datos de NASA reales y no solo contenido? | Añadir una capa de datos (por ejemplo, radiación medida) a RF-03. | Evaluación. |
| **Asumido:** las imágenes de NASA se pueden usar en la demo. | ¿Hay reglas de uso de imágenes en la hackatón? | Usar ilustraciones propias. | RF-08, RF-10. |
| **Asumido:** los 3 preajustes de partida solo rellenan destino, tripulación y duración (RF-01): Luna fácil 2 y 10 turnos, Luna difícil 4 y 20, Marte 3 y 14. El motor no tiene un campo de dificultad. | ¿Qué diferencia "Luna difícil" de "Luna fácil"? | Añadir `dificultad` a `Configuracion` y a `parametros.ts`. | Fase 2. |
| **Asumido:** Curiosity adelanta la alerta de radiación (avisa en ámbar) pero no cambia la dosis. | ¿Debe cambiar también la simulación (por ejemplo, menos dosis en tormenta solar)? | Aplicarlo en `engine/turno.ts`. | Balance (fase 6). |
| **Asumido:** cada evento afecta solo al turno en que ocurre. | ¿Hacen falta eventos que duren varios días? | Añadir efectos activos con duración al `Estado`. | Fase 3. |

## Guion de demo (3 minutos)

1. Elegir Marte y gastar el presupuesto, incluyendo Curiosity (RF-01, RF-02, RF-07).
2. Ver la tarjeta de historia de Curiosity (RF-08).
3. Jugar 3–4 turnos con una tormenta de polvo (RF-03, RF-04).
4. Mostrar el panel de salud con una alerta de radiación (RF-05).
5. Abrir la bitácora final con las historias desbloqueadas (RF-09).

## Documentos

- [docs/PRD.md](docs/PRD.md): producto, usuarios, historias y criterios de aceptación.
- [docs/TRD.md](docs/TRD.md): stack, arquitectura, modelo de datos y motor de simulación.
- [docs/UX-Design-Brief.md](docs/UX-Design-Brief.md): flujo, pantallas, dirección visual y accesibilidad.

## Estado

| Requisito | Estado |
|---|---|
| RF-01, RF-02 | Hecho: pantallas de inicio y de diseño de misión, con avisos previos al lanzamiento |
| RF-07 | Catálogo con equipo histórico hecho; su efecto ya se aplica en el motor |
| RF-03, RF-04, RF-09 | Hecho: partida jugable de principio a fin (fase 3); consumos y radiación con cifras de la NASA, sin verificar |
| RF-05 | Hecho: panel de salud con icono, número, barra y texto, y alertas agrupadas; Curiosity avisa antes de la radiación |
| RF-06 | Hecho: tendencia de salud media y recursos en el juego (desplegable) y en la bitácora |
| RF-08 | Parcial: se desbloquea la historia y la bitácora la lista con su fuente; faltan texto, imagen y tarjeta (fase 5) |
| RNF-04 | Hecho: el motor no importa React (hay prueba) |
| RF-10 a RF-12, RNF-01 a RNF-03, RNF-05 | Sin empezar |
| Despliegue de prueba (fase 0) | Hecho el 2026-11-14: https://horce73.github.io/Hackaton-NASA-1411/ (GitHub Pages, lanzamiento manual) |
