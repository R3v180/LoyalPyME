// filename: backend/src/admin/admin-stats.service.ts
// Version: 1.1.0 (Add previous period data for trend calculation)

import { PrismaClient, UserRole, QrCodeStatus } from '@prisma/client';
// Importar más funciones de date-fns
import { startOfDay, endOfDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Interface actualizada para incluir datos del periodo anterior.
 */
export interface AdminOverviewStatsData {
  totalActiveCustomers: number;          // Valor puntual, no necesita periodo previo
  newCustomersLast7Days: number;
  newCustomersPrevious7Days: number; // NUEVO
  pointsIssuedLast7Days: number;
  pointsIssuedPrevious7Days: number; // NUEVO
  rewardsRedeemedLast7Days: number;    // Nota: Solo cuenta regalos canjeados actualmente
  rewardsRedeemedPrevious7Days: number;// NUEVO
}

/**
 * Calcula las estadísticas clave y los datos del periodo anterior para el overview.
 * @param businessId - El ID del negocio.
 * @returns Un objeto con las estadísticas calculadas (periodo actual y anterior).
 * @throws Error si ocurre un problema al consultar la base de datos.
 */
export const getOverviewStats = async (businessId: string): Promise<AdminOverviewStatsData> => {
  console.log(`[AdminStatsService] Calculando overview stats (con periodo previo) para businessId: ${businessId}`);

  try {
    // --- Definir Rangos de Fechas ---
    const now = new Date();
    // Últimos 7 días (incluyendo hoy)
    const startOfLast7Days = startOfDay(subDays(now, 6)); // Incluye 7 días completos
    const endOfLast7Days = now; // Hasta el momento actual

    // 7 días anteriores (el periodo justo antes de los últimos 7 días)
    const startOfPrevious7Days = startOfDay(subDays(now, 13)); // Inicio de hace 14 días
    const endOfPrevious7Days = endOfDay(subDays(now, 7));   // Fin del día de hace 7 días

    console.log(`[AdminStatsService] Date Ranges - Last 7: ${startOfLast7Days.toISOString()} - ${endOfLast7Days.toISOString()}`);
    console.log(`[AdminStatsService] Date Ranges - Prev 7: ${startOfPrevious7Days.toISOString()} - ${endOfPrevious7Days.toISOString()}`);


    // --- Ejecutar Consultas en Paralelo (Ahora 7 consultas) ---
    const [
      totalActiveCustomers,        // Único valor puntual
      newCustomersLast7Days,
      pointsIssuedResultLast7Days,
      rewardsRedeemedLast7Days,
      // Consultas para el periodo anterior
      newCustomersPrevious7Days,
      pointsIssuedResultPrevious7Days,
      rewardsRedeemedPrevious7Days,
    ] = await Promise.all([
      // 1. Total Clientes Activos (sigue igual)
      prisma.user.count({ where: { businessId, isActive: true, role: UserRole.CUSTOMER_FINAL } }),

      // --- Consultas para los Últimos 7 Días ---
      // 2. Nuevos Clientes (Últimos 7 días)
      prisma.user.count({ where: { businessId, role: UserRole.CUSTOMER_FINAL, createdAt: { gte: startOfLast7Days, lte: endOfLast7Days } } }),
      // 3. Puntos Otorgados (Últimos 7 días)
      prisma.qrCode.aggregate({ _sum: { pointsEarned: true }, where: { businessId, status: QrCodeStatus.COMPLETED, completedAt: { gte: startOfLast7Days, lte: endOfLast7Days } } }),
      // 4. Recompensas Canjeadas (Últimos 7 días) - Solo regalos por ahora
      prisma.grantedReward.count({ where: { businessId, status: 'REDEEMED', redeemedAt: { gte: startOfLast7Days, lte: endOfLast7Days } } }),

      // --- Consultas para los 7 Días Anteriores ---
      // 5. Nuevos Clientes (7 días previos)
      prisma.user.count({ where: { businessId, role: UserRole.CUSTOMER_FINAL, createdAt: { gte: startOfPrevious7Days, lte: endOfPrevious7Days } } }),
      // 6. Puntos Otorgados (7 días previos)
      prisma.qrCode.aggregate({ _sum: { pointsEarned: true }, where: { businessId, status: QrCodeStatus.COMPLETED, completedAt: { gte: startOfPrevious7Days, lte: endOfPrevious7Days } } }),
      // 7. Recompensas Canjeadas (7 días previos) - Solo regalos por ahora
      prisma.grantedReward.count({ where: { businessId, status: 'REDEEMED', redeemedAt: { gte: startOfPrevious7Days, lte: endOfPrevious7Days } } }),
    ]);

    // Extraer sumas de puntos (pueden ser null si no hubo)
    const pointsIssuedLast7Days = pointsIssuedResultLast7Days._sum.pointsEarned ?? 0;
    const pointsIssuedPrevious7Days = pointsIssuedResultPrevious7Days._sum.pointsEarned ?? 0;

    const result = {
      totalActiveCustomers,
      newCustomersLast7Days,
      newCustomersPrevious7Days,
      pointsIssuedLast7Days,
      pointsIssuedPrevious7Days,
      rewardsRedeemedLast7Days,
      rewardsRedeemedPrevious7Days,
    };

    console.log(`[AdminStatsService] Stats calculadas (con periodo previo) para ${businessId}:`, result);

    // Devolver el objeto con todos los resultados
    return result;

  } catch (error) {
    console.error(`[AdminStatsService] Error al calcular overview stats (con periodo previo) para business ${businessId}:`, error);
    throw new Error('Error al obtener las estadísticas del dashboard.');
  }
};

// End of file: backend/src/admin/admin-stats.service.ts