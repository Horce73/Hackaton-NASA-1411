# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Jugadores de 8 a 14 años**, en navegador de escritorio o en el móvil (táctil, vertical y horizontal).
- **El jurado de la hackatón de la NASA**, que lo ve en una demo guiada de unos 3 minutos (guion en el README).

Las dos audiencias pesan igual: el juego debe entenderse sin explicación para un niño y ser creíble para el jurado.

## Product Purpose

Misión Legado es un juego educativo por turnos: el jugador elige una misión (Luna fácil, Luna difícil o Marte), diseña su base con un presupuesto de créditos y la mantiene viva día a día con su tripulación, en 3D y a pie. El éxito es terminar la misión con la tripulación sana y entender por qué cada decisión importa.

## Positioning

Dos cosas a la vez, con el mismo peso:

- **El legado de la NASA:** cada dato lleva su fuente, y lo que se aprendió en misiones reales (Apolo, Curiosity, Spirit y Opportunity…) da ventaja dentro del juego: el cuaderno de misión desbloquea las cifras de los eventos.
- **Una base 3D jugable:** construir y recorrer a pie tu propia base en la Luna o en Marte, con su gravedad real, módulos basados en conceptos de la NASA y una tripulación con especialidades.

## Operating Context

- Partidas de 10 a 20 días; cada día dura un minuto (ajustable a ×2 o sin reloj).
- Flujo: inicio → diseño de la base → llegada → días (decidir, trabajar en 3D, resumen, dato curioso) → bitácora final.
- Requisitos trazados como RF-xx / RNF-xx en el README y el TRD.

## Capabilities and Constraints

- React 18, Vite, TypeScript estricto, Tailwind v4, three.js; sin backend. Despliegue en GitHub Pages.
- Todo valor de balance es provisional y vive en `src/data/parametros.ts`.
- **No se usa la insignia ni el logo de la NASA, ni nada que los imite**, sin permiso escrito (hay una opción apagada en el código).
- **Ningún dato histórico o científico se inventa:** cada uno lleva su fuente y `verificada: false` hasta que el equipo lo revisa.

## Brand Commitments

- Nombre: **Misión Legado**. Idioma: español, para 8–14 años: frases cortas, sin tecnicismos sin explicar.
- Tono elegido por el usuario (2026-11-15): **centro de control de la NASA**, sobrio y preciso, sin dejar de ser apto para niños.

## Evidence on Hand

- Fotos de equipos históricos en `public/img/*.webp` (de la biblioteca de imágenes de la NASA) e ilustraciones de base y hábitat convertidas desde documentos de la NASA.
- Fuentes de cada dato en `src/data/` (historias, avisos, eventos, datos curiosos, llegada).
- No hay testimonios, usuarios reales ni métricas de uso: no deben inventarse.

## Product Principles

1. Primero jugar, luego leer: cada dato aparece cuando sirve para decidir.
2. Lo real da ventaja: lo que la NASA aprendió se nota en la partida.
3. Una decisión por pantalla para un niño de 8 años.
4. Lo que se ve en 3D es fiel a conceptos reales, con sus simplificaciones dichas.

## Accessibility & Inclusion

- Objetivos táctiles de al menos 44 px y juego completo en el móvil.
- Movimiento reducido respetado; lector de pantalla con etiquetas y anuncios de estado.
- Texto de al menos 12 px y contraste AA.
