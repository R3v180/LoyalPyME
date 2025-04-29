// filename: frontend/src/hooks/useUserProfileData.ts
// Version: 1.0.1 (Fix encoding, standardize return value names)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';

// --- Interfaces ---
// TODO: Mover UserData y UseProfileResult a src/types/customer.ts o similar
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    role: string;
    currentTier?: {
        id: string;
        name: string;
    } | null;
    // Añadir businessId si se usa en algún sitio que llame a este hook
    // businessId: string;
}

// Tipo de Retorno del Hook (con nombres estandarizados)
interface UseUserProfileDataReturn {
    userData: UserData | null;
    loading: boolean; // Nombre estandarizado
    error: string | null; // Nombre estandarizado
    refetch: () => Promise<void>; // Nombre estandarizado
}
// --- Fin Tipos ---


/**
 * Hook para obtener y gestionar los datos del perfil del usuario logueado.
 */
export const useUserProfileData = (): UseUserProfileDataReturn => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Nombre estandarizado
    const [error, setError] = useState<string | null>(null); // Nombre estandarizado

    // Función para obtener el perfil
    const fetchUserProfile = useCallback(async () => {
        console.log('[useUserProfileData] Fetching user profile...');
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<UserData>('/profile');
            if (response.data) {
                setUserData(response.data);
                console.log('[useUserProfileData] User profile updated.');
            } else {
                console.warn('[useUserProfileData] No user data received from /profile endpoint.');
                setUserData(null); // Asegurarse que queda null si no hay datos
                // Considerar lanzar error si se espera siempre data
                // throw new Error("No se recibieron datos del usuario.");
            }
        } catch (err) {
            console.error("[useUserProfileData] Error fetching user profile:", err);
            const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido.'; // Corregido: Ocurrió
            let detailedError = `Error al cargar perfil: ${errorMsg}.`;
            if (err instanceof AxiosError && err.response) { detailedError += ` (Status: ${err.response.status})`; }
            setError(detailedError);
            setUserData(null); // Limpiar datos en caso de error
        } finally {
            setLoading(false);
            console.log('[useUserProfileData] Fetch user profile finished.');
        }
    }, []); // Sin dependencias

    // Efecto para la carga inicial
    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Retornar estado y función de refresco con nombres estandarizados
    return {
        userData,
        loading, // Nombre estandarizado
        error,   // Nombre estandarizado
        refetch: fetchUserProfile // Nombre estandarizado
    };
};

export default useUserProfileData; // Exportar con el nombre correcto

// End of File: frontend/src/hooks/useUserProfileData.ts