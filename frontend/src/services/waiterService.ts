// frontend/src/services/waiterService.ts
// Version: 1.0.0 (Initial service for waiter actions: get ready items, mark as served)

import axiosInstance from './axiosInstance'; // Nuestra instancia de Axios configurada con interceptor de token
import { ReadyPickupItem, OrderItemStatusUpdateResponse } from '../types/camarero.types'; // Tipos que definimos antes
import { OrderItemStatus } from '../types/customer'; // Para el payload de actualización

const WAITER_STAFF_API_BASE = '/camarero/staff'; // Prefijo base para las rutas de este servicio

/**
 * Obtiene la lista de ítems de pedido que están listos para ser recogidos.
 * Llama a GET /api/camarero/staff/ready-for-pickup
 * @returns Una promesa que resuelve con un array de ReadyPickupItem.
 */
export const getReadyForPickupItems = async (): Promise<ReadyPickupItem[]> => {
    console.log('[WaiterService] Fetching items ready for pickup...');
    try {
        const response = await axiosInstance.get<ReadyPickupItem[]>(`${WAITER_STAFF_API_BASE}/ready-for-pickup`);
        console.log(`[WaiterService] Successfully fetched ${response.data?.length || 0} ready items.`);
        return response.data || []; // Devolver array vacío si no hay datos
    } catch (error) {
        // El error ya debería ser manejado y logueado por el interceptor de axiosInstance,
        // pero podemos añadir un log específico aquí si es necesario.
        console.error("[WaiterService] Error fetching ready for pickup items:", error);
        // Relanzar para que el hook o componente que llama pueda manejarlo (ej. mostrar UI de error)
        throw error; 
    }
};

/**
 * Marca un OrderItem específico como SERVED.
 * Llama a PATCH /api/camarero/staff/order-items/:orderItemId/status
 * @param orderItemId - El ID del OrderItem a actualizar.
 * @returns Una promesa que resuelve con la respuesta del backend (OrderItemStatusUpdateResponse).
 */
export const markOrderItemAsServed = async (orderItemId: string): Promise<OrderItemStatusUpdateResponse> => {
    console.log(`[WaiterService] Marking order item ${orderItemId} as SERVED...`);
    try {
        // El backend espera un payload: { newStatus: "SERVED" }
        const payload = { newStatus: OrderItemStatus.SERVED }; 

        const response = await axiosInstance.patch<OrderItemStatusUpdateResponse>(
            `${WAITER_STAFF_API_BASE}/order-items/${orderItemId}/status`,
            payload
        );
        console.log(`[WaiterService] Successfully marked item ${orderItemId} as SERVED. Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[WaiterService] Error marking order item ${orderItemId} as served:`, error);
        throw error;
    }
};