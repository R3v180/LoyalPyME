// filename: frontend/src/services/axiosInstance.ts
// Version: 1.1.1 (Remove meta-comments)

import axios from 'axios';

// Usar ruta relativa para baseURL
// El proxy de Vite redirigirá /api a http://localhost:3000/api
const API_BASE_URL = '/api'; // Ruta relativa para que funcione el proxy

// Crea una instancia de Axios con la configuración base
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Añade un interceptor de peticiones (request interceptor)
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener el token de localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Añadir la cabecera Authorization si existe el token
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config; // Devolver la configuración modificada (o la original si no hay token)
  },
  (error) => {
    // Manejar errores que ocurran durante la configuración de la petición
    console.error('Error in request interceptor:', error);
    return Promise.reject(error); // Rechazar la promesa con el error
  }
);

// Opcional: Añadir interceptor de respuestas aquí si fuera necesario
/*
axiosInstance.interceptors.response.use(
  (response) => {
    // Cualquier código de estado que este dentro del rango de 2xx causa la ejecución de esta función
    // Haz algo con los datos de la respuesta
    return response;
  },
  (error) => {
    // Cualquier código de estado que caiga fuera del rango de 2xx causa la ejecución de esta función
    // Por ejemplo, manejar errores 401/403 globales aquí
    if (error.response?.status === 401) {
      // Podríamos hacer logout automático aquí
      console.error("Unauthorized (401) response detected by interceptor.");
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // window.location.href = '/login'; // Redirección forzada
    }
    return Promise.reject(error); // Rechazar la promesa con el error
  }
);
*/

// Exporta la instancia configurada para usarla en otros servicios
export default axiosInstance;

// End of File: frontend/src/services/axiosInstance.ts