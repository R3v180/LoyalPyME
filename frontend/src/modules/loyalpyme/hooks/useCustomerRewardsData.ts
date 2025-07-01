// frontend/src/modules/loyalpyme/hooks/useCustomerRewardsData.ts
// VERSIÓN 3.0.0 - Versión original sin parseo explícito, confiando en los nuevos tipos flexibles.

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { useTranslation } from 'react-i18next';

import { Reward, GrantedReward } from '../../../shared/types/user.types';

export interface UseCustomerRewardsDataResult {
    redeemableRewards: Reward[];
    availableCoupons: GrantedReward[];
    pendingGifts: GrantedReward[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useCustomerRewardsData = (): UseCustomerRewardsDataResult => {
    const { t } = useTranslation();

    const [rewardsCatalog, setRewardsCatalog] = useState<Reward[]>([]);
    const [allGrantedRewards, setAllGrantedRewards] = useState<GrantedReward[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log('[useCustomerRewardsData] Fetching all rewards data...');
        
        try {
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards') 
            ]);

            setRewardsCatalog(rewardsResponse.data || []);
            setAllGrantedRewards(grantedRewardsResponse.data || []);
            
            console.log(`[useCustomerRewardsData] Fetched ${rewardsResponse.data?.length ?? 0} catalog rewards and ${grantedRewardsResponse.data?.length ?? 0} granted rewards.`);

        } catch (err: any) {
            const message = err.response?.data?.message || err.message || t('customerDashboard.errorLoadingRewards');
            setError(message);
            console.error('[useCustomerRewardsData] Error fetching rewards data:', err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    return {
        redeemableRewards: rewardsCatalog,
        availableCoupons: allGrantedRewards.filter(gr => gr.status === 'AVAILABLE'),
        pendingGifts: allGrantedRewards.filter(gr => gr.status === 'PENDING'),
        loading,
        error,
        refresh: fetchAllData,
    };
};