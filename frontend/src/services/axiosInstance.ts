// File: frontend/src/services/axiosInstance.ts
// Version: 1.0.1

import axios from 'axios';

// Define la URL base de tu API backend
const API_BASE_URL = 'http://localhost:3000/api';

// Crea una instancia de Axios con la configuración base
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Añade un interceptor de peticiones (request interceptor)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // CORRECCIÓN: Usar el método set() para añadir la cabecera.
      // Axios se encarga de la inicialización del objeto headers si es necesario.
      config.headers.set('Authorization', `Bearer ${token}`);
      // console.log('Token added to request headers:', config.headers.get('Authorization')); // Descomentar para depurar
    } else {
      // console.log('No token found in localStorage'); // Descomentar para depurar
    }
    return config;
  },
  (error) => {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Opcional: Interceptor de respuestas (sin cambios respecto al anterior)
/*
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request (401). Token might be invalid or expired.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
*/

// Exporta la instancia configurada
export default axiosInstance;

// End of File: frontend/src/services/axiosInstance.ts