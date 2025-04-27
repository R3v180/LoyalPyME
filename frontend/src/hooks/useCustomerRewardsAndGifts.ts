// filename: frontend/src/hooks/useCustomerRewardsAndGifts.ts
// Version: 1.0.0

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance'; // Ajusta la ruta si es necesario
import { AxiosError } from 'axios';
// Importar tipos desde el archivo compartido
import { Reward, GrantedReward, DisplayReward, UseRewardsAndGiftsResult } from '../types/customer';

const useCustomerRewardsAndGifts = (): UseRewardsAndGiftsResult => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[]>([]);
    const [displayRewards, setDisplayRewards] = useState<DisplayReward[]>([]);
    const [loading, setLoading] = useState(true); // Loading combinado para ambas listas
    const [error, setError] = useState<string | null>(null); // Error combinado

    const fetchRewardsAndGifts = useCallback(async () => {
        setLoading(true);
        setError(null); // Limpiar error al inicio de la carga
        try {
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards')
            ]);

            // Filtrar recompensas activas y actualizar estados individuales
            setRewards(rewardsResponse.data?.filter(reward => reward.isActive) ?? []);
            setGrantedRewards(grantedRewardsResponse.data ?? []);

        } catch (err) {
            console.error("Error fetching rewards and granted rewards:", err);
             const errorMsg = (err instanceof AxiosError && err.response?.data?.message)
                           ? err.response.data.message
                           : (err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
            setError(`Error al cargar recompensas y regalos: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    }, []); // Sin dependencias externas por ahora

    // Efecto para combinar las listas cuando cambian rewards o grantedRewards
    useEffect(() => {
        const gifts: DisplayReward[] = grantedRewards.map(gr => {
            // Fallback para assignedByString en caso de datos incompletos
            const assignerName = gr.business?.name || gr.assignedBy?.name || gr.assignedBy?.email || 'Admin';
            return {
                isGift: true,
                grantedRewardId: gr.id,
                id: gr.reward.id, // Usamos el ID de la recompensa asociada para referencia si es necesario
                name: gr.reward.name,
                description: gr.reward.description,
                pointsCost: 0, // Regalos cuestan 0 puntos
                assignedByString: assignerName,
                assignedAt: gr.assignedAt
            };
        });

        const pointsRewards: DisplayReward[] = rewards.map(r => ({
            isGift: false,
            id: r.id,
            name: r.name,
            description: r.description,
            pointsCost: r.pointsCost
            // grantedRewardId, assignedByString, assignedAt son undefined para recompensas normales
        }));

        // Combina y posiblemente ordena las listas (ej: regalos primero)
        // Podríamos añadir un criterio de ordenación más sofisticado si fuera necesario
        setDisplayRewards([...gifts, ...pointsRewards]);

    }, [rewards, grantedRewards]); // Este efecto se ejecuta cuando rewards o grantedRewards cambian

    useEffect(() => {
        fetchRewardsAndGifts();
    }, [fetchRewardsAndGifts]); // Ejecutar en el montaje

    return { displayRewards, loading, error, refetch: fetchRewardsAndGifts };
};

export default useCustomerRewardsAndGifts;

// End of File: frontend/src/hooks/useCustomerRewardsAndGifts.ts