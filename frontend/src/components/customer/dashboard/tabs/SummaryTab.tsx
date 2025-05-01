// filename: frontend/src/components/customer/dashboard/tabs/SummaryTab.tsx
// Version: 1.4.7 (DEFINITIVELY remove businessConfig prop/types - FINAL CHECK)

import React, { useMemo } from 'react';
// FIX: Ensure ALL used components are imported, remove Group/Grid if SimpleGrid is used
import { Stack, Alert, Card, Text, Button, Skeleton, Badge, Paper, SimpleGrid } from '@mantine/core';
import { IconAlertCircle, IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Import child components
import UserInfoDisplay from '../../UserInfoDisplay';
import QrValidationSection from '../../QrValidationSection';

// FIX: Remove unused type imports
import {
    UserData,
    TierBenefitData,
    DisplayReward,
} from '../../../../types/customer';

// Define ProgressBarDataType locally
type ProgressBarDataType = {
    type: 'progress'; percentage: number; currentValueLabel: string; targetValueLabel: string; unit: string; nextTierName: string;
} | { type: 'max_level'; currentTierName: string; } | null;

// --- FIX: Define props for the SummaryTab component (Removed businessConfig) ---
interface SummaryTabProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: ProgressBarDataType;
    currentTierBenefits: TierBenefitData[];
    nextTierName: string | null;
    nextTierBenefits: TierBenefitData[];
    // businessConfig: { tierCalculationBasis: TierCalculationBasis | null } | null; // <-- REMOVED FROM PROPS
    loadingTierData: boolean;
    errorTierData: string | null;
    displayRewards: DisplayReward[];
    setActiveTab: (value: string | null) => void;
    handleValidateQr: (token: string) => Promise<void>;
    validatingQr: boolean;
    scannerOpened: boolean;
    onOpenScanner: () => void;
    onCloseScanner: () => void;
}

const SummaryTab: React.FC<SummaryTabProps> = ({
    userData,
    loadingUser,
    errorUser,
    progressBarData,
    currentTierBenefits,
    nextTierName,
    nextTierBenefits,
    // businessConfig, // <-- REMOVED from destructuring
    loadingTierData,
    errorTierData,
    displayRewards,
    setActiveTab,
    handleValidateQr,
    validatingQr,
    scannerOpened,
    onOpenScanner,
    onCloseScanner
}) => {
    const { t } = useTranslation();

    // Summary Snippet Logic (Show up to 3 previews)
    const rewardsSummary = useMemo(() => {
        const allGifts = displayRewards?.filter(r => r.isGift) ?? [];
        const pointRewards = displayRewards?.filter(r => !r.isGift && r.pointsCost > 0) ?? [];
        const userPts = userData?.points ?? 0;
        const pendingGiftsCount = allGifts.length;
        const affordablePointRewards = pointRewards.filter(r => r.pointsCost <= userPts).sort((a, b) => a.pointsCost - b.pointsCost);
        const maxPreviewItems = 4; // Reverted to 3 based on screenshot/layout issues? Or stick to 4? Let's stick to 4 for now.
        const previewItems: DisplayReward[] = [...allGifts.slice(0, maxPreviewItems)];
        if (previewItems.length < maxPreviewItems) { previewItems.push(...affordablePointRewards.slice(0, maxPreviewItems - previewItems.length)); }
        const nextReward = pointRewards.filter(r => r.pointsCost > userPts).sort((a, b) => a.pointsCost - b.pointsCost)[0];
        return { pendingGiftsCount, previewItems, nextReward };
    }, [displayRewards, userData?.points]);

    // Extract tierCalculationBasis LOCALLY if needed for UserInfoDisplay (check UserInfoDisplayProps again)
    // Let's assume UserInfoDisplay doesn't need it explicitly passed if progressBarData includes unit.
    // const tierCalculationBasis = businessConfig?.tierCalculationBasis ?? null;

    return (
         <Stack gap="xl">
            <UserInfoDisplay
                userData={userData}
                loadingUser={loadingUser}
                errorUser={errorUser}
                progressBarData={progressBarData}
                benefits={currentTierBenefits}
                nextTierName={nextTierName}
                nextTierBenefits={nextTierBenefits}
                // tierCalculationBasis={tierCalculationBasis} // <-- Ensure this is NOT passed if UserInfoDisplay doesn't need it
            />
            { !loadingTierData && errorTierData && (
                <Alert title={t('common.error')} color="orange" icon={<IconAlertCircle />}>
                    {t('customerDashboard.errorLoadingProgress')}
                </Alert>
            ) }
            <QrValidationSection
                onValidate={handleValidateQr}
                isValidating={validatingQr}
                scannerOpened={scannerOpened}
                onOpenScanner={onOpenScanner}
                onCloseScanner={onCloseScanner}
            />

            {/* Rewards Summary Snippet Card */}
            <Card shadow="sm" padding="lg" radius="md" withBorder data-testid="rewards-summary-card">
                <Stack gap="md">
                    {(rewardsSummary.pendingGiftsCount > 0 || rewardsSummary.previewItems.length > 0) && (
                         <Text size="sm" fw={500}>
                            {rewardsSummary.pendingGiftsCount > 0
                                ? t('customerDashboard.summary.pendingGifts', `Tienes ${rewardsSummary.pendingGiftsCount} regalo(s) pendiente(s):`, { count: rewardsSummary.pendingGiftsCount })
                                : t('customerDashboard.summary.rewardsTitle', 'Recompensas Disponibles:')}
                        </Text>
                     )}
                    {rewardsSummary.previewItems.length > 0 && (
                        <SimpleGrid
                            cols={{ base: 2, xs: 3, sm: 4 }} // Adjust columns based on desired density
                            spacing="sm"
                            verticalSpacing="md"
                        >
                             {rewardsSummary.previewItems.map((item) => (
                                <Paper key={item.isGift ? item.grantedRewardId : item.id} p="xs" radius="sm" withBorder component={Stack} gap={4} align="center" data-testid={`preview-${item.id}`}>
                                     <Skeleton height={80} width={80} radius="sm" />
                                     <Text size="xs" ta="center" lineClamp={2} style={{ height: '2.4em' }}>{item.name}</Text>
                                     {item.isGift ? (
                                         <Badge size="xs" variant="light" color="teal" mt={2}>{t('customerDashboard.giftFree')}</Badge>
                                     ) : (
                                         <Text size="xs" ta="center" c="blue" fw={500} mt={2}>{item.pointsCost.toLocaleString()} {t('common.points')}</Text>
                                     )}
                                 </Paper>
                             ))}
                         </SimpleGrid>
                    )}
                     {rewardsSummary.nextReward && (
                         <Text size="sm">
                              {t('customerDashboard.summary.nextReward',
                                 `Próxima recompensa: ${rewardsSummary.nextReward.name} por ${rewardsSummary.nextReward.pointsCost.toLocaleString()} puntos.`,
                                 { name: rewardsSummary.nextReward.name, points: rewardsSummary.nextReward.pointsCost.toLocaleString() }
                               )}
                         </Text>
                    )}
                    {rewardsSummary.previewItems.length > 0 || rewardsSummary.nextReward ? (
                         <Button variant="light" color="blue" fullWidth mt="xs" rightSection={<IconArrowRight size={16} />} onClick={() => setActiveTab('rewards')} data-testid="view-rewards-button">
                             {t('customerDashboard.summary.viewAllButton')}
                         </Button>
                     ) : (
                         <Text size="sm" c="dimmed" mt="xs">{t('customerDashboard.summary.noRewardsInfo')}</Text>
                     )}
                 </Stack>
            </Card>
         </Stack>
    );
};

export default SummaryTab;

// End of File: frontend/src/components/customer/dashboard/tabs/SummaryTab.tsx