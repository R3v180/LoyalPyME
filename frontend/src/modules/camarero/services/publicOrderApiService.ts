// frontend/src/modules/camarero/services/publicOrderApiService.ts (MODIFICADO)

import axios from 'axios';
import {
    CreateOrderPayloadDto,
    AddItemsToOrderPayloadDto,
    BackendOrderResponse,
    OrderItemFE,
} from '../types/publicOrder.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

const getProcessedNotesValue = (notesInput: string | null | undefined): string | null => {
    if (notesInput === null || notesInput === undefined) return null;
    const trimmed = notesInput.trim();
    return trimmed === "" ? null : trimmed;
};

export const submitNewOrder = async (
    businessSlug: string,
    payload: CreateOrderPayloadDto
): Promise<BackendOrderResponse> => {
    try {
        const response = await axios.post<BackendOrderResponse>(`${API_BASE_URL}/order/${businessSlug}`, payload);
        return response.data;
    } catch (error) {
        console.error(`[PublicOrderApiService] Error submitting NEW order for slug ${businessSlug}:`, error);
        throw error;
    }
};

export const addItemsToExistingOrderApi = async (
    orderId: string,
    businessSlug: string,
    payload: AddItemsToOrderPayloadDto
): Promise<BackendOrderResponse> => {
    try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (businessSlug) {
            headers['x-loyalpyme-business-slug'] = businessSlug;
        }
        const response = await axios.post<BackendOrderResponse>(
            `${API_BASE_URL}/order/${orderId}/items`,
            payload,
            { headers }
        );
        return response.data;
    } catch (error) {
        console.error(`[PublicOrderApiService] Error adding items to order ${orderId}:`, error);
        throw error;
    }
};


// --- CAMBIO PRINCIPAL: Se añade el parámetro 'requestingCustomerId' a la firma de la función ---
export const handleOrderSubmission = async (
    cartItems: OrderItemFE[],
    generalOrderNotes: string,
    activeOrderId: string | null,
    businessSlug: string,
    tableIdentifier?: string,
    requestingCustomerId?: string | null // <-- NUEVO PARÁMETRO
): Promise<BackendOrderResponse> => {
// --- FIN DEL CAMBIO ---

    const dtoItems = cartItems.map(feItem => ({
        menuItemId: feItem.menuItemId,
        quantity: feItem.quantity,
        notes: getProcessedNotesValue(feItem.notes),
        selectedModifierOptions: feItem.selectedModifiers.length > 0
            ? feItem.selectedModifiers.map(sm => ({ modifierOptionId: sm.modifierOptionId }))
            : [],
    }));

    // --- CAMBIO: Se elimina la lógica de leer localStorage de aquí ---
    // Ya no es necesario, el ID del cliente viene como argumento
    // let customerIdForPayload: string | null = null;
    // ... lógica de localStorage eliminada ...
    // --- FIN DEL CAMBIO ---

    if (activeOrderId) {
        // Al añadir ítems, el customerId ya está en el pedido original, no se pasa de nuevo.
        // Esta parte se mantiene igual.
        const payloadForAdd: AddItemsToOrderPayloadDto = {
            items: dtoItems,
            customerNotes: getProcessedNotesValue(generalOrderNotes),
        };
        const response = await addItemsToExistingOrderApi(activeOrderId, businessSlug, payloadForAdd);
        return { ...response, id: activeOrderId };
    } else {
        const payloadForCreate: CreateOrderPayloadDto = {
            items: dtoItems,
            customerNotes: getProcessedNotesValue(generalOrderNotes),
            tableIdentifier: tableIdentifier || null,
            // --- CAMBIO: Se usa el nuevo parámetro ---
            customerId: requestingCustomerId || null,
            // --- FIN DEL CAMBIO ---
        };
        return submitNewOrder(businessSlug, payloadForCreate);
    }
};