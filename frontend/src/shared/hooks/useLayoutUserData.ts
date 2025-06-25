// frontend/src/hooks/useLayoutUserData.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import type { UserData } from '../../types/customer';

interface UseLayoutUserDataReturn {
    userData: UserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
}

export const useLayoutUserData = (): UseLayoutUserDataReturn => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const handleLogout = useCallback(() => {
        console.log("[useLayoutUserData] Executing logout...");
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // También limpiar el usuario al hacer logout
        setUserData(null);
        if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        const fetchAndSetUserData = async () => {
            console.log("[useLayoutUserData] Starting user data check/fetch...");
            setLoadingUser(true);
            const token = localStorage.getItem('token');

            if (!token) {
                console.log("[useLayoutUserData] No token found. Ensuring user is null.");
                if (userData !== null) setUserData(null); // Asegurar que userData es null si no hay token
                setLoadingUser(false);
                return;
            }

            // SIEMPRE intentamos obtener de /api/profile si hay token para datos frescos
            console.log("[useLayoutUserData] Token found. Fetching user profile from API...");
            try {
                const response = await axiosInstance.get<UserData>('/profile');
                if (response.data && response.data.id && response.data.email && response.data.role) {
                    setUserData(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data)); // Actualizar localStorage con datos frescos
                    console.log("[useLayoutUserData] User data fetched from API and saved to localStorage:", response.data);
                } else {
                    console.error("[useLayoutUserData] Invalid or incomplete data received from API /profile endpoint. Logging out.");
                    handleLogout(); // Logout si API devuelve datos inválidos/incompletos
                }
            } catch (apiError: any) {
                console.error("[useLayoutUserData] Error fetching user profile from API:", apiError);
                // Si falla /profile (ej. token expirado o inválido), hacemos logout.
                // Esto también limpia el localStorage.
                // Podríamos intentar cargar desde localStorage como fallback aquí,
                // pero es más seguro hacer logout si /profile falla con un token existente.
                if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                    console.log("[useLayoutUserData] API /profile returned 401/403, logging out.");
                    handleLogout();
                } else {
                    // Otro error de red, etc. No necesariamente invalida el token.
                    // Podríamos intentar cargar desde localStorage como último recurso.
                    console.warn("[useLayoutUserData] API /profile fetch failed with other error. Attempting to load from localStorage if available.");
                    const storedUserJson = localStorage.getItem('user');
                    if (storedUserJson) {
                        try {
                            const parsed = JSON.parse(storedUserJson) as UserData;
                            if (parsed && parsed.id && parsed.email && parsed.role) {
                                setUserData(parsed);
                                console.log("[useLayoutUserData] Loaded stale data from localStorage due to API error.");
                            } else {
                                handleLogout(); // Stored data is invalid
                            }
                        } catch (e) {
                            handleLogout(); // Error parsing stored data
                        }
                    } else {
                        // No hay nada en localStorage y la API falló, nos rendimos y hacemos logout.
                        handleLogout();
                    }
                }
            } finally {
                setLoadingUser(false);
                console.log("[useLayoutUserData] User data fetch/check process finished.");
            }
        };

        fetchAndSetUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]); // handleLogout no necesita estar aquí si su referencia no cambia, pero navigate sí

    // useEffect para reaccionar a cambios en localStorage (ej: logout en otra pestaña)
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'token' || event.key === 'user') {
                console.log('[useLayoutUserData] localStorage changed in another tab. Re-evaluating auth state.');
                // Forzar una re-evaluación. Si 'token' es null, el efecto principal hará logout.
                // Si 'token' existe pero 'user' cambió (o se borró), el efecto principal debería recargar de /profile.
                // Una forma simple de forzarlo es recargar los datos.
                // O, si el token ya no existe, hacer logout.
                const token = localStorage.getItem('token');
                if (!token && userData !== null) { // Si el token se borró y teníamos datos, hacemos logout
                    handleLogout();
                } else if (token && (!userData || (event.key === 'user' && localStorage.getItem('user') !== JSON.stringify(userData)))) {
                    // Si hay token pero no userData, o si 'user' cambió, podemos forzar una recarga
                    // Esto es más complejo, por ahora, el efecto principal al montar/cambiar navigate debería ser suficiente
                    // para la mayoría de los casos de carga inicial.
                    // Para una sincronización perfecta entre pestañas, se necesitaría una lógica más robusta
                    // o una librería de gestión de estado global.
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [userData, handleLogout]);


    return { userData, loadingUser, handleLogout };
};