// frontend/src/modules/loyalpyme/hooks/useCustomerRewardsData.ts
// Version: 1.3.0 (Expose availableCoupons and their loading/error states)

import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { useTranslation } from 'react-i18next';

// Importar tipos actualizados
import { Reward, GrantedReward, DisplayReward } from '../../../shared/types/user.types';

// --- CAMBIO 1: Actualizar la interfaz de retorno del hook ---
export interface UseCustomerRewardsDataResult {
    displayRewards: DisplayReward[];
    loadingRewards: boolean;
    loadingGrantedRewards: boolean; // Se puede mantener para logs o lógica interna
    errorRewards: string | null;
    refreshRewards: () => Promise<void>;
    // --- PROPIEDADES AÑADIDAS ---
    availableCoupons: GrantedReward[];
    loadingCoupons: boolean;
    errorCoupons: string | null;
}
// --- FIN CAMBIO 1 ---

const combineAndMapRewards = (
    rewards: Reward[] | null,
    grantedRewards: GrantedReward[] | null,
    t: ReturnType<typeof useTranslation>['t']
): DisplayReward[] => {
    const combined: DisplayReward[] = [];
    if (grantedRewards) {
        const gifts: DisplayReward[] = grantedRewards
            .filter(gr => gr && gr.reward)
            .map((gr): DisplayReward => {
                let assigner = t('customerDashboard.summary.unknownAssigner', 'Desconocido');
                if (gr.assignedBy) {
                    assigner = gr.assignedBy.name || gr.assignedBy.email || assigner;
                }
                return {
                    isGift: true,
                    grantedRewardId: gr.id,
                    id: gr.reward.id,
                    name_es: gr.reward.name_es,
                    name_en: gr.reward.name_en,
                    description_es: gr.reward.description_es,
                    description_en: gr.reward.description_en,
                    pointsCost: 0,
                    imageUrl: gr.reward.imageUrl,
                    assignedByString: assigner,
                    assignedAt: gr.assignedAt,
                    type: null
                };
            });
        combined.push(...gifts);
    }
    if (rewards) {
        const grantedRewardBaseIds = new Set(grantedRewards?.map(gr => gr.reward.id) ?? []);
        const pointsRewards: DisplayReward[] = rewards
            .filter(r => r && !grantedRewardBaseIds.has(r.id))
            .map((r): DisplayReward => ({
                isGift: false,
                id: r.id,
                name_es: r.name_es,
                name_en: r.name_en,
                description_es: r.description_es,
                description_en: r.description_en,
                pointsCost: r.pointsCost,
                imageUrl: r.imageUrl,
                type: r.type,
                linkedMenuItemId: r.linkedMenuItemId,
                discountType: r.discountType,
                discountValue: r.discountValue
            }));
        combined.push(...pointsRewards);
    }
    return combined;
};


export const useCustomerRewardsData = (): UseCustomerRewardsDataResult => {
    const { t } = useTranslation();
    const [rewards, setRewards] = useState<Reward[] | null>(null);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[] | null>(null);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [loadingGrantedRewards, setLoadingGrantedRewards] = useState<boolean>(true);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    const fetchAllRewardsData = useCallback(async () => {
        setLoadingRewards(true);
        setLoadingGrantedRewards(true);
        setErrorRewards(null);
        try {
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/available-coupons') // <-- Asegurarse que se llama al endpoint correcto para los cupones
            ]);

            if (!Array.isArray(rewardsResponse.data) || !Array.isArray(grantedRewardsResponse.data)) {
                throw new Error("La respuesta de la API no tiene el formato esperado.");
            }
            setRewards(rewardsResponse.data);
            setGrantedRewards(grantedRewardsResponse.data);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || t('customerDashboard.errorLoadingRewards');
            setErrorRewards(message);
        } finally {
            setLoadingRewards(false);
            setLoadingGrantedRewards(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAllRewardsData();
    }, [fetchAllRewardsData]);

    const displayRewards = useMemo(() => {
        // Esta función ahora solo combina los regalos y las recompensas del catálogo
        const giftsFromGranted = grantedRewards?.filter(gr => gr.status === 'PENDING') ?? [];
        return combineAndMapRewards(rewards, giftsFromGranted, t);
    }, [rewards, grantedRewards, t]);

    const availableCoupons = useMemo(() => {
        // Los cupones disponibles son los `GrantedReward` con estado AVAILABLE
        return grantedRewards?.filter(gr => gr.status === 'AVAILABLE') ?? [];
    }, [grantedRewards]);

    const refreshRewards = useCallback(() => {
        return fetchAllRewardsData();
    }, [fetchAllRewardsData]);

    // --- CAMBIO 2: Actualizar el objeto de retorno del hook ---
    return {
        displayRewards,
        loadingRewards,
        loadingGrantedRewards,
        errorRewards,
        refreshRewards,
        // --- PROPIEDADES AÑADIDAS ---
        availableCoupons: availableCoupons,
        loadingCoupons: loadingGrantedRewards, // Reutilizamos el estado de carga
        errorCoupons: errorRewards, // Reutilizamos el estado de error
    };
    // --- FIN CAMBIO 2 ---
};