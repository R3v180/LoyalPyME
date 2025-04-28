// filename: frontend/vite.config.ts
// Version: 1.1.0 (Add server host and proxy configuration)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- Bloque Añadido/Modificado ---
  server: {
    host: true, // Permite a Vite escuchar en todas las IPs locales (0.0.0.0)
               // y no solo en localhost. Necesario para acceso desde la red.
    port: 5173, // Mantenemos el puerto estándar (opcional si no cambia)
    proxy: {
      // Cualquier petición desde el frontend que empiece por '/api'
      // será redirigida al servidor backend que corre en localhost:3000
      '/api': {
        target: 'http://localhost:3000', // La URL base de tu backend
        changeOrigin: true, // Importante para que el backend reciba bien la petición
        // secure: false, // Generalmente no necesario para http local
        // rewrite: (path) => path.replace(/^\/api/, ''), // No necesario si tu backend espera /api/...
      },
      // Añadimos también una regla para las rutas públicas que creamos
      '/public': {
         target: 'http://localhost:3000', // También apuntan al backend
         changeOrigin: true,
      }
      // Puedes añadir más reglas de proxy aquí si fuera necesario en el futuro
    }
  }
  // --- Fin Bloque Añadido/Modificado ---
})

// End of file: frontend/vite.config.ts