// frontend/src/modules/camarero/services/publicOrderApiService.ts
// Version 2.0.0 - Updated submission handler with rewards logic

import axios from 'axios';
import {
    CreateOrderPayloadDto,
    AddItemsToOrderPayloadDto,
    BackendOrderResponse,
    OrderItemFE,
    CreateOrderItemDto, // Importar este tipo
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


/**
 * Orquesta el envío de un nuevo pedido o la adición de ítems a uno existente,
 * incluyendo la información de las recompensas canjeadas.
 * 
 * @param cartItems - Los ítems en el carrito del frontend.
 * @param generalOrderNotes - Notas generales para el pedido.
 * @param activeOrderId - ID del pedido activo, si se están añadiendo ítems.
 * @param businessSlug - El slug del negocio.
 * @param tableIdentifier - El identificador de la mesa.
 * @param requestingCustomerId - El ID del cliente LCo logueado.
 * @param appliedDiscountId - El ID de la recompensa de descuento aplicada al total.
 * @returns La respuesta del backend con el ID y número del pedido.
 */
export const handleOrderSubmission = async (
    cartItems: OrderItemFE[],
    generalOrderNotes: string,
    activeOrderId: string | null,
    businessSlug: string,
    tableIdentifier: string | undefined,
    requestingCustomerId: string | null | undefined,
    appliedDiscountId: string | null | undefined // <-- ACEPTAR EL NUEVO ARGUMENTO
): Promise<BackendOrderResponse> => {
    
    // Mapear los items del carrito al DTO que espera el backend.
    // Ahora incluimos el `redeemedRewardId` si existe.
    const dtoItems: CreateOrderItemDto[] = cartItems.map(feItem => ({
        menuItemId: feItem.menuItemId,
        quantity: feItem.quantity,
        notes: getProcessedNotesValue(feItem.notes),
        selectedModifierOptions: feItem.selectedModifiers.length > 0
            ? feItem.selectedModifiers.map(sm => ({ modifierOptionId: sm.modifierOptionId }))
            : [],
        redeemedRewardId: feItem.redeemedRewardId || null, // Incluir el ID de la recompensa del ítem
    }));

    if (activeOrderId) {
        // --- LÓGICA PARA AÑADIR A PEDIDO EXISTENTE ---
        const payloadForAdd: AddItemsToOrderPayloadDto = {
            items: dtoItems,
            customerNotes: getProcessedNotesValue(generalOrderNotes),
            // Pasamos el descuento aquí también. El backend decidirá si puede aplicarlo
            // o si ya existe uno.
            appliedLcoRewardId: appliedDiscountId || null,
        };
        const response = await addItemsToExistingOrderApi(activeOrderId, businessSlug, payloadForAdd);
        return { ...response, id: activeOrderId };

    } else {
        // --- LÓGICA PARA CREAR UN NUEVO PEDIDO ---
        const payloadForCreate: CreateOrderPayloadDto = {
            items: dtoItems,
            customerNotes: getProcessedNotesValue(generalOrderNotes),
            tableIdentifier: tableIdentifier || null,
            customerId: requestingCustomerId || null,
            appliedLcoRewardId: appliedDiscountId || null, // Pasar el ID del descuento aplicado
        };
        return submitNewOrder(businessSlug, payloadForCreate);
    }
};