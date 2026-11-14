import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { guardarPartida } from '../../state/guardado';
import { crearEstadoInicial, reducer, type Accion, type EstadoApp } from '../../state/reducer';

const Contexto = createContext<{ estado: EstadoApp; dispatch: Dispatch<Accion> } | null>(null);

export function ProveedorEstado({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, undefined, () => crearEstadoInicial());
  useEffect(() => guardarPartida(estado), [estado]); // RF-12
  return <Contexto.Provider value={{ estado, dispatch }}>{children}</Contexto.Provider>;
}

export function useEstado() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useEstado se usa dentro de ProveedorEstado.');
  return valor;
}
