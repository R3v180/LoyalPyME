// filename: frontend/src/hooks/useAdminRewards.ts
// Version: 1.0.2 (Remove unused icon imports)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
// import { IconCheck, IconX } from '@tabler/icons-react'; // <-- Importación eliminada

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
        if (rewards.length === 0) setLoading(true);
        setError(null);
        console.log("[useAdminRewards] Fetching rewards...");
        try {
            const response = await axiosInstance.get<Reward[]>('/rewards');
            setRewards(response.data ?? []);
        } catch (err: any) {
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
    }, [rewards.length]);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    const handleToggleActive = useCallback(async (rewardId: string, currentIsActive: boolean) => {
        setActionLoading({ type: 'toggle', id: rewardId });
        const newIsActive = !currentIsActive;
        const actionText = newIsActive ? 'activada' : 'desactivada';
        try {
            await axiosInstance.patch(`/rewards/${rewardId}`, { isActive: newIsActive });
            setRewards((prevRewards: Reward[]) =>
                prevRewards.map((r: Reward) =>
                    r.id === rewardId ? { ...r, isActive: newIsActive, updatedAt: new Date().toISOString() } : r
            ));
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
            setRewards((prevRewards: Reward[]) =>
                prevRewards.filter((r: Reward) => r.id !== rewardId)
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