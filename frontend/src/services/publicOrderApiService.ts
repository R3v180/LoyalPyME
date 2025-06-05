// frontend/src/services/publicOrderApiService.ts
// Version: 1.0.2 (Ensure payload parameters strictly expect string | null for optionals)

import axios from 'axios';
// Importar los DTOs desde el archivo de tipos centralizado
import {
    CreateOrderPayloadDto,    // Este DTO debería tener tableIdentifier y orderNotes como string | null
    AddItemsToOrderPayloadDto,  // Este DTO debería tener customerNotes como string | null
    BackendOrderResponse,
} from '../types/publicOrder.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

/**
 * Envía un nuevo pedido al backend.
 * @param businessSlug El slug del negocio.
 * @param payload Los datos del pedido, conforme a CreateOrderPayloadDto.
 * @returns Una promesa que resuelve con la respuesta del backend.
 */
export const submitNewOrder = async (
    businessSlug: string,
    payload: CreateOrderPayloadDto // Asegúrate que CreateOrderPayloadDto aquí use string | null para opcionales
): Promise<BackendOrderResponse> => {
    // console.log(`[PublicOrderApiService] Submitting NEW order to slug ${businessSlug}:`, JSON.stringify(payload, null, 2));
    try {
        const response = await axios.post<BackendOrderResponse>(`${API_BASE_URL}/order/${businessSlug}`, payload);
        // console.log(`[PublicOrderApiService] NEW order submission successful:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[PublicOrderApiService] Error submitting NEW order for slug ${businessSlug}:`, error);
        // Se relanza el error para que el componente que llama (PublicMenuViewPage) lo maneje y muestre la notificación.
        throw error;
    }
};

/**
 * Añade ítems a un pedido existente.
 * @param orderId El ID del pedido existente.
 * @param businessSlug El slug del negocio (para el header).
 * @param payload Los datos de los ítems a añadir, conforme a AddItemsToOrderPayloadDto.
 * @returns Una promesa que resuelve con la respuesta del backend.
 */
export const addItemsToExistingOrderApi = async (
    orderId: string,
    businessSlug: string,
    payload: AddItemsToOrderPayloadDto // Asegúrate que AddItemsToOrderPayloadDto aquí use string | null para opcionales
): Promise<BackendOrderResponse> => {
    // console.log(`[PublicOrderApiService] Adding items to existing order ${orderId} for business ${businessSlug}:`, JSON.stringify(payload, null, 2));
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (businessSlug) {
            headers['x-loyalpyme-business-slug'] = businessSlug;
        }
        const response = await axios.post<BackendOrderResponse>(
            `${API_BASE_URL}/order/${orderId}/items`,
            payload,
            { headers }
        );
        // console.log(`[PublicOrderApiService] Add items to order ${orderId} successful:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[PublicOrderApiService] Error adding items to order ${orderId}:`, error);
        throw error;
    }
};