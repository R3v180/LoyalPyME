// filename: frontend/src/hooks/useLayoutUserData.ts
// Version: 1.0.1 (Fix encoding, clean comments)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

// Interfaz simplificada para los datos del usuario
// TODO: Considerar moverla a un archivo de tipos compartido (e.g., src/types/user.ts)
interface LayoutUserData {
    name?: string | null;
    email: string;
    role: string; // Considerar usar un Enum UserRole si se define en types
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

    // Función de Logout
    const handleLogout = useCallback(() => {
        console.log("Executing logout...");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserData(null); // Limpiar estado local
        navigate('/login', { replace: true });
    }, [navigate]);

    useEffect(() => {
        const fetchUserData = async () => {
            console.log("[useLayoutUserData] Starting user data fetch...");
            setLoadingUser(true);
            let userFromStorage: LayoutUserData | null = null;

            // Intentar cargar desde localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    // Validar campos esenciales
                    if (parsed && typeof parsed.email === 'string' && typeof parsed.role === 'string') {
                        userFromStorage = {
                            email: parsed.email,
                            name: typeof parsed.name === 'string' ? parsed.name : null,
                            role: parsed.role
                        };
                        console.log("[useLayoutUserData] User data found in localStorage:", userFromStorage);
                    } else {
                        console.warn("[useLayoutUserData] User data in localStorage is invalid or incomplete."); // Corregido: inválido
                        localStorage.removeItem('user'); // Limpiar si no es válido
                    }
                } catch (e) {
                    console.error("[useLayoutUserData] Failed to parse user from localStorage:", e);
                    localStorage.removeItem('user'); // Limpiar si está corrupto // Corregido: corrupto
                }
            } else {
                console.log("[useLayoutUserData] No user data found in localStorage.");
            }

            // Si existe en localStorage y es válido, usarlo
            if (userFromStorage) {
                setUserData(userFromStorage);
                setLoadingUser(false); // Terminar carga si usamos datos locales
                console.log("[useLayoutUserData] Using data from localStorage. Fetch finished.");
            } else {
                // Si no, intentar obtener desde la API
                console.log("[useLayoutUserData] Fetching user profile from API...");
                try {
                    const response = await axiosInstance.get<LayoutUserData>('/profile');
                    if (response.data && response.data.email && response.data.role) {
                        setUserData(response.data);
                        // Actualizar localStorage con los datos frescos
                        localStorage.setItem('user', JSON.stringify(response.data));
                        console.log("[useLayoutUserData] User data fetched from API:", response.data);
                    } else {
                        console.error("[useLayoutUserData] Invalid data received from API profile endpoint.");
                        handleLogout(); // Logout si la API devuelve datos inválidos y no teníamos nada local
                    }
                } catch (apiError: any) {
                    console.error("[useLayoutUserData] Error fetching user profile from API:", apiError);
                    // Logout si la API falla (ej. token inválido/expirado)
                    if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                        console.log("[useLayoutUserData] API returned 401/403, logging out.");
                        handleLogout();
                    } else {
                        // Si falla la API y no teníamos nada de localStorage, hacemos logout
                        if (!userFromStorage) { // Comprobación redundante aquí ya que userFromStorage es null si llegamos aquí
                            handleLogout();
                        } else {
                            // Si teníamos datos locales pero la API falló con otro error, podríamos decidir mantener los datos locales?
                            // Por ahora, la lógica actual haría logout en este caso también.
                            // Para mantener datos locales si la API falla (y no es 401/403), no llamar a handleLogout() aquí.
                             console.warn("[useLayoutUserData] API fetch failed, but keeping potentially stale data from previous check (if any).");
                             // Si decidimos mantener datos viejos si la API falla (y no es 401/403), necesitamos asegurarnos que setLoadingUser(false) se llame
                        }
                    }
                } finally {
                     // Asegurarse de quitar el loading incluso si la API falló pero no hicimos logout
                     setLoadingUser(false);
                     console.log("[useLayoutUserData] API fetch process finished.");
                }
            } // Fin del else (fetch API)

            // Quitar el setLoading final aquí si ya se hizo en las ramas anteriores
            // setLoadingUser(false);
            // console.log("[useLayoutUserData] User data fetch process finished.");

        }; // Fin de fetchUserData

        fetchUserData();

    }, [handleLogout]); // Ejecutar solo al montar o si handleLogout cambia

    return { userData, loadingUser, handleLogout };
};

export default useLayoutUserData;

// End of File: frontend/src/hooks/useLayoutUserData.ts