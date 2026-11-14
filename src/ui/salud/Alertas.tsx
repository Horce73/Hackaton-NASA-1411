import { alertasSalud } from '../../engine/salud';
import type { AlertaSalud, Estado } from '../../engine/tipos';
import { Icono } from '../comun/Icono';
import estilos from './Alertas.module.css';

// "Lucía, Marco y Aiko"
function nombres(lista: string[]): string {
  return lista.length === 1 ? lista[0] : `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
}

// Frases cortas en el tono del UX Brief: qué pasa y qué hacer.
function texto({ indicador, temprana }: AlertaSalud, quienes: string[]): string {
  const n = nombres(quienes);
  const varios = quienes.length > 1;
  if (temprana) return `Curiosity avisa: sube la radiación de ${n}. Protégete en la próxima tormenta solar.`;
  switch (indicador) {
    case 'radiacion':
      return `${n} ${varios ? 'han' : 'ha'} recibido mucha radiación. Evita salir fuera.`;
    case 'nutricion':
      return `${n} no ${varios ? 'comen' : 'come'} lo suficiente. Hace falta más comida.`;
    case 'suenoEstres':
      return `${n} ${varios ? 'necesitan' : 'necesita'} descansar. El descanso está bajo.`;
    case 'musculoHueso':
      return `${n} ${varios ? 'pierden' : 'pierde'} fuerza en músculos y huesos. Toca hacer ejercicio.`;
  }
}

export function Alertas({ partida }: { partida: Estado }) {
  // Una frase por problema, con todos los astronautas a los que afecta (vienen de peor a mejor).
  const grupos = new Map<string, { alerta: AlertaSalud; quienes: string[] }>();
  for (const alerta of alertasSalud(partida)) {
    const clave = `${alerta.indicador}-${alerta.temprana}`;
    const grupo = grupos.get(clave);
    if (grupo) grupo.quienes.push(alerta.astronauta);
    else grupos.set(clave, { alerta, quienes: [alerta.astronauta] });
  }

  return (
    <div className={estilos.alertas} role="status">
      {grupos.size === 0 ? (
        <p className={estilos.calma}>
          <Icono nombre="ok" /> Nadie está en peligro.
        </p>
      ) : (
        <ul>
          {[...grupos].map(([clave, { alerta, quienes }]) => (
            <li key={clave} data-temprana={alerta.temprana}>
              <Icono nombre="alerta" />
              <span>{texto(alerta, quienes)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
