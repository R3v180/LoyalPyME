// filename: frontend/src/hooks/useUserProfileData.ts
// Version: 1.0.0 (Initial creation - focused hook)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';

// --- Interface ---
// TODO: Mover esta interfaz a archivos compartidos (e.g., src/types/user.ts)
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
}

// --- Tipo de Retorno del Hook ---
interface UseUserProfileDataReturn {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    refreshUserProfile: () => Promise<void>; // Función para refrescar manualmente
}

/**
 * Hook para obtener y gestionar los datos del perfil del usuario logueado.
 */
export const useUserProfileData = (): UseUserProfileDataReturn => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    const [errorUser, setErrorUser] = useState<string | null>(null);

    // Función para obtener el perfil
    const fetchUserProfile = useCallback(async () => {
        console.log('[useUserProfileData] Fetching user profile...');
        setLoadingUser(true);
        setErrorUser(null);
        try {
            const response = await axiosInstance.get<UserData>('/profile');
            if (response.data) {
                setUserData(response.data);
                console.log('[useUserProfileData] User profile updated.');
            } else {
                // Podríamos lanzar un error o simplemente dejar userData como null
                console.warn('[useUserProfileData] No user data received from /profile endpoint.');
                setUserData(null); // Asegurarse que queda null si no hay datos
            }
        } catch (err) {
            console.error("[useUserProfileData] Error fetching user profile:", err);
            const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            let detailedError = `Error al cargar perfil: ${errorMsg}.`;
             if (err instanceof AxiosError && err.response) { detailedError += ` (Status: ${err.response.status})`; }
            setErrorUser(detailedError);
            setUserData(null); // Limpiar datos en caso de error
        } finally {
            setLoadingUser(false);
            console.log('[useUserProfileData] Fetch user profile finished.');
        }
    }, []); // Sin dependencias, siempre llama al mismo endpoint

    // Efecto para la carga inicial
    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]); // Se ejecuta al montar

    // Retornamos el estado y la función de refresco
    return {
        userData,
        loadingUser,
        errorUser,
        refreshUserProfile: fetchUserProfile // Exponemos la función fetch como refresh
    };
};