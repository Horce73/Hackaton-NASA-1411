import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Destino } from '../engine/tipos';
import type { ConjuntoTexturas } from './texturas';

export interface AstronautaRig {
  root: THREE.Group;
  cuerpo: THREE.Group;
  brazoIzq: THREE.Group;
  brazoDer: THREE.Group;
  piernaIzq: THREE.Group;
  piernaDer: THREE.Group;
  sombra: THREE.Mesh;
}

function crearSombraContacto(tex: THREE.Texture, radio: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radio * 2, radio * 2),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.025;
  return mesh;
}

function habilitarSombras(grupo: THREE.Object3D) {
  grupo.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

function crearMaterialesBase(tex: ConjuntoTexturas) {
  const matMetal = new THREE.MeshStandardMaterial({
    map: tex.metalHullAlbedo,
    normalMap: tex.metalHullNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: tex.metalHullRoughness,
    roughness: 0.72,
    metalness: 0.68,
    envMapIntensity: 1.15,
  });

  const matOscuro = new THREE.MeshStandardMaterial({
    map: tex.metalHullAlbedo,
    normalMap: tex.metalHullNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: tex.metalHullRoughness,
    color: 0x3b4863,
    roughness: 0.82,
    metalness: 0.45,
    envMapIntensity: 0.9,
  });

  const matAcento = new THREE.MeshStandardMaterial({
    map: tex.acentoAlbedo,
    normalMap: tex.acentoNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 0.42,
    metalness: 0.25,
    envMapIntensity: 1.0,
  });

  const matFoil = new THREE.MeshStandardMaterial({
    map: tex.foilDoradoAlbedo,
    normalMap: tex.foilDoradoNormal,
    normalScale: new THREE.Vector2(1.3, 1.3),
    roughnessMap: tex.foilDoradoRoughness,
    roughness: 0.55,
    metalness: 0.92,
    envMapIntensity: 1.35,
  });

  const matSolar = new THREE.MeshStandardMaterial({
    map: tex.panelSolarAlbedo,
    normalMap: tex.panelSolarNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: tex.panelSolarRoughness,
    roughness: 0.48,
    metalness: 0.62,
    envMapIntensity: 1.3,
  });

  return { matMetal, matOscuro, matAcento, matFoil, matSolar };
}

// `colorRol` tiñe los acentos y la franja del pecho según la especialidad (RF-14).
export function crearAstronauta3D(tex: ConjuntoTexturas, colorRol?: string): AstronautaRig {
  const root = new THREE.Group();
  const cuerpo = new THREE.Group();
  root.add(cuerpo);

  const matTraje = new THREE.MeshStandardMaterial({
    map: tex.trajeAlbedo,
    normalMap: tex.trajeNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.76,
    metalness: 0.06,
  });
  const matAcento = new THREE.MeshStandardMaterial({
    map: colorRol ? null : tex.acentoAlbedo,
    color: colorRol ?? 0xffffff,
    normalMap: tex.acentoNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.42,
    metalness: 0.18,
  });
  const matMetal = new THREE.MeshStandardMaterial({
    map: tex.metalHullAlbedo,
    normalMap: tex.metalHullNormal,
    color: 0x52617d,
    roughness: 0.35,
    metalness: 0.78,
  });
  const matPechera = new THREE.MeshStandardMaterial({
    map: tex.pecheraAlbedo,
    roughness: 0.38,
    metalness: 0.45,
  });
  const matVisor = new THREE.MeshPhysicalMaterial({
    color: 0xe3a024,
    roughness: 0.08,
    metalness: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    iridescence: 0.45,
    envMapIntensity: 1.5,
  });
  const matFoil = new THREE.MeshStandardMaterial({
    map: tex.foilDoradoAlbedo,
    normalMap: tex.foilDoradoNormal,
    roughnessMap: tex.foilDoradoRoughness,
    roughness: 0.5,
    metalness: 0.9,
  });

  // Torso con tejido Beta-cloth
  const torso = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.58, 0.36, 4, 0.12), matTraje);
  torso.position.y = 1.02;
  cuerpo.add(torso);

  // Pechera DCM con instrumentos reales
  const pechera = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.24, 0.06, 2, 0.02), matPechera);
  pechera.position.set(0, 1.07, 0.18);
  cuerpo.add(pechera);

  // Anillo metálico del cuello
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.07, 16), matMetal);
  cuello.position.y = 1.33;
  cuerpo.add(cuello);

  // Cinturón con hebilla metálica
  const cinturon = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.1, 0.38, 2, 0.04), matAcento);
  cinturon.position.y = 0.74;
  cuerpo.add(cinturon);

  // Franja del color de la especialidad, visible de frente y de espaldas
  if (colorRol) {
    const franja = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.07, 0.38, 2, 0.03), matAcento);
    franja.position.y = 1.26;
    cuerpo.add(franja);
  }

  // Mochila PLSS (soporte vital) con paneles de foil térmico
  const mochila = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.54, 0.24, 3, 0.06), matTraje);
  mochila.position.set(0, 1.05, -0.26);
  cuerpo.add(mochila);

  const placaMochila = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.03), matFoil);
  placaMochila.position.set(0, 1.02, -0.385);
  cuerpo.add(placaMochila);

  const bandaMochila = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.09, 0.26, 2, 0.03), matAcento);
  bandaMochila.position.set(0, 1.2, -0.26);
  cuerpo.add(bandaMochila);

  const toberaGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.14, 12);
  const toberaIzq = new THREE.Mesh(toberaGeo, matMetal);
  toberaIzq.position.set(-0.12, 0.74, -0.28);
  const toberaDer = new THREE.Mesh(toberaGeo, matMetal);
  toberaDer.position.set(0.12, 0.74, -0.28);
  cuerpo.add(toberaIzq, toberaDer);


  // Casco y visor dorado iridiscente
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.25, 22, 18), matTraje);
  casco.position.set(0, 1.5, 0);
  cuerpo.add(casco);

  // En la esfera, phi = PI / 2 es el frente (+Z): el visor va centrado ahí.
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16, Math.PI / 2 - 0.9, 1.8, 0.55, 1.2), matVisor);
  visor.position.set(0, 1.5, 0.03);
  cuerpo.add(visor);

  const visera = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.04, 16, 1, false, -0.9, 1.8), matMetal);
  visera.position.set(0, 1.63, 0.04);
  cuerpo.add(visera);

  // Antena del casco
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.24, 8), matMetal);
  antena.position.set(0.2, 1.66, -0.05);
  cuerpo.add(antena);

  // Brazos articulados con puños metálicos
  const crearBrazo = (lado: number) => {
    const pivote = new THREE.Group();
    pivote.position.set(lado * 0.34, 1.24, 0);
    const hombrera = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), matAcento);
    const brazo = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 6, 12), matTraje);
    brazo.position.y = -0.22;
    const muneca = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.05, 12), matMetal);
    muneca.position.y = -0.39;
    const guante = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), matMetal);
    guante.position.y = -0.45;
    pivote.add(hombrera, brazo, muneca, guante);
    return pivote;
  };
  const brazoIzq = crearBrazo(-1);
  const brazoDer = crearBrazo(1);
  cuerpo.add(brazoIzq, brazoDer);

  // Piernas articuladas con rodilleras y botas con suela
  const crearPierna = (lado: number) => {
    const pivote = new THREE.Group();
    pivote.position.set(lado * 0.14, 0.68, 0);
    const muslo = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 6, 12), matTraje);
    muslo.position.y = -0.24;
    const rodillera = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.1, 0.15, 2, 0.04), matAcento);
    rodillera.position.set(0, -0.26, 0.04);
    const bota = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.14, 0.27, 3, 0.05), matMetal);
    bota.position.set(0, -0.58, 0.04);
    pivote.add(muslo, rodillera, bota);
    return pivote;
  };
  const piernaIzq = crearPierna(-1);
  const piernaDer = crearPierna(1);
  cuerpo.add(piernaIzq, piernaDer);

  const sombra = crearSombraContacto(tex.sombraContacto, 0.68);
  root.add(sombra);

  habilitarSombras(cuerpo);
  return { root, cuerpo, brazoIzq, brazoDer, piernaIzq, piernaDer, sombra };
}

// Hábitat central a escala real del Surface Habitat de referencia de la NASA (el de Marte es casi idéntico):
// parte metálica de 4,4 m de diámetro y 2,6 m de alto con la esclusa, y encima la inflable de 6,5 m de
// diámetro y 5,2 m de alto con las dos plantas habitables.
// https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf
export const HABITAT = { radioMetal: 2.2, altoMetal: 2.6, radioInflable: 3.25, altoInflable: 5.2, alturaPlataforma: 0.3 };

// APAGADO hasta tener permiso por escrito: la insignia de la NASA no puede usarse sin permiso explícito
// (https://www.nasa.gov/nasa-brand-center/nasa-logo-use/). Para encenderlo, copiar `RAW/logo nasa pe.png`
// a `public/img/logo-nasa.png` y poner esto en true. Mientras esté en false, la imagen no se publica.
const MOSTRAR_LOGO_NASA = false;

export function crearBaseCentral3D(destino: Destino, tex: ConjuntoTexturas, isSoftwareGl: boolean): THREE.Group {
  const grupo = new THREE.Group();
  grupo.name = 'habitat-central';

  const { matMetal, matOscuro, matAcento, matFoil } = crearMaterialesBase(tex);
  const { radioMetal, altoMetal, radioInflable, altoInflable, alturaPlataforma } = HABITAT;

  const matPlataforma = new THREE.MeshStandardMaterial({
    map: tex.rocaAlbedo,
    normalMap: tex.rocaNormal,
    roughnessMap: tex.rocaRoughness,
    color: 0x7b869e,
    roughness: 0.78,
    metalness: 0.25,
  });
  // Capa exterior de tela técnica del inflable (la textura del traje es del mismo tipo de tejido).
  const matInflable = new THREE.MeshStandardMaterial({
    map: tex.trajeAlbedo,
    normalMap: tex.trajeNormal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    color: destino === 'luna' ? 0xf2f2ee : 0xf4ece4,
    roughness: 0.88,
    metalness: 0.02,
  });
  const matEsclusa = new THREE.MeshStandardMaterial({
    map: tex.esclusaAlbedo,
    normalMap: tex.esclusaNormal,
    normalScale: new THREE.Vector2(1.1, 1.1),
    emissiveMap: tex.esclusaEmissive,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.9,
    roughness: 0.45,
    metalness: 0.65,
  });
  const matVentana = new THREE.MeshStandardMaterial({
    color: 0xffe2a8,
    emissive: 0xffc46b,
    emissiveIntensity: isSoftwareGl ? 0.8 : 1.2,
    roughness: 0.3,
  });

  // Plataforma de apoyo
  const plataforma = new THREE.Mesh(new THREE.CylinderGeometry(radioMetal + 0.9, radioMetal + 1.2, alturaPlataforma, 8), matPlataforma);
  plataforma.position.y = alturaPlataforma / 2;
  grupo.add(plataforma);

  // Parte metálica: descenso, logística y esclusa
  const yMetal = alturaPlataforma;
  const metal = new THREE.Mesh(new THREE.CylinderGeometry(radioMetal, radioMetal, altoMetal, 24), matMetal);
  metal.position.y = yMetal + altoMetal / 2;
  grupo.add(metal);
  const banda = new THREE.Mesh(new THREE.CylinderGeometry(radioMetal + 0.04, radioMetal + 0.04, 0.22, 24), matAcento);
  banda.position.y = yMetal + altoMetal - 0.3;
  grupo.add(banda);

  // Patas de aterrizaje: del casco, a media altura, hasta apoyar en la plataforma con un pie redondo.
  const radioPie = radioMetal + 0.75; // dentro de la plataforma, que mide radioMetal + 0.9 arriba
  for (let k = 0; k < 4; k++) {
    const angulo = Math.PI / 4 + (k * Math.PI) / 2;
    const c = Math.cos(angulo);
    const sn = Math.sin(angulo);
    const arriba = new THREE.Vector3(c * radioMetal, yMetal + 1.7, sn * radioMetal);
    const abajo = new THREE.Vector3(c * radioPie, yMetal + 0.08, sn * radioPie);
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, arriba.distanceTo(abajo), 8), matOscuro);
    pata.position.copy(arriba).lerp(abajo, 0.5);
    pata.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arriba.clone().sub(abajo).normalize());
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.1, 12), matOscuro);
    pie.position.set(abajo.x, yMetal + 0.05, abajo.z);
    grupo.add(pata, pie);
  }

  // Esclusa en la parte metálica, mirando a +Z (por donde llega la tripulación)
  const marco = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.15, 0.5), matMetal);
  marco.position.set(0, yMetal + 1.1, radioMetal - 0.05);
  grupo.add(marco);
  const puerta = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.85, 0.12), matEsclusa);
  puerta.name = 'puerta-esclusa'; // la escena la desliza al salir la tripulación
  puerta.position.set(0, yMetal + 1.05, radioMetal + 0.24);
  grupo.add(puerta);

  // Parte inflable: cilindro de bordes redondeados (perfil girado), como en el corte de la NASA
  const yInflable = yMetal + altoMetal;
  const r = radioInflable;
  const curva = 1.4; // radio de los hombros redondeados
  const perfil: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(radioMetal, 0)];
  for (let k = 0; k <= 6; k++) {
    const a = -Math.PI / 2 + (k / 6) * (Math.PI / 2);
    perfil.push(new THREE.Vector2(r - curva + Math.cos(a) * curva, curva + Math.sin(a) * curva));
  }
  for (let k = 0; k <= 6; k++) {
    const a = (k / 6) * (Math.PI / 2);
    perfil.push(new THREE.Vector2(r - curva + Math.cos(a) * curva, altoInflable - curva + Math.sin(a) * curva));
  }
  perfil.push(new THREE.Vector2(0, altoInflable));
  const inflable = new THREE.Mesh(new THREE.LatheGeometry(perfil, 32), matInflable);
  inflable.position.y = yInflable;
  grupo.add(inflable);

  // Correas de refuerzo y ventanas iluminadas
  for (const h of [0.35, 0.65]) {
    const correa = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.05, 6, 40), matFoil);
    correa.rotation.x = Math.PI / 2;
    correa.position.y = yInflable + altoInflable * h;
    grupo.add(correa);
  }
  for (const angulo of [Math.PI / 2 - 0.5, Math.PI / 2 + 0.5, -Math.PI / 2]) {
    const ventana = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), matVentana);
    ventana.position.set(Math.cos(angulo) * (r + 0.02), yInflable + altoInflable * 0.5, Math.sin(angulo) * (r + 0.02));
    ventana.lookAt(Math.cos(angulo) * 10, yInflable + altoInflable * 0.5, Math.sin(angulo) * 10);
    grupo.add(ventana);
  }

  // Logo en el frente del inflable, entre las dos correas: un trozo de cilindro para que siga la curva
  if (MOSTRAR_LOGO_NASA) {
    const ancho = 1.3;
    const logo = new THREE.Mesh(
      new THREE.CylinderGeometry(r + 0.02, r + 0.02, ancho * (460 / 542), 12, 1, true, -ancho / r / 2, ancho / r),
      new THREE.MeshStandardMaterial({ alphaTest: 0.5, roughness: 0.8 }),
    );
    logo.position.y = yInflable + altoInflable * 0.5;
    logo.visible = false; // sin textura sería un rectángulo blanco
    new THREE.TextureLoader().load('img/logo-nasa.png', (textura) => {
      textura.colorSpace = THREE.SRGBColorSpace;
      (logo.material as THREE.MeshStandardMaterial).map = textura;
      (logo.material as THREE.MeshStandardMaterial).needsUpdate = true;
      logo.visible = true;
    });
    grupo.add(logo);
  }

  // Antena parabólica de comunicaciones en la cima
  const yCima = yInflable + altoInflable;
  const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 10), matMetal);
  mastil.position.y = yCima + 0.6;
  grupo.add(mastil);
  const antenaGrupo = new THREE.Group();
  antenaGrupo.name = 'antena-rotatoria';
  antenaGrupo.position.y = yCima + 1.3;
  const plato = new THREE.Mesh(new THREE.SphereGeometry(0.88, 18, 12, 0, Math.PI * 2, 0, 0.85), matMetal);
  plato.rotation.x = Math.PI * 0.65;
  const receptor = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.55, 8), matFoil);
  receptor.position.set(0, 0.25, 0.45);
  receptor.rotation.x = 0.8;
  antenaGrupo.add(plato, receptor);
  grupo.add(antenaGrupo);

  const sombra = crearSombraContacto(tex.sombraContacto, r + 1.2);
  grupo.add(sombra);

  habilitarSombras(grupo);
  return grupo;
}

export function crearModulo3D(
  itemId: string,
  tex: ConjuntoTexturas,
  isSoftwareGl: boolean,
  destino: Destino = 'luna',
): THREE.Group {
  const g = new THREE.Group();
  g.name = `item-${itemId}`;

  const { matMetal, matOscuro, matAcento, matFoil, matSolar } = crearMaterialesBase(tex);

  switch (itemId) {
    case 'panel-solar': {
      if (destino === 'luna') {
        // VSAT (Vertical Solar Array Technology): panel vertical en un mástil de unos 10 m que gira siguiendo al Sol,
        // bajo en el horizonte del polo sur. Se puede recoger para cambiarlo de sitio.
        // https://www.nasa.gov/technology/nasa-industry-to-mature-vertical-solar-array-technologies-for-lunar-surface/
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.5, 8), matOscuro);
        base.position.y = 0.25;
        const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 10, 10), matMetal);
        mastil.position.y = 5.25;
        const gira = new THREE.Group(); // el panel gira con el Sol: lo anima la escena
        gira.name = 'seguidor-solar';
        const manta = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.2, 0.04), matSolar);
        manta.position.set(1.2, 6.6, 0);
        const larguero = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), matMetal);
        larguero.position.set(1.2, 9.75, 0);
        const larguero2 = larguero.clone();
        larguero2.position.y = 3.45;
        gira.add(manta, larguero, larguero2);
        const remate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.3, 10), matFoil);
        remate.position.y = 10.3;
        g.add(base, mastil, gira, remate, crearSombraContacto(tex.sombraContacto, 1.4));
      } else {
        // En Marte el Sol sube más: paneles inclinados a ras de suelo, en dos filas.
        [-0.85, 0.85].forEach((z) => {
          const fila = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 1.3), matSolar);
          fila.position.set(0, 0.95, z);
          fila.rotation.x = -0.5;
          g.add(fila);
          [-1.4, 1.4].forEach((x) => {
            const pata = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), matMetal);
            pata.position.set(x, 0.47, z);
            g.add(pata);
          });
        });
        g.add(crearSombraContacto(tex.sombraContacto, 2.2));
      }
      break;
    }

    case 'reactor': {
      // Fission Surface Power: reactor de 40 kW con radiadores desplegables de herencia ISS. La NASA lo coloca a 1 km
      // de la base; aquí está más cerca para que se pueda visitar, y los radiadores son más pequeños.
      // https://www.nasa.gov/exploration-systems-development-mission-directorate/fission-surface-power/
      // https://ntrs.nasa.gov/citations/20220004670
      const cubierta = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 6), matOscuro);
      cubierta.position.y = 1.2;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 8), matMetal);
        pata.position.set(Math.cos(ang) * 1.2, 0.62, Math.sin(ang) * 1.2);
        const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.08, 10), matMetal);
        pie.position.set(Math.cos(ang) * 1.3, 0.04, Math.sin(ang) * 1.3);
        g.add(pata, pie);
      }
      // El escudo cónico bajo el núcleo protege de la radiación del reactor.
      const escudo = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.45, 0.9, 14), matOscuro);
      escudo.position.y = 1.8;
      const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 14), matFoil);
      nucleo.position.y = 2.8;
      const conversores = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 12), matMetal);
      conversores.position.y = 3.6;
      const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 8), matMetal);
      mastil.position.y = 5.9;
      g.add(cubierta, escudo, nucleo, conversores, mastil);
      // Radiadores blancos a los dos lados, de canto al Sol.
      const matRadiador = new THREE.MeshStandardMaterial({ color: 0xe9ecf1, roughness: 0.55, metalness: 0.2 });
      [-1, 1].forEach((lado) => {
        const radiador = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 0.06), matRadiador);
        radiador.position.set(lado * 1.45, 5.6, 0);
        const tubo = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 0.1), matMetal);
        tubo.position.set(lado * 1.45, 7.45, 0);
        g.add(radiador, tubo);
      });
      g.add(crearSombraContacto(tex.sombraContacto, 2.2));
      break;
    }

    case 'invernadero': {
      // Invernadero inflable y desplegable, como el prototipo lunar de la Universidad de Arizona con la NASA:
      // un cilindro tumbado con los cultivos dentro y tapas rígidas en los extremos.
      // https://www.nasa.gov/science-research/lunar-martian-greenhouses-designed-to-mimic-those-on-earth/
      const largo = 5;
      const radio = 1.25;
      const membrana = new THREE.Mesh(
        new THREE.CylinderGeometry(radio, radio, largo, 20, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xf4f1e8,
          roughness: 0.6,
          transparent: true,
          opacity: isSoftwareGl ? 0.45 : 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      membrana.rotation.z = Math.PI / 2;
      membrana.position.y = radio;
      for (let i = 0; i <= 4; i++) {
        const costilla = new THREE.Mesh(new THREE.TorusGeometry(radio + 0.02, 0.04, 6, 24), matMetal);
        costilla.rotation.y = Math.PI / 2;
        costilla.position.set(-largo / 2 + (i * largo) / 4, radio, 0);
        g.add(costilla);
      }
      [-1, 1].forEach((lado) => {
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(radio + 0.05, radio + 0.05, 0.25, 20), matMetal);
        tapa.rotation.z = Math.PI / 2;
        tapa.position.set(lado * (largo / 2 + 0.12), radio, 0);
        g.add(tapa);
      });
      // Dentro: dos bancales de cultivo y las barras de luz encima.
      const matPlanta = new THREE.MeshStandardMaterial({
        map: tex.cultivoAlbedo,
        normalMap: tex.cultivoNormal,
        color: 0x7fd36b,
        emissive: 0x1d4a14,
        emissiveIntensity: 0.5,
        roughness: 0.8,
      });
      const matLuz = new THREE.MeshBasicMaterial({ color: 0xfff1d6 });
      [-0.55, 0.55].forEach((z) => {
        const bancal = new THREE.Mesh(new THREE.BoxGeometry(largo - 0.6, 0.5, 0.6), matPlanta);
        bancal.position.set(0, 0.45, z);
        const luz = new THREE.Mesh(new THREE.BoxGeometry(largo - 0.8, 0.04, 0.12), matLuz);
        luz.position.set(0, 1.85, z);
        g.add(bancal, luz);
      });
      g.add(membrana, crearSombraContacto(tex.sombraContacto, 2.6));
      break;
    }

    case 'blindaje': {
      // Refugio de radiación con sacos de regolito: el concepto 1.2 del estudio Lunar Safe Haven (NASA, 2021,
      // figura 6). Una estructura de acero cubierta de sacos llenos del suelo del sitio en el techo y tres paredes;
      // la cara +X (de lado, según se rodea la base) queda abierta, en corte, para ver el módulo de refugio. Los sacos
      // pesan menos por volumen que el regolito suelto y necesitan una capa más gruesa.
      // https://ntrs.nasa.gov/api/citations/20210022066/downloads/Grande_Lunar%20Safe%20Haven_ASCEND%202021_Full_v2b.docx.pdf
      const ancho = 3.6;
      const alto = 3;
      const mitad = ancho / 2;
      const suelo = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.1, ancho), matOscuro);
      suelo.position.y = 0.05;
      g.add(suelo);

      // Estructura: columnas, vigas del techo y travesaños de la cara abierta.
      const viga = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), matOscuro);
        m.position.set(x, y, z);
        g.add(m);
      };
      for (const x of [-mitad + 0.08, mitad - 0.08]) {
        for (const z of [-mitad + 0.08, mitad - 0.08]) viga(0.16, alto, 0.16, x, alto / 2, z);
      }
      for (const z of [-mitad + 0.08, mitad - 0.08]) viga(ancho, 0.16, 0.16, 0, alto, z);
      for (const x of [-mitad + 0.08, mitad - 0.08]) viga(0.16, 0.16, ancho, x, alto, 0);
      viga(0.12, alto, 0.12, mitad - 0.08, alto / 2, -0.6);
      viga(0.12, alto, 0.12, mitad - 0.08, alto / 2, 0.6);
      viga(0.12, 0.12, ancho, mitad - 0.08, alto * 0.55, 0);

      // Dentro: el módulo de refugio, un cilindro blanco con franja azul.
      const refugio = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.75, 2.2, 18),
        new THREE.MeshStandardMaterial({ color: 0xe8ebf0, roughness: 0.5, metalness: 0.3 }),
      );
      refugio.position.set(-0.2, 1.2, 0);
      const franja = new THREE.Mesh(
        new THREE.CylinderGeometry(0.77, 0.77, 0.22, 18),
        new THREE.MeshStandardMaterial({ color: 0x3b5ba5, roughness: 0.5 }),
      );
      franja.position.set(-0.2, 1.35, 0);
      g.add(refugio, franja);

      // Sacos: una sola malla instanciada (un dibujo para todos).
      const posiciones: [number, number, number, number][] = [];
      const saco = { largo: 0.6, alto: 0.3, fondo: 0.42 };
      const fila = (n: number) => (n % 2) * (saco.largo / 2);
      for (let r = 0; r < 10; r++) {
        const y = 0.25 + r * saco.alto;
        for (let u = -mitad + saco.largo / 2 + fila(r); u <= mitad - saco.largo / 2 + 0.01; u += saco.largo) {
          posiciones.push([-mitad - saco.fondo / 2, y, u, Math.PI / 2]); // pared -X
          if (u < mitad - 0.3) {
            posiciones.push([u, y, -mitad - saco.fondo / 2, 0]); // pared -Z
            posiciones.push([u, y, mitad + saco.fondo / 2, 0]); // pared +Z, la que mira al hábitat
          }
        }
      }
      // Techo en dos capas, con lomo, como el de la figura.
      for (let z = -mitad - 0.4 + saco.largo / 2; z <= mitad + 0.4; z += saco.largo) {
        for (let x = -mitad - 0.3 + saco.fondo / 2; x <= mitad + 0.05; x += saco.fondo) {
          posiciones.push([x, alto + 0.22, z, Math.PI / 2]);
          if (Math.abs(z) < 1.1) posiciones.push([x, alto + 0.5, z, Math.PI / 2]);
        }
      }
      const sacos = new THREE.InstancedMesh(
        new RoundedBoxGeometry(saco.largo - 0.04, saco.alto - 0.02, saco.fondo - 0.04, 2, 0.08),
        new THREE.MeshStandardMaterial({
          color: destino === 'luna' ? 0xb9a78c : 0xb27b5b,
          roughness: 0.95,
          metalness: 0,
        }),
        posiciones.length,
      );
      const matriz = new THREE.Matrix4();
      const giro = new THREE.Quaternion();
      const eje = new THREE.Vector3(0, 1, 0);
      const escala = new THREE.Vector3(1, 1, 1);
      posiciones.forEach(([x, y, z, rot], i) => {
        // Un poco torcidos, como sacos apilados a mano.
        giro.setFromAxisAngle(eje, rot + (((i * 37) % 7) - 3) * 0.012);
        matriz.compose(new THREE.Vector3(x, y, z), giro, escala);
        sacos.setMatrixAt(i, matriz);
      });
      g.add(sacos, crearSombraContacto(tex.sombraContacto, 2.8));
      break;
    }

    case 'reciclador':
    case 'zona-descanso':
    case 'gimnasio': {
      crearModuloPresurizado(g, itemId, tex);
      break;
    }

    // EQUIPO HISTÓRICO REAL NASA
    case 'lrv': {
      const chasis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 2.3), matFoil);
      chasis.position.y = 0.48;
      const ruedaGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
      ruedaGeo.rotateZ(Math.PI / 2);
      const ruedaMat = new THREE.MeshStandardMaterial({
        map: tex.trajeAlbedo,
        normalMap: tex.trajeNormal,
        color: 0x7c8699,
        roughness: 0.65,
        metalness: 0.65,
      });
      [
        [-0.85, 0.32, 0.85],
        [0.85, 0.32, 0.85],
        [-0.85, 0.32, -0.85],
        [0.85, 0.32, -0.85],
      ].forEach(([rx, ry, rz]) => {
        const r = new THREE.Mesh(ruedaGeo, ruedaMat);
        r.position.set(rx, ry, rz);
        g.add(r);
      });
      const asiento1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.45), matOscuro);
      asiento1.position.set(-0.35, 0.82, -0.1);
      const asiento2 = asiento1.clone();
      asiento2.position.x = 0.35;
      const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 8), matMetal);
      mastil.position.set(0, 1.0, 0.8);
      const antena = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.25, 14, 1, true), matFoil);
      antena.position.set(0, 1.48, 0.8);
      antena.rotation.x = -Math.PI * 0.72;
      g.add(chasis, asiento1, asiento2, mastil, antena, crearSombraContacto(tex.sombraContacto, 1.8));
      break;
    }

    case 'alsep': {
      const estacion = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 1.1), matFoil);
      estacion.position.y = 0.45;
      const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.85, 12), matOscuro);
      rtg.position.set(1.15, 0.42, 0.35);
      const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.3, 8), matMetal);
      antena.position.set(0, 1.4, 0);
      const cable = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.14), matAcento);
      cable.position.set(0.55, 0.03, 0.18);
      g.add(estacion, rtg, antena, cable, crearSombraContacto(tex.sombraContacto, 1.6));
      break;
    }

    case 'retrorreflector': {
      const soporte = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.9), matOscuro);
      soporte.position.y = 0.11;
      const marco = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 1.0), matMetal);
      marco.position.set(0, 0.55, 0);
      marco.rotation.x = -0.55;
      const espejos = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.06, 0.78),
        new THREE.MeshPhysicalMaterial({
          map: tex.panelSolarAlbedo,
          color: 0xeef7ff,
          roughness: 0.05,
          metalness: 0.95,
          clearcoat: 1,
        }),
      );
      espejos.position.set(0, 0.6, 0.04);
      espejos.rotation.x = -0.55;
      const haz = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 4.5, 8),
        new THREE.MeshBasicMaterial({ color: 0x4cd7a1, transparent: true, opacity: 0.5 }),
      );
      haz.position.set(0, 2.5, 0.8);
      haz.rotation.x = 0.35;
      g.add(soporte, marco, espejos, haz, crearSombraContacto(tex.sombraContacto, 1.2));
      break;
    }

    case 'sojourner': {
      // A escala real, según el modelo a tamaño real que la JPL hizo para la Smithsonian: 58 × 43 cm de planta y
      // 81 cm de alto con la antena (https://www.si.edu/object/mars-pathfinder-mini-rover-full-scale-model:nasm_A20020297000).
      // Ruedas de 13 cm de diámetro (página de Mars Pathfinder de la JPL). Forma tomada de las vistas del equipo.
      // El frente (+Z) mira a la base; la antena va delante a un lado y el espectrómetro APXS detrás.
      const matCaja = new THREE.MeshStandardMaterial({ color: 0xd9962b, roughness: 0.6, metalness: 0.3 });
      const matRueda = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.5, metalness: 0.75 });
      const barra = (a: THREE.Vector3, b: THREE.Vector3, grosor = 0.018) => {
        const largo = a.distanceTo(b);
        const m = new THREE.Mesh(new THREE.BoxGeometry(grosor, grosor, largo), matMetal);
        m.position.copy(a).lerp(b, 0.5);
        m.lookAt(b);
        g.add(m);
      };

      const caja = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.42), matCaja);
      caja.position.y = 0.21;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.012, 0.58), matSolar);
      panel.position.set(0, 0.305, 0.03);
      const marcoPanel = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.008, 0.59), matOscuro);
      marcoPanel.position.set(0, 0.296, 0.03);
      const camara = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.01), matOscuro);
      camara.position.set(0, 0.24, 0.215);
      const apxs = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.06, 12), matMetal);
      apxs.rotation.x = Math.PI / 2;
      apxs.position.set(0, 0.2, -0.27);
      barra(new THREE.Vector3(0, 0.2, -0.21), new THREE.Vector3(0, 0.2, -0.24), 0.02);
      g.add(caja, marcoPanel, panel, camara, apxs);

      // Antena con el codo que se ve en las vistas de frente
      const xAntena = 0.19;
      barra(new THREE.Vector3(xAntena, 0.31, 0.2), new THREE.Vector3(xAntena, 0.4, 0.2), 0.012);
      barra(new THREE.Vector3(xAntena, 0.4, 0.2), new THREE.Vector3(xAntena - 0.05, 0.47, 0.2), 0.012);
      barra(new THREE.Vector3(xAntena - 0.05, 0.47, 0.2), new THREE.Vector3(xAntena - 0.05, 0.81, 0.2), 0.008);

      // Suspensión rocker-bogie: en cada lado, un balancín delantero y un bogie con las ruedas central y trasera
      const radioRueda = 0.065;
      const ruedaGeo = new THREE.CylinderGeometry(radioRueda, radioRueda, 0.07, 16);
      ruedaGeo.rotateZ(Math.PI / 2);
      const tacoGeo = new THREE.BoxGeometry(0.072, 0.012, 0.012);
      for (const lado of [-1, 1]) {
        const x = lado * 0.21;
        const ruedas = [0.22, 0, -0.22].map((z) => new THREE.Vector3(x, radioRueda, z));
        for (const centro of ruedas) {
          const rueda = new THREE.Mesh(ruedaGeo, matRueda);
          rueda.position.copy(centro);
          g.add(rueda);
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const taco = new THREE.Mesh(tacoGeo, matOscuro);
            taco.position.set(x, radioRueda + Math.sin(a) * radioRueda, centro.z + Math.cos(a) * radioRueda);
            taco.rotation.x = -a;
            g.add(taco);
          }
        }
        const xBrazo = lado * 0.165;
        const pivote = new THREE.Vector3(xBrazo, 0.2, 0.02);
        const pivoteBogie = new THREE.Vector3(xBrazo, 0.14, -0.11);
        barra(new THREE.Vector3(xBrazo, radioRueda + 0.05, 0.22), pivote);
        barra(pivote, pivoteBogie);
        barra(pivoteBogie, new THREE.Vector3(xBrazo, radioRueda + 0.04, 0));
        barra(pivoteBogie, new THREE.Vector3(xBrazo, radioRueda + 0.04, -0.22));
        for (const centro of ruedas) barra(new THREE.Vector3(xBrazo, radioRueda + 0.05, centro.z), centro, 0.014);
      }
      g.add(crearSombraContacto(tex.sombraContacto, 0.5));
      break;
    }

    case 'spirit-opportunity': {
      const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 1.1), matFoil);
      cuerpo.position.y = 0.42;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.2), matSolar);
      panel.position.y = 0.6;
      const ruedaGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12);
      ruedaGeo.rotateZ(Math.PI / 2);
      [-0.55, 0.55].forEach((rx) => {
        [-0.45, 0, 0.45].forEach((rz) => {
          const r = new THREE.Mesh(ruedaGeo, matOscuro);
          r.position.set(rx, 0.16, rz);
          g.add(r);
        });
      });
      g.add(cuerpo, panel, crearSombraContacto(tex.sombraContacto, 1.1));
      break;
    }

    case 'curiosity': {
      const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 2.0), matMetal);
      cuerpo.position.y = 0.72;
      const cubiertaFoil = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 1.5), matFoil);
      cubiertaFoil.position.y = 1.02;
      const ruedaGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 16);
      ruedaGeo.rotateZ(Math.PI / 2);
      [-0.9, 0.9].forEach((rx) => {
        [-0.85, 0, 0.85].forEach((rz) => {
          const r = new THREE.Mesh(ruedaGeo, matOscuro);
          r.position.set(rx, 0.28, rz);
          g.add(r);
        });
      });
      const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.05, 10), matMetal);
      mastil.position.set(0.2, 1.45, 0.65);
      const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.32), matMetal);
      cabeza.position.set(0.2, 1.98, 0.68);
      const ojo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      );
      ojo.rotation.x = Math.PI / 2;
      ojo.position.set(0.2, 1.98, 0.86);
      const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 10), matAcento);
      rtg.rotation.x = -0.45;
      rtg.position.set(0, 0.95, -1.1);
      g.add(cuerpo, cubiertaFoil, mastil, cabeza, ojo, rtg, crearSombraContacto(tex.sombraContacto, 1.8));
      break;
    }

    case 'perseverance-ingenuity': {
      const caja = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.55), matFoil);
      caja.position.y = 1.65;
      [
        [-0.35, -0.35],
        [0.35, -0.35],
        [-0.35, 0.35],
        [0.35, 0.35],
      ].forEach(([px, pz]) => {
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6), matOscuro);
        pata.position.set(px * 0.65, 1.28, pz * 0.65);
        pata.rotation.z = -px * 0.6;
        pata.rotation.x = pz * 0.6;
        g.add(pata);
      });
      const rotores = new THREE.Group();
      rotores.name = 'rotores-ingenuity';
      rotores.position.y = 2.08;
      const pala1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 0.16), matOscuro);
      const pala2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 2.2), matOscuro);
      pala2.position.y = 0.08;
      rotores.add(pala1, pala2);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.45), matSolar);
      panel.position.y = 2.26;
      g.add(caja, rotores, panel, crearSombraContacto(tex.sombraContacto, 1.0));
      break;
    }

    case 'surveyor-3':
    default: {
      // A escala real según la NSSDCA (https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A):
      // trípode de tubo de aluminio, mástil de 1 m sobre el vértice, unos 3 m de alto, patas de 4,3 m de punta a punta,
      // panel solar de 0,855 m² y antena plana arriba, dos compartimentos térmicos, cámara de TV cerca del vértice y
      // pala de 12 × 5 cm en un brazo de 1,5 m. La forma sigue la foto del Apolo 12 (public/img/surveyor-3.webp).
      const matBlanco = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.7, metalness: 0.1 });
      const matAntena = new THREE.MeshStandardMaterial({ color: 0xc9cdd4, roughness: 0.45, metalness: 0.55 });
      const tubo = (a: THREE.Vector3, b: THREE.Vector3, radio = 0.03, mat: THREE.Material = matMetal) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, a.distanceTo(b), 8), mat);
        m.position.copy(a).lerp(b, 0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        g.add(m);
      };
      const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
      const enAngulo = (ang: number, r: number, y: number) => v(Math.cos(ang) * r, y, Math.sin(ang) * r);
      const angulos = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => a + Math.PI / 2);

      // Trípode: tres esquinas abajo unidas entre sí y con el vértice, con riostras.
      const vertice = v(0, 2.0, 0);
      const esquinas = angulos.map((ang) => enAngulo(ang, 0.85, 0.7));
      esquinas.forEach((e, i) => {
        const siguiente = esquinas[(i + 1) % 3];
        tubo(e, vertice);
        tubo(e, siguiente);
        tubo(e.clone().lerp(vertice, 0.5), siguiente.clone().lerp(vertice, 0.5), 0.02);
      });

      // Patas articuladas en las esquinas, con amortiguador y pie redondo que se aplasta al tocar el suelo.
      angulos.forEach((ang, i) => {
        const pie = enAngulo(ang, 2.15, 0.12);
        tubo(esquinas[i], pie, 0.035);
        tubo(enAngulo(ang, 0.45, 1.25), esquinas[i].clone().lerp(pie, 0.55), 0.045, matOscuro);
        const zapata = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 14), matBlanco);
        zapata.position.copy(pie).setY(0.06);
        g.add(zapata);
      });

      // Mástil con el panel solar inclinado y la antena plana casi vertical.
      tubo(vertice, v(0, 3.0, 0), 0.035);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.03, 0.93), matSolar);
      panel.position.set(0.25, 3.0, 0);
      panel.rotation.z = -0.35;
      const antena = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.06), matAntena);
      antena.position.set(-0.45, 2.75, 0.05);
      antena.rotation.y = 0.5;
      antena.rotation.x = -0.2;
      tubo(v(0, 2.8, 0), antena.position.clone(), 0.02);

      // Dos compartimentos térmicos blancos colgados del trípode.
      [0, 1].forEach((k) => {
        const e = esquinas[k].clone().lerp(esquinas[(k + 1) % 3], 0.5);
        const caja = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.46), matBlanco);
        caja.position.copy(e).multiplyScalar(1.25).setY(0.95);
        caja.lookAt(0, 0.95, 0);
        g.add(caja);
      });

      // Cámara de TV cerca del vértice: cilindro con el espejo en una capucha inclinada.
      const camara = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), matBlanco);
      const posCamara = enAngulo(angulos[2] + 0.5, 0.4, 1.6);
      camara.position.copy(posCamara);
      const capucha = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.22, 12), matMetal);
      capucha.position.copy(posCamara).setY(1.95);
      capucha.rotation.z = 0.5;
      g.add(camara, capucha);

      // Brazo de la pala (pantógrafo de 1,5 m) estirado hacia el suelo, con la pala al final.
      const hombro = enAngulo(angulos[1] + 0.6, 0.6, 0.85);
      const punta = enAngulo(angulos[1] + 0.6, 2.05, 0.2);
      tubo(hombro, punta, 0.025);
      tubo(hombro.clone().setY(0.75), punta.clone().setY(0.14), 0.02);
      const pala = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.05), matOscuro);
      pala.position.copy(punta).setY(0.1);
      g.add(pala);

      // Motores vernier bajo el trípode.
      esquinas.forEach((e) => {
        const tobera = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 10, 1, true), matOscuro);
        tobera.position.copy(e).setY(0.55);
        g.add(tobera);
      });

      g.add(panel, antena, crearSombraContacto(tex.sombraContacto, 2.4));
      break;
    }
  }

  habilitarSombras(g);
  return g;
}

// Módulos que en una base real estarían presurizados (dentro no se lleva traje): cilindro tumbado sobre patas,
// unido al hábitat por un túnel. El eje va en X; la escotilla del túnel mira a +Z (hacia el hábitat) y la ventana
// grande a -Z (hacia fuera), para ver el interior desde el exterior.
export const MODULO_PRESURIZADO = { radio: 1.1, largo: 4, altoEje: 1.55, radioTunel: 0.6 };
export const MODULOS_PRESURIZADOS = new Set(['reciclador', 'zona-descanso', 'gimnasio']);

const FRANJA_PRESURIZADO: Record<string, number> = {
  reciclador: 0x4cd7a1,
  'zona-descanso': 0x9b8cf5,
  gimnasio: 0xf5b942,
};

function crearModuloPresurizado(g: THREE.Group, itemId: string, tex: ConjuntoTexturas) {
  const { matMetal, matOscuro } = crearMaterialesBase(tex);
  const { radio, largo, altoEje } = MODULO_PRESURIZADO;
  const horizontal = (m: THREE.Mesh, x = 0) => {
    m.rotation.z = Math.PI / 2;
    m.position.set(x, altoEje, 0);
    g.add(m);
  };

  // Casco: dos tramos enteros en los extremos y uno central con el hueco de la ventana (centrado en -Z).
  // Con el eje en X, el ángulo θ de CylinderGeometry pone el punto en (y, z) = (r·sen θ, r·cos θ): -Z es θ = π.
  const centroVentana = Math.PI - 0.15;
  const hueco = 1.3;
  const tramo = (largo - 2) / 2;
  horizontal(new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, tramo, 20), matMetal), -1 - tramo / 2);
  horizontal(new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, tramo, 20), matMetal), 1 + tramo / 2);
  horizontal(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radio, radio, 2, 20, 1, true, centroVentana + hueco / 2, Math.PI * 2 - hueco),
      new THREE.MeshStandardMaterial({ map: tex.metalHullAlbedo, roughness: 0.72, metalness: 0.68, side: THREE.DoubleSide }),
    ),
  );
  horizontal(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radio, radio, 2, 8, 1, true, centroVentana - hueco / 2, hueco),
      new THREE.MeshStandardMaterial({ color: 0x9fc6e8, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false }),
    ),
  );
  // Tapas redondeadas y franjas del color de su sistema.
  [-1, 1].forEach((lado) => {
    const tapa = new THREE.Mesh(new THREE.SphereGeometry(radio, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), matMetal);
    tapa.rotation.z = -lado * (Math.PI / 2);
    tapa.position.set((lado * largo) / 2, altoEje, 0);
    tapa.scale.y = 0.35;
    const franja = new THREE.Mesh(
      new THREE.CylinderGeometry(radio + 0.02, radio + 0.02, 0.18, 20),
      new THREE.MeshStandardMaterial({ color: FRANJA_PRESURIZADO[itemId] ?? 0xf5b942, roughness: 0.5 }),
    );
    horizontal(franja, lado * 1.1);
    const pata = new THREE.Mesh(new THREE.BoxGeometry(0.25, altoEje - radio + 0.3, 1.6), matOscuro);
    pata.position.set(lado * 1.3, (altoEje - radio + 0.3) / 2, 0);
    g.add(tapa, pata);
  });
  // Escotilla del túnel hacia el hábitat.
  const escotilla = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.2, 16), matOscuro);
  escotilla.rotation.x = Math.PI / 2;
  escotilla.position.set(0, altoEje, radio - 0.02);
  g.add(escotilla);

  // Interior iluminado, visible por la ventana: suelo, pared del fondo y el equipo de cada módulo.
  const matInterior = new THREE.MeshStandardMaterial({ color: 0xe9e4d6, emissive: 0x6b5a3a, emissiveIntensity: 0.55 });
  const suelo = new THREE.Mesh(new THREE.BoxGeometry(largo - 0.4, 0.05, 1.5), matInterior);
  suelo.position.set(0, altoEje - 0.65, 0);
  g.add(suelo);
  const equipo = (w: number, h: number, d: number, color: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.6 }),
    );
    m.position.set(x, altoEje - 0.62 + y, z);
    g.add(m);
  };
  if (itemId === 'zona-descanso') {
    // Literas: dos camas, una sobre otra, y una luz cálida.
    equipo(1.7, 0.2, 0.7, 0x6d7fd1, -0.3, 0.25, 0.25);
    equipo(1.7, 0.2, 0.7, 0x6d7fd1, -0.3, 0.85, 0.25);
    equipo(0.1, 1.1, 0.7, 0xbfc4cc, -1.2, 0.55, 0.25);
    equipo(0.6, 0.06, 0.3, 0xfff1d6, 0.9, 1.25, 0);
  } else if (itemId === 'gimnasio') {
    // Cinta de correr con arnés, como la de la ISS, y una bicicleta estática.
    equipo(1.5, 0.2, 0.7, 0x3b4863, -0.4, 0.1, 0.1);
    equipo(0.08, 1.0, 0.08, 0xbfc4cc, -1.1, 0.6, 0.1);
    equipo(0.08, 0.08, 0.7, 0xbfc4cc, -1.1, 1.1, 0.1);
    equipo(0.5, 0.5, 0.12, 0xf5b942, 0.9, 0.35, 0.1);
    equipo(0.1, 0.7, 0.1, 0xbfc4cc, 1.1, 0.45, 0.1);
  } else {
    // Reciclador: bastidores del sistema de soporte vital, con luces de estado.
    [-1.1, -0.35, 0.4].forEach((x) => equipo(0.6, 1.15, 0.5, 0xd9dde4, x, 0.6, 0.35));
    [-1.1, -0.35, 0.4].forEach((x) => equipo(0.3, 0.06, 0.02, 0x4cd7a1, x, 0.9, 0.09));
    // Fuera: depósitos de agua junto a un extremo.
    [-0.45, 0.45].forEach((z) => {
      const deposito = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.6, 14), matMetal);
      deposito.position.set(largo / 2 + 0.7, 0.8, z);
      g.add(deposito);
    });
  }
  g.add(crearSombraContacto(tex.sombraContacto, 2.4));
}

// Túnel presurizado de `largo` metros entre el hábitat y un módulo: a lo largo de +Z, con aros cada metro.
export function crearTunel3D(largo: number, tex: ConjuntoTexturas): THREE.Group {
  const g = new THREE.Group();
  const { matMetal, matOscuro } = crearMaterialesBase(tex);
  const r = MODULO_PRESURIZADO.radioTunel;
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, largo, 14, 1, true), matMetal);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.z = largo / 2;
  g.add(tubo);
  for (let z = 0.5; z < largo; z += 1) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.05, 6, 16), matOscuro);
    aro.position.z = z;
    g.add(aro);
  }
  habilitarSombras(g);
  return g;
}

export function crearNodoInteractivo3D(tipo: 'averia' | 'historia'): THREE.Group {
  const g = new THREE.Group();

  const color = tipo === 'averia' ? 0xff6b6b : 0xf5b942;
  const anillo = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.06, 8, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
  );
  anillo.rotation.x = Math.PI / 2;
  anillo.position.y = 0.08;
  const baliza = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshBasicMaterial({ color }),
  );
  baliza.name = 'baliza-flotante';
  baliza.position.y = 2.6;
  g.add(anillo, baliza);

  return g;
}
