// filename: frontend/src/hooks/useAdminRewards.ts
// Version: 1.2.0 (Ensure correct Reward type with i18n fields is used)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { notifications } from '@mantine/notifications';

// --- IMPORTANTE: Asegurarse de importar Reward desde la ubicación correcta ---
import { Reward } from '../../../shared/types/user.types'; // Debe importar la interfaz Reward actualizada
// --- FIN IMPORTANTE ---


// Tipos (sin cambios en la definición, pero ahora usan la Reward importada)
export type ActionLoading = { type: 'toggle' | 'delete'; id: string } | null;

export interface UseAdminRewardsReturn {
    rewards: Reward[]; // <-- Usa la interfaz Reward importada (que ahora tiene name_es/en)
    loading: boolean;
    error: string | null;
    actionLoading: ActionLoading;
    fetchRewards: () => Promise<void>;
    handleToggleActive: (rewardId: string, currentIsActive: boolean) => Promise<void>;
    handleDeleteReward: (rewardId: string, rewardName: string) => Promise<void>; // rewardName puede ser ahora name_es o name_en
}


export const useAdminRewards = (): UseAdminRewardsReturn => {
    // --- Estado interno usa la interfaz Reward importada ---
    const [rewards, setRewards] = useState<Reward[]>([]);
    // --- Fin Estado ---
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<ActionLoading>(null);

    // Funciones (sin cambios en la lógica interna, pero ahora trabajan con el tipo Reward correcto)
    const fetchRewards = useCallback(async () => {
        if (rewards.length === 0 || !loading) setLoading(true); // Ajuste para mostrar loading en refetch
        setError(null);
        console.log("[useAdminRewards] Fetching rewards...");
        try {
            // La llamada espera un array de objetos Reward (con name_es/en)
            const response = await axiosInstance.get<Reward[]>('/rewards'); // Usa el tipo Reward correcto
            console.log("[useAdminRewards] Raw rewards data received:", response.data);
            setRewards(response.data ?? []);
        } catch (err: any) {
           console.error('[useAdminRewards] Error fetching rewards:', err);
           const message = err.response?.data?.message || err.message || 'Error desconocido al cargar recompensas.';
           setError(message);
           // Solo mostrar notificación si ya había datos y falla el refetch
           if (rewards.length > 0) {
                notifications.show({ title: 'Error al Refrescar', message, color: 'red' });
           }
         } finally {
            setLoading(false);
            console.log("[useAdminRewards] Fetch rewards finished.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]); // Dependencia ajustada para permitir refetch

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]); // fetchRewards ahora tiene dependencias correctas

    const handleToggleActive = useCallback(async (rewardId: string, currentIsActive: boolean) => {
         setActionLoading({ type: 'toggle', id: rewardId });
        const newIsActive = !currentIsActive;
        const actionText = newIsActive ? 'activada' : 'desactivada'; // TODO: i18n
        try {
            await axiosInstance.patch(`/rewards/${rewardId}`, { isActive: newIsActive });
            // Actualización optimista del estado
            setRewards((prevRewards) =>
                prevRewards.map((r) =>
                    r.id === rewardId ? { ...r, isActive: newIsActive, updatedAt: new Date().toISOString() } : r
                )
            );
            notifications.show({
                 title: `Recompensa ${actionText}`, // TODO: i18n
                message: `La recompensa se ha ${actionText} correctamente.`, // TODO: i18n
                color: 'green',
                autoClose: 4000
            });
        } catch (err: any) {
             console.error('Error toggling reward active state:', err);
             const message = `Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`; // TODO: i18n
             notifications.show({
                title: 'Error al Actualizar Estado', message, color: 'red', // TODO: i18n
                autoClose: 6000
            });
        } finally {
            setActionLoading(null);
        }
    }, []);

    const handleDeleteReward = useCallback(async (rewardId: string, rewardName: string) => { // rewardName es ahora name_es o name_en
        setActionLoading({ type: 'delete', id: rewardId });
        try {
            await axiosInstance.delete(`/rewards/${rewardId}`);
            setRewards((prevRewards) => prevRewards.filter((r) => r.id !== rewardId) );
             notifications.show({
                title: 'Recompensa Eliminada', // TODO: i18n
                message: `La recompensa "${rewardName}" ha sido eliminada.`, // Usa el nombre pasado
                color: 'green',
                autoClose: 4000
            });
         } catch (err: any) {
            console.error('Error deleting reward:', err);
            const apiMessage = err.response?.data?.message || err.message || 'Error desconocido';
            let notifyMessage = `Error al eliminar "${rewardName}": ${apiMessage}`; // TODO: i18n
            if (err.response?.status === 404 || apiMessage.includes('no encontrada')) {
                 notifyMessage = `No se encontró la recompensa "${rewardName}" (quizás ya fue eliminada).`; // TODO: i18n
            }
             if (err.response?.status === 409 || apiMessage.includes('siendo utilizada')) {
                notifyMessage = `No se puede eliminar "${rewardName}" porque está en uso.`; // TODO: i18n
            }
            notifications.show({
                title: 'Error al Eliminar', message: notifyMessage, color: 'red', // TODO: i18n
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