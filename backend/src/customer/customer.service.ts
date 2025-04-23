// File: backend/src/customer/customer.service.ts
 // Version: 1.0.0 (Initial service for customer actions)
 

 import { PrismaClient, Reward, Prisma } from '@prisma/client';
 

 const prisma = new PrismaClient();
 

 /**
  * Finds all active rewards for a specific business.
  * Used by customers to see available rewards.
  * @param businessId The ID of the business whose active rewards are to be fetched.
  * @returns A promise that resolves with an array of active reward objects.
  * @throws Error if there's a database error.
  */
 export const findActiveRewardsForCustomer = async (
  businessId: string
 ): Promise<Reward[]> => {
  console.log(
  `[CUSTOMER SVC] Finding active rewards for business: ${businessId}`
  );
  try {
  const rewards = await prisma.reward.findMany({
  where: {
  businessId: businessId, // Filtra por el ID del negocio del cliente
  isActive: true, // Filtra solo las recompensas activas
  },
  orderBy: {
  pointsCost: 'asc', // Opcional: Ordenar por coste de puntos ascendente
  },
  // No seleccionamos campos específicos, devolvemos el objeto Reward completo
  });
  console.log(
  `[CUSTOMER SVC] Found ${rewards.length} active rewards for business ${businessId}`
  );
  return rewards;
  } catch (error) {
  console.error(
  `[CUSTOMER SVC] Error fetching active rewards for business ${businessId}:`,
  error
  );
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
  throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
  }
  throw new Error('Error inesperado al buscar recompensas activas.');
  }
 };
 

 // Aquí podríamos añadir otras funciones de servicio específicas para clientes en el futuro
 

 // End of File: backend/src/customer/customer.service.ts