// filename: frontend/src/components/customer/dashboard/UserInfoDisplay.tsx
// Version: 1.7.3 (Remove ProgressBarDataType from type import)

import React from 'react';
import { Card, Text, Group, Progress, Stack, Tooltip, Popover, List, ThemeIcon, Loader, Alert, Box } from '@mantine/core';
import { IconCircleCheck, IconGift, IconDiscount2, IconStar, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { useMediaQuery } from '@mantine/hooks';

// --- FIX: Remove ProgressBarDataType from this import ---
import { UserData, TierBenefitData, TierCalculationBasis, TierData } from '../../types/customer';

// Define ProgressBarDataType locally
type ProgressBarDataType = {
    type: 'progress';
    percentage: number;
    currentValueLabel: string;
    targetValueLabel: string;
    unit: string;
    nextTierName: string;
} | {
    type: 'max_level';
    currentTierName: string;
} | null;
// --- END FIX ---

export interface UserInfoDisplayProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: ProgressBarDataType; // Uses the locally defined type
    benefits: TierBenefitData[];
    nextTierName: string | null;
    nextTierBenefits: TierBenefitData[];
    tierCalculationBasis?: TierCalculationBasis | null;
    allTiers?: TierData[];
}

// Helper function definition corrected
const renderBenefitItem = (benefit: TierBenefitData, index: number, t: TFunction): JSX.Element => {
    let icon = <IconStar size={16} />;
    let text = benefit.description || `${benefit.type}: ${benefit.value}`;
    switch (benefit.type) {
        case 'POINTS_MULTIPLIER': icon = <IconCircleCheck size={16} />; text = t('benefits.pointsMultiplier', { value: benefit.value }); break;
        case 'EXCLUSIVE_REWARD_ACCESS': icon = <IconGift size={16} />; text = t('benefits.exclusiveRewardAccess', { value: benefit.value }); break;
        case 'CUSTOM_BENEFIT': icon = <IconDiscount2 size={16} />; text = t('benefits.customBenefit', { value: benefit.value }); break;
    }
    return ( <List.Item key={benefit.id || index} icon={<ThemeIcon color="teal" size={24} radius="xl">{icon}</ThemeIcon>}>{text}</List.Item> );
};


const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({
    userData,
    loadingUser,
    errorUser,
    progressBarData,
    benefits,
    nextTierName,
    nextTierBenefits
}) => {
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: em(768px))');

    // Loading state
    if (loadingUser) { return <Card withBorder radius="md" p="xl"><Loader size="sm" data-testid="user-info-loader" /></Card>; }
    // Error state
    if (errorUser || !userData) { return ( <Card withBorder radius="md" p="xl"><Alert title={t('customerDashboard.errorLoadingProfileTitle')} color="red" icon={<IconAlertCircle size="1rem" />} data-testid="user-info-error">{errorUser || t('customerDashboard.errorLoadingProfileDefault')}</Alert></Card> ); }

    const currentTierDisplayName = userData.currentTier?.name ?? t('customerDashboard.baseTier');
    const nextTierTitle = progressBarData?.type === 'progress' ? progressBarData.nextTierName : nextTierName;
    const popoverTitleText = nextTierTitle ? t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierTitle }) : '';

    // Prepare content for Tooltip/Popover label/dropdown
    const nextTierContent = nextTierTitle ? (
        <Stack gap="xs">
            <Text fw={500}>{popoverTitleText}</Text>
            {nextTierBenefits && nextTierBenefits.length > 0 ? (
                <List spacing="xs" size="sm" center>{nextTierBenefits.map((b, i) => renderBenefitItem(b, i, t))}</List>
            ) : ( <Text size="sm" c="dimmed">{t('common.noItems')}</Text> )}
        </Stack>
    ) : null;

    return (
        <Card withBorder radius="md" p="xl" data-testid="user-info-card">
            <Stack gap="lg">
                {/* User Name and Points */}
                <Group justify="space-between">
                    <Text fz="lg" fw={600}>{userData.name || userData.email}</Text>
                    <Text fz="lg" fw={700} c="blue">{userData.points.toLocaleString()} {t('common.points')}</Text>
                </Group>

                {/* Tier and Progress Section */}
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text fz="sm" fw={500} c="dimmed">{t('customerDashboard.currentTier')}</Text>
                        <Text fz="sm" fw={700} data-testid="current-tier-name">{currentTierDisplayName}</Text>
                    </Group>

                    {/* Progress Bar or Max Level Message */}
                    {progressBarData?.type === 'progress' && nextTierContent && (
                        <Box>
                             {!isMobile ? (
                                 <Tooltip label={nextTierContent} multiline w={300} position="top" withArrow openDelay={100} closeDelay={200} >
                                     <Progress value={progressBarData.percentage} size="lg" radius="xl" striped animated style={{ cursor: 'help' }} data-testid="progress-bar" />
                                 </Tooltip>
                             ) : (
                                 <Popover width={300} position="top" withArrow shadow="md">
                                     <Popover.Target>
                                         <Progress value={progressBarData.percentage} size="lg" radius="xl" striped animated style={{ cursor: 'pointer' }} data-testid="progress-bar" />
                                     </Popover.Target>
                                     <Popover.Dropdown>
                                         {nextTierContent}
                                     </Popover.Dropdown>
                                 </Popover>
                             )}
                            <Group justify="space-between" mt={5}>
                                <Text fz="xs" c="dimmed" data-testid="progress-label">
                                    {t('customerDashboard.progressLabel', {
                                        currentValue: progressBarData.currentValueLabel,
                                        targetValue: progressBarData.targetValueLabel,
                                        unit: progressBarData.unit,
                                        nextTierName: progressBarData.nextTierName
                                    })}
                                </Text>
                            </Group>
                        </Box>
                    )}
                    {progressBarData?.type === 'max_level' && (
                         <Box data-testid="max-level-indicator">
                            <Progress value={100} size="lg" radius="xl" color="teal" />
                             <Text fz="xs" c="teal" fw={500} mt={5}>{t('customerDashboard.maxLevelReachedShort')}</Text>
                         </Box>
                    )}
                    {!progressBarData && (
                         <Text fz="xs" c="dimmed">{t('customerDashboard.errorLoadingProgress')}</Text>
                     )}
                </Stack>

                 {/* Current Tier Benefits Section */}
                 <Stack gap="xs" mt="md" data-testid="current-benefits-section">
                      <Text fw={500}>{t('customerDashboard.tierBenefitsTitle', { tierName: currentTierDisplayName })}</Text>
                      {benefits && benefits.length > 0 ? (
                          <List spacing="xs" size="sm" center icon={<></>}>
                              {benefits.map((b, i) => renderBenefitItem(b, i, t))}
                          </List>
                      ) : (
                          <Text size="sm" c="dimmed">{t('common.noItems')}</Text>
                      )}
                 </Stack>
            </Stack>
        </Card>
    );
};

export default UserInfoDisplay;

// End of File: frontend/src/components/customer/dashboard/UserInfoDisplay.tsx