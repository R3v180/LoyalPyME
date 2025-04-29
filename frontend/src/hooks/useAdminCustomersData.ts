// filename: frontend/src/hooks/useAdminCustomersData.ts
// Version: 1.1.2 (Export required types)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';

// --- Tipos necesarios (AHORA EXPORTADOS) ---
// Idealmente, mover a un archivo /types/ compartido más adelante
export interface Customer { id: string; name?: string | null; email: string; points: number; currentTier?: { id: string; name: string; level?: number; } | null; createdAt: string; isFavorite?: boolean; isActive?: boolean; }
interface CustomerApiResponse { items: Customer[]; totalPages: number; currentPage: number; totalItems: number; }
export type SortColumn = 'name' | 'email' | 'points' | 'createdAt' | 'isActive' | 'isFavorite' | 'currentTier.level'; // Exportar si se usa fuera
export interface SortStatus { column: SortColumn; direction: 'asc' | 'desc'; }
export interface CustomerFilters {
    search?: string;
    isFavorite?: boolean;
    isActive?: boolean;
    tierId?: string;
}

// Interfaz para el resultado que el hook devolverá (AHORA EXPORTADA)
export interface UseAdminCustomersDataResult {
    customers: Customer[];
    loading: boolean;
    error: string | null;
    totalPages: number;
    currentPage: number; // <--- Nombre corregido aquí en la definición
    totalItems: number;
    searchTerm: string;
    sortStatus: SortStatus;
    filters: CustomerFilters;
    setPage: (page: number) => void;
    setSearchTerm: (term: string) => void;
    setSortStatus: (status: SortStatus) => void; // Acepta el objeto SortStatus completo
    setFilters: (filters: Partial<CustomerFilters>) => void;
    refetch: () => Promise<void>; // <--- Nombre corregido aquí en la definición
}
// --- Fin Tipos ---


const useAdminCustomersData = (): UseAdminCustomersDataResult => {
    // Estados
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activePage, setPage] = useState(1); // Mantenemos activePage internamente
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortStatus, setSortStatusState] = useState<SortStatus>({ column: 'createdAt', direction: 'desc' }); // Renombrar setter interno
    const [filters, setFiltersState] = useState<CustomerFilters>({}); // Renombrar setter interno

    // Función de carga de datos
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log(`[useAdminCustomersData] Fetching customers: Page=${activePage}, Search='${searchTerm}', SortBy=${sortStatus.column}, SortDir=${sortStatus.direction}, Filters=`, filters);
        try {
            const params = new URLSearchParams({
                page: activePage.toString(),
                limit: '10',
                sortBy: sortStatus.column,
                sortDir: sortStatus.direction
            });
            if (searchTerm) params.append('search', searchTerm);
            if (filters.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
            if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
            if (filters.tierId) { params.append('tierId', filters.tierId); }

            const response = await axiosInstance.get<CustomerApiResponse>(`/admin/customers?${params.toString()}`);
            const apiData = response.data;

            if (apiData && Array.isArray(apiData.items) && typeof apiData.currentPage === 'number' && typeof apiData.totalPages === 'number' && typeof apiData.totalItems === 'number') {
                setCustomers(apiData.items);
                setTotalPages(apiData.totalPages);
                setTotalItems(apiData.totalItems);
                // Ajustar página activa si la API devuelve una página diferente (ej. si se eliminaron datos)
                if(apiData.currentPage !== activePage && apiData.currentPage <= apiData.totalPages) {
                   setPage(apiData.currentPage);
                } else if (activePage > apiData.totalPages && apiData.totalPages > 0) {
                   setPage(apiData.totalPages); // Ir a la última página si la actual ya no existe
                } else if (apiData.totalPages === 0) {
                   setPage(1); // Resetear a 1 si no hay resultados
                }

                console.log(`[useAdminCustomersData] Fetched ${apiData.items.length} customers. Total: ${apiData.totalItems}, Pages: ${apiData.totalPages}. Current page state: ${activePage}`);
            } else {
                console.error("[useAdminCustomersData] Invalid paginated response structure:", apiData);
                throw new Error("La respuesta del servidor no tiene el formato esperado.");
            }
        } catch (err: any) {
            console.error("[useAdminCustomersData] Error fetching customers:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Error desconocido al cargar clientes.';
            setError(errorMsg);
            setCustomers([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [activePage, searchTerm, sortStatus, filters]); // Dependencias correctas

    // Efecto para Carga Inicial y Recarga
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]); // Se relanza si cambia fetchCustomers (que depende de activePage, searchTerm, sortStatus, filters)

    // Efecto para resetear página al cambiar filtros/búsqueda
     useEffect(() => {
        // Solo resetear si no es la carga inicial (evitar doble fetch inicial)
        // y si activePage no es ya 1
        if (activePage !== 1) {
             console.log("[useAdminCustomersData] Search or filters changed, resetting page to 1.");
             setPage(1);
        }
    }, [searchTerm, filters]); // Depender solo de searchTerm y filters (como objeto)


    // Funciones Setters (ahora usan los setters internos renombrados)
    const handleSetPage = useCallback((page: number) => { setPage(page); }, []);
    const handleSetSearchTerm = useCallback((term: string) => { setSearchTerm(term); }, []);
    const handleSetSortStatus = useCallback((status: SortStatus) => { setSortStatusState(status); }, []); // Usa setSortStatusState
    const handleSetFilters = useCallback((newFilters: Partial<CustomerFilters>) => {
        setFiltersState(prevFilters => { // Usa setFiltersState
            const updatedFilters = { ...prevFilters };
             for (const key in newFilters) {
                if (Object.prototype.hasOwnProperty.call(newFilters, key)) {
                    const filterKey = key as keyof CustomerFilters;
                    const value = newFilters[filterKey];
                    if (value === undefined || value === '') { // Considerar string vacío como quitar filtro también
                        delete updatedFilters[filterKey];
                    } else {
                        if ((filterKey === 'isActive' || filterKey === 'isFavorite') && typeof value === 'boolean') {
                            updatedFilters[filterKey] = value;
                        } else if ((filterKey === 'search' || filterKey === 'tierId') && typeof value === 'string') {
                            updatedFilters[filterKey] = value;
                        } else {
                            console.warn(`[useAdminCustomersData] Ignorando filtro con tipo inesperado para key '${filterKey}':`, value);
                        }
                    }
                }
            }
            console.log('[useAdminCustomersData] Filters updated:', updatedFilters);
            return updatedFilters;
        });
    }, []);

    // Refetch
    const refetch = useCallback(async () => { await fetchCustomers(); }, [fetchCustomers]);

    // Retorno del hook
    return {
        customers, loading, error, totalPages,
        currentPage: activePage, // Exponer como currentPage
        totalItems, searchTerm, sortStatus, filters,
        setPage: handleSetPage,
        setSearchTerm: handleSetSearchTerm,
        setSortStatus: handleSetSortStatus, // Exponer la función que usa el setter interno
        setFilters: handleSetFilters,       // Exponer la función que usa el setter interno
        refetch,                            // Exponer como refetch
    };
};

export default useAdminCustomersData;

// End of File: frontend/src/hooks/useAdminCustomersData.ts