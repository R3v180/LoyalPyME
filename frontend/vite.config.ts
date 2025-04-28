import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert' // Necesitarás instalarlo

export default defineConfig({
  plugins: [react(), mkcert()], // Añade mkcert()
  server: {
    host: true,
    port: 5173, // Puedes especificar el puerto aquí también
    https: true, // <-- AÑADE ESTA LÍNEA
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/public': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
})