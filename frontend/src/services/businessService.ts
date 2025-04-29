// filename: frontend/src/services/businessService.ts
// Version: 1.1.1 (Remove meta-comments, fix encoding)

import axios from 'axios'; // Usamos axios base, NO axiosInstance, porque es una ruta pública

/**
 * Interface para la estructura de datos de cada negocio en la lista pública.
 * Contiene lo necesario para un desplegable (valor y etiqueta).
 */
export interface BusinessOption {
  id: string;
  name: string;
}

// Usar ruta relativa para que funcione con el proxy de Vite
// El proxy definido en vite.config.ts para '/public' redirigirá esto
const PUBLIC_BUSINESS_LIST_URL = '/public/businesses/public-list';


/**
 * Obtiene la lista pública de negocios (ID y Nombre) desde la API.
 * @returns Una promesa que resuelve con un array de objetos BusinessOption.
 * @throws Lanza un error si la petición a la API falla.
 */
export const getPublicBusinessList = async (): Promise<BusinessOption[]> => {
  console.log('[BusinessService] Fetching public business list...');
  try {
    // La llamada ahora usa la URL relativa
    const response = await axios.get<BusinessOption[]>(PUBLIC_BUSINESS_LIST_URL);

    console.log(`[BusinessService] Received ${response.data?.length ?? 0} businesses.`);
    return response.data || []; // Devolver array vacío si la data es null/undefined

  } catch (error: any) {
    console.error('[BusinessService] Error fetching public business list:', error);
    const errorMessage = error.response?.data?.message ||
                           error.message ||
                           'Error desconocido al obtener la lista de negocios.'; // Corregido: desconocido
    // Relanzar el error para que el componente que llama lo maneje (ej: en RegisterPage)
    throw new Error(errorMessage);
  }
};

// End of file: frontend/src/services/businessService.ts