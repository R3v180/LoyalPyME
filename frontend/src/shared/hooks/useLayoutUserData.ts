// frontend/src/shared/hooks/useLayoutUserData.ts
// Version 1.0.1 - Corrected type import path

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

// --- CORRECCIÓN DE RUTA ---
import type { UserData } from '../types/user.types';
// --- FIN CORRECCIÓN ---

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
        localStorage.removeItem('user');
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
                if (userData !== null) setUserData(null);
                setLoadingUser(false);
                return;
            }

            console.log("[useLayoutUserData] Token found. Fetching user profile from API...");
            try {
                const response = await axiosInstance.get<UserData>('/profile');
                if (response.data && response.data.id && response.data.email && response.data.role) {
                    setUserData(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                    console.log("[useLayoutUserData] User data fetched from API and saved to localStorage:", response.data);
                } else {
                    console.error("[useLayoutUserData] Invalid or incomplete data received from API /profile endpoint. Logging out.");
                    handleLogout();
                }
            } catch (apiError: any) {
                console.error("[useLayoutUserData] Error fetching user profile from API:", apiError);
                if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                    console.log("[useLayoutUserData] API /profile returned 401/403, logging out.");
                    handleLogout();
                } else {
                    console.warn("[useLayoutUserData] API /profile fetch failed with other error. Attempting to load from localStorage if available.");
                    const storedUserJson = localStorage.getItem('user');
                    if (storedUserJson) {
                        try {
                            const parsed = JSON.parse(storedUserJson) as UserData;
                            if (parsed && parsed.id && parsed.email && parsed.role) {
                                setUserData(parsed);
                                console.log("[useLayoutUserData] Loaded stale data from localStorage due to API error.");
                            } else {
                                handleLogout();
                            }
                        } catch (e) {
                            handleLogout();
                        }
                    } else {
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
    }, [navigate]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'token' || event.key === 'user') {
                console.log('[useLayoutUserData] localStorage changed in another tab. Re-evaluating auth state.');
                const token = localStorage.getItem('token');
                if (!token && userData !== null) {
                    handleLogout();
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