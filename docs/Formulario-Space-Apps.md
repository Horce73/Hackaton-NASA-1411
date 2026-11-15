# Misión Legado: textos para el formulario de NASA Space Apps

Tres campos del formulario del proyecto, listos para copiar. Antes de enviar:

- **Uso de IA:** el texto declara que usamos Claude Code como asistente. Confirmad en las reglas de este año si hay que declararlo y dónde.
- **Versión publicada:** comprobad que la de GitHub Pages está al día con la última versión.
- **Enlaces:** abrid los enlaces antes de enviar. El formulario exige que todos sean públicos, también el repositorio de GitHub, y algunos datos siguen marcados en el código como pendientes de verificar (`verificada: false`).
- **Límite de caracteres:** si el campo «Detalles del proyecto» tiene límite, hay que acortar el texto.

---

## Detalles del proyecto

**Misión Legado** es un juego web educativo, para jóvenes de 8 a 14 años, en el que diseñas una base en la Luna o en Marte y la mantienes con vida usando lo que aprendieron las misiones reales de la NASA.

**¿Qué hace y cómo funciona?**
El jugador elige una misión (Luna fácil, Luna difícil o Marte) y diseña su base con un presupuesto limitado de créditos. Puede llevar paneles solares, un reactor, un invernadero, un reciclador de aire y agua, un refugio contra la radiación, un gimnasio, una zona de descanso y equipo histórico de la NASA, como el rover Curiosity, el retrorreflector del Apolo 11 o la Surveyor 3.

Después la misión avanza día a día. Cada día trae un evento: una tormenta solar, una tormenta de polvo, una avería, una fuga de agua… El jugador decide qué hacer y la tripulación lo ejecuta en 3D. Cada astronauta tiene una especialidad (ingeniería, biología, geología o medicina) y se mueve a pie con la gravedad real del destino para cumplir las tareas en los módulos. La simulación lleva la cuenta de la energía, el alimento, el oxígeno, el agua, la radiación y la salud de cada astronauta. Al final, una bitácora explica qué pasó y por qué.

**¿Qué beneficios tiene?**
- **Aprender jugando:** la ciencia no es decoración, da ventaja. El equipo histórico que se lleva a la misión desbloquea, en un cuaderno, lo que esa misión midió. Por ejemplo, Curiosity enseña cuánta radiación hay en Marte, y con ese dato el jugador decide mejor ante una tormenta solar.
- **Datos con fuente:** cada dato histórico o científico cita su fuente de la NASA, y el jugador puede abrirla.
- **Consecuencias realistas:** quien sale sin blindaje durante una tormenta solar ve subir la dosis de radiación, como habría ocurrido en la Luna con la tormenta de agosto de 1972.
- **Sin instalación:** funciona en el navegador de un ordenador o de un móvil, sin cuentas ni descargas.

**Impacto previsto**
Queremos que niños y jóvenes entiendan por qué una base espacial necesita cada sistema y qué sabemos gracias a cada misión. Es material para el aula o para casa: una misión dura de 10 a 20 días de juego, a un minuto por día, y entre días aparecen datos curiosos con diagramas, como los cráteres de la cara visible de la Luna, por qué vemos siempre la misma cara o el monte Olimpo.

**Herramientas y tecnología**
- **Aplicación web:** TypeScript, React 18 y Vite, con estilos en Tailwind CSS.
- **3D:** three.js. La base, la tripulación y los módulos están modelados en código a partir de conceptos e imágenes de la NASA: el hábitat de superficie del documento ASCEND, el panel solar vertical VSAT, el reactor de Fission Surface Power, el refugio de sacos de regolito del estudio Lunar Safe Haven y la Surveyor 3.
- **Sonido:** sintetizado con la Web Audio API, sin archivos de audio.
- **Calidad:** pruebas automáticas con Vitest sobre el motor de simulación.
- **Publicación:** GitHub Pages: https://horce73.github.io/Hackaton-NASA-1411/
- **Hardware:** solo ordenador y móvil; no hace falta ninguno especial.
- **Asistencia de IA:** Claude Code nos ayudó a programar y a revisar fuentes.

**¿Por qué es creativo?**
Une cuatro retos de la hackatón en un solo juego: diseñar la misión con un presupuesto («Diseña tu misión espacial»), gestionar la energía, el alimento, el agua, el oxígeno y la radiación («Astronautas junior»), cuidar la salud de cada astronauta («Salud en órbita») y descubrir la historia real del equipo de la NASA («Historias del espacio»). Lo histórico tiene un papel dentro del juego: el «legado» de la NASA es literalmente la ventaja del jugador. Cada día la tripulación sale por la compuerta y vuelve a entrar al terminar. Marte tiene su cielo caramelo con el halo azulado alrededor del Sol y, al fondo, el monte Olimpo.

**Factores que consideramos**
- **Rigor:** todo dato científico enlaza a su fuente de la NASA, y las simplificaciones del juego se dicen.
- **Público:** lenguaje claro para 8–14 años, con frases como «pesas 6 veces menos que en la Tierra» en vez de «1/6 g».
- **Accesibilidad:** botones de al menos 44 px, soporte de lector de pantalla y respeto del movimiento reducido.
- **Móvil:** controles táctiles y botón de pantalla completa.
- **Rendimiento:** debe funcionar en móviles modestos.
- **Imagen de marca:** no usamos el logotipo ni la insignia de la NASA.

---

## Datos de la NASA

Cada fila es un «Agregar nuevo enlace»: la primera columna va en «Texto del enlace» y la segunda en «Enlace URL».

| Texto del enlace | Enlace URL |
|---|---|
| NASA Image and Video Library (fotos de Apolo, Surveyor, Sojourner, Spirit, Opportunity, Curiosity y Perseverance) | https://images.nasa.gov/ |
| NASA Space Science Data Coordinated Archive (retrorreflector, ALSEP, Surveyor 3, vehículo lunar) | https://nssdc.gsfc.nasa.gov/ |
| Apollo Lunar Surface Journal | https://www.hq.nasa.gov/alsj/ |
| NASA Science: Moon Facts | https://science.nasa.gov/moon/facts/ |
| NASA Science: Mars Facts | https://science.nasa.gov/mars/facts/ |
| Radiation Measurements on Mars (RAD de Curiosity) | https://science.nasa.gov/resource/radiation-measurements-on-mars/ |
| OCHMO Technical Brief: Radiation Protection | https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf |
| Human Research Program: Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ |
| ISS Water Recovery Milestone | https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/ |
| Veggie | https://science.nasa.gov/mission/veggie/ |
| Internal Layout of a Lunar Surface Habitat (NTRS, ASCEND) | https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf |
| Lunar Safe Haven: refugio con sacos de regolito (NTRS) | https://ntrs.nasa.gov/api/citations/20210022066/downloads/Grande_Lunar%20Safe%20Haven_ASCEND%202021_Full_v2b.docx.pdf |
| Fission Surface Power | https://www.nasa.gov/exploration-systems-development-mission-directorate/fission-surface-power/ |
| Vertical Solar Array Technology (VSAT) | https://www.nasa.gov/technology/nasa-industry-to-mature-vertical-solar-array-technologies-for-lunar-surface/ |

---

## Socios de agencias espaciales y otros datos

No usamos datos de otras agencias espaciales. Estos son el código, las tipografías, las herramientas y las fuentes externas del proyecto; todos son de acceso público y de código abierto o de uso libre.

| Texto del enlace | Enlace URL |
|---|---|
| Código del proyecto (GitHub) | https://github.com/Horce73/Hackaton-NASA-1411 |
| React | https://react.dev/ |
| three.js (3D) | https://threejs.org/ |
| Vite | https://vite.dev/ |
| TypeScript | https://www.typescriptlang.org/ |
| Tailwind CSS | https://tailwindcss.com/ |
| Lucide (iconos) | https://lucide.dev/ |
| Vitest (pruebas) | https://vitest.dev/ |
| Tipografía Space Grotesk (SIL Open Font License) | https://fonts.google.com/specimen/Space+Grotesk |
| Tipografía Atkinson Hyperlegible (SIL Open Font License) | https://www.brailleinstitute.org/freefont/ |
| GitHub Pages (publicación) | https://pages.github.com/ |
| Claude Code (asistente de programación con IA) | https://claude.com/claude-code |
| Smithsonian: modelo a escala real del rover Sojourner (medidas del modelo 3D) | https://www.si.edu/object/mars-pathfinder-mini-rover-full-scale-model:nasm_A20020297000 |
| Planetary Data System, nodo de geociencias: experimento de viento solar del Apolo 12 | https://pds-geosciences.wustl.edu/Lunar/urn-nasa-pds-a12sws_solar_wind_28s_1hr/document/a12a_sws.txt |

---

## Anexo: todos los recursos de la NASA citados en el código

Solo si piden el detalle: los 61 recursos que cita el código, agrupados por tema.

### Imágenes del juego (biblioteca de imágenes de la NASA)

| Texto del enlace | Enlace URL |
|---|---|
| Foto del Apolo 11: Buzz Aldrin con los experimentos (AS11-40-5948) | https://images.nasa.gov/details/as11-40-5948 |
| Foto del Apolo 12: estación ALSEP (AS12-47-6919) | https://images.nasa.gov/details/as12-47-6919 |
| Foto del Apolo 12: Surveyor 3 (AS12-48-7133) | https://images.nasa.gov/details/AS12-48-7133 |
| Foto del Apolo 15: vehículo lunar (AS15-86-11603) | https://images.nasa.gov/details/as15-86-11603 |
| Rover Sojourner en Marte (PIA04318) | https://images.nasa.gov/details/PIA04318 |
| Ilustración de los rovers Spirit y Opportunity (PIA04239) | https://images.nasa.gov/details/PIA04239 |
| Autorretrato de Curiosity (PIA16764) | https://images.nasa.gov/details/PIA16764 |
| Perseverance e Ingenuity (PIA24542) | https://images.nasa.gov/details/PIA24542 |
| NASA Moonbase Solicitations (ilustración de base lunar) | https://www.nasa.gov/moonbase-solicitations/ |

### Misiones y equipo histórico

| Texto del enlace | Enlace URL |
|---|---|
| Retrorreflector láser del Apolo 11 (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=1969-059C-04 |
| The Apollo Experiment That Keeps on Giving | https://www.nasa.gov/missions/apollo/apollo-11/the-apollo-experiment-that-keeps-on-giving/ |
| ALSEP del Apolo 12 (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C |
| Lunar Roving Vehicle (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html |
| Apollo 17 Lunar Surface Journal: el guardabarros del rover | https://www.hq.nasa.gov/alsj/a17/A17NewFender.html |
| Surveyor 3 (NASA Science) | https://science.nasa.gov/mission/surveyor-3/ |
| Surveyor 3 (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A |
| Análisis de las piezas de la Surveyor 3 traídas por el Apolo 12 (NTRS) | https://ntrs.nasa.gov/citations/19710024418 |
| Mars Pathfinder | https://science.nasa.gov/mission/mars-pathfinder/ |
| Remolinos de polvo vistos por Mars Pathfinder (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/marspath/dustdevil.html |
| Mars Exploration Rovers: Spirit y Opportunity | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ |
| Spirit Gets Energy Boost From Cleaner Solar Panels (JPL) | https://www.jpl.nasa.gov/news/spirit-gets-energy-boost-from-cleaner-solar-panels/ |
| Mars Science Laboratory: Curiosity | https://science.nasa.gov/mission/msl-curiosity/ |
| Radiation Measurements on Mars (RAD de Curiosity) | https://science.nasa.gov/resource/radiation-measurements-on-mars/ |
| NASA Rover Results Include First Age Measurement on Mars | https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/ |
| Mars 2020: Perseverance | https://science.nasa.gov/mission/mars-2020-perseverance/ |
| Perseverance Extracts First Oxygen From Red Planet (MOXIE) | https://www.nasa.gov/news-release/nasas-perseverance-mars-rover-extracts-first-oxygen-from-red-planet/ |
| Mars 2020 Landing Quick Facts (JPL) | https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/quick_facts/ |
| LCROSS | https://science.nasa.gov/mission/lcross/ |
| Explorer 1 (JPL) | https://www.jpl.nasa.gov/missions/explorer-1/ |
| Apollo 13: The Successful Failure | https://www.nasa.gov/missions/apollo/apollo-13-the-successful-failure/ |
| Jumping Salute (Apolo 16) | https://moon.nasa.gov/resources/103/jumping-salute/ |

### Salud, soporte vital y radiación

| Texto del enlace | Enlace URL |
|---|---|
| OCHMO Technical Brief: Radiation Protection | https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf |
| OCHMO-TB-020: Radiation Protection | https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf |
| OCHMO-TB-002: ECLSS (soporte vital) | https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-002-eclss.pdf |
| Human Research Program: Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ |
| Human Research Roadmap: Food Evidence Report | https://humanresearchroadmap.nasa.gov/evidence/reports/food.pdf |
| Human Research Roadmap: Behavioral Medicine Evidence Report | https://humanresearchroadmap.nasa.gov/evidence/reports/BMed.pdf |
| Counteracting Bone and Muscle Loss in Microgravity | https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/ |
| Investigación MABL-A (pérdida ósea en microgravedad) | https://science.nasa.gov/biological-physical/investigations/mabl-a/ |
| NASA Achieves Water Recovery Milestone on the ISS | https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/ |
| Veggie | https://science.nasa.gov/mission/veggie/ |
| Veggie Success Benefits Journey to Mars (Kennedy blog) | https://blogs.nasa.gov/kennedy/2015/08/11/veggie-success-benefits-journey-to-mars-and-eaters-on-earth/ |
| 20 años de caminatas espaciales en la Estación Espacial | https://www.nasa.gov/history/space-station-20th-spacewalking-history/ |
| Informe OIG IG-20-005: mantenimiento de la ISS | https://oig.nasa.gov/wp-content/uploads/2024/02/IG-20-005.pdf |
| Informe sobre el polvo lunar en las misiones Apolo (NTRS) | https://ntrs.nasa.gov/citations/20050160460 |

### Base, hábitat y módulos

| Texto del enlace | Enlace URL |
|---|---|
| Internal Layout of a Lunar Surface Habitat (NTRS, ASCEND) | https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf |
| Lunar Safe Haven: refugio con sacos de regolito (NTRS) | https://ntrs.nasa.gov/api/citations/20210022066/downloads/Grande_Lunar%20Safe%20Haven_ASCEND%202021_Full_v2b.docx.pdf |
| Vertical Solar Array Technology (VSAT) | https://www.nasa.gov/technology/nasa-industry-to-mature-vertical-solar-array-technologies-for-lunar-surface/ |
| Fission Surface Power | https://www.nasa.gov/exploration-systems-development-mission-directorate/fission-surface-power/ |
| A Deployable 40 kWe Lunar Fission Surface Power Concept (NTRS) | https://ntrs.nasa.gov/citations/20220004670 |
| Lunar, Martian Greenhouses Designed to Mimic Those on Earth | https://www.nasa.gov/science-research/lunar-martian-greenhouses-designed-to-mimic-those-on-earth/ |

### La Luna, Marte y datos curiosos

| Texto del enlace | Enlace URL |
|---|---|
| Moon Facts | https://science.nasa.gov/moon/facts/ |
| Tidal Locking (por qué vemos una sola cara) | https://science.nasa.gov/moon/tidal-locking/ |
| Lunar Length of Day (NTRS) | https://ntrs.nasa.gov/api/citations/20205008686/downloads/Caitlin_Lunar%20Length%20of%20Day_paper.pdf |
| Why Do Eclipses Happen? | https://science.nasa.gov/eclipses/geometry/ |
| Mars Facts | https://science.nasa.gov/mars/facts/ |
| Phobos | https://science.nasa.gov/mars/moons/phobos/ |
| Hubble Sees Martian Moon Orbiting the Red Planet | https://science.nasa.gov/solar-system/planets/mars/nasas-hubble-sees-martian-moon-orbiting-the-red-planet/ |
| Curiosity Rover Views Serene Sundown on Mars (JPL) | https://www.jpl.nasa.gov/news/nasas-curiosity-rover-views-serene-sundown-on-mars/ |
| 10 Things: Massive Dust Storm on Mars | https://science.nasa.gov/solar-system/planets/mars/10-things-massive-dust-storm-on-mars/ |
| What's Mars Solar Conjunction | https://www.nasa.gov/solar-system/whats-mars-solar-conjunction-and-why-does-it-matter/ |
