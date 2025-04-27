// filename: frontend/src/hooks/useAdminCustomers.ts
// Version: 1.0.0 (Initial extraction)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance'; // Ajusta si es necesario

// --- Interfaces ---
// TODO: Mover estas interfaces a archivos compartidos (e.g., src/types/)

export interface Customer {
    id: string;
    name?: string | null;
    email: string;
    points: number;
    currentTier?: {
        id: string;
        name: string;
        level?: number; // Asegurarse que esto existe en el backend si se usa para ordenar
    } | null;
    createdAt: string; // Considerar usar Date si se transforma
    isFavorite?: boolean;
    isActive?: boolean;
}

interface CustomerApiResponse {
    items: Customer[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

export interface SortStatus {
    column: keyof Customer | 'currentTier.level' | 'createdAt'; // Incluir todos los campos ordenables
    direction: 'asc' | 'desc';
}

// --- Tipo de Retorno del Hook ---
interface UseAdminCustomersReturn {
    customers: Customer[];
    loading: boolean;
    error: string | null;
    activePage: number;
    totalPages: number;
    setPage: (page: number) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortStatus: SortStatus;
    handleSort: (column: SortStatus['column']) => void;
    refreshData: () => void; // Para recargar manualmente
}

const DEBOUNCE_DELAY = 500; // ms

/**
 * Hook para gestionar la obtención, búsqueda, paginación y ordenación
 * de la lista de clientes para administradores.
 */
export const useAdminCustomers = (): UseAdminCustomersReturn => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTermState] = useState<string>('');
    const [activePage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortStatus, setSortStatus] = useState<SortStatus>({ column: 'createdAt', direction: 'desc' });

    // Función principal para obtener datos
    const fetchCustomers = useCallback(async (page = 1, search = '', sort = sortStatus) => {
        setLoading(true);
        setError(null);
        console.log(`[useAdminCustomers] Fetching: page=${page}, search=${search}, sortBy=${sort.column}, sortDir=${sort.direction}`);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10', // Podría ser configurable en el futuro
                sortBy: sort.column,
                sortDir: sort.direction,
            });
            if (search.trim()) { // Solo añadir si no está vacío
                params.append('search', search.trim());
            }
            // TODO: Añadir filtro 'isFavorite' si se implementa el checkbox

            const response = await axiosInstance.get<CustomerApiResponse>(`/admin/customers?${params.toString()}`);
            const apiData = response.data;

            // Validar respuesta
            if (apiData && Array.isArray(apiData.items) && typeof apiData.currentPage === 'number' && typeof apiData.totalPages === 'number') {
                setCustomers(apiData.items);
                setPage(apiData.currentPage);
                setTotalPages(apiData.totalPages);
                console.log("[useAdminCustomers] Data updated.");
            } else {
                console.error("[useAdminCustomers] Invalid API response structure:", apiData);
                throw new Error("La respuesta del servidor no tiene el formato esperado.");
            }
        } catch (err: any) {
            console.error("[useAdminCustomers] Error fetching customers:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Error desconocido al cargar clientes.';
            setError(errorMsg);
            // Resetear estado en caso de error
            setCustomers([]);
            setPage(1);
            setTotalPages(1);
        } finally {
            setLoading(false);
            console.log("[useAdminCustomers] Fetch finished.");
        }
    }, []); // No necesita dependencias externas fijas, usa los params que le pasan

    // Handler para cambiar la ordenación
    const handleSort = useCallback((column: SortStatus['column']) => {
        setSortStatus(current => {
            const isSameColumn = column === current.column;
            // Si es la misma columna, invertimos dirección, si no, empezamos por 'asc'
            const direction = isSameColumn ? (current.direction === 'asc' ? 'desc' : 'asc') : 'asc';
            return { column, direction };
        });
        setPage(1); // Volver a la página 1 al cambiar el orden
        console.log(`[useAdminCustomers] Sort changed. New status: ${column} ${sortStatus.direction}. Resetting page to 1.`);
    }, []); // Dependencia sortStatus.direction eliminada para evitar bucles si se llama rápido

    // Handler para cambiar el término de búsqueda (resetea página)
    const setSearchTerm = useCallback((term: string) => {
        setSearchTermState(term);
        setPage(1); // Volver a la página 1 al buscar
        console.log(`[useAdminCustomers] Search term changed. Resetting page to 1.`);
    }, []);

    // Efecto para la carga inicial (solo al montar)
    useEffect(() => {
        console.log("[useAdminCustomers] Initial fetch effect running...");
        fetchCustomers(1, '', { column: 'createdAt', direction: 'desc' });
    }, [fetchCustomers]); // Depende solo de fetchCustomers (que es estable por useCallback)

    // Efecto para debounce de búsqueda, paginación y ordenación
    useEffect(() => {
        console.log(`[useAdminCustomers] Debounce effect triggered for page: ${activePage}, search: ${searchTerm}, sort: ${sortStatus.column}/${sortStatus.direction}`);
        // No ejecutar en la carga inicial si searchTerm está vacío (ya lo hizo el otro effect)
        const isInitialLoad = activePage === 1 && searchTerm === '' && sortStatus.column === 'createdAt' && sortStatus.direction === 'desc';

        // Creamos el timeout
        const handler = setTimeout(() => {
             // Evitar llamada redundante en la carga inicial si el estado coincide exactamente con el fetch inicial
            if (!isInitialLoad || (activePage !== 1 || searchTerm !== '' || sortStatus.column !== 'createdAt' || sortStatus.direction !== 'desc')) {
                 console.log("[useAdminCustomers] Debounce timeout executing fetch...");
                 fetchCustomers(activePage, searchTerm, sortStatus);
             } else {
                 console.log("[useAdminCustomers] Debounce skipped fetch (initial load state).");
             }
        }, DEBOUNCE_DELAY);

        // Limpiar el timeout si alguna dependencia cambia antes de que se ejecute
        return () => {
            console.log("[useAdminCustomers] Clearing debounce timeout.");
            clearTimeout(handler);
        };
    }, [activePage, searchTerm, sortStatus, fetchCustomers]); // Depende de estos estados/funciones

    // Función para refrescar datos manualmente
    const refreshData = useCallback(() => {
        console.log("[useAdminCustomers] Manual refresh triggered.");
        fetchCustomers(activePage, searchTerm, sortStatus);
    }, [activePage, searchTerm, sortStatus, fetchCustomers]);

    // Devolvemos el estado y las funciones que necesita el componente UI
    return {
        customers,
        loading,
        error,
        activePage,
        totalPages,
        setPage, // Pasamos el setPage original de useState
        searchTerm,
        setSearchTerm, // Pasamos nuestro setSearchTerm que resetea página
        sortStatus,
        handleSort, // Pasamos nuestro handleSort que resetea página
        refreshData
    };
};