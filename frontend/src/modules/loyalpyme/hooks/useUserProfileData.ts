// filename: frontend/src/hooks/useUserProfileData.ts
// Version: 1.5.0 (Return setUserData function and use imported types)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { AxiosError } from 'axios';
// Importar tipos desde el archivo central
import { UserData, UseProfileResult } from '../../../shared/types/user.types'; // Asegúrate que la ruta es correcta


/**
 * Hook para obtener y gestionar los datos del perfil del usuario logueado.
 */
export const useUserProfileData = (): UseProfileResult => { // <-- Usa tipo importado
    const [userData, setUserData] = useState<UserData | null>(null); // <-- Usa tipo importado
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserProfile = useCallback(async () => {
        console.log('[useUserProfileData] Fetching user profile...');
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<UserData>('/profile'); // <-- Usa tipo importado
            if (response.data) {
                setUserData(response.data);
                console.log('[useUserProfileData] User profile updated.');
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

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Devolver también setUserData
    // Asegúrate de que esta sección es idéntica en tu archivo:
    return {
        userData,
        loading,
        error,
        refetch: fetchUserProfile,
        setUserData // <-- La propiedad que falta según el error
    };
};

export default useUserProfileData;

// End of File: frontend/src/hooks/useUserProfileData.ts