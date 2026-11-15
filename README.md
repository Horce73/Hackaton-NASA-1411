# Misión Legado 
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
| RF-09 | Final de partida: misión con éxito o abortada, puntuación y bitácora con las historias desbloqueadas. Si se aborta por salud, la bitácora explica la causa con un caso real de la NASA. | 1, 3, 13 | M |
| RF-10 | Fotos desde la API de imágenes de la NASA, con imágenes estáticas de respaldo. | 1 | C |
| RF-11 | Efectos de sonido con Web Audio. | — | C |
| RF-12 | Guardar la última partida en `localStorage`. | — | C |
| RF-13 | Tripulación en 3D: un astronauta por tripulante; las teclas 1–4 eligen a quién mover y los demás siguen con su tarea. | 13 | S |
| RF-14 | Especialidades fijas (ingeniería, biología, geología, medicina): el especialista hace su tipo de tarea el doble de rápido. | 13 | S |
| RF-15 | Tareas del día en las estaciones, con aviso flotante y progreso. Cada opción pide 2 o 3 tareas que cuentan lo que significa; solo hace efecto si se terminan todas, y si no, se aplica la opción de riesgo del evento. Las del exterior piden 2 personas a la vez, como una caminata espacial. Cada día hay un muestreo geológico opcional que da ciencia. Día de 60 s, ajustable a ×2 o sin reloj. Al terminar, la tripulación entra y sale el resumen del día. Las opciones de quedarse dentro («Descansar», «Refugiarse en la base», «Esperar instrucciones», «Quedarse dentro») no piden tareas: la tripulación no sale y el día pasa al momento. | 3, 13 | S |
| RF-16 | Mantenimiento de cada módulo cada pocos días (los cultivos, a diario): si no se hace el día que toca, el módulo no rinde ese día. Comprar demasiados módulos sobrecarga a la tripulación. | 13 | S |
| RF-17 | Cuaderno de misión: cada equipo histórico guarda lo que midió su misión (dato y fuente). Al inspeccionarlo en 3D, la cámara se acerca y un diálogo negro lo cuenta; queda anotado. Un evento que explica una misión sin anotar muestra qué cambia cada opción, sin cifras, y con qué misión se midió; con la nota (o si es conocimiento general, o ya se vivió) se ven las cifras. | 1, 13 | S |

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

Tras la entrega del MVP, fases de jugabilidad (decididas el 2026-11-14, en la rama `feat/tripulacion-multitarea`):

| Fase | Resultado |
|---|---|
| 7. Documentos | RF-13 a RF-16 en el PRD, el TRD y el UX Brief. |
| 8. Motor | Tareas del día, especialidades y mantenimiento en `engine/`, con pruebas. |
| 9. 3D | Varios astronautas, selección con 1–4 y avisos flotantes con progreso. |
| 10. HUD y verificación | Barra de tripulación, lista de tareas, reloj y "Terminar día"; teclado, movimiento reducido y rendimiento. |

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
| **Asumido:** los 3 preajustes de partida solo rellenan destino, tripulación y duración (RF-01): Luna fácil 2 y 10 turnos, Luna difícil 4 y 14, Marte 3 y 10. El motor no tiene un campo de dificultad. | ¿Qué diferencia "Luna difícil" de "Luna fácil"? | Añadir `dificultad` a `Configuracion` y a `parametros.ts`. | Fase 2. |
| **Asumido:** Curiosity adelanta la alerta de radiación (avisa en ámbar) pero no cambia la dosis. | ¿Debe cambiar también la simulación (por ejemplo, menos dosis en tormenta solar)? | Aplicarlo en `engine/turno.ts`. | Balance (fase 6). |
| **Asumido:** no se puede usar la insignia de la NASA sin permiso (https://www.nasa.gov/nasa-brand-center/nasa-logo-use/); queda lista y apagada en el hábitat (`MOSTRAR_LOGO_NASA` en `src/three/modelos3d.ts`). | ¿La organización de Space Apps autoriza por escrito poner la insignia en el juego? | Copiar `RAW/logo nasa pe.png` a `public/img/logo-nasa.png` y poner el flag en `true`. | Nada: el juego funciona sin el logo. |
| **Asumido:** cada evento afecta solo al turno en que ocurre. | ¿Hacen falta eventos que duren varios días? | Añadir efectos activos con duración al `Estado`. | Fase 3. |

## Guion de demo (3 minutos)

Abrir con la semilla fija para que los eventos salgan siempre igual:
https://horce73.github.io/Hackaton-NASA-1411/?seed=12 (en local, `npm run dev` y `?seed=12`).
Recorrido comprobado en Chrome el 2026-11-14. Entre corchetes, el tiempo orientativo de cada paso (suma 3 min);
ajustarlo tras ensayar con cronómetro.

1. **[0:15] Inicio:** elegir la misión **Marte** y pulsar **Diseñar la base** (RF-01). Destino, astronautas y duración se cambian en **Personalizar**.
2. **[0:30] Diseño:** enseñar los créditos que quedan, la pestaña **Equipo NASA** con Curiosity y «Así aguantará tu base».
   Pulsar **Lanzar misión** (RF-02, RF-07).
3. **[0:15] Llegada:** amanecer con el Sol alineado sobre la antena, la fanfarria y cuánto dura un sol en Marte.
   **Empezar la misión**. La tripulación espera dentro.
4. **[0:30] Día 1, tormenta de polvo:** las opciones dicen qué cambian, sin cifras: esto se midió con Spirit y
   Opportunity, que no trajimos (RF-17). Elegir **Ahorrar energía**: se abre la compuerta («Abriendo la compuerta,
   Lucía») y la tripulación sale uno a uno. Sale el plan del día: reloj de
   60 s, dos tareas del plan (apagar sistemas en el hábitat y proteger los cultivos), el muestreo geológico opcional y
   los módulos a los que les toca revisión, con un aviso
   flotante sobre cada estación. Caminar con W hacia el hábitat y pulsar **E**: Lucía es ingeniera y trabaja el doble de
   rápido. Pulsar **2** y llevar a Marco, biólogo, al invernadero. **Terminar día**: la tripulación vuelve a entrar por
   la compuerta y sale el resumen del día; los módulos sin revisar no rinden. **Continuar** abre un dato curioso
   (Olympus Mons junto al Everest) y **Siguiente día** (RF-03, RF-04, RF-08, RF-13 a RF-17).
5. **[0:30] Día 2, tormenta solar:** el panel dice que esto se midió con Curiosity. Caminar hasta Curiosity (a la
   izquierda, detrás de la base) y pulsar **E**: la cámara se acerca y el diálogo cuenta lo que midió su instrumento RAD.
   **Anotar en el cuaderno**: ahora las opciones tienen cifras. Elegir **Seguir trabajando fuera** y **Terminar día**
   para mostrar el riesgo (RF-17).
6. **[0:35] Día 3:** abrir **Salud**: Curiosity avisa de la radiación antes de que sea peligrosa (RF-05).
   Opcional: pulsar **Explorar 3D [H]** y caminar con WASD hasta un equipo de la NASA.
7. **[0:35] Cierre:** **Abortar** y **Confirmar regreso** para abrir la bitácora con puntuación, tendencia e
   historias desbloqueadas (RF-06, RF-09).

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
| RF-08 | Hecho: tarjeta de historia (modal en partida y en bitácora) con imágenes WebP y textos; textos verificados por el equipo el 2026-11-14. Los equipos elegidos salen también como datos curiosos tras el resumen del día, junto a los diagramas del destino (textos nuevos con `verificada: false`) |
| RNF-04 | Hecho: el motor no importa React (hay prueba) |
| RF-11 | Hecho en el PR #2: efectos de sonido sintetizados con Web Audio (`src/audio/`) |
| RNF-01, RNF-02 | Hecho: sitio estático; datos, fuentes e imágenes van en el repo |
| RNF-03 | Hecho (fase 6): Lighthouse accesibilidad 100 en inicio; contrastes, teclado, foco y `prefers-reduced-motion` comprobados en Chrome, también en el 3D |
| RNF-05 | Hecho (fase 6): 69 kB comprimidos al arrancar; el 3D (149 kB) se descarga aparte. Lighthouse rendimiento 57 móvil / 65 escritorio, medido con gráficos por software |
| RF-12 | Hecho: la partida en curso se guarda en `localStorage` y el inicio ofrece "Continuar partida" |
| RF-10 | No se hace (decidido, TRD sección 13) |
| RF-13 a RF-16 | Hecho (fases 7 a 10): tripulación en 3D con selección 1–4, especialidades, tareas del día con avisos flotantes y reloj de 60 s (×2 o sin reloj), mantenimiento por módulo cada pocos días y muestreo diario del geólogo; el trabajo crece con la tripulación y con los días. Comprobado en Chrome; falta jugarlo con personas para ajustar tiempos |
| RF-17 | Hecho: cuaderno de misión con primer plano y diálogo al inspeccionar, una medición con fuente por misión (5 nuevas con `verificada: false`), riesgo sin cifras hasta tener la nota. 4 eventos nuevos (hielo en un cráter, polvo en los trajes, conjunción solar, remolino) con `verificada: false` hasta contrastarlos |
| Textos con fuente | Historias y avisos verificados por el equipo el 2026-11-14; `npm run test:entrega` pasa |
| Despliegue de prueba (fase 0) | Hecho el 2026-11-14: https://horce73.github.io/Hackaton-NASA-1411/ (GitHub Pages, lanzamiento manual) |
