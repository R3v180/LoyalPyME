// filename: backend/src/admin/admin-stats.service.ts
// Version: 1.0.1 (Fix: Use string literal for GrantedReward status)

// CORRECCIÓN: Eliminado 'GrantedRewardStatus' de la importación
import { PrismaClient, UserRole, QrCodeStatus } from '@prisma/client'; 
import { startOfDay, endOfDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Interface para la estructura de datos devuelta por el servicio de estadísticas del overview.
 */
export interface AdminOverviewStatsData {
  totalActiveCustomers: number;
  newCustomersLast7Days: number;
  pointsIssuedLast7Days: number;
  rewardsRedeemedLast7Days: number; // Nota: Actualmente solo cuenta regalos canjeados
}

/**
 * Calcula las estadísticas clave para el overview del dashboard de administración.
 * @param businessId - El ID del negocio para el cual calcular las estadísticas.
 * @returns Un objeto con las estadísticas calculadas.
 * @throws Error si ocurre un problema al consultar la base de datos.
 */
export const getOverviewStats = async (businessId: string): Promise<AdminOverviewStatsData> => {
  console.log(`[AdminStatsService] Calculando overview stats para businessId: ${businessId}`);

  try {
    // --- Definir Rangos de Fechas ---
    const now = new Date();
    const startOf7DaysAgo = startOfDay(subDays(now, 6)); 

    // --- Ejecutar Consultas en Paralelo ---
    const [
      totalActiveCustomers,
      newCustomersLast7Days,
      pointsIssuedResult,
      rewardsRedeemedLast7Days,
    ] = await Promise.all([
      // 1. Total Clientes Activos
      prisma.user.count({
        where: {
          businessId: businessId,
          isActive: true,
          role: UserRole.CUSTOMER_FINAL,
        },
      }),
      // 2. Nuevos Clientes (Últimos 7 días)
      prisma.user.count({
        where: {
          businessId: businessId,
          role: UserRole.CUSTOMER_FINAL,
          createdAt: {
            gte: startOf7DaysAgo, 
            lte: now,             
          },
        },
      }),
      // 3. Puntos Otorgados (Últimos 7 días) - Suma de QrCodes completados
      prisma.qrCode.aggregate({
        _sum: {
          pointsEarned: true,
        },
        where: {
          businessId: businessId,
          status: QrCodeStatus.COMPLETED,
          completedAt: {
            gte: startOf7DaysAgo,
            lte: now,
          },
        },
      }),
      // 4. Recompensas Canjeadas (Últimos 7 días)
      //    NOTA: Asumiendo que el campo 'status' en GrantedReward es String y se usa 'REDEEMED'.
      //    Verificar que coincida con la lógica de canje en customer.service.ts.
      //    **No cuenta** canjes hechos directamente con puntos si no se loggean aparte.
      prisma.grantedReward.count({
        where: {
          businessId: businessId,
          // CORRECCIÓN: Usar string literal en lugar del Enum inexistente
          status: 'REDEEMED', 
          redeemedAt: { // Asumiendo que existe el campo 'redeemedAt' y se actualiza
            gte: startOf7DaysAgo,
            lte: now,
          },
        },
      }),
    ]);

    // Extraer suma de puntos (puede ser null si no hubo)
    const pointsIssuedLast7Days = pointsIssuedResult._sum.pointsEarned ?? 0;

    console.log(`[AdminStatsService] Stats calculadas para ${businessId}:`, {
        totalActiveCustomers,
        newCustomersLast7Days,
        pointsIssuedLast7Days,
        rewardsRedeemedLast7Days
    });

    // Devolver el objeto con los resultados
    return {
      totalActiveCustomers,
      newCustomersLast7Days,
      pointsIssuedLast7Days,
      rewardsRedeemedLast7Days,
    };

  } catch (error) {
    console.error(`[AdminStatsService] Error al calcular overview stats para business ${businessId}:`, error);
    throw new Error('Error al obtener las estadísticas del dashboard.');
  }
};

// End of file: backend/src/admin/admin-stats.service.ts