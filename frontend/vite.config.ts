// filename: frontend/vite.config.ts
// Version: 1.1.3 (Use mergeConfig to combine Vite and Vitest configs)

// Importar defineConfig y mergeConfig de Vite
import { defineConfig, mergeConfig } from 'vite';
// Importar defineConfig de Vitest con un alias
import { defineConfig as defineVitestConfig } from 'vitest/config';

import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

// Configuración específica de Vite
const viteConfig = defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: true,
    port: 5173,
    https: true,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/public': { target: 'http://localhost:3000', changeOrigin: true }
    }
  },
  // Aquí irían otras opciones específicas de Vite si las tuvieras
});

// Configuración específica de Vitest
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts', // Seguimos necesitando este archivo
    css: true,
  },
  // Aquí irían otras opciones específicas de Vitest si las tuvieras
});

// Exportar la configuración combinada
export default mergeConfig(viteConfig, vitestConfig);

// End of File: frontend/vite.config.ts