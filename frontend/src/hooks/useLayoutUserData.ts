// filename: frontend/src/hooks/useLayoutUserData.ts
// Version: 1.0.0 (Initial creation)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance'; // Ajusta la ruta si es necesario

// Interfaz simplificada para los datos del usuario necesarios en el layout
// Considerar moverla a un archivo de tipos compartido (e.g., src/types/user.ts) en el futuro
interface LayoutUserData {
    name?: string | null;
    email: string;
    role: string; // Considerar usar un Enum si está disponible en el frontend
}

// Tipo para el valor de retorno del hook
interface UseLayoutUserDataReturn {
    userData: LayoutUserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
}

/**
 * Hook personalizado para obtener y gestionar los datos básicos del usuario
 * necesarios en el MainLayout. Maneja la carga desde localStorage o API
 * y proporciona una función de logout.
 */
export const useLayoutUserData = (): UseLayoutUserDataReturn => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<LayoutUserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Función de Logout envuelta en useCallback para estabilidad referencial
    const handleLogout = useCallback(() => {
        console.log("Executing logout..."); // Log para depuración
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserData(null); // Limpiar estado local
        navigate('/login', { replace: true });
    }, [navigate]);

    useEffect(() => {
        const fetchUserData = async () => {
            console.log("[useLayoutUserData] Starting user data fetch..."); // Log inicio fetch
            setLoadingUser(true);
            try {
                // 1. Intentar cargar desde localStorage
                const storedUser = localStorage.getItem('user');
                let userFromStorage: LayoutUserData | null = null;
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        // Validar campos esenciales
                        if (parsed && typeof parsed.email === 'string' && typeof parsed.role === 'string') {
                            userFromStorage = {
                                email: parsed.email,
                                name: typeof parsed.name === 'string' ? parsed.name : null, // Asegurar que name sea string o null
                                role: parsed.role
                            };
                            console.log("[useLayoutUserData] User data found in localStorage:", userFromStorage);
                        } else {
                            console.warn("[useLayoutUserData] User data in localStorage is invalid or incomplete.");
                        }
                    } catch (e) {
                        console.error("[useLayoutUserData] Failed to parse user from localStorage:", e);
                        localStorage.removeItem('user'); // Limpiar si está corrupto
                    }
                } else {
                    console.log("[useLayoutUserData] No user data found in localStorage.");
                }

                // 2. Si existe en localStorage y es válido, usarlo
                if (userFromStorage) {
                    setUserData(userFromStorage);
                } else {
                    // 3. Si no, intentar obtener desde la API
                    console.log("[useLayoutUserData] Fetching user profile from API...");
                    try {
                        const response = await axiosInstance.get<LayoutUserData>('/profile');
                        if (response.data && response.data.email && response.data.role) {
                           setUserData(response.data);
                           // Opcional: Actualizar localStorage con los datos frescos de la API
                           localStorage.setItem('user', JSON.stringify(response.data));
                           console.log("[useLayoutUserData] User data fetched from API:", response.data);
                        } else {
                             console.error("[useLayoutUserData] Invalid data received from API profile endpoint.");
                             // Considerar logout si la API falla y no hay datos locales válidos?
                             handleLogout(); // Logout si la API falla y no teníamos nada válido
                        }
                    } catch (apiError: any) {
                         console.error("[useLayoutUserData] Error fetching user profile from API:", apiError);
                         // Logout si la llamada a la API falla (ej. token inválido/expirado)
                         if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                            console.log("[useLayoutUserData] API returned 401/403, logging out.");
                            handleLogout();
                         } else {
                             // Otro tipo de error de API, podríamos querer manejarlo diferente
                             // Por ahora, si falla la API y no teníamos nada de localStorage, hacemos logout
                             if (!userFromStorage) {
                                 handleLogout();
                             }
                         }
                    }
                }

            } catch (error) {
                // Error inesperado general durante el proceso
                console.error("[useLayoutUserData] Unexpected error fetching user data:", error);
                handleLogout(); // Logout como medida de seguridad
            } finally {
                setLoadingUser(false);
                console.log("[useLayoutUserData] User data fetch process finished."); // Log fin fetch
            }
        };

        fetchUserData();
        // handleLogout se incluye como dependencia porque se usa en caso de error
        // navigate no es necesario porque useCallback ya lo tiene como dependencia
    }, [handleLogout]); // Ejecutar solo al montar o si handleLogout cambia (que no debería)

    return { userData, loadingUser, handleLogout };
};