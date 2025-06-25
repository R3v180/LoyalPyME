// filename: frontend/src/services/adminService.ts
// Version: 1.1.1 (Fix character encoding)

import axiosInstance from '../../../shared/services/axiosInstance'; // Usar instancia configurada

/**
 * Interface actualizada que define la estructura de los datos de estadísticas
 * devueltos por el endpoint del backend /api/admin/stats/overview,
 * incluyendo datos del periodo anterior para calcular tendencias.
 */
export interface AdminOverviewStats {
    totalActiveCustomers: number;       // Valor puntual
    newCustomersLast7Days: number;
    newCustomersPrevious7Days: number; // Para tendencia
    pointsIssuedLast7Days: number;
    pointsIssuedPrevious7Days: number; // Para tendencia
    rewardsRedeemedLast7Days: number;   // Nota: Solo cuenta regalos canjeados actualmente
    rewardsRedeemedPrevious7Days: number;// Para tendencia
}

/**
 * Obtiene las estadísticas clave (incluyendo datos previos) para el dashboard
 * del administrador desde la API.
 * @returns Una promesa que resuelve con el objeto AdminOverviewStats actualizado.
 * @throws Lanza un error si la petición a la API falla.
 */
export const getAdminDashboardStats = async (): Promise<AdminOverviewStats> => {
  console.log('[AdminService] Fetching dashboard overview stats (including previous period)...');
  try {
    // La petición GET sigue siendo la misma, espera la nueva estructura
    const response = await axiosInstance.get<AdminOverviewStats>('/admin/stats/overview');

    // AxiosInstance ya está tipado con la interfaz AdminOverviewStats
    console.log('[AdminService] Stats received (with previous period):', response.data);
    return response.data;

  } catch (error: any) {
    console.error('[AdminService] Error fetching extended dashboard stats:', error);
    const errorMessage = error.response?.data?.message ||
                           error.message ||
                           'Error desconocido al obtener estadísticas extendidas.'; // Corregido: estadísticas, desconocido
    // Relanzamos para que el hook/componente que llama lo maneje
    throw new Error(errorMessage);
  }
};

// End of file: frontend/src/services/adminService.ts