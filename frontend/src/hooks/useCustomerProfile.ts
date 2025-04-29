// filename: frontend/src/hooks/useCustomerProfile.ts
// Version: 1.0.1 (Fix character encoding)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance'; // Ajusta la ruta si es necesario
import { AxiosError } from 'axios';
// Importar el tipo UserData desde el archivo compartido (o definirlo aquí)
// TODO: Mover UserData y UseProfileResult a src/types/customer.ts o similar
import { UserData, UseProfileResult } from '../types/customer'; // Asume que ya existe en types

const useCustomerProfile = (): UseProfileResult => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true); // Cambiado a 'loading' para consistencia
    const [error, setError] = useState<string | null>(null); // Cambiado a 'error'

    const fetchProfile = useCallback(async () => {
        console.log('[useCustomerProfile] Fetching user profile...');
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<UserData>('/profile'); // Endpoint /api/profile
            if (response.data) {
                setUserData(response.data);
                console.log('[useCustomerProfile] User profile updated.');
            } else {
                // Esto no debería ocurrir si la API devuelve datos o un error
                console.warn('[useCustomerProfile] No user data received from /profile endpoint.');
                throw new Error("No se recibieron datos del usuario.");
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message)
                           ? err.response.data.message
                           : (err instanceof Error ? err.message : 'Ocurrió un error desconocido.'); // Corregido: Ocurrió
            setError(`Error al cargar tu perfil: ${errorMsg}`);
             setUserData(null); // Limpiar datos en caso de error
        } finally {
            setLoading(false);
            console.log('[useCustomerProfile] Fetch user profile finished.');
        }
    }, []); // useCallback sin dependencias externas

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]); // Ejecutar en el montaje

    // Devolver estado y función de refresco con nombres consistentes
    return { userData, loading, error, refetch: fetchProfile }; // Cambiado loadingUser->loading, errorUser->error, refreshUserProfile->refetch
};

export default useCustomerProfile;

// End of File: frontend/src/hooks/useCustomerProfile.ts