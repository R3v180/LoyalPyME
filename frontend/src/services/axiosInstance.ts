// File: frontend/src/services/axiosInstance.ts
// Version: 1.0.3 (Reverted port to 3000)

import axios from 'axios';

// Define la URL base de tu API backend
// --- CAMBIO: Apuntar de nuevo al puerto 3000 ---
const API_BASE_URL = 'http://localhost:3000/api';
// --- FIN CAMBIO ---

// Crea una instancia de Axios con la configuración base
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Añade un interceptor de peticiones (request interceptor)
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

// End of File: frontend/src/services/axiosInstance.ts