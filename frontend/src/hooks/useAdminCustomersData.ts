// filename: frontend/src/hooks/useAdminCustomersData.ts
// Version: 1.0.1 (Remove unused AxiosError import)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance'; // Ajusta la ruta si es necesario
// REMOVED: AxiosError // No longer needed directly

// --- Tipos necesarios para este hook (copiados/adaptados del archivo de origen) ---
// Idealmente, estos tipos vivirían en un archivo de tipos compartidos
interface Customer { id: string; name?: string | null; email: string; points: number; currentTier?: { id: string; name: string; level?: number; } | null; createdAt: string; isFavorite?: boolean; isActive?: boolean; }
interface CustomerApiResponse { items: Customer[]; totalPages: number; currentPage: number; totalItems: number; }
type SortColumn = 'name' | 'email' | 'points' | 'createdAt' | 'isActive' | 'isFavorite' | 'currentTier.level';
interface SortStatus { column: SortColumn; direction: 'asc' | 'desc'; }

// Interfaz para las opciones de filtro que se pasarán al fetch
interface CustomerFilters {
    search?: string;
    isFavorite?: boolean;
    isActive?: boolean;
}

// Interfaz para el resultado que el hook devolverá
interface UseAdminCustomersDataResult {
    customers: Customer[];
    loading: boolean;
    error: string | null;
    totalPages: number;
    currentPage: number;
    totalItems: number;
    searchTerm: string;
    sortStatus: SortStatus;
    filters: CustomerFilters;
    setPage: (page: number) => void;
    setSearchTerm: (term: string) => void;
    setSortStatus: (status: SortStatus) => void;
    setFilters: (filters: CustomerFilters) => void;
    refetch: () => Promise<void>; // Función para recargar datos manualmente
}
// --- Fin Tipos ---


const useAdminCustomersData = (): UseAdminCustomersDataResult => {
    // --- Estados gestionados por el hook ---
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activePage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortStatus, setSortStatus] = useState<SortStatus>({ column: 'createdAt', direction: 'desc' });
    // Estados para los filtros adicionales
    const [filters, setFilters] = useState<CustomerFilters>({});
    // --- Fin Estados ---

    // --- Función de carga de datos (Centralizada en el hook) ---
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);

        console.log(`[useAdminCustomersData] Fetching customers: Page=${activePage}, Search='${searchTerm}', SortBy=${sortStatus.column}, SortDir=${sortStatus.direction}, Filters=`, filters);

        try {
            const params = new URLSearchParams({
                page: activePage.toString(),
                limit: '10', // Límite fijo por ahora, podría ser configurable
                sortBy: sortStatus.column,
                sortDir: sortStatus.direction
            });

            // Añadir parámetros de filtro si existen y no son undefined/null
            if (searchTerm) params.append('search', searchTerm);
            if (filters.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
            if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

            const response = await axiosInstance.get<CustomerApiResponse>(`/admin/customers?${params.toString()}`);
            const apiData = response.data;

            if (apiData && Array.isArray(apiData.items) && typeof apiData.currentPage === 'number' && typeof apiData.totalPages === 'number' && typeof apiData.totalItems === 'number') {
                setCustomers(apiData.items);
                setTotalPages(apiData.totalPages);
                setTotalItems(apiData.totalItems);
                // Asegurar que la página actual reportada por el backend coincide o ajustar
                // Si el backend devuelve una página que no esperábamos (ej. > totalPages nuevas),
                // podríamos forzar setPage(apiData.currentPage) aquí, pero por ahora confiamos en el estado local.
                console.log(`[useAdminCustomersData] Fetched ${apiData.items.length} customers. Total: ${apiData.totalItems}, Pages: ${apiData.totalPages}.`);
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
             // Opcional: Resetear a página 1 en caso de error
             // setPage(1);
        } finally {
            setLoading(false);
        }
    }, [activePage, searchTerm, sortStatus.column, sortStatus.direction, filters]); // Dependencias de useCallback

    // --- Efectos para disparar la carga de datos ---

    // Efecto inicial para cargar datos al montar
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]); // Se ejecuta en el montaje y cuando fetchCustomers cambia (debido a sus dependencias)

    // Efecto para resetear la página a 1 cuando cambian los criterios que afectan el total de resultados
    useEffect(() => {
        // Si cambia el término de búsqueda o los filtros, volvemos a la primera página
        // Comparamos stringified para detectar cambios en el objeto filters
        setPage(1);
    }, [searchTerm, JSON.stringify(filters)]); // Depende de searchTerm y filters

    // --- Funciones para modificar el estado desde fuera del hook ---
    // Estas funciones son devueltas por el hook para que el componente las use

    const handleSetPage = useCallback((page: number) => {
        setPage(page);
        // El useEffect de fetchCustomers reaccionará a este cambio
    }, []);

     const handleSetSearchTerm = useCallback((term: string) => {
        setSearchTerm(term);
        // El useEffect para searchTerm/filters reaccionará y reseteará la página, luego fetchCustomers reaccionará.
    }, []);

    const handleSetSortStatus = useCallback((status: SortStatus) => {
        setSortStatus(status);
         // El useEffect para searchTerm/filters reaccionará (o no, si sort no afecta el total), luego fetchCustomers reaccionará.
    }, []);

    const handleSetFilters = useCallback((newFilters: CustomerFilters) => {
        // Fusionar con filtros existentes si no quieres reemplazar completamente
        setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
         // El useEffect para searchTerm/filters reaccionará y reseteará la página, luego fetchCustomers reaccionará.
    }, []);

    const refetch = useCallback(async () => {
        // Llama directamente a la función de carga con los estados actuales
        await fetchCustomers();
    }, [fetchCustomers]); // Depende de fetchCustomers

    // --- Valores y funciones que el hook expone ---
    return {
        customers,
        loading,
        error,
        totalPages,
        currentPage: activePage,
        totalItems,
        searchTerm,
        sortStatus,
        filters, // También exponemos los filtros actuales si el padre necesita leerlos
        setPage: handleSetPage,
        setSearchTerm: handleSetSearchTerm,
        setSortStatus: handleSetSortStatus,
        setFilters: handleSetFilters, // Exponemos la función para que el padre controle los filtros
        refetch,
    };
};

export default useAdminCustomersData;

// End of File: frontend/src/hooks/useAdminCustomersData.ts