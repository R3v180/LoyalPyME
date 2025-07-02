// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/SummaryTab.tsx
// VERSIÓN 3.0.1 - Corregidas las importaciones y eliminadas variables no usadas.

import React from 'react';
import {
    Stack, Grid, Paper, Title, Text, Button, Alert, Group
} from '@mantine/core';
import { IconGift, IconToolsKitchen2, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Tipos
import UserInfoDisplay, { type UserInfoDisplayProps } from '../../UserInfoDisplay';
import QrValidationSection from '../../QrValidationSection';
import RewardList from '../../RewardList';
import AvailableCouponsList from '../../AvailableCouponsList';
import type { UserData, TierBenefitData, Reward, GrantedReward, DisplayReward } from '../../../../../../shared/types/user.types';
import { RewardType } from '../../../../../../shared/types/enums';

interface SummaryTabProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: UserInfoDisplayProps['progressBarData'];
    currentTierBenefits: TierBenefitData[];
    nextTierName: string | null;
    nextTierBenefits: TierBenefitData[];
    
    // Props de recompensas
    redeemableRewards: Reward[];
    userPoints: number | undefined;
    loadingRewards: boolean;
    errorRewards: string | null;
    pendingGifts: GrantedReward[];
    availableCoupons: GrantedReward[];
    redeemingRewardId: string | null;
    onRedeemPoints: (rewardId: string) => void;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => void;

    // Props de acciones
    handleValidateQr: (token: string) => Promise<void>;
    validatingQr: boolean;
    scannerOpened: boolean;
    onOpenScanner: () => void;
    onCloseScanner: () => void;
}

const SummaryTab: React.FC<SummaryTabProps> = ({
    userData, loadingUser, errorUser, progressBarData, currentTierBenefits,
    nextTierName, nextTierBenefits,
    redeemableRewards, userPoints, loadingRewards, errorRewards,
    pendingGifts, availableCoupons, redeemingRewardId, onRedeemPoints, onRedeemGift,
    handleValidateQr, validatingQr, scannerOpened, onOpenScanner, onCloseScanner
}) => {
    const { t } = useTranslation();
    
    // Lógica para transformar los datos para el componente RewardList
    const giftDisplayItems: DisplayReward[] = pendingGifts.map(gr => ({
        isGift: true, id: gr.reward.id, grantedRewardId: gr.id, name_es: gr.reward.name_es, name_en: gr.reward.name_en,
        description_es: gr.reward.description_es, description_en: gr.reward.description_en, pointsCost: 0,
        imageUrl: gr.reward.imageUrl, assignedAt: gr.assignedAt,
        assignedByString: gr.assignedBy?.name || gr.assignedBy?.email || t('customerDashboard.summary.unknownAssigner'),
        type: gr.reward.type, linkedMenuItemId: gr.reward.linkedMenuItemId,
        discountType: gr.reward.discountType, discountValue: Number(gr.reward.discountValue) || null,
    }));

    const catalogDisplayItems: DisplayReward[] = redeemableRewards
        .filter(r => r.type !== RewardType.MENU_ITEM)
        .map(r => ({
            isGift: false, id: r.id, name_es: r.name_es, name_en: r.name_en,
            description_es: r.description_es, description_en: r.description_en,
            pointsCost: r.pointsCost, imageUrl: r.imageUrl, type: r.type,
            linkedMenuItemId: r.linkedMenuItemId, discountType: r.discountType,
            discountValue: Number(r.discountValue) || null,
        }));
    
    const handleAcquireReward = (rewardId: string) => {
        onRedeemPoints(rewardId);
    };

    return (
        <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="xl">
                    <UserInfoDisplay
                        userData={userData} loadingUser={loadingUser} errorUser={errorUser}
                        progressBarData={progressBarData} benefits={currentTierBenefits}
                        nextTierName={nextTierName} nextTierBenefits={nextTierBenefits}
                    />
                    <QrValidationSection
                        onValidate={handleValidateQr} isValidating={validatingQr}
                        scannerOpened={scannerOpened} onOpenScanner={onOpenScanner} onCloseScanner={onCloseScanner}
                    />
                </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="xl">
                    {userData?.isCamareroActive && userData?.businessSlug && (
                        <Paper withBorder p="lg" radius="md" shadow="sm">
                            <Group justify="space-between" align="center">
                                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                                    <Text fw={500} size="lg" truncate>{userData.businessName ? t('customerDashboard.summary.viewMenuFor', { businessName: userData.businessName }) : t('customerDashboard.summary.viewMenuDefaultTitle')}</Text>
                                    <Text size="sm" c="dimmed" lineClamp={2}>{t('customerDashboard.summary.viewMenuSubtitle')}</Text>
                                </Stack>
                                <Button component={Link} to={`/m/${userData.businessSlug}`} leftSection={<IconToolsKitchen2 size={18} />} variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 105 }} size="sm">
                                    {t('customerDashboard.summary.viewMenuButton')}
                                </Button>
                            </Group>
                        </Paper>
                    )}
                    
                    {pendingGifts.length > 0 && (
                        <Paper withBorder p="lg" radius="md" shadow="sm">
                            <Stack gap="md">
                                <Title order={4}>{t('customerDashboard.giftsSectionTitle')}</Title>
                                <Alert color="yellow" icon={<IconGift />} title={t('customerDashboard.summary.pendingGifts', { count: pendingGifts.length })} variant='light' radius="md">
                                    {t('customerDashboard.summary.pendingGiftsDesc')}
                                </Alert>
                                <RewardList
                                    rewards={giftDisplayItems}
                                    userPoints={userPoints}
                                    redeemingRewardId={redeemingRewardId}
                                    errorRewards={errorRewards}
                                    loadingRewards={loadingRewards}
                                    onRedeemPoints={handleAcquireReward}
                                    onRedeemGift={onRedeemGift}
                                    isAcquireFlow={false}
                                />
                            </Stack>
                        </Paper>
                    )}

                    {availableCoupons.length > 0 && (
                        <Paper withBorder p="lg" radius="md" shadow="sm">
                             <Stack gap="md">
                                <Title order={4}>{t('customerDashboard.availableCouponsTitle')}</Title>
                                <AvailableCouponsList coupons={availableCoupons} loading={loadingRewards} error={errorRewards} />
                            </Stack>
                        </Paper>
                    )}

                    <Paper withBorder p="lg" radius="md" shadow="sm">
                        <Stack gap="md">
                            <Title order={4}>{t('customerDashboard.rewardsCatalogTitle')}</Title>
                             {errorRewards && <Alert color="red" title={t('common.error')} icon={<IconAlertCircle />}>{errorRewards}</Alert>}
                             <RewardList
                                rewards={catalogDisplayItems}
                                userPoints={userPoints}
                                redeemingRewardId={redeemingRewardId}
                                errorRewards={null}
                                loadingRewards={loadingRewards}
                                onRedeemPoints={handleAcquireReward}
                                onRedeemGift={onRedeemGift}
                                isAcquireFlow={true}
                             />
                        </Stack>
                    </Paper>
                </Stack>
            </Grid.Col>
        </Grid>
    );
};

export default SummaryTab;