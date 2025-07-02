// frontend/src/modules/camarero/services/publicOrderApiService.ts
// Version 2.0.1 - Corregida la importación del DTO.

import axios from 'axios';
import {
    CreateOrderPayloadDto,
    AddItemsToOrderPayloadDto,
    BackendOrderResponse,
    OrderItemFE,
    // --- CORRECCIÓN AQUÍ ---
    FrontendCreateOrderItemDto, // Importamos el tipo correcto que usa el payload
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

export const handleOrderSubmission = async (
    cartItems: OrderItemFE[],
    generalOrderNotes: string,
    activeOrderId: string | null,
    businessSlug: string,
    tableIdentifier: string | undefined,
    requestingCustomerId: string | null | undefined,
    appliedDiscountId: string | null | undefined
): Promise<BackendOrderResponse> => {
    
    // --- CORRECCIÓN AQUÍ ---
    // El tipo del array ahora es el DTO correcto que importamos.
    const dtoItems: FrontendCreateOrderItemDto[] = cartItems.map(feItem => ({
        menuItemId: feItem.menuItemId,
        quantity: feItem.quantity,
        notes: getProcessedNotesValue(feItem.notes),
        selectedModifierOptions: feItem.selectedModifiers.length > 0
            ? feItem.selectedModifiers.map(sm => ({ modifierOptionId: sm.modifierOptionId }))
            : [],
        redeemedRewardId: feItem.redeemedRewardId || null,
    }));

    if (activeOrderId) {
        const payloadForAdd: AddItemsToOrderPayloadDto = {
            items: dtoItems,
            customerNotes: getProcessedNotesValue(generalOrderNotes),
            appliedLcoRewardId: appliedDiscountId || null,
        };
        const response = await addItemsToExistingOrderApi(activeOrderId, businessSlug, payloadForAdd);
        return { ...response, id: activeOrderId };
    } else {
        const payloadForCreate: CreateOrderPayloadDto = {
            items: dtoItems,
            customerNotes: getProcessedNotesValue(generalOrderNotes),
            tableIdentifier: tableIdentifier || null,
            customerId: requestingCustomerId || null,
            appliedLcoRewardId: appliedDiscountId || null,
        };
        return submitNewOrder(businessSlug, payloadForCreate);
    }
};