// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/RewardsTab.tsx
// VERSIÓN 4.0.2 - Lógica de navegación refinada y logs añadidos para depuración.

import React from 'react';
import { Box, Title, Stack, Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';

// Componentes y tipos...
import RewardList from '../../RewardList';
import AvailableCouponsList from '../../AvailableCouponsList'; 
import { Reward, GrantedReward, DisplayReward } from '../../../../../../shared/types/user.types';
import { RewardType } from '../../../../../../shared/types/enums';
import { useLayoutUserData } from '../../../../../../shared/hooks/useLayoutUserData';

interface RewardsTabProps {
    redeemableRewards: Reward[];
    userPoints: number | undefined;
    acquiringRewardId: string | null;
    loadingRewards: boolean;
    errorRewards: string | null;
    availableCoupons: GrantedReward[];
    loadingCoupons: boolean;
    errorCoupons: string | null;
    pendingGifts: GrantedReward[];
    loadingGifts: boolean;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => Promise<void>;
}

const RewardsTab: React.FC<RewardsTabProps> = ({
    redeemableRewards, userPoints, acquiringRewardId, loadingRewards, errorRewards,
    availableCoupons, loadingCoupons, errorCoupons, pendingGifts, loadingGifts, onRedeemGift
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { userData } = useLayoutUserData();

    // La función que se pasa al botón de canje en el catálogo
    const handleRedeemClick = (rewardId: string) => {
        console.log(`[RewardsTab] handleRedeemClick initiated for rewardId: ${rewardId}`);
        const rewardToRedeem = redeemableRewards.find(r => r.id === rewardId);
        
        if (!rewardToRedeem) {
            console.error(`[RewardsTab] Reward with ID ${rewardId} not found in catalog.`);
            return;
        }

        if (typeof userPoints === 'number' && userPoints < rewardToRedeem.pointsCost) {
            notifications.show({
                title: t('common.error'),
                message: t('customerDashboard.insufficientPoints'),
                color: 'orange'
            });
            return;
        }

        // Si la recompensa es de un tipo que se debe aplicar en el carrito (descuento o ítem)
        // y tenemos el slug del negocio para navegar al menú.
        if (
            (rewardToRedeem.type === RewardType.MENU_ITEM || rewardToRedeem.type === RewardType.DISCOUNT_ON_ITEM || rewardToRedeem.type === RewardType.DISCOUNT_ON_TOTAL) 
            && userData?.businessSlug
        ) {
            console.log(`[RewardsTab] Navigating to menu page with reward to apply.`, rewardToRedeem);
            
            notifications.show({
                title: t('common.info'),
                message: 'Serás redirigido al menú para aplicar tu recompensa.',
                color: 'blue',
                icon: <IconInfoCircle />,
            });
            
            // Navegamos y pasamos el objeto de la recompensa completo en el estado.
            navigate(`/m/${userData.businessSlug}`, { 
                state: { rewardToApply: rewardToRedeem } 
            });

        } else {
            // Caso para productos genéricos o si no hay slug (no debería pasar)
            console.warn(`[RewardsTab] Reward type (${rewardToRedeem.type}) not handled for direct menu navigation or business slug is missing.`);
            notifications.show({
                title: t('common.info'),
                message: 'Esta recompensa debe canjearse de otra manera.',
                color: 'blue',
                icon: <IconInfoCircle />,
            });
        }
    };
    
    // El resto del componente se mantiene igual...
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
                <RewardList
                    rewards={catalogDisplayItems}
                    userPoints={userPoints}
                    redeemingRewardId={acquiringRewardId}
                    loadingRewards={loadingRewards}
                    errorRewards={errorRewards}
                    onRedeemPoints={handleRedeemClick}
                    onRedeemGift={() => Promise.resolve()}
                    isAcquireFlow={true}
                />
            </Box>

            {giftDisplayItems.length > 0 && (
                 <Stack>
                    <Title order={4}>{t('customerDashboard.giftsSectionTitle')}</Title>
                    <RewardList
                        rewards={giftDisplayItems}
                        userPoints={userPoints}
                        redeemingRewardId={acquiringRewardId}
                        loadingRewards={loadingGifts}
                        errorRewards={null}
                        onRedeemPoints={() => Promise.resolve()}
                        onRedeemGift={onRedeemGift}
                    />
                </Stack>
            )}
        </Stack>
    );
};

export default RewardsTab;