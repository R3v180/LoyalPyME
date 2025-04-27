// filename: frontend/src/services/adminService.ts
// Version: 1.0.0

import axiosInstance from './axiosInstance'; // Ajusta la ruta si es necesario

/**
 * Interface que define la estructura de los datos de estadísticas
 * devueltos por el endpoint del backend /api/admin/stats/overview
 */
export interface AdminOverviewStats {
  totalActiveCustomers: number;
  newCustomersLast7Days: number;
  pointsIssuedLast7Days: number;
  rewardsRedeemedLast7Days: number;
}

/**
 * Obtiene las estadísticas clave para el dashboard del administrador desde la API.
 * @returns Una promesa que resuelve con el objeto AdminOverviewStats.
 * @throws Lanza un error si la petición a la API falla.
 */
export const getAdminDashboardStats = async (): Promise<AdminOverviewStats> => {
  console.log('[AdminService] Fetching dashboard overview stats...');
  try {
    // Hacemos la petición GET al endpoint relativo definido en el backend
    const response = await axiosInstance.get<AdminOverviewStats>('/admin/stats/overview');

    // Si la petición es exitosa (status 2xx), axiosInstance devuelve response.data
    // ya tipado como AdminOverviewStats gracias a <AdminOverviewStats>
    console.log('[AdminService] Stats received:', response.data);
    return response.data;

  } catch (error: any) {
    // Si hay un error en la petición (red, status 4xx, 5xx)
    console.error('[AdminService] Error fetching dashboard stats:', error);

    // Construimos un mensaje de error más descriptivo
    const errorMessage = error.response?.data?.message || // Mensaje específico del backend
                         error.message ||                 // Mensaje genérico del error
                         'Error desconocido al obtener estadísticas.';

    // Relanzamos el error para que el componente que llama (AdminOverview)
    // pueda manejarlo y mostrar una notificación al usuario.
    throw new Error(errorMessage);
  }
};

// Aquí podrían añadirse otras funciones de servicio relacionadas con el admin en el futuro
// (ej: getAdminSettings, updateAdminProfile, etc.)

// End of file: frontend/src/services/adminService.ts