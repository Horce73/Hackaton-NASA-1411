import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Punto de entrada mínimo: la interfaz empieza en la fase 2.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <h1>Misión Legado</h1>
    </main>
  </StrictMode>,
);
