// filename: frontend/src/hooks/useCustomerRewardsData.ts
// Version: 1.2.1 (Remove unused i18nLanguage parameter)

import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

// Importar tipos actualizados
import { Reward, GrantedReward, DisplayReward } from '../types/customer';

// Interfaz de retorno (sin cambios)
export interface UseCustomerRewardsDataResult {
    displayRewards: DisplayReward[];
    loadingRewards: boolean;
    loadingGrantedRewards: boolean;
    errorRewards: string | null;
    refreshRewards: () => Promise<void>;
}

// --- Función Helper para combinar y mapear (parámetro i18nLanguage ELIMINADO) ---
const combineAndMapRewards = (
    rewards: Reward[] | null,
    grantedRewards: GrantedReward[] | null,
    t: ReturnType<typeof useTranslation>['t']
    // i18nLanguage: string // <-- Parámetro eliminado
): DisplayReward[] => {
    console.log('[useCustomerRewardsData] Combining rewards and gifts...');
    const combined: DisplayReward[] = [];

    // Mapear Regalos Otorgados (GrantedReward)
    if (grantedRewards) {
        const gifts: DisplayReward[] = grantedRewards
            .filter(gr => gr && gr.reward)
            .map((gr): DisplayReward => {
                let assigner = t('customerDashboard.summary.unknownAssigner', 'Desconocido');
                if (gr.assignedBy) { assigner = gr.assignedBy.name || gr.assignedBy.email || assigner; }
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
                };
            });
        combined.push(...gifts);
        console.log(`[useCustomerRewardsData] Mapped ${gifts.length} gifts.`);
    } else { console.log('[useCustomerRewardsData] No granted rewards data received.'); }

    // Mapear Recompensas por Puntos (Reward)
    if (rewards) {
         const grantedRewardBaseIds = new Set(grantedRewards?.map(gr => gr.reward.id) ?? []);
         const pointsRewards: DisplayReward[] = rewards
             .filter(r => r && !grantedRewardBaseIds.has(r.id))
             .map((r): DisplayReward => {
                 return {
                     isGift: false,
                     id: r.id,
                     name_es: r.name_es,
                     name_en: r.name_en,
                     description_es: r.description_es,
                     description_en: r.description_en,
                     pointsCost: r.pointsCost,
                     imageUrl: r.imageUrl,
                 };
             });
        combined.push(...pointsRewards);
        console.log(`[useCustomerRewardsData] Mapped ${pointsRewards.length} points rewards.`);
    } else { console.log('[useCustomerRewardsData] No points rewards data received.'); }

    console.log('[useCustomerRewardsData] Final combined display rewards:', combined);
    return combined;
};


// Hook Principal
export const useCustomerRewardsData = (): UseCustomerRewardsDataResult => {
    const { t } = useTranslation(); // Mantenemos i18n aquí por si se necesita en otro sitio
    const [rewards, setRewards] = useState<Reward[] | null>(null);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[] | null>(null);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [loadingGrantedRewards, setLoadingGrantedRewards] = useState<boolean>(true);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    const fetchAllRewardsData = useCallback(async () => {
        setLoadingRewards(true); setLoadingGrantedRewards(true); setErrorRewards(null);
        console.log('[useCustomerRewardsData] Fetching rewards data...');
        try {
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards')
            ]);
            if (!Array.isArray(rewardsResponse.data) || !Array.isArray(grantedRewardsResponse.data)) { console.error("Invalid API response structure", {rewards: rewardsResponse.data, granted: grantedRewardsResponse.data}); throw new Error("La respuesta de la API no tiene el formato esperado."); }
            setRewards(rewardsResponse.data);
            setGrantedRewards(grantedRewardsResponse.data);
            console.log('[useCustomerRewardsData] Rewards data fetch successful.');
        } catch (err: any) { console.error('[useCustomerRewardsData] Error fetching rewards data:', err); const message = err.response?.data?.message || err.message || t('customerDashboard.errorLoadingRewards', 'Error desconocido al cargar recompensas/regalos.'); setErrorRewards(message); if (rewards || grantedRewards) { notifications.show({ title: t('common.errorLoadingData'), message, color: 'red' }); }
        } finally { setLoadingRewards(false); setLoadingGrantedRewards(false); console.log('[useCustomerRewardsData] Fetch rewards process finished.'); }
    }, [t, rewards, grantedRewards]);

    useEffect(() => { fetchAllRewardsData(); }, [fetchAllRewardsData]);

    // --- useMemo ACTUALIZADO: Dependencia i18nLanguage eliminada ---
    const displayRewards = useMemo(() => {
        // Ya no pasamos i18n.language
        return combineAndMapRewards(rewards, grantedRewards, t);
    }, [rewards, grantedRewards, t]); // Eliminada i18n.language
    // --- FIN useMemo ---

    useEffect(() => { console.log("[useCustomerRewardsData] Display rewards updated.", displayRewards); }, [displayRewards]);

    const refreshRewards = useCallback(() => { console.log("[useCustomerRewardsData] Refresh triggered."); return fetchAllRewardsData(); }, [fetchAllRewardsData]);

    return { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards };
};

// End of File: frontend/src/hooks/useCustomerRewardsData.ts