// filename: frontend/src/components/customer/dashboard/tabs/SummaryTab.tsx
// Version: 1.6.2 (Ensure Image component is used + Add DEBUG log)

import React, { useMemo } from 'react';
// Asegúrate que Image esté importado y Skeleton NO
import {
    Stack, Alert, Card, Text, Button, Badge, Paper, SimpleGrid, Image
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Import child components
import UserInfoDisplay from '../../UserInfoDisplay';
import QrValidationSection from '../../QrValidationSection';

// Import types needed
import {
    UserData,
    TierBenefitData,
    DisplayReward,
} from '../../../../types/customer';

// Define ProgressBarDataType locally
type ProgressBarDataType = {
    type: 'progress'; percentage: number; currentValueLabel: string; targetValueLabel: string; unit: string; nextTierName: string;
} | { type: 'max_level'; currentTierName: string; } | null;

// Props (sin cambios)
interface SummaryTabProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: ProgressBarDataType;
    currentTierBenefits: TierBenefitData[];
    nextTierName: string | null;
    nextTierBenefits: TierBenefitData[];
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
    userData, loadingUser, errorUser, progressBarData, currentTierBenefits,
    nextTierName, nextTierBenefits, loadingTierData, errorTierData,
    displayRewards, setActiveTab, handleValidateQr, validatingQr,
    scannerOpened, onOpenScanner, onCloseScanner
}) => {
    const { t } = useTranslation();

    // Summary Snippet Logic (sin cambios)
    const rewardsSummary = useMemo(() => {
        const allGifts = displayRewards?.filter(r => r.isGift) ?? [];
        const pointRewards = displayRewards?.filter(r => !r.isGift && r.pointsCost > 0) ?? [];
        const userPts = userData?.points ?? 0;
        const pendingGiftsCount = allGifts.length;
        const affordablePointRewards = pointRewards.filter(r => r.pointsCost <= userPts).sort((a, b) => a.pointsCost - b.pointsCost);
        const maxPreviewItems = 4;
        const previewItems: DisplayReward[] = [...allGifts.slice(0, maxPreviewItems)];
        if (previewItems.length < maxPreviewItems) { previewItems.push(...affordablePointRewards.slice(0, maxPreviewItems - previewItems.length)); }
        const nextReward = pointRewards.filter(r => r.pointsCost > userPts).sort((a, b) => a.pointsCost - b.pointsCost)[0];
        return { pendingGiftsCount, previewItems, nextReward };
    }, [displayRewards, userData?.points]);

    // --- AÑADIR ESTE LOG PARA DEPURAR ---
    console.log('[DEBUG SummaryTab] previewItems:', rewardsSummary.previewItems);
    // ----------------------------------

    return (
         <Stack gap="xl">
            {/* UserInfoDisplay y QrValidationSection (sin cambios aquí) */}
            <UserInfoDisplay
                userData={userData} loadingUser={loadingUser} errorUser={errorUser}
                progressBarData={progressBarData} benefits={currentTierBenefits}
                nextTierName={nextTierName} nextTierBenefits={nextTierBenefits}
            />
             { !loadingTierData && errorTierData && ( <Alert /* ... */ /> ) }
            <QrValidationSection
                onValidate={handleValidateQr} isValidating={validatingQr}
                scannerOpened={scannerOpened} onOpenScanner={onOpenScanner} onCloseScanner={onCloseScanner}
            />

            {/* Rewards Summary Snippet Card */}
            <Card shadow="sm" padding="lg" radius="md" withBorder data-testid="rewards-summary-card">
                <Stack gap="md">
                     {(rewardsSummary.pendingGiftsCount > 0 || rewardsSummary.previewItems.length > 0) && (
                         <Text size="sm" fw={500}>
                            {rewardsSummary.pendingGiftsCount > 0
                                ? t('customerDashboard.summary.pendingGifts', { count: rewardsSummary.pendingGiftsCount })
                                : t('customerDashboard.summary.rewardsTitle')}
                        </Text>
                     )}
                    {rewardsSummary.previewItems.length > 0 && (
                        <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="sm" verticalSpacing="md">
                             {rewardsSummary.previewItems.map((item) => (
                                 <Paper key={item.isGift ? item.grantedRewardId : item.id} p="xs" radius="sm" withBorder component={Stack} gap={4} align="center" data-testid={`preview-${item.id}`}>
                                     {/* --- CÓDIGO CORRECTO CON IMAGE --- */}
                                     <Image
                                        src={item.imageUrl || '/placeholder-reward.png'} // Usa imageUrl o fallback
                                        alt={item.name}
                                        h={80}
                                        w={80}
                                        fit="cover"
                                        radius="sm"
                                     />
                                     {/* --- FIN CÓDIGO CORRECTO --- */}
                                     <Text size="xs" ta="center" lineClamp={2} style={{ height: '2.4em' }}>{item.name}</Text>
                                     {item.isGift ? ( <Badge size="xs" variant="light" color="teal" mt={2}>{t('customerDashboard.giftFree')}</Badge> )
                                      : ( <Text size="xs" ta="center" c="blue" fw={500} mt={2}>{item.pointsCost.toLocaleString()} {t('common.points')}</Text> )}
                                 </Paper>
                             ))}
                         </SimpleGrid>
                    )}
                     {rewardsSummary.nextReward && ( <Text size="sm">{t('customerDashboard.summary.nextReward', { name: rewardsSummary.nextReward.name, points: rewardsSummary.nextReward.pointsCost.toLocaleString() })}</Text> )}
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