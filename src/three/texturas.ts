import * as THREE from 'three';
import type { Destino } from '../engine/tipos';

export interface ConjuntoTexturas {
  terrenoAlbedo: THREE.CanvasTexture;
  terrenoNormal: THREE.CanvasTexture;
  terrenoRoughness: THREE.CanvasTexture;
  rocaAlbedo: THREE.CanvasTexture;
  rocaNormal: THREE.CanvasTexture;
  rocaRoughness: THREE.CanvasTexture;
  metalHullAlbedo: THREE.CanvasTexture;
  metalHullNormal: THREE.CanvasTexture;
  metalHullRoughness: THREE.CanvasTexture;
  trajeAlbedo: THREE.CanvasTexture;
  trajeNormal: THREE.CanvasTexture;
  pecheraAlbedo: THREE.CanvasTexture;
  acentoAlbedo: THREE.CanvasTexture;
  acentoNormal: THREE.CanvasTexture;
  panelSolarAlbedo: THREE.CanvasTexture;
  panelSolarNormal: THREE.CanvasTexture;
  panelSolarRoughness: THREE.CanvasTexture;
  foilDoradoAlbedo: THREE.CanvasTexture;
  foilDoradoNormal: THREE.CanvasTexture;
  foilDoradoRoughness: THREE.CanvasTexture;
  esclusaAlbedo: THREE.CanvasTexture;
  esclusaNormal: THREE.CanvasTexture;
  esclusaEmissive: THREE.CanvasTexture;
  cultivoAlbedo: THREE.CanvasTexture;
  cultivoNormal: THREE.CanvasTexture;
  tierraAlbedo: THREE.CanvasTexture;
  tierraRoughness: THREE.CanvasTexture;
  fobosAlbedo: THREE.CanvasTexture;
  fobosNormal: THREE.CanvasTexture;
  sombraContacto: THREE.CanvasTexture;
  dispose: () => void;
}

function pseudoRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function crearCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

/**
 * Convierte un mapa de alturas en escala de grises (canal R) en un Normal Map tangent-space
 * mediante operador Sobel envuelto (seamless tiling).
 */
function generarNormalDesdeAltura(
  alturaCanvas: HTMLCanvasElement,
  fuerza: number,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const w = alturaCanvas.width;
  const h = alturaCanvas.height;
  const ctxSrc = alturaCanvas.getContext('2d')!;
  const src = ctxSrc.getImageData(0, 0, w, h).data;

  const [outCanvas, ctxOut] = crearCanvas(w, h);
  const dstImg = ctxOut.createImageData(w, h);
  const dst = dstImg.data;

  const sample = (x: number, y: number) => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = tr + 2 * r + br - (tl + 2 * l + bl);
      const dY = bl + 2 * b + br - (tl + 2 * t + tr);

      let nx = -dX * fuerza;
      let ny = -dY * fuerza;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }

  ctxOut.putImageData(dstImg, 0, 0);
  const tex = new THREE.CanvasTexture(outCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

function configurarTextura(
  canvas: HTMLCanvasElement,
  esColor: boolean,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (esColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

export function crearConjuntoTexturas(destino: Destino, maxAnisotropy: number): ConjuntoTexturas {
  const rand = pseudoRand(destino === 'luna' ? 101 : 202);
  const todas: THREE.Texture[] = [];
  const registrar = <T extends THREE.Texture>(t: T): T => {
    todas.push(t);
    return t;
  };

  // =========================================================================
  // 1. TERRENO PLANETARIO (512x512 Albedo + Normal + Roughness)
  // =========================================================================
  const T_SIZE = 512;
  const [cTerrA, ctxTA] = crearCanvas(T_SIZE, T_SIZE);
  const [cTerrH, ctxTH] = crearCanvas(T_SIZE, T_SIZE);
  const [cTerrR, ctxTR] = crearCanvas(T_SIZE, T_SIZE);

  // Marte: regolito ocre rojizo por el óxido de hierro del polvo (https://science.nasa.gov/mars/facts/).
  ctxTA.fillStyle = destino === 'luna' ? '#6c727f' : '#a55e3a';
  ctxTA.fillRect(0, 0, T_SIZE, T_SIZE);
  ctxTH.fillStyle = '#808080';
  ctxTH.fillRect(0, 0, T_SIZE, T_SIZE);
  ctxTR.fillStyle = destino === 'luna' ? '#e8e8e8' : '#dcdcdc';
  ctxTR.fillRect(0, 0, T_SIZE, T_SIZE);

  // Parches amplios de variación mineral (tileable en bordes)
  for (let i = 0; i < 65; i++) {
    const x = rand() * T_SIZE;
    const y = rand() * T_SIZE;
    const r = 26 + rand() * 55;
    const claro = rand() > 0.5;
    const colA =
      destino === 'luna'
        ? claro
          ? 'rgba(170,178,194,0.12)'
          : 'rgba(46,50,60,0.14)'
        : claro
          ? 'rgba(216,152,106,0.16)'
          : 'rgba(96,46,28,0.18)';
    const colH = claro ? 'rgba(180,180,180,0.12)' : 'rgba(75,75,75,0.12)';

    for (const ox of [-T_SIZE, 0, T_SIZE]) {
      for (const oy of [-T_SIZE, 0, T_SIZE]) {
        if (x + ox + r < 0 || x + ox - r > T_SIZE || y + oy + r < 0 || y + oy - r > T_SIZE) continue;
        ctxTA.fillStyle = colA;
        ctxTA.beginPath();
        ctxTA.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctxTA.fill();

        ctxTH.fillStyle = colH;
        ctxTH.beginPath();
        ctxTH.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctxTH.fill();
      }
    }
  }

  // Grano fino y guijarros de regolito
  for (let i = 0; i < 6500; i++) {
    const x = rand() * T_SIZE;
    const y = rand() * T_SIZE;
    const r = 0.8 + rand() * 2.8;
    const tipo = rand();
    if (destino === 'luna') {
      ctxTA.fillStyle =
        tipo > 0.65
          ? 'rgba(216,222,235,0.22)'
          : tipo > 0.3
            ? 'rgba(54,58,68,0.24)'
            : 'rgba(130,136,150,0.18)';
    } else {
      ctxTA.fillStyle =
        tipo > 0.65
          ? 'rgba(226,136,92,0.22)'
          : tipo > 0.3
            ? 'rgba(84,32,18,0.24)'
            : 'rgba(170,84,48,0.2)';
    }
    ctxTA.beginPath();
    ctxTA.arc(x, y, r, 0, Math.PI * 2);
    ctxTA.fill();

    ctxTH.fillStyle = tipo > 0.5 ? 'rgba(220,220,220,0.28)' : 'rgba(42,42,42,0.28)';
    ctxTH.beginPath();
    ctxTH.arc(x, y, r, 0, Math.PI * 2);
    ctxTH.fill();

    if (tipo > 0.85) {
      // Pequeños cristales/piedras ligeramente menos rugosas
      ctxTR.fillStyle = 'rgba(165,165,165,0.35)';
      ctxTR.fillRect(x, y, r * 1.3, r * 1.3);
    }
  }

  if (destino === 'marte') {
    // Ondas de arena: crestas claras y senos oscuros, periódicas en X y repetidas en Y para que la textura no tenga
    // costuras.
    for (let fila = 0; fila < 14; fila++) {
      const y0 = (fila / 14) * T_SIZE + rand() * 8;
      const fase = rand() * Math.PI * 2;
      for (const oy of [-T_SIZE, 0, T_SIZE]) {
        for (const [desplazamiento, colorA, colorH, ancho] of [
          [0, 'rgba(100,46,26,0.2)', 'rgba(60,60,60,0.25)', 3],
          [-3, 'rgba(226,166,118,0.16)', 'rgba(205,205,205,0.25)', 2],
        ] as const) {
          ctxTA.strokeStyle = colorA;
          ctxTH.strokeStyle = colorH;
          ctxTA.lineWidth = ctxTH.lineWidth = ancho;
          ctxTA.beginPath();
          ctxTH.beginPath();
          for (let x = 0; x <= T_SIZE; x += 4) {
            const y = y0 + oy + desplazamiento + 5 * Math.sin((x / T_SIZE) * Math.PI * 2 * 3 + fase);
            if (x === 0) {
              ctxTA.moveTo(x, y);
              ctxTH.moveTo(x, y);
            } else {
              ctxTA.lineTo(x, y);
              ctxTH.lineTo(x, y);
            }
          }
          ctxTA.stroke();
          ctxTH.stroke();
        }
      }
    }
    // Guijarros de basalto oscuro, a medio cubrir de polvo.
    for (let i = 0; i < 900; i++) {
      const x = rand() * T_SIZE;
      const y = rand() * T_SIZE;
      const r = 1.2 + rand() * 2.6;
      ctxTA.fillStyle = rand() > 0.35 ? 'rgba(62,48,42,0.55)' : 'rgba(118,82,64,0.5)';
      ctxTA.beginPath();
      ctxTA.ellipse(x, y, r * 1.3, r, rand() * Math.PI, 0, Math.PI * 2);
      ctxTA.fill();
      ctxTH.fillStyle = 'rgba(230,230,230,0.45)';
      ctxTH.beginPath();
      ctxTH.arc(x, y, r, 0, Math.PI * 2);
      ctxTH.fill();
    }
  }

  // Microcráteres con borde elevado y sombra interna. En Marte, el viento y el polvo borran casi todos los pequeños.
  for (let i = 0; i < (destino === 'luna' ? 42 : 10); i++) {
    const x = rand() * T_SIZE;
    const y = rand() * T_SIZE;
    const r = 6 + rand() * 22;

    for (const ox of [-T_SIZE, 0, T_SIZE]) {
      for (const oy of [-T_SIZE, 0, T_SIZE]) {
        const cx = x + ox;
        const cy = y + oy;
        if (cx + r < 0 || cx - r > T_SIZE || cy + r < 0 || cy - r > T_SIZE) continue;

        const gH = ctxTH.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        gH.addColorStop(0, 'rgba(25,25,25,0.65)');
        gH.addColorStop(0.68, 'rgba(90,90,90,0.3)');
        gH.addColorStop(0.88, 'rgba(235,235,235,0.48)');
        gH.addColorStop(1, 'rgba(128,128,128,0)');
        ctxTH.fillStyle = gH;
        ctxTH.beginPath();
        ctxTH.arc(cx, cy, r, 0, Math.PI * 2);
        ctxTH.fill();

        const gA = ctxTA.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        gA.addColorStop(0, destino === 'luna' ? 'rgba(38,42,52,0.28)' : 'rgba(72,26,14,0.32)');
        gA.addColorStop(0.85, destino === 'luna' ? 'rgba(182,190,206,0.16)' : 'rgba(218,122,82,0.16)');
        gA.addColorStop(1, 'rgba(0,0,0,0)');
        ctxTA.fillStyle = gA;
        ctxTA.beginPath();
        ctxTA.arc(cx, cy, r, 0, Math.PI * 2);
        ctxTA.fill();
      }
    }
  }

  const terrenoAlbedo = registrar(configurarTextura(cTerrA, true, maxAnisotropy, 20, 20));
  const terrenoNormal = registrar(generarNormalDesdeAltura(cTerrH, 2.2, maxAnisotropy, 20, 20));
  const terrenoRoughness = registrar(configurarTextura(cTerrR, false, maxAnisotropy, 20, 20));

  // =========================================================================
  // 2. ROCAS BASÁLTICAS / MARCIANAS (256x256 Albedo + Normal + Roughness)
  // =========================================================================
  const [cRocA, ctxRA] = crearCanvas(256, 256);
  const [cRocH, ctxRH] = crearCanvas(256, 256);
  const [cRocR, ctxRR] = crearCanvas(256, 256);

  ctxRA.fillStyle = destino === 'luna' ? '#585f6d' : '#7b3924';
  ctxRA.fillRect(0, 0, 256, 256);
  ctxRH.fillStyle = '#808080';
  ctxRH.fillRect(0, 0, 256, 256);
  ctxRR.fillStyle = '#dcdcdc';
  ctxRR.fillRect(0, 0, 256, 256);

  // Estratos y vetas minerales
  for (let i = 0; i < 45; i++) {
    const y = rand() * 256;
    const h = 2 + rand() * 8;
    ctxRA.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(15,15,20,0.18)';
    ctxRA.fillRect(0, y, 256, h);
    ctxRH.fillStyle = rand() > 0.5 ? 'rgba(210,210,210,0.22)' : 'rgba(50,50,50,0.25)';
    ctxRH.fillRect(0, y, 256, h);
  }
  // Grietas y poros volcánicos
  for (let i = 0; i < 80; i++) {
    const x1 = rand() * 256;
    const y1 = rand() * 256;
    const x2 = x1 + (rand() - 0.5) * 60;
    const y2 = y1 + (rand() - 0.5) * 40;
    ctxRH.strokeStyle = 'rgba(20,20,20,0.55)';
    ctxRH.lineWidth = 1 + rand() * 2;
    ctxRH.beginPath();
    ctxRH.moveTo(x1, y1);
    ctxRH.lineTo(x2, y2);
    ctxRH.stroke();

    ctxRA.strokeStyle = 'rgba(20,16,18,0.32)';
    ctxRA.lineWidth = 1.5;
    ctxRA.beginPath();
    ctxRA.moveTo(x1, y1);
    ctxRA.lineTo(x2, y2);
    ctxRA.stroke();
  }
  for (let i = 0; i < 900; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const s = 1 + rand() * 2.5;
    ctxRA.fillStyle = rand() > 0.7 ? 'rgba(220,225,235,0.15)' : 'rgba(25,25,30,0.18)';
    ctxRA.fillRect(x, y, s, s);
    if (rand() > 0.8) {
      ctxRR.fillStyle = 'rgba(140,140,140,0.4)';
      ctxRR.fillRect(x, y, s, s);
    }
  }

  const rocaAlbedo = registrar(configurarTextura(cRocA, true, maxAnisotropy, 1, 1));
  const rocaNormal = registrar(generarNormalDesdeAltura(cRocH, 2.8, maxAnisotropy, 1, 1));
  const rocaRoughness = registrar(configurarTextura(cRocR, false, maxAnisotropy, 1, 1));

  // =========================================================================
  // 3. FUSELAJE METÁLICO AEROESPACIAL (512x512 Albedo + Normal + Roughness)
  // =========================================================================
  const [cMetA, ctxMA] = crearCanvas(512, 512);
  const [cMetH, ctxMH] = crearCanvas(512, 512);
  const [cMetR, ctxMR] = crearCanvas(512, 512);

  ctxMA.fillStyle = '#cfd8ea';
  ctxMA.fillRect(0, 0, 512, 512);
  ctxMH.fillStyle = '#909090';
  ctxMH.fillRect(0, 0, 512, 512);
  ctxMR.fillStyle = '#686868';
  ctxMR.fillRect(0, 0, 512, 512);

  // Grano cepillado horizontal
  for (let i = 0; i < 900; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const w = 18 + rand() * 64;
    ctxMA.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(90,104,130,0.06)';
    ctxMA.fillRect(x, y, w, 1.5);
    ctxMR.fillStyle = rand() > 0.5 ? 'rgba(140,140,140,0.18)' : 'rgba(75,75,75,0.18)';
    ctxMR.fillRect(x, y, w, 1.5);
  }

  // Cuadrícula de planchas con costuras y remaches
  const paso = 128;
  for (let gx = 0; gx < 512; gx += paso) {
    for (let gy = 0; gy < 512; gy += paso) {
      // Variación sutil por panel
      ctxMA.fillStyle = ((gx + gy) / paso) % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(40,54,82,0.05)';
      ctxMA.fillRect(gx + 2, gy + 2, paso - 4, paso - 4);

      // Ranura del panel
      ctxMH.strokeStyle = '#2a2a2a';
      ctxMH.lineWidth = 3;
      ctxMH.strokeRect(gx + 1, gy + 1, paso - 2, paso - 2);

      ctxMA.strokeStyle = 'rgba(72,84,112,0.55)';
      ctxMA.lineWidth = 2;
      ctxMA.strokeRect(gx + 1, gy + 1, paso - 2, paso - 2);

      ctxMR.strokeStyle = '#c8c8c8';
      ctxMR.lineWidth = 3;
      ctxMR.strokeRect(gx + 1, gy + 1, paso - 2, paso - 2);

      // Remaches en los bordes de cada placa
      for (let rx = gx + 12; rx < gx + paso - 8; rx += 26) {
        for (const ry of [gy + 10, gy + paso - 10]) {
          ctxMH.fillStyle = '#e5e5e5';
          ctxMH.beginPath();
          ctxMH.arc(rx, ry, 2.2, 0, Math.PI * 2);
          ctxMH.fill();

          ctxMA.fillStyle = 'rgba(110,124,150,0.55)';
          ctxMA.beginPath();
          ctxMA.arc(rx, ry, 2.0, 0, Math.PI * 2);
          ctxMA.fill();
        }
      }
    }
  }

  // Bandas sutiles de identificación técnica
  ctxMA.fillStyle = 'rgba(226,103,74,0.82)';
  ctxMA.fillRect(0, 240, 512, 12);
  ctxMA.fillStyle = 'rgba(40,52,78,0.65)';
  ctxMA.fillRect(0, 254, 512, 5);

  const metalHullAlbedo = registrar(configurarTextura(cMetA, true, maxAnisotropy, 1, 1));
  const metalHullNormal = registrar(generarNormalDesdeAltura(cMetH, 2.0, maxAnisotropy, 1, 1));
  const metalHullRoughness = registrar(configurarTextura(cMetR, false, maxAnisotropy, 1, 1));

  // =========================================================================
  // 4. TRAJE ESPACIAL TEJIDO BETA-CLOTH + PECHERA DE TELEMETRÍA (256x256)
  // =========================================================================
  const [cTraA, ctxTrA] = crearCanvas(256, 256);
  const [cTraH, ctxTrH] = crearCanvas(256, 256);
  ctxTrA.fillStyle = '#eef2fa';
  ctxTrA.fillRect(0, 0, 256, 256);
  ctxTrH.fillStyle = '#808080';
  ctxTrH.fillRect(0, 0, 256, 256);

  // Tejido ripstop y acolchado térmico
  ctxTrA.strokeStyle = 'rgba(170,182,208,0.35)';
  ctxTrH.strokeStyle = 'rgba(55,55,55,0.45)';
  ctxTrA.lineWidth = 1;
  ctxTrH.lineWidth = 1.2;
  for (let i = 0; i <= 256; i += 8) {
    ctxTrA.beginPath();
    ctxTrA.moveTo(i, 0);
    ctxTrA.lineTo(i, 256);
    ctxTrA.stroke();
    ctxTrA.beginPath();
    ctxTrA.moveTo(0, i);
    ctxTrA.lineTo(256, i);
    ctxTrA.stroke();

    ctxTrH.beginPath();
    ctxTrH.moveTo(i, 0);
    ctxTrH.lineTo(i, 256);
    ctxTrH.stroke();
    ctxTrH.beginPath();
    ctxTrH.moveTo(0, i);
    ctxTrH.lineTo(256, i);
    ctxTrH.stroke();
  }
  // Costuras acolchadas diagonales
  ctxTrH.strokeStyle = 'rgba(215,215,215,0.45)';
  ctxTrH.lineWidth = 2;
  for (let i = -256; i < 512; i += 48) {
    ctxTrH.beginPath();
    ctxTrH.moveTo(i, 0);
    ctxTrH.lineTo(i + 256, 256);
    ctxTrH.stroke();
  }
  // Polvo lunar/marciano sutil adherido al tejido
  for (let i = 0; i < 450; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    ctxTrA.fillStyle = destino === 'luna' ? 'rgba(105,112,125,0.1)' : 'rgba(155,78,48,0.12)';
    ctxTrA.fillRect(x, y, 2, 2);
  }

  const trajeAlbedo = registrar(configurarTextura(cTraA, true, maxAnisotropy, 2, 2));
  const trajeNormal = registrar(generarNormalDesdeAltura(cTraH, 1.8, maxAnisotropy, 2, 2));

  // Pechera DCM del astronauta
  const [cPec, ctxP] = crearCanvas(256, 256);
  ctxP.fillStyle = '#2b344b';
  ctxP.fillRect(0, 0, 256, 256);
  ctxP.strokeStyle = '#9aa8c7';
  ctxP.lineWidth = 6;
  ctxP.strokeRect(8, 8, 240, 240);
  ctxP.fillStyle = '#0f172a';
  ctxP.fillRect(26, 28, 204, 82);
  ctxP.fillStyle = '#4cd7a1';
  ctxP.fillRect(38, 44, 90, 14);
  ctxP.fillStyle = '#38bdf8';
  ctxP.fillRect(38, 68, 140, 10);
  ctxP.fillStyle = '#f5b942';
  ctxP.fillRect(38, 86, 65, 10);
  // Válvulas y conectores rojo/azul
  ctxP.fillStyle = '#e2674a';
  ctxP.beginPath();
  ctxP.arc(70, 175, 24, 0, Math.PI * 2);
  ctxP.fill();
  ctxP.fillStyle = '#38bdf8';
  ctxP.beginPath();
  ctxP.arc(185, 175, 24, 0, Math.PI * 2);
  ctxP.fill();
  ctxP.fillStyle = '#cbd5e1';
  ctxP.fillRect(114, 152, 28, 46);
  const pecheraAlbedo = registrar(configurarTextura(cPec, true, maxAnisotropy, 1, 1));

  // =========================================================================
  // 5. ACENTO AEROESPACIAL ANODIZADO + CINTAS DE SEGURIDAD (256x256)
  // =========================================================================
  const [cAceA, ctxAA] = crearCanvas(256, 256);
  const [cAceH, ctxAH] = crearCanvas(256, 256);
  ctxAA.fillStyle = '#de6547';
  ctxAA.fillRect(0, 0, 256, 256);
  ctxAH.fillStyle = '#888888';
  ctxAH.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 64; i += 16) {
    ctxAA.fillStyle = 'rgba(255,255,255,0.08)';
    ctxAA.fillRect(0, i * 4, 256, 6);
  }
  ctxAH.strokeStyle = '#303030';
  ctxAH.lineWidth = 3;
  ctxAH.strokeRect(4, 4, 248, 248);
  ctxAH.strokeRect(4, 128, 248, 124);
  for (let p = 20; p < 245; p += 36) {
    ctxAH.fillStyle = '#e8e8e8';
    ctxAH.beginPath();
    ctxAH.arc(p, 16, 2.5, 0, Math.PI * 2);
    ctxAH.arc(p, 240, 2.5, 0, Math.PI * 2);
    ctxAH.fill();
  }
  const acentoAlbedo = registrar(configurarTextura(cAceA, true, maxAnisotropy, 1, 1));
  const acentoNormal = registrar(generarNormalDesdeAltura(cAceH, 2.0, maxAnisotropy, 1, 1));

  // =========================================================================
  // 6. PANEL SOLAR FOTOVOLTAICO (512x512 Albedo + Normal + Roughness)
  // =========================================================================
  const [cSolA, ctxSA] = crearCanvas(512, 512);
  const [cSolH, ctxSH] = crearCanvas(512, 512);
  const [cSolR, ctxSR] = crearCanvas(512, 512);

  ctxSA.fillStyle = '#0e1c42';
  ctxSA.fillRect(0, 0, 512, 512);
  ctxSH.fillStyle = '#909090';
  ctxSH.fillRect(0, 0, 512, 512);
  ctxSR.fillStyle = '#242424'; // Silicio muy brillante
  ctxSR.fillRect(0, 0, 512, 512);

  // Células individuales con reflejo azulado y micro-conductores
  const celW = 64;
  const celH = 128;
  for (let cx = 0; cx < 512; cx += celW) {
    for (let cy = 0; cy < 512; cy += celH) {
      const grad = ctxSA.createLinearGradient(cx, cy, cx + celW, cy + celH);
      grad.addColorStop(0, '#132a63');
      grad.addColorStop(0.5, '#1b3e8c');
      grad.addColorStop(1, '#10214d');
      ctxSA.fillStyle = grad;
      ctxSA.fillRect(cx + 3, cy + 3, celW - 6, celH - 6);

      // Micro-líneas de contacto dentro de la célula
      ctxSA.strokeStyle = 'rgba(130,175,235,0.3)';
      ctxSA.lineWidth = 1;
      for (let my = cy + 16; my < cy + celH - 8; my += 16) {
        ctxSA.beginPath();
        ctxSA.moveTo(cx + 5, my);
        ctxSA.lineTo(cx + celW - 5, my);
        ctxSA.stroke();
      }

      // Marco plateado entre células
      ctxSA.strokeStyle = '#9cbdf0';
      ctxSA.lineWidth = 3;
      ctxSA.strokeRect(cx + 1.5, cy + 1.5, celW - 3, celH - 3);

      ctxSH.strokeStyle = '#303030';
      ctxSH.lineWidth = 4;
      ctxSH.strokeRect(cx + 1.5, cy + 1.5, celW - 3, celH - 3);

      ctxSR.strokeStyle = '#b0b0b0';
      ctxSR.lineWidth = 4;
      ctxSR.strokeRect(cx + 1.5, cy + 1.5, celW - 3, celH - 3);
    }
  }
  // Busbar central plateado
  ctxSA.fillStyle = '#b9d1f6';
  ctxSA.fillRect(253, 0, 6, 512);
  ctxSA.fillRect(0, 253, 512, 6);

  const panelSolarAlbedo = registrar(configurarTextura(cSolA, true, maxAnisotropy, 1, 1));
  const panelSolarNormal = registrar(generarNormalDesdeAltura(cSolH, 2.2, maxAnisotropy, 1, 1));
  const panelSolarRoughness = registrar(configurarTextura(cSolR, false, maxAnisotropy, 1, 1));

  // =========================================================================
  // 7. FOIL DORADO KAPTON MLI (512x512 Albedo + Normal + Roughness)
  // =========================================================================
  const [cFoilA, ctxFA] = crearCanvas(512, 512);
  const [cFoilH, ctxFH] = crearCanvas(512, 512);
  const [cFoilR, ctxFR] = crearCanvas(512, 512);

  ctxFA.fillStyle = '#d49424';
  ctxFA.fillRect(0, 0, 512, 512);
  ctxFH.fillStyle = '#808080';
  ctxFH.fillRect(0, 0, 512, 512);
  ctxFR.fillStyle = '#404040';
  ctxFR.fillRect(0, 0, 512, 512);

  // Facetas arrugadas de manta térmica MLI
  for (let i = 0; i < 320; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const w = 18 + rand() * 52;
    const h = 14 + rand() * 44;
    const tono = rand();

    ctxFA.save();
    ctxFA.translate(x, y);
    ctxFA.rotate(rand() * Math.PI);
    ctxFA.fillStyle =
      tono > 0.55
        ? 'rgba(255,222,115,0.28)'
        : tono > 0.25
          ? 'rgba(182,115,16,0.25)'
          : 'rgba(110,64,8,0.22)';
    ctxFA.beginPath();
    ctxFA.moveTo(-w / 2, 0);
    ctxFA.lineTo(0, -h / 2);
    ctxFA.lineTo(w / 2, 0);
    ctxFA.lineTo(0, h / 2);
    ctxFA.closePath();
    ctxFA.fill();
    ctxFA.restore();

    ctxFH.save();
    ctxFH.translate(x, y);
    ctxFH.rotate(rand() * Math.PI);
    ctxFH.fillStyle = tono > 0.5 ? 'rgba(235,235,235,0.38)' : 'rgba(35,35,35,0.38)';
    ctxFH.beginPath();
    ctxFH.moveTo(-w / 2, 0);
    ctxFH.lineTo(0, -h / 2);
    ctxFH.lineTo(w / 2, 0);
    ctxFH.lineTo(0, h / 2);
    ctxFH.closePath();
    ctxFH.fill();
    ctxFH.restore();
  }
  // Pliegues rectos y costuras de Kapton
  for (let i = 0; i < 160; i++) {
    const x1 = rand() * 512;
    const y1 = rand() * 512;
    const x2 = x1 + (rand() - 0.5) * 90;
    const y2 = y1 + (rand() - 0.5) * 90;
    ctxFH.strokeStyle = rand() > 0.5 ? 'rgba(250,250,250,0.65)' : 'rgba(20,20,20,0.65)';
    ctxFH.lineWidth = 2;
    ctxFH.beginPath();
    ctxFH.moveTo(x1, y1);
    ctxFH.lineTo(x2, y2);
    ctxFH.stroke();

    ctxFR.strokeStyle = rand() > 0.5 ? 'rgba(95,95,95,0.5)' : 'rgba(25,25,25,0.5)';
    ctxFR.lineWidth = 2;
    ctxFR.beginPath();
    ctxFR.moveTo(x1, y1);
    ctxFR.lineTo(x2, y2);
    ctxFR.stroke();
  }

  const foilDoradoAlbedo = registrar(configurarTextura(cFoilA, true, maxAnisotropy, 1, 1));
  const foilDoradoNormal = registrar(generarNormalDesdeAltura(cFoilH, 2.8, maxAnisotropy, 1, 1));
  const foilDoradoRoughness = registrar(configurarTextura(cFoilR, false, maxAnisotropy, 1, 1));

  // =========================================================================
  // 8. COMPUERTA DE ESCLUSA PRESURIZADA (256x256 Albedo + Normal + Emissive)
  // =========================================================================
  const [cEscA, ctxEA] = crearCanvas(256, 256);
  const [cEscH, ctxEH] = crearCanvas(256, 256);
  const [cEscE, ctxEE] = crearCanvas(256, 256);

  ctxEA.fillStyle = '#a8b4cc';
  ctxEA.fillRect(0, 0, 256, 256);
  ctxEH.fillStyle = '#909090';
  ctxEH.fillRect(0, 0, 256, 256);
  ctxEE.fillStyle = '#000000';
  ctxEE.fillRect(0, 0, 256, 256);

  // Marco y nervaduras de la escotilla
  ctxEA.strokeStyle = '#38435e';
  ctxEA.lineWidth = 14;
  ctxEA.strokeRect(10, 10, 236, 236);
  ctxEH.strokeStyle = '#e0e0e0';
  ctxEH.lineWidth = 14;
  ctxEH.strokeRect(10, 10, 236, 236);

  // Bandas de precaución inferior
  for (let x = 18; x < 238; x += 28) {
    ctxEA.fillStyle = '#e2674a';
    ctxEA.fillRect(x, 214, 14, 20);
    ctxEA.fillStyle = '#1e2538';
    ctxEA.fillRect(x + 14, 214, 14, 20);
  }

  // Ojo de buey iluminado desde el interior cálido
  const gradVent = ctxEA.createRadialGradient(128, 92, 6, 128, 92, 46);
  gradVent.addColorStop(0, '#fff4cc');
  gradVent.addColorStop(0.7, '#f5b942');
  gradVent.addColorStop(1, '#c97a16');
  ctxEA.fillStyle = gradVent;
  ctxEA.beginPath();
  ctxEA.arc(128, 92, 42, 0, Math.PI * 2);
  ctxEA.fill();
  ctxEA.strokeStyle = '#2d374f';
  ctxEA.lineWidth = 8;
  ctxEA.stroke();

  ctxEE.fillStyle = '#f5b942';
  ctxEE.beginPath();
  ctxEE.arc(128, 92, 38, 0, Math.PI * 2);
  ctxEE.fill();

  // Volante de cierre hermético
  ctxEA.strokeStyle = '#283147';
  ctxEA.lineWidth = 7;
  ctxEA.beginPath();
  ctxEA.arc(128, 174, 22, 0, Math.PI * 2);
  ctxEA.stroke();
  ctxEH.strokeStyle = '#f0f0f0';
  ctxEH.lineWidth = 7;
  ctxEH.beginPath();
  ctxEH.arc(128, 174, 22, 0, Math.PI * 2);
  ctxEH.stroke();

  const esclusaAlbedo = registrar(configurarTextura(cEscA, true, maxAnisotropy, 1, 1));
  const esclusaNormal = registrar(generarNormalDesdeAltura(cEscH, 2.2, maxAnisotropy, 1, 1));
  const esclusaEmissive = registrar(configurarTextura(cEscE, true, maxAnisotropy, 1, 1));

  // =========================================================================
  // 9. CULTIVO HIDROPÓNICO DEL INVERNADERO (256x256 Albedo + Normal)
  // =========================================================================
  const [cCulA, ctxCA] = crearCanvas(256, 256);
  const [cCulH, ctxCH] = crearCanvas(256, 256);
  ctxCA.fillStyle = '#1b3a24';
  ctxCA.fillRect(0, 0, 256, 256);
  ctxCH.fillStyle = '#606060';
  ctxCH.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 420; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 4 + rand() * 10;
    const verde = 115 + Math.floor(rand() * 105);
    ctxCA.fillStyle = `rgb(${Math.floor(verde * 0.35)}, ${verde}, ${Math.floor(verde * 0.45)})`;
    ctxCA.beginPath();
    ctxCA.arc(x, y, r, 0, Math.PI * 2);
    ctxCA.fill();

    ctxCH.fillStyle = rand() > 0.4 ? 'rgba(220,220,220,0.35)' : 'rgba(60,60,60,0.35)';
    ctxCH.beginPath();
    ctxCH.arc(x, y, r * 0.85, 0, Math.PI * 2);
    ctxCH.fill();
  }
  const cultivoAlbedo = registrar(configurarTextura(cCulA, true, maxAnisotropy, 2, 1));
  const cultivoNormal = registrar(generarNormalDesdeAltura(cCulH, 2.4, maxAnisotropy, 2, 1));

  // =========================================================================
  // 11. PLANETA TIERRA EN EL CIELO LUNAR + FOBOS EN MARTE (512x256 / 256x128)
  // =========================================================================
  const [cEarA, ctxEarA] = crearCanvas(512, 256);
  const [cEarR, ctxEarR] = crearCanvas(512, 256);
  const gradOcean = ctxEarA.createLinearGradient(0, 0, 0, 256);
  gradOcean.addColorStop(0, '#c8e4ff');
  gradOcean.addColorStop(0.1, '#1c4d9c');
  gradOcean.addColorStop(0.5, '#154494');
  gradOcean.addColorStop(0.9, '#1c4d9c');
  gradOcean.addColorStop(1, '#dceeff');
  ctxEarA.fillStyle = gradOcean;
  ctxEarA.fillRect(0, 0, 512, 256);

  ctxEarR.fillStyle = '#383838'; // Océanos especulares
  ctxEarR.fillRect(0, 0, 512, 256);

  // Continentes orgánicos
  const randPlanet = pseudoRand(404);
  for (let i = 0; i < 42; i++) {
    const cx = 40 + randPlanet() * 430;
    const cy = 40 + randPlanet() * 176;
    const rx = 18 + randPlanet() * 44;
    const ry = 12 + randPlanet() * 28;
    ctxEarA.fillStyle = randPlanet() > 0.35 ? '#3e7b4f' : '#9c8a5b';
    ctxEarA.beginPath();
    ctxEarA.ellipse(cx, cy, rx, ry, randPlanet() * Math.PI, 0, Math.PI * 2);
    ctxEarA.fill();

    ctxEarR.fillStyle = '#d4d4d4'; // Tierra firme mate
    ctxEarR.beginPath();
    ctxEarR.ellipse(cx, cy, rx, ry, randPlanet() * Math.PI, 0, Math.PI * 2);
    ctxEarR.fill();
  }
  // Nubes atmosféricas
  for (let i = 0; i < 95; i++) {
    const cx = randPlanet() * 512;
    const cy = 20 + randPlanet() * 216;
    const rx = 20 + randPlanet() * 65;
    const ry = 4 + randPlanet() * 10;
    ctxEarA.fillStyle = 'rgba(255,255,255,0.42)';
    ctxEarA.beginPath();
    ctxEarA.ellipse(cx, cy, rx, ry, (randPlanet() - 0.5) * 0.25, 0, Math.PI * 2);
    ctxEarA.fill();
  }
  const tierraAlbedo = registrar(configurarTextura(cEarA, true, maxAnisotropy, 1, 1));
  const tierraRoughness = registrar(configurarTextura(cEarR, false, maxAnisotropy, 1, 1));

  // Fobos (luna craterizada de Marte)
  const [cFobA, ctxFobA] = crearCanvas(256, 128);
  const [cFobH, ctxFobH] = crearCanvas(256, 128);
  ctxFobA.fillStyle = '#7e635a';
  ctxFobA.fillRect(0, 0, 256, 128);
  ctxFobH.fillStyle = '#808080';
  ctxFobH.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 38; i++) {
    const x = randPlanet() * 256;
    const y = randPlanet() * 128;
    const r = 4 + randPlanet() * 14;
    ctxFobA.fillStyle = 'rgba(48,34,30,0.45)';
    ctxFobA.beginPath();
    ctxFobA.arc(x, y, r, 0, Math.PI * 2);
    ctxFobA.fill();
    ctxFobH.fillStyle = 'rgba(30,30,30,0.6)';
    ctxFobH.beginPath();
    ctxFobH.arc(x, y, r, 0, Math.PI * 2);
    ctxFobH.fill();
  }
  const fobosAlbedo = registrar(configurarTextura(cFobA, true, maxAnisotropy, 1, 1));
  const fobosNormal = registrar(generarNormalDesdeAltura(cFobH, 2.5, maxAnisotropy, 1, 1));

  // =========================================================================
  // 12. SOMBRA DE CONTACTO RADIAL
  // =========================================================================
  const [cSombra, ctxSh] = crearCanvas(128, 128);
  const gradSh = ctxSh.createRadialGradient(64, 64, 6, 64, 64, 62);
  gradSh.addColorStop(0, 'rgba(0,0,0,0.72)');
  gradSh.addColorStop(0.55, 'rgba(0,0,0,0.3)');
  gradSh.addColorStop(1, 'rgba(0,0,0,0)');
  ctxSh.fillStyle = gradSh;
  ctxSh.fillRect(0, 0, 128, 128);
  const sombraContacto = registrar(configurarTextura(cSombra, true, 1, 1, 1));
  sombraContacto.wrapS = THREE.ClampToEdgeWrapping;
  sombraContacto.wrapT = THREE.ClampToEdgeWrapping;

  return {
    terrenoAlbedo,
    terrenoNormal,
    terrenoRoughness,
    rocaAlbedo,
    rocaNormal,
    rocaRoughness,
    metalHullAlbedo,
    metalHullNormal,
    metalHullRoughness,
    trajeAlbedo,
    trajeNormal,
    pecheraAlbedo,
    acentoAlbedo,
    acentoNormal,
    panelSolarAlbedo,
    panelSolarNormal,
    panelSolarRoughness,
    foilDoradoAlbedo,
    foilDoradoNormal,
    foilDoradoRoughness,
    esclusaAlbedo,
    esclusaNormal,
    esclusaEmissive,
    cultivoAlbedo,
    cultivoNormal,
    tierraAlbedo,
    tierraRoughness,
    fobosAlbedo,
    fobosNormal,
    sombraContacto,
    dispose: () => {
      todas.forEach((t) => t.dispose());
    },
  };
}
