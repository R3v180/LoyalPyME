// frontend/src/services/adminCustomerService.ts
import axiosInstance from '../../../shared/services/axiosInstance';
import { CustomerDetails } from '../components/admin/CustomerDetailsModal';
// Customer ya no se importa directamente aquí si la respuesta de la API es diferente

// ... (otros tipos de Payload sin cambios) ...
interface UpdateNotesPayload { notes: string | null; }
interface AdjustPointsPayload { amount: number; reason: string | null; }
interface ChangeTierPayload { tierId: string | null; }
interface AssignRewardPayload { rewardId: string; }
interface BulkStatusPayload { customerIds: string[]; isActive: boolean; }
interface BulkDeletePayload { customerIds: string[]; }
interface BulkAdjustPointsPayload { customerIds: string[]; amount: number; reason: string | null; }

// --- CORRECCIÓN EN CustomerActionResponse ---
// Definir la estructura del objeto 'customer' que devuelve la API para estas acciones
interface CustomerUpdatePartial {
    id: string;
    points?: number;          // Hacer opcional si no siempre viene
    currentTierId?: string | null; // Propiedad directa del backend
    tierAchievedAt?: string | null; // Propiedad directa del backend
    isFavorite?: boolean;     // Hacer opcional
    isActive?: boolean;       // Hacer opcional
    // Añadir cualquier otro campo que la API devuelva en el objeto 'customer'
}

export interface CustomerActionResponse {
    message: string;
    customer: CustomerUpdatePartial; // Usar el nuevo tipo
}
// --- FIN CORRECCIÓN ---

export interface GrantedRewardIdResponse {
    message: string;
    grantedRewardId: string;
}

export interface BulkOperationResponse {
    message: string;
    count: number;
}

// --- Funciones del Servicio (sin cambios en la lógica, solo usan el tipo corregido) ---

export const getCustomerDetailsApi = async (customerId: string): Promise<CustomerDetails> => {
    const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customerId}/details`);
    return response.data;
};

export const updateCustomerNotesApi = async (customerId: string, notes: string | null): Promise<{ message: string }> => {
    const payload: UpdateNotesPayload = { notes };
    const response = await axiosInstance.patch<{ message: string }>(`/admin/customers/${customerId}/notes`, payload);
    return response.data;
};

export const adjustCustomerPointsApi = async (customerId: string, amount: number, reason: string | null): Promise<CustomerActionResponse> => {
    const payload: AdjustPointsPayload = { amount, reason };
    const response = await axiosInstance.post<CustomerActionResponse>(`/admin/customers/${customerId}/adjust-points`, payload);
    return response.data;
};

export const changeCustomerTierApi = async (customerId: string, tierId: string | null): Promise<CustomerActionResponse> => {
    const payload: ChangeTierPayload = { tierId };
    const response = await axiosInstance.put<CustomerActionResponse>(`/admin/customers/${customerId}/tier`, payload);
    return response.data;
};

export const assignRewardToCustomerApi = async (customerId: string, rewardId: string): Promise<GrantedRewardIdResponse> => {
    const payload: AssignRewardPayload = { rewardId };
    const response = await axiosInstance.post<GrantedRewardIdResponse>(`/admin/customers/${customerId}/assign-reward`, payload);
    return response.data;
};

export const toggleCustomerFavoriteApi = async (customerId: string): Promise<CustomerActionResponse> => {
    const response = await axiosInstance.patch<CustomerActionResponse>(`/admin/customers/${customerId}/toggle-favorite`);
    return response.data;
};

export const toggleCustomerActiveApi = async (customerId: string): Promise<CustomerActionResponse> => {
    const response = await axiosInstance.patch<CustomerActionResponse>(`/admin/customers/${customerId}/toggle-active`);
    return response.data;
};

export const bulkUpdateCustomerStatusApi = async (customerIds: string[], isActive: boolean): Promise<BulkOperationResponse> => {
    const payload: BulkStatusPayload = { customerIds, isActive };
    const response = await axiosInstance.patch<BulkOperationResponse>('/admin/customers/bulk-status', payload);
    return response.data;
};

export const bulkDeleteCustomersApi = async (customerIds: string[]): Promise<BulkOperationResponse> => {
    const payload: BulkDeletePayload = { customerIds };
    const response = await axiosInstance.delete<BulkOperationResponse>('/admin/customers/bulk-delete', { data: payload });
    return response.data;
};

export const bulkAdjustCustomerPointsApi = async (customerIds: string[], amount: number, reason: string | null): Promise<BulkOperationResponse> => {
    const payload: BulkAdjustPointsPayload = { customerIds, amount, reason };
    const response = await axiosInstance.post<BulkOperationResponse>('/admin/customers/bulk-adjust-points', payload);
    return response.data;
};