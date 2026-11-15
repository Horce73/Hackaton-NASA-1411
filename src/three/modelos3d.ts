import * as THREE from 'three';
import type { Destino } from '../engine/tipos';
import type { ConjuntoTexturas } from './texturas';

export interface AstronautaRig {
  root: THREE.Group;
  cuerpo: THREE.Group;
  brazoIzq: THREE.Group;
  brazoDer: THREE.Group;
  piernaIzq: THREE.Group;
  piernaDer: THREE.Group;
  llamaIzq: THREE.Mesh;
  llamaDer: THREE.Mesh;
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
  const matLlama = new THREE.MeshBasicMaterial({
    color: 0x6ce5ff,
    transparent: true,
    opacity: 0.88,
  });

  // Torso con tejido Beta-cloth
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.58, 0.34), matTraje);
  torso.position.y = 1.02;
  cuerpo.add(torso);

  // Pechera DCM con instrumentos reales
  const pechera = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.06), matPechera);
  pechera.position.set(0, 1.07, 0.18);
  cuerpo.add(pechera);

  // Anillo metálico del cuello
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.07, 16), matMetal);
  cuello.position.y = 1.33;
  cuerpo.add(cuello);

  // Cinturón con hebilla metálica
  const cinturon = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.36), matAcento);
  cinturon.position.y = 0.74;
  cuerpo.add(cinturon);

  // Franja del color de la especialidad, visible de frente y de espaldas
  if (colorRol) {
    const franja = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.07, 0.36), matAcento);
    franja.position.y = 1.26;
    cuerpo.add(franja);
  }

  // Mochila PLSS con paneles de foil térmico y toberas
  const mochila = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.24), matTraje);
  mochila.position.set(0, 1.05, -0.26);
  cuerpo.add(mochila);

  const placaMochila = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.03), matFoil);
  placaMochila.position.set(0, 1.02, -0.385);
  cuerpo.add(placaMochila);

  const bandaMochila = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.26), matAcento);
  bandaMochila.position.set(0, 1.2, -0.26);
  cuerpo.add(bandaMochila);

  const toberaGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.14, 12);
  const toberaIzq = new THREE.Mesh(toberaGeo, matMetal);
  toberaIzq.position.set(-0.12, 0.74, -0.28);
  const toberaDer = new THREE.Mesh(toberaGeo, matMetal);
  toberaDer.position.set(0.12, 0.74, -0.28);
  cuerpo.add(toberaIzq, toberaDer);

  const llamaGeo = new THREE.ConeGeometry(0.065, 0.35, 10);
  llamaGeo.rotateX(Math.PI);
  const llamaIzq = new THREE.Mesh(llamaGeo, matLlama);
  llamaIzq.position.set(-0.12, 0.52, -0.28);
  llamaIzq.visible = false;
  const llamaDer = new THREE.Mesh(llamaGeo, matLlama);
  llamaDer.position.set(0.12, 0.52, -0.28);
  llamaDer.visible = false;
  cuerpo.add(llamaIzq, llamaDer);

  // Casco y visor dorado iridiscente
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.25, 22, 18), matTraje);
  casco.position.set(0, 1.5, 0);
  cuerpo.add(casco);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.215, 20, 14, -0.9, 1.8, 0.45, 1.45), matVisor);
  visor.position.set(0, 1.5, 0.06);
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
    const rodillera = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.14), matAcento);
    rodillera.position.set(0, -0.26, 0.04);
    const bota = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.25), matMetal);
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
  return { root, cuerpo, brazoIzq, brazoDer, piernaIzq, piernaDer, llamaIzq, llamaDer, sombra };
}

// Hábitat central a escala real del Surface Habitat de referencia de la NASA (el de Marte es casi idéntico):
// parte metálica de 4,4 m de diámetro y 2,6 m de alto con la esclusa, y encima la inflable de 6,5 m de
// diámetro y 5,2 m de alto con las dos plantas habitables.
// https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf
export const HABITAT = { radioMetal: 2.2, altoMetal: 2.6, radioInflable: 3.25, altoInflable: 5.2, alturaPlataforma: 0.3 };

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

  // Patas de aterrizaje
  for (let k = 0; k < 4; k++) {
    const angulo = Math.PI / 4 + (k * Math.PI) / 2;
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.2, 8), matOscuro);
    pata.position.set(Math.cos(angulo) * (radioMetal + 0.55), yMetal + 0.95, Math.sin(angulo) * (radioMetal + 0.55));
    pata.lookAt(Math.cos(angulo) * radioMetal * 0.6, yMetal + 2.2, Math.sin(angulo) * radioMetal * 0.6);
    pata.rotateX(Math.PI / 2);
    grupo.add(pata);
  }

  // Esclusa en la parte metálica, mirando a +Z (por donde llega la tripulación)
  const marco = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.15, 0.5), matMetal);
  marco.position.set(0, yMetal + 1.1, radioMetal - 0.05);
  grupo.add(marco);
  const puerta = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.85, 0.12), matEsclusa);
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

export function crearModulo3D(itemId: string, tex: ConjuntoTexturas, isSoftwareGl: boolean): THREE.Group {
  const g = new THREE.Group();
  g.name = `item-${itemId}`;

  const { matMetal, matOscuro, matAcento, matFoil, matSolar } = crearMaterialesBase(tex);

  switch (itemId) {
    case 'panel-solar': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.82, 0.35, 8), matOscuro);
      base.position.y = 0.175;
      const juntaFoil = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.28, 10), matFoil);
      juntaFoil.position.y = 0.45;
      const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.45, 10), matMetal);
      poste.position.y = 1.05;
      const ala1 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 1.32), matSolar);
      ala1.position.set(-1.3, 1.78, 0);
      ala1.rotation.x = 0.45;
      const ala2 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 1.32), matSolar);
      ala2.position.set(1.3, 1.78, 0);
      ala2.rotation.x = 0.45;
      const marco = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.07, 0.16), matMetal);
      marco.position.set(0, 1.78, 0);
      g.add(base, juntaFoil, poste, ala1, ala2, marco);
      g.add(crearSombraContacto(tex.sombraContacto, 2.3));
      break;
    }

    case 'reactor': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.3, 12), matOscuro);
      base.position.y = 0.15;
      const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 1.9, 16), matMetal);
      nucleo.position.y = 1.2;
      const tapaFoil = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.66, 0.28, 14), matFoil);
      tapaFoil.position.y = 2.25;
      const anillo = new THREE.Mesh(
        new THREE.TorusGeometry(0.74, 0.08, 10, 24),
        new THREE.MeshStandardMaterial({
          color: 0x4cd7a1,
          emissive: 0x32b886,
          emissiveIntensity: 1.15,
          roughness: 0.2,
        }),
      );
      anillo.rotation.x = Math.PI / 2;
      anillo.position.y = 1.45;
      for (let i = 0; i < 4; i++) {
        const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.65, 0.92), matAcento);
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        aleta.position.set(Math.cos(ang) * 0.96, 1.25, Math.sin(ang) * 0.96);
        aleta.rotation.y = -ang;
        g.add(aleta);
      }
      g.add(base, nucleo, tapaFoil, anillo, crearSombraContacto(tex.sombraContacto, 1.95));
      break;
    }

    case 'invernadero': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 2.4), matOscuro);
      base.position.y = 0.175;
      const cultivoMat = new THREE.MeshStandardMaterial({
        map: tex.cultivoAlbedo,
        normalMap: tex.cultivoNormal,
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughness: 0.78,
      });
      const cama1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.36, 0.72), cultivoMat);
      cama1.position.set(0, 0.52, -0.5);
      const cama2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.36, 0.72), cultivoMat);
      cama2.position.set(0, 0.52, 0.5);
      const luzUv = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.06, 0.18),
        new THREE.MeshBasicMaterial({ color: 0xd980fa }),
      );
      luzUv.position.set(0, 1.32, 0);
      const domo = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 3.0, 14, 1, false, 0, Math.PI),
        new THREE.MeshPhysicalMaterial({
          color: 0xd0ffe8,
          roughness: 0.08,
          clearcoat: 1,
          transparent: true,
          opacity: isSoftwareGl ? 0.34 : 0.38,
          depthWrite: false,
        }),
      );
      domo.rotation.z = Math.PI / 2;
      domo.rotation.y = Math.PI / 2;
      domo.position.y = 0.35;
      const arco = new THREE.Mesh(new THREE.TorusGeometry(1.17, 0.05, 8, 18, Math.PI), matMetal);
      arco.position.set(0, 0.35, 0);
      arco.rotation.y = Math.PI / 2;
      g.add(base, cama1, cama2, luzUv, domo, arco, crearSombraContacto(tex.sombraContacto, 2.15));
      break;
    }

    case 'reciclador': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.26, 1.8), matOscuro);
      base.position.y = 0.13;
      const matAgua = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0b4c75,
        emissiveIntensity: 0.6,
        roughness: 0.12,
        metalness: 0.2,
        clearcoat: 1,
      });
      const tanque1 = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.9, 16), matMetal);
      tanque1.position.set(-0.6, 1.15, 0);
      const tanque2 = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.9, 16), matAgua);
      tanque2.position.set(0.6, 1.15, 0);
      const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.16, 16), matMetal);
      aro.position.set(0.6, 1.15, 0);
      const tubo = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.11, 10, 20, Math.PI),
        matAcento,
      );
      tubo.position.set(0, 2.1, 0);
      g.add(base, tanque1, tanque2, aro, tubo, crearSombraContacto(tex.sombraContacto, 1.8));
      break;
    }

    case 'blindaje': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.25, 6), matOscuro);
      base.position.y = 0.125;
      const muro1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.65, 0.35), matMetal);
      muro1.position.set(0, 1.0, -0.7);
      const muro2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.45, 0.35), matAcento);
      muro2.position.set(-1.1, 0.9, 0.2);
      muro2.rotation.y = Math.PI / 3;
      const muro3 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.45, 0.35), matAcento);
      muro3.position.set(1.1, 0.9, 0.2);
      muro3.rotation.y = -Math.PI / 3;
      g.add(base, muro1, muro2, muro3, crearSombraContacto(tex.sombraContacto, 2.0));
      break;
    }

    case 'zona-descanso': {
      const soporte1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 1.55), matOscuro);
      soporte1.position.set(-0.9, 0.21, 0);
      const soporte2 = soporte1.clone();
      soporte2.position.x = 0.9;
      const modulo = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.7, 18), matMetal);
      modulo.rotation.z = Math.PI / 2;
      modulo.position.y = 1.2;
      const anillo1 = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.18, 18), matAcento);
      anillo1.rotation.z = Math.PI / 2;
      anillo1.position.set(-0.9, 1.2, 0);
      const anillo2 = anillo1.clone();
      anillo2.position.x = 0.9;
      const ventanaMat = new THREE.MeshBasicMaterial({ color: 0xf9ca5c });
      const marcoMat = matOscuro;
      [-0.48, 0.48].forEach((vx) => {
        const marco = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 14), marcoMat);
        marco.rotation.x = Math.PI / 2;
        marco.position.set(vx, 1.25, 0.93);
        const cristal = new THREE.Mesh(new THREE.CircleGeometry(0.22, 14), ventanaMat);
        cristal.position.set(vx, 1.25, 0.98);
        g.add(marco, cristal);
      });
      g.add(soporte1, soporte2, modulo, anillo1, anillo2, crearSombraContacto(tex.sombraContacto, 1.9));
      break;
    }

    case 'gimnasio': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.28, 2.0), matOscuro);
      base.position.y = 0.14;
      const arco1 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.1, 10, 20, Math.PI), matAcento);
      arco1.position.set(0, 0.3, -0.5);
      const arco2 = arco1.clone();
      arco2.position.z = 0.5;
      const cinta = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.24, 0.8), matMetal);
      cinta.position.set(0, 0.4, 0);
      const volante = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 16), matFoil);
      volante.rotation.z = Math.PI / 2;
      volante.position.set(0.5, 0.78, 0);
      g.add(base, arco1, arco2, cinta, volante, crearSombraContacto(tex.sombraContacto, 1.9));
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

    case 'sojourner':
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
      const chasis = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.45, 6), matMetal);
      chasis.position.y = 0.85;
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8), matMetal);
        pata.position.set(Math.cos(ang) * 0.72, 0.45, Math.sin(ang) * 0.72);
        pata.rotation.z = Math.cos(ang) * 0.45;
        pata.rotation.x = -Math.sin(ang) * 0.45;
        const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 10), matFoil);
        pie.position.set(Math.cos(ang) * 0.96, 0.04, Math.sin(ang) * 0.96);
        g.add(pata, pie);
      }
      const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 8), matMetal);
      mastil.position.y = 1.65;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.7), matSolar);
      panel.position.set(0, 2.3, 0);
      panel.rotation.x = 0.3;
      const camara = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.28), matFoil);
      camara.position.set(0.32, 1.38, 0.32);
      g.add(chasis, mastil, panel, camara, crearSombraContacto(tex.sombraContacto, 1.4));
      break;
    }
  }

  habilitarSombras(g);
  return g;
}

export function crearNodoInteractivo3D(
  tipo: 'hielo' | 'averia' | 'historia',
  tex: ConjuntoTexturas,
): THREE.Group {
  const g = new THREE.Group();

  if (tipo === 'hielo') {
    const matHielo = new THREE.MeshPhysicalMaterial({
      map: tex.hieloAlbedo,
      normalMap: tex.hieloNormal,
      normalScale: new THREE.Vector2(1.2, 1.2),
      color: 0x8ae4ff,
      emissive: 0x16648f,
      emissiveIntensity: 0.65,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });
    for (let i = 0; i < 4; i++) {
      const cristal = new THREE.Mesh(new THREE.ConeGeometry(0.22 + i * 0.03, 0.8 + (i % 2) * 0.35, 6), matHielo);
      const ang = (i * Math.PI) / 2;
      cristal.position.set(Math.cos(ang) * 0.22, 0.4, Math.sin(ang) * 0.22);
      cristal.rotation.z = Math.cos(ang) * 0.25;
      cristal.rotation.x = Math.sin(ang) * 0.25;
      g.add(cristal);
    }
    const hazHielo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.22, 3.2, 8),
      new THREE.MeshBasicMaterial({
        color: 0x7be0ff,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    hazHielo.position.y = 1.9;
    g.add(hazHielo);
    g.add(crearSombraContacto(tex.sombraContacto, 0.9));
  } else {
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
  }

  return g;
}
