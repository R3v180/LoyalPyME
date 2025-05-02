// filename: frontend/src/hooks/useAdminRewards.ts
// Version: 1.1.0 (Add imageUrl to Reward interface)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
// Icon imports not needed here

// --- Tipos (Reward ahora incluye imageUrl) ---
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId?: string; // Es bueno tenerlo si la API lo devuelve
    createdAt: string;
    updatedAt: string;
    imageUrl?: string | null; // <-- AÑADIDO AQUÍ
}

export type ActionLoading = { type: 'toggle' | 'delete'; id: string } | null;

export interface UseAdminRewardsReturn {
    rewards: Reward[]; // Ahora el estado rewards contendrá objetos con imageUrl
    loading: boolean;
    error: string | null;
    actionLoading: ActionLoading;
    fetchRewards: () => Promise<void>;
    handleToggleActive: (rewardId: string, currentIsActive: boolean) => Promise<void>;
    handleDeleteReward: (rewardId: string, rewardName: string) => Promise<void>;
}
// --- Fin Tipos ---

export const useAdminRewards = (): UseAdminRewardsReturn => {
    // --- Estados Internos (sin cambios) ---
    const [rewards, setRewards] = useState<Reward[]>([]); // Usa la interfaz Reward actualizada
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<ActionLoading>(null);

    // --- Funciones ---
    const fetchRewards = useCallback(async () => {
        if (rewards.length === 0) setLoading(true);
        setError(null);
        console.log("[useAdminRewards] Fetching rewards...");
        try {
            // La llamada espera un array de objetos Reward (que ahora incluye imageUrl)
            const response = await axiosInstance.get<Reward[]>('/rewards');

            console.log("[useAdminRewards] Raw rewards data received:", response.data);

            // Actualizar estado (TypeScript ahora entenderá que imageUrl puede estar ahí)
            setRewards(response.data ?? []);
        } catch (err: any) {
            // ... (manejo de errores sin cambios) ...
           console.error('[useAdminRewards] Error fetching rewards:', err);
           const message = err.response?.data?.message || err.message || 'Error desconocido al cargar recompensas.';
           setError(message);
           if (rewards.length > 0) {
                notifications.show({ title: 'Error al Refrescar', message, color: 'red' });
           }
         } finally {
            setLoading(false);
            console.log("[useAdminRewards] Fetch rewards finished.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Dependencias sin cambios

    // useEffect para carga inicial (sin cambios)
    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    // handleToggleActive (sin cambios en lógica)
    const handleToggleActive = useCallback(async (rewardId: string, currentIsActive: boolean) => {
        // ... (código sin cambios) ...
         setActionLoading({ type: 'toggle', id: rewardId });
        const newIsActive = !currentIsActive;
        const actionText = newIsActive ? 'activada' : 'desactivada';
        try {
            await axiosInstance.patch(`/rewards/${rewardId}`, { isActive: newIsActive });
            setRewards((prevRewards) =>
                prevRewards.map((r) =>
                    r.id === rewardId ? { ...r, isActive: newIsActive, updatedAt: new Date().toISOString() } : r
                )
            );
            notifications.show({
                 title: `Recompensa ${actionText}`,
                message: `La recompensa se ha ${actionText} correctamente.`,
                color: 'green',
                autoClose: 4000
            });
        } catch (err: any) {
             console.error('Error toggling reward active state:', err);
            const message = `Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
            notifications.show({
                title: 'Error al Actualizar Estado', message, color: 'red',
                autoClose: 6000
            });
        } finally {
            setActionLoading(null);
        }
    }, []);

    // handleDeleteReward (sin cambios en lógica)
    const handleDeleteReward = useCallback(async (rewardId: string, rewardName: string) => {
        // ... (código sin cambios) ...
        setActionLoading({ type: 'delete', id: rewardId });
        try {
            await axiosInstance.delete(`/rewards/${rewardId}`);
            setRewards((prevRewards) =>
                prevRewards.filter((r) => r.id !== rewardId)
            );
             notifications.show({
                title: 'Recompensa Eliminada',
                message: `La recompensa "${rewardName}" ha sido eliminada.`,
                color: 'green',
                 autoClose: 4000
            });
         } catch (err: any) {
            console.error('Error deleting reward:', err);
            const message = `Error al eliminar "${rewardName}": ${err.response?.data?.message || err.message || 'Error desconocido'}`;
            let notifyMessage = message;
            if (err.response?.status === 404 || (err instanceof Error && err.message.includes('no encontrada'))) {
                 notifyMessage = `No se encontró la recompensa "${rewardName}" (quizás ya fue eliminada).`;
             }
             if (err.response?.status === 409 || (err instanceof Error && err.message.includes('siendo utilizada'))) {
                notifyMessage = `No se puede eliminar "${rewardName}" porque está en uso.`;
             }
            notifications.show({
                title: 'Error al Eliminar', message: notifyMessage, color: 'red',
                autoClose: 6000
            });
        } finally {
            setActionLoading(null);
        }
    }, []);

    // Retorno del Hook (sin cambios)
    return {
        rewards,
        loading,
        error,
        actionLoading,
        fetchRewards,
        handleToggleActive,
        handleDeleteReward
    };
};

// End of File: frontend/src/hooks/useAdminRewards.ts