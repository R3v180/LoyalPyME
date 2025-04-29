// filename: frontend/src/hooks/useLayoutUserData.ts
// Version: 1.1.0 (Check for token before fetching profile)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

// Interfaz (sin cambios)
interface LayoutUserData {
    name?: string | null;
    email: string;
    role: string;
}
interface UseLayoutUserDataReturn {
    userData: LayoutUserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
}

export const useLayoutUserData = (): UseLayoutUserDataReturn => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<LayoutUserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const handleLogout = useCallback(() => {
        console.log("Executing logout...");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserData(null);
        // Asegurarse que la redirección no cause problemas si ya estamos en /login
        if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        const fetchUserData = async () => {
            console.log("[useLayoutUserData] Starting user data check...");
            setLoadingUser(true);
            let userFromStorage: LayoutUserData | null = null;

            // --- CAMBIO: Comprobar token ANTES de intentar cargar/fetch ---
            const token = localStorage.getItem('token');
            if (!token) {
                console.log("[useLayoutUserData] No token found. Assuming logged out.");
                setUserData(null);
                setLoadingUser(false);
                // No llamamos a logout aquí, simplemente no hay usuario
                return; // Salir de la función fetchUserData
            }
            // --- FIN CAMBIO ---


            // Si llegamos aquí, hay token. Intentar cargar desde localStorage
            const storedUser = localStorage.getItem('user');
             if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (parsed && typeof parsed.email === 'string' && typeof parsed.role === 'string') {
                        userFromStorage = {
                            email: parsed.email,
                            name: typeof parsed.name === 'string' ? parsed.name : null,
                             role: parsed.role
                        };
                        console.log("[useLayoutUserData] User data found in localStorage:", userFromStorage);
                    } else {
                         console.warn("[useLayoutUserData] User data in localStorage is invalid.");
                        localStorage.removeItem('user');
                    }
                } catch (e) {
                    console.error("[useLayoutUserData] Failed to parse user from localStorage:", e);
                    localStorage.removeItem('user');
                }
            } else {
                console.log("[useLayoutUserData] No user data found in localStorage (but token exists).");
            }

            // Si existe en localStorage y es válido, usarlo
            if (userFromStorage) {
                setUserData(userFromStorage);
                setLoadingUser(false);
                console.log("[useLayoutUserData] Using data from localStorage.");
            } else {
                // Si no (o era inválido), intentar obtener desde la API (ahora sabemos que hay token)
                console.log("[useLayoutUserData] Fetching user profile from API...");
                try {
                    const response = await axiosInstance.get<LayoutUserData>('/profile');
                    if (response.data && response.data.email && response.data.role) {
                        setUserData(response.data);
                        localStorage.setItem('user', JSON.stringify(response.data));
                        console.log("[useLayoutUserData] User data fetched from API:", response.data);
                    } else {
                        console.error("[useLayoutUserData] Invalid data received from API profile endpoint.");
                        handleLogout(); // Logout si API devuelve datos inválidos
                    }
                } catch (apiError: any) {
                    console.error("[useLayoutUserData] Error fetching user profile from API:", apiError);
                    // Logout si API falla (ej. token inválido/expirado)
                    if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                        console.log("[useLayoutUserData] API returned 401/403, logging out.");
                        handleLogout();
                    } else {
                        // Otro error de API, podríamos mostrar un error genérico pero no hacer logout
                        console.error("Unhandled API error while fetching profile, keeping potentially stale local data (if any) or null.");
                        // Mantenemos userData como estaba (null si no había nada en localStorage)
                    }
                } finally {
                     setLoadingUser(false); // Quitar loading independientemente del error (excepto si hicimos logout)
                     console.log("[useLayoutUserData] API fetch process finished.");
                }
            }
        };

        fetchUserData();
    }, [handleLogout]); // handleLogout es la única dependencia externa real

    return { userData, loadingUser, handleLogout };
};

export default useLayoutUserData;