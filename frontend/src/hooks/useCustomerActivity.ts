// filename: frontend/src/hooks/useCustomerActivity.ts
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { ActivityLogItem, PaginatedActivityResponse } from '../types/customer'; // Importar tipos definidos

// Definir el tipo de retorno del hook
export interface UseCustomerActivityResult {
    activityLogs: ActivityLogItem[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    setPage: (page: number) => void; // Función para cambiar de página
    refetch: () => void; // Función para recargar la página actual
}

const ITEMS_PER_PAGE = 15; // Número de items por página

export const useCustomerActivity = (): UseCustomerActivityResult => {
    // Estados del hook
    const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);

    // Función para obtener los datos de una página específica
    const fetchActivity = useCallback(async (pageToFetch: number) => {
        setLoading(true);
        // No limpiar el error aquí necesariamente, podría ser útil verlo mientras carga
        // setError(null);
        console.log(`[useCustomerActivity] Fetching page ${pageToFetch}...`);

        try {
            const response = await axiosInstance.get<PaginatedActivityResponse>('/customer/activity', {
                params: {
                    page: pageToFetch,
                    limit: ITEMS_PER_PAGE,
                },
            });

            const data = response.data;
            if (data && Array.isArray(data.logs)) {
                setActivityLogs(data.logs);
                setTotalPages(data.totalPages ?? 1);
                setTotalItems(data.totalItems ?? 0);
                setCurrentPage(data.currentPage ?? pageToFetch); // Usar la página devuelta por la API si existe
                setError(null); // Limpiar error en caso de éxito
                console.log(`[useCustomerActivity] Fetch successful for page ${pageToFetch}. Total Items: ${data.totalItems}`);
            } else {
                console.error('[useCustomerActivity] Invalid response structure:', data);
                throw new Error('La respuesta del servidor para el historial no tiene el formato esperado.');
            }

        } catch (err: any) {
            console.error(`[useCustomerActivity] Error fetching activity page ${pageToFetch}:`, err);
            const errorMsg = err.response?.data?.message || err.message || 'Error desconocido al cargar el historial.';
            setError(errorMsg);
            // No limpiar los logs existentes en caso de error de fetch, podría ser confuso
            // setActivityLogs([]);
            // setTotalPages(1);
            // setTotalItems(0);
            // setCurrentPage(1);
        } finally {
            setLoading(false);
            console.log(`[useCustomerActivity] Fetch process finished for page ${pageToFetch}.`);
        }
    }, []); // No necesita dependencias si usa 'currentPage' del estado

    // Función para establecer la página (disparará el useEffect)
    const setPage = useCallback((page: number) => {
        // Validar que la página esté dentro de los límites si ya conocemos totalPages
        if (page > 0 && (totalPages === 1 || page <= totalPages)) {
             if(page !== currentPage){ // Solo actualiza si la página es diferente
                console.log(`[useCustomerActivity] Setting page to: ${page}`);
                setCurrentPage(page);
             }
        } else {
             console.warn(`[useCustomerActivity] Attempted to set invalid page: ${page} (Total: ${totalPages})`);
        }
    }, [totalPages, currentPage]); // Depende de totalPages y currentPage

    // Efecto para la carga inicial
    useEffect(() => {
        console.log('[useCustomerActivity] Initial fetch triggered.');
        fetchActivity(1); // Cargar página 1 al montar
    }, [fetchActivity]);

    // Efecto para recargar cuando cambia la página (excepto en carga inicial)
    useEffect(() => {
        // Evitar recarga si es la carga inicial (manejada por el otro useEffect)
        // o si la página no es válida
        if (currentPage !== 1 && currentPage > 0 && (totalPages === 1 || currentPage <= totalPages)) {
             console.log(`[useCustomerActivity] Page changed to ${currentPage}, refetching...`);
            fetchActivity(currentPage);
        }
    }, [currentPage, fetchActivity, totalPages]); // Depende de currentPage

    // Función para recargar la página actual
    const refetch = useCallback(() => {
        console.log(`[useCustomerActivity] Manual refetch triggered for page ${currentPage}.`);
        fetchActivity(currentPage);
    }, [fetchActivity, currentPage]);


    // Retornar el estado y las funciones
    return {
        activityLogs,
        loading,
        error,
        currentPage,
        totalPages,
        totalItems,
        setPage,
        refetch
    };
};