// frontend/src/modules/loyalpyme/hooks/useCustomerPurchaseHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../../shared/services/axiosInstance';
import { CustomerOrder, PaginatedOrdersResponse } from '../types/history.types';

// Interfaz para el valor de retorno del hook
export interface UseCustomerPurchaseHistoryResult {
    orders: CustomerOrder[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    setPage: (page: number) => void;
    refetch: () => void;
}

const ITEMS_PER_PAGE = 10; // 10 pedidos por página

export const useCustomerPurchaseHistory = (): UseCustomerPurchaseHistoryResult => {
    const { t } = useTranslation();
    
    // Estados del hook
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);

    // Función para obtener los datos de una página específica
    const fetchOrders = useCallback(async (pageToFetch: number) => {
        setLoading(true);
        console.log(`[useCustomerPurchaseHistory] Fetching page ${pageToFetch}...`);

        try {
            const response = await axiosInstance.get<PaginatedOrdersResponse>('/customer/orders', {
                params: {
                    page: pageToFetch,
                    limit: ITEMS_PER_PAGE,
                },
            });

            const data = response.data;
            if (data && Array.isArray(data.orders)) {
                // Mapear la respuesta para asegurar que los campos Decimal (que llegan como string o number)
                // sean tratados como números en nuestro estado.
                const parsedOrders = data.orders.map(order => ({
                    ...order,
                    finalAmount: Number(order.finalAmount),
                    items: order.items.map(item => ({
                        ...item,
                        totalItemPrice: Number(item.totalItemPrice),
                        priceAtPurchase: Number(item.priceAtPurchase),
                        selectedModifiers: item.selectedModifiers.map(mod => ({
                            ...mod,
                            optionPriceAdjustmentSnapshot: Number(mod.optionPriceAdjustmentSnapshot)
                        }))
                    }))
                }));

                setOrders(parsedOrders);
                setTotalPages(data.totalPages ?? 1);
                setTotalItems(data.totalItems ?? 0);
                setCurrentPage(data.currentPage ?? pageToFetch);
                setError(null);
                console.log(`[useCustomerPurchaseHistory] Fetch successful for page ${pageToFetch}. Total Items: ${data.totalItems}`);
            } else {
                console.error('[useCustomerPurchaseHistory] Invalid response structure:', data);
                throw new Error(t('historyHook.error.invalidResponse', 'La respuesta del servidor para el historial de pedidos no tiene el formato esperado.'));
            }

        } catch (err: any) {
            console.error(`[useCustomerPurchaseHistory] Error fetching orders page ${pageToFetch}:`, err);
            const errorMsg = err.response?.data?.message || err.message || t('historyHook.error.unknown', 'Error desconocido al cargar el historial de pedidos.');
            setError(errorMsg);
        } finally {
            setLoading(false);
            console.log(`[useCustomerPurchaseHistory] Fetch process finished for page ${pageToFetch}.`);
        }
    }, [t]);

    // Función para establecer la página
    const setPage = useCallback((page: number) => {
        if (page > 0 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    }, [totalPages, currentPage]);
    
    // Efecto para la carga inicial y cuando cambia la página
    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage, fetchOrders]);


    // Función para recargar la página actual
    const refetch = useCallback(() => {
        console.log(`[useCustomerPurchaseHistory] Manual refetch triggered for page ${currentPage}.`);
        fetchOrders(currentPage);
    }, [fetchOrders, currentPage]);

    // Retornar el estado y las funciones
    return {
        orders,
        loading,
        error,
        currentPage,
        totalPages,
        totalItems,
        setPage,
        refetch
    };
};