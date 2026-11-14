import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './', // rutas relativas: sirve en GitHub Pages sin fijar el nombre del repo
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
