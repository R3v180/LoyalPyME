// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/RewardsTab.tsx
// VERSIÓN 5.0.2 - Limpieza final de importaciones no utilizadas.

import React from 'react';
import { Box, Title, Stack, Divider, Alert } from '@mantine/core'; // 'Text' eliminado
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import RewardList from '../../RewardList';
import AvailableCouponsList from '../../AvailableCouponsList'; 
import { Reward, GrantedReward, DisplayReward } from '../../../../../../shared/types/user.types';

// --- Interfaz de Props Final y Simplificada ---
interface RewardsTabProps {
    redeemableRewards: Reward[];
    userPoints: number | undefined;
    loadingRewards: boolean;
    errorRewards: string | null;
    
    availableCoupons: GrantedReward[];
    loadingCoupons: boolean;
    errorCoupons: string | null;
    
    pendingGifts: GrantedReward[];
    loadingGifts: boolean;
    errorGifts: string | null;
}

const RewardsTab: React.FC<RewardsTabProps> = ({
    redeemableRewards, userPoints, loadingRewards, errorRewards,
    availableCoupons, loadingCoupons, errorCoupons,
    pendingGifts, loadingGifts, errorGifts,
}) => {
    const { t } = useTranslation();
    
    const giftDisplayItems: DisplayReward[] = pendingGifts.map(gr => ({
        isGift: true, id: gr.reward.id, grantedRewardId: gr.id, name_es: gr.reward.name_es, name_en: gr.reward.name_en,
        description_es: gr.reward.description_es, description_en: gr.reward.description_en, pointsCost: 0,
        imageUrl: gr.reward.imageUrl, assignedAt: gr.assignedAt,
        assignedByString: gr.assignedBy?.name || gr.assignedBy?.email || t('customerDashboard.summary.unknownAssigner'),
        type: gr.reward.type, linkedMenuItemId: gr.reward.linkedMenuItemId, 
        discountType: gr.reward.discountType, discountValue: Number(gr.reward.discountValue) || null, 
    }));
    
    const catalogDisplayItems: DisplayReward[] = redeemableRewards.map(r => ({
        isGift: false, id: r.id, name_es: r.name_es, name_en: r.name_en,
        description_es: r.description_es, description_en: r.description_en,
        pointsCost: r.pointsCost, imageUrl: r.imageUrl, type: r.type,
        linkedMenuItemId: r.linkedMenuItemId, discountType: r.discountType, 
        discountValue: Number(r.discountValue) || null,
    }));

    return (
        <Stack gap="xl">
            {pendingGifts.length > 0 && (
                 <Box>
                    <Title order={4}>{t('customerDashboard.giftsSectionTitle')}</Title>
                    <RewardList
                        rewards={giftDisplayItems}
                        loadingRewards={loadingGifts}
                        errorRewards={errorGifts}
                        userPoints={userPoints}
                        redeemingRewardId={null} // No hay acción de carga aquí
                        onRedeemPoints={() => {}} // No-op
                        onRedeemGift={() => Promise.resolve()} // No-op
                    />
                </Box>
            )}

            <Box>
                <Title order={4}>{t('customerDashboard.availableCouponsTitle')}</Title>
                <AvailableCouponsList
                    coupons={availableCoupons}
                    loading={loadingCoupons}
                    error={errorCoupons}
                />
            </Box>
            
            <Divider my="xl" label={t('customerDashboard.rewardsCatalogTitle')} labelPosition="center" />

            <Box>
                {errorRewards && <Alert color="red" title={t('common.error')} icon={<IconAlertCircle />}>{errorRewards}</Alert>}
                <RewardList
                    rewards={catalogDisplayItems}
                    userPoints={userPoints}
                    loadingRewards={loadingRewards}
                    errorRewards={null}
                    redeemingRewardId={null}
                    onRedeemPoints={() => {}} // No-op, el botón ahora solo es informativo
                    onRedeemGift={() => Promise.resolve()}
                    isAcquireFlow={true}
                />
            </Box>
        </Stack>
    );
};

export default RewardsTab;