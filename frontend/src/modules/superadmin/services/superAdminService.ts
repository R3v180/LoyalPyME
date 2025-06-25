// frontend/src/services/superAdminService.ts

import axiosInstance from '../../../shared/services/axiosInstance';

// --- Tipos de Datos para Payloads y Respuestas ---

interface SetPricePayload {
    price: number;
    currency: string;
}

interface RecordPaymentPayload {
    amountPaid: number;
    month: number;
    year: number;
    notes?: string;
    paymentMethod?: string;
}

export interface BusinessPayment {
    id: string;
    paymentDate: string;
    amountPaid: number;
    month: number;
    year: number;
    paymentMethod: string | null;
    notes: string | null;
}

export interface UpdatedBusinessResponse {
    id: string;
    monthlyPrice: number | null;
    currency: string;
}

// --- NUEVO TIPO AÑADIDO ---
// El tipo de dato para cada periodo pendiente que devuelve la API
export interface PendingPeriod {
    year: number;
    month: number;
    label: string; // ej. "Junio 2025"
}


// --- Funciones del Servicio ---

/**
 * Llama a la API para establecer el precio de suscripción de un negocio.
 */
export const setSubscriptionPrice = async (businessId: string, payload: SetPricePayload): Promise<UpdatedBusinessResponse> => {
    try {
        const response = await axiosInstance.put<UpdatedBusinessResponse>(`/superadmin/businesses/${businessId}/subscription`, payload);
        return response.data;
    } catch (error) {
        console.error(`[SuperAdminService] Error setting subscription price for business ${businessId}:`, error);
        throw error;
    }
};

/**
 * Llama a la API para registrar un nuevo pago manual.
 */
export const recordPayment = async (businessId: string, payload: RecordPaymentPayload): Promise<BusinessPayment> => {
    try {
        const response = await axiosInstance.post<BusinessPayment>(`/superadmin/businesses/${businessId}/payments`, payload);
        return response.data;
    } catch (error) {
        console.error(`[SuperAdminService] Error recording payment for business ${businessId}:`, error);
        throw error;
    }
};

/**
 * Llama a la API para obtener el historial de pagos de un negocio.
 */
export const getPaymentHistory = async (businessId: string): Promise<BusinessPayment[]> => {
    try {
        const response = await axiosInstance.get<BusinessPayment[]>(`/superadmin/businesses/${businessId}/payments`);
        return response.data || [];
    } catch (error) {
        console.error(`[SuperAdminService] Error fetching payment history for business ${businessId}:`, error);
        throw error;
    }
};

// --- NUEVA FUNCIÓN AÑADIDA ---
/**
 * Llama a la API para obtener los periodos de pago pendientes para un negocio.
 * @param businessId - El ID del negocio.
 * @returns Una lista de los periodos pendientes.
 */
export const getPendingPaymentPeriods = async (businessId: string): Promise<PendingPeriod[]> => {
    try {
        const response = await axiosInstance.get<PendingPeriod[]>(`/superadmin/businesses/${businessId}/pending-payments`);
        return response.data || [];
    } catch (error) {
        console.error(`[SuperAdminService] Error fetching pending payment periods for business ${businessId}:`, error);
        throw error;
    }
};