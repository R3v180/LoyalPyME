// filename: frontend/src/services/businessService.ts
// Version: 1.0.0

import axios from 'axios'; // Usamos axios base, NO axiosInstance, porque es una ruta pública

/**
 * Interface para la estructura de datos de cada negocio en la lista pública.
 * Contiene lo necesario para un desplegable (valor y etiqueta).
 */
export interface BusinessOption {
  id: string;   // Se usará como el 'value' en el <Select>
  name: string; // Se usará como el 'label' en el <Select>
}

// URL completa del endpoint público que creamos en el backend
// NOTA: Hardcodeamos la URL base aquí como se hace en otras llamadas públicas (ej: auth)
// En una app más grande, la URL base podría venir de una variable de entorno de frontend.
const PUBLIC_BUSINESS_LIST_URL = 'http://localhost:3000/public/businesses/public-list';

/**
 * Obtiene la lista pública de negocios (ID y Nombre) desde la API.
 * @returns Una promesa que resuelve con un array de objetos BusinessOption.
 * @throws Lanza un error si la petición a la API falla.
 */
export const getPublicBusinessList = async (): Promise<BusinessOption[]> => {
  console.log('[BusinessService] Fetching public business list...');
  try {
    // Hacemos la petición GET a la URL pública, sin token
    const response = await axios.get<BusinessOption[]>(PUBLIC_BUSINESS_LIST_URL);

    // Axios devuelve los datos en response.data, ya tipado como BusinessOption[]
    console.log(`[BusinessService] Received ${response.data?.length ?? 0} businesses.`);
    return response.data || []; // Devolvemos los datos o un array vacío si no viene nada

  } catch (error: any) {
    console.error('[BusinessService] Error fetching public business list:', error);
    const errorMessage = error.response?.data?.message ||
                         error.message ||
                         'Error desconocido al obtener la lista de negocios.';
    // Relanzamos para que el componente RegisterPage maneje el error (ej: mostrando notificación)
    throw new Error(errorMessage);
  }
};

// End of file: frontend/src/services/businessService.ts