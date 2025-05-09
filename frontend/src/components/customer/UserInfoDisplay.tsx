// frontend/src/components/customer/UserInfoDisplay.tsx
// La versión que me pasaste era frontend/src/components/customer/dashboard/UserInfoDisplay.tsx
// Usaré esa ruta. Si es diferente, dímelo.

import React from 'react';
import {
    Card, Text, Group, Progress, Stack, Popover, List, ThemeIcon, Loader, Alert, Box,
    ActionIcon
} from '@mantine/core';
import {
    IconCircleCheck, IconGift, IconDiscount2, IconStar, IconAlertCircle,
    IconHelp
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { UserData, TierBenefitData, TierCalculationBasis, TierData } from '../../types/customer'; // Asumiendo que TierData también se importa aquí si se usa

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

export interface UserInfoDisplayProps {
    userData: UserData | null; // UserData ahora tiene points? opcional
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: ProgressBarDataType;
    benefits: TierBenefitData[];
    nextTierName: string | null; // Se usa para el popover
    nextTierBenefits: TierBenefitData[];
    tierCalculationBasis?: TierCalculationBasis | null;
    allTiers?: TierData[];
}

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
    nextTierBenefits, // nextTierName se saca de progressBarData
    // tierCalculationBasis, // No se usa directamente en el render
    // allTiers // No se usa directamente en el render
}) => {
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: em(768px))');
    const [popoverOpened, { open: openPopover, close: closePopover, toggle: togglePopover }] = useDisclosure(false);

    if (loadingUser) { return <Card withBorder radius="md" p="xl"><Loader size="sm" data-testid="user-info-loader" /></Card>; }
    if (errorUser || !userData) { return ( <Card withBorder radius="md" p="xl"><Alert title={t('customerDashboard.errorLoadingProfileTitle')} color="red" icon={<IconAlertCircle size="1rem" />} data-testid="user-info-error">{errorUser || t('customerDashboard.errorLoadingProfileDefault')}</Alert></Card> ); }

    const currentTierDisplayName = userData.currentTier?.name ?? t('customerDashboard.baseTier');

    // --- CORRECCIÓN AQUÍ para userData.points ---
    const displayPoints = userData.points ?? 0; // Si points es undefined, mostrar 0
    // --- FIN CORRECCIÓN ---

    const nextTierTitle = progressBarData?.type === 'progress' ? progressBarData.nextTierName : null;
    const popoverTitleText = nextTierTitle ? t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierTitle }) : '';

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
                <Group justify="space-between">
                    <Text fz="lg" fw={600}>{userData.name || userData.email}</Text>
                    {/* --- USAR displayPoints --- */}
                    <Text fz="lg" fw={700} c="blue">{displayPoints.toLocaleString()} {t('common.points')}</Text>
                    {/* --- FIN USAR --- */}
                </Group>

                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text fz="sm" fw={500} c="dimmed">{t('customerDashboard.currentTier')}</Text>
                        <Text fz="sm" fw={700} data-testid="current-tier-name">{currentTierDisplayName}</Text>
                    </Group>

                    {progressBarData?.type === 'progress' && nextTierContent && (
                        <Box>
                            <Popover
                                width={300}
                                position="top"
                                withArrow
                                shadow="md"
                                opened={popoverOpened}
                            >
                                <Popover.Target>
                                    <Group
                                        wrap="nowrap"
                                        gap="xs"
                                        onMouseEnter={!isMobile ? openPopover : undefined}
                                        onMouseLeave={!isMobile ? closePopover : undefined}
                                        style={{ cursor: !isMobile ? 'help' : 'default' }}
                                    >
                                        <Progress
                                            value={progressBarData.percentage}
                                            size="lg" radius="xl" striped animated
                                            style={{ flexGrow: 1 }}
                                            data-testid="progress-bar"
                                        />
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            onClick={togglePopover}
                                            hiddenFrom="sm"
                                            aria-label={t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierTitle || ''})}
                                            title={t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierTitle || ''})}
                                            data-testid="mobile-popover-trigger"
                                        >
                                            <IconHelp size={18} stroke={1.5}/>
                                        </ActionIcon>
                                    </Group>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    {nextTierContent}
                                </Popover.Dropdown>
                            </Popover>
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
                    {!progressBarData && !loadingUser && !errorUser && (
                       <Text fz="xs" c="dimmed">{t('customerDashboard.errorLoadingProgress')}</Text>
                    )}
                </Stack>

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