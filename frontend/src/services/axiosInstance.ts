// filename: frontend/src/services/axiosInstance.ts
// Version: 1.1.0 (Use relative baseURL for Vite proxy)

import axios from 'axios';

// --- CAMBIO: Usar ruta relativa para baseURL ---
// Ahora que tenemos el proxy de Vite, las peticiones a /api
// serán redirigidas automáticamente a http://localhost:3000/api
// sin importar si accedemos al frontend desde localhost o desde la IP local.
const API_BASE_URL = '/api'; // Ruta relativa
// --- FIN CAMBIO ---

// Crea una instancia de Axios con la configuración base
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Añade un interceptor de peticiones (request interceptor) - SIN CAMBIOS
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Usar el método set() para añadir la cabecera.
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Opcional: Interceptor de respuestas
/*
axiosInstance.interceptors.response.use( ... );
*/

// Exporta la instancia configurada
export default axiosInstance;

// End of file: frontend/src/services/axiosInstance.ts