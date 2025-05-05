// filename: frontend/src/components/customer/dashboard/UserInfoDisplay.tsx
// Version: 1.8.0 (Implement mobile icon click for next tier popover)

import React from 'react';
import {
    Card, Text, Group, Progress, Stack, Popover, List, ThemeIcon, Loader, Alert, Box,
    ActionIcon // <-- Añadido
} from '@mantine/core';
import {
    IconCircleCheck, IconGift, IconDiscount2, IconStar, IconAlertCircle,
    IconHelp // <-- Añadido (o usa IconInfoCircle)
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { useDisclosure, useMediaQuery } from '@mantine/hooks'; // <-- Añadido useDisclosure
// Tipos (asumiendo que están correctos ahora)
import { UserData, TierBenefitData, TierCalculationBasis, TierData } from '../../types/customer';

// Tipo local para ProgressBarData
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
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: ProgressBarDataType;
    benefits: TierBenefitData[];
    nextTierName: string | null;
    nextTierBenefits: TierBenefitData[];
    tierCalculationBasis?: TierCalculationBasis | null; // Mantener por si se usa en el futuro
    allTiers?: TierData[]; // Mantener por si se usa en el futuro
}

// Helper function (sin cambios)
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
    nextTierBenefits
}) => {
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: em(768px))');
    // --- NUEVO: Estado para controlar el Popover ---
    const [popoverOpened, { open: openPopover, close: closePopover, toggle: togglePopover }] = useDisclosure(false);
    // --- FIN NUEVO ---

    // Loading state (sin cambios)
    if (loadingUser) { return <Card withBorder radius="md" p="xl"><Loader size="sm" data-testid="user-info-loader" /></Card>; }
    // Error state (sin cambios)
    if (errorUser || !userData) { return ( <Card withBorder radius="md" p="xl"><Alert title={t('customerDashboard.errorLoadingProfileTitle')} color="red" icon={<IconAlertCircle size="1rem" />} data-testid="user-info-error">{errorUser || t('customerDashboard.errorLoadingProfileDefault')}</Alert></Card> ); }

    const currentTierDisplayName = userData.currentTier?.name ?? t('customerDashboard.baseTier');

    // --- LÓGICA PARA POPOVER ---
    const nextTierTitle = progressBarData?.type === 'progress' ? progressBarData.nextTierName : null; // Solo hay título si hay progreso
    const popoverTitleText = nextTierTitle ? t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierTitle }) : '';

    const nextTierContent = nextTierTitle ? (
        <Stack gap="xs">
            <Text fw={500}>{popoverTitleText}</Text>
            {nextTierBenefits && nextTierBenefits.length > 0 ? (
                <List spacing="xs" size="sm" center>{nextTierBenefits.map((b, i) => renderBenefitItem(b, i, t))}</List>
            ) : ( <Text size="sm" c="dimmed">{t('common.noItems')}</Text> )}
        </Stack>
    ) : null;
    // --- FIN LÓGICA POPOVER ---

    return (
        <Card withBorder radius="md" p="xl" data-testid="user-info-card">
            <Stack gap="lg">
                {/* User Name and Points (sin cambios) */}
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
                             {/* --- Popover unificado con lógica condicional de trigger --- */}
                            <Popover
                                width={300}
                                position="top"
                                withArrow
                                shadow="md"
                                opened={popoverOpened} // Controlado por estado
                                // onClose={closePopover} // Opcional: cerrar si se hace clic fuera
                            >
                                <Popover.Target>
                                    {/* Grupo que contiene Progress y el icono móvil */}
                                    <Group
                                        wrap="nowrap"
                                        gap="xs"
                                        // Eventos de hover solo para escritorio (controlan el estado)
                                        onMouseEnter={!isMobile ? openPopover : undefined}
                                        onMouseLeave={!isMobile ? closePopover : undefined}
                                        style={{ cursor: !isMobile ? 'help' : 'default' }} // Cursor de ayuda en escritorio
                                    >
                                        <Progress
                                            value={progressBarData.percentage}
                                            size="lg" radius="xl" striped animated
                                            style={{ flexGrow: 1 }} // Ocupa el espacio disponible
                                            data-testid="progress-bar"
                                        />
                                        {/* Icono clickeable SOLO para móvil */}
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            onClick={togglePopover} // Click abre/cierra popover en móvil
                                            hiddenFrom="sm" // Oculto en pantallas >= sm
                                            aria-label={t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierTitle || ''})} // Accessibility
                                            title={t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierTitle || ''})} // Tooltip visual (opcional)
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
                             {/* FIN Popover unificado --- */}

                            {/* Progress Label (sin cambios) */}
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

                    {progressBarData?.type === 'max_level' && ( // Mensaje Nivel Máximo (sin cambios)
                         <Box data-testid="max-level-indicator">
                            <Progress value={100} size="lg" radius="xl" color="teal" />
                            <Text fz="xs" c="teal" fw={500} mt={5}>{t('customerDashboard.maxLevelReachedShort')}</Text>
                         </Box>
                    )}
                    {!progressBarData && !loadingUser && !errorUser && ( // Mensaje Error Carga Progreso (sin cambios)
                       <Text fz="xs" c="dimmed">{t('customerDashboard.errorLoadingProgress')}</Text>
                    )}
                </Stack>

                {/* Current Tier Benefits Section (sin cambios) */}
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