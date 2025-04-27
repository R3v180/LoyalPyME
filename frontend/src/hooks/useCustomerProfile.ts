// filename: frontend/src/hooks/useCustomerProfile.ts
// Version: 1.0.0

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance'; // Ajusta la ruta si es necesario
import { AxiosError } from 'axios';
// Importar el tipo UserData desde el archivo compartido
import { UserData, UseProfileResult } from '../types/customer';

const useCustomerProfile = (): UseProfileResult => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<UserData>('/profile');
            if (response.data) {
                setUserData(response.data);
            } else {
                throw new Error("No se recibieron datos del usuario.");
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message)
                           ? err.response.data.message
                           : (err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
            setError(`Error al cargar tu perfil: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    }, []); // Sin dependencias externas por ahora

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]); // Ejecutar en el montaje

    return { userData, loading, error, refetch: fetchProfile };
};

export default useCustomerProfile;

// End of File: frontend/src/hooks/useCustomerProfile.ts