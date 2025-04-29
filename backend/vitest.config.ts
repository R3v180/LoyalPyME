// backend/vitest.config.ts (Opcional por ahora)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Para no tener que importar describe, it, expect, etc.
    environment: 'node', // Entorno de Node.js
    // setupFiles: ['./tests/setup.ts'], // Archivo opcional para configuración global
    coverage: {
      provider: 'v8', // o 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
  },
});