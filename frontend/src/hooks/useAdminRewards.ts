// filename: frontend/src/hooks/useAdminRewards.ts
// Version: 1.0.3 (Add console.log for diagnostics)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
// Icon imports remain removed as they are not used directly here

// --- Tipos ---
// TODO: Mover Reward a un archivo /types/ compartido
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId?: string;
    createdAt: string;
    updatedAt: string;
}

export type ActionLoading = { type: 'toggle' | 'delete'; id: string } | null;
export interface UseAdminRewardsReturn {
    rewards: Reward[];
    loading: boolean;
    error: string | null;
    actionLoading: ActionLoading;
    fetchRewards: () => Promise<void>;
    handleToggleActive: (rewardId: string, currentIsActive: boolean) => Promise<void>;
    handleDeleteReward: (rewardId: string, rewardName: string) => Promise<void>;
}
// --- Fin Tipos ---

export const useAdminRewards = (): UseAdminRewardsReturn => {
    // --- Estados Internos ---
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<ActionLoading>(null);

    // --- Funciones ---
    const fetchRewards = useCallback(async () => {
        // Si ya hay recompensas, no mostramos el loader principal a pantalla completa,
        // pero sí podríamos indicar una carga sutil si quisiéramos (no implementado ahora)
        if (rewards.length === 0) setLoading(true);
        setError(null);
        console.log("[useAdminRewards] Fetching rewards...");
        try {
            const response = await axiosInstance.get<Reward[]>('/rewards');

            // --- DIAGNOSTICO: Loguear los datos recibidos ---
            console.log("[useAdminRewards] Raw rewards data received:", response.data);
            // ------------------------------------------------

            setRewards(response.data ?? []); // Actualizar estado con los datos recibidos
        } catch (err: any) {
             console.error('[useAdminRewards] Error fetching rewards:', err);
            const message = err.response?.data?.message || err.message || 'Error desconocido al cargar recompensas.';
            setError(message);
            // No mostrar notificación de error si es la carga inicial la que falla
            // Solo mostrar si intentamos refrescar y falla
            if (rewards.length > 0) {
                 notifications.show({ title: 'Error al Refrescar', message, color: 'red' });
            }
         } finally {
            setLoading(false);
            console.log("[useAdminRewards] Fetch rewards finished.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Se elimina rewards.length de las dependencias para evitar bucles si la API falla y resetea rewards

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    const handleToggleActive = useCallback(async (rewardId: string, currentIsActive: boolean) => {
        setActionLoading({ type: 'toggle', id: rewardId });
        const newIsActive = !currentIsActive;
        const actionText = newIsActive ? 'activada' : 'desactivada';
        try {
            await axiosInstance.patch(`/rewards/${rewardId}`, { isActive: newIsActive });
            // Actualizar estado local *después* de éxito en API
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

    const handleDeleteReward = useCallback(async (rewardId: string, rewardName: string) => {
        setActionLoading({ type: 'delete', id: rewardId });
        try {
            await axiosInstance.delete(`/rewards/${rewardId}`);
            // Actualizar estado local *después* de éxito en API
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

    // Retorno del Hook
    return {
        rewards,
        loading,
        error,
        actionLoading,
        fetchRewards, // Exponer fetchRewards como refetch
        handleToggleActive,
        handleDeleteReward
    };
};

// End of File: frontend/src/hooks/useAdminRewards.ts