// filename: frontend/src/hooks/useUserProfileData.ts
// Version: 1.1.0 (Import and use UserData type with benefits from types/customer)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
// --- MODIFICACIÓN: Importar tipos desde el archivo central ---
import { UserData, UseProfileResult } from '../types/customer'; // Asume ruta correcta
// --- FIN MODIFICACIÓN ---

// --- ELIMINADO: Definición local de UserData eliminada ---
// export interface UserData { ... } // <- Eliminada
// --- FIN ELIMINADO ---

// Tipo de Retorno del Hook (ya no se define aquí si se importa de types/customer)
// interface UseUserProfileDataReturn { ... } // <- Eliminada si UseProfileResult se importa

/**
 * Hook para obtener y gestionar los datos del perfil del usuario logueado.
 */
// --- MODIFICACIÓN: Usar tipo importado UseProfileResult ---
export const useUserProfileData = (): UseProfileResult => {
// --- FIN MODIFICACIÓN ---

    // --- MODIFICACIÓN: Usar tipo importado UserData para el estado ---
    const [userData, setUserData] = useState<UserData | null>(null);
    // --- FIN MODIFICACIÓN ---
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Función para obtener el perfil
    const fetchUserProfile = useCallback(async () => {
        console.log('[useUserProfileData] Fetching user profile...');
        setLoading(true);
        setError(null);
        try {
            // --- MODIFICACIÓN: Usar tipo importado UserData en la llamada GET ---
            const response = await axiosInstance.get<UserData>('/profile');
            // --- FIN MODIFICACIÓN ---
            if (response.data) {
                // El response.data ahora debería coincidir con la interfaz UserData actualizada
                setUserData(response.data);
                console.log('[useUserProfileData] User profile updated. Tier benefits:', response.data.currentTier?.benefits); // Log para verificar
            } else {
                console.warn('[useUserProfileData] No user data received from /profile endpoint.');
                setUserData(null);
            }
        } catch (err) {
            console.error("[useUserProfileData] Error fetching user profile:", err);
            const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            let detailedError = `Error al cargar perfil: ${errorMsg}.`;
            if (err instanceof AxiosError && err.response) { detailedError += ` (Status: ${err.response.status})`; }
            setError(detailedError);
            setUserData(null);
        } finally {
            setLoading(false);
            console.log('[useUserProfileData] Fetch user profile finished.');
        }
    }, []);

    // Efecto para la carga inicial
    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Retornar estado y función de refresco
    return {
        userData,
        loading,
        error,
        refetch: fetchUserProfile
    };
};

export default useUserProfileData;

// End of File: frontend/src/hooks/useUserProfileData.ts