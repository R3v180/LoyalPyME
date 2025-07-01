// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/SummaryTab.tsx
// Version 1.5.4 - Corrected type import path

import React, { useMemo } from 'react';
import {
    Stack, Grid, Paper, Title, Group, Text, Box, Image as MantineImage,
    AspectRatio, Button, Alert, Loader, Center,
    SimpleGrid, Badge
} from '@mantine/core';
import { IconGift, IconArrowRight, IconCoin, IconToolsKitchen2 } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Importar Componentes Hijos y sus Props
import UserInfoDisplay, { type UserInfoDisplayProps } from '../../UserInfoDisplay';
import QrValidationSection from '../../QrValidationSection';

// --- CORRECCIÓN DE RUTA ---
import type { DisplayReward, UserData, TierBenefitData } from '../../../../../../shared/types/user.types';
// --- FIN CORRECCIÓN ---

// Props del componente
interface SummaryTabProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: UserInfoDisplayProps['progressBarData'];
    currentTierBenefits: TierBenefitData[];
    nextTierName: string | null;
    nextTierBenefits: TierBenefitData[];
    displayRewards: DisplayReward[] | null;
    userPoints: number | undefined;
    redeemingRewardId: string | null;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => Promise<void>;
    onRedeemPoints: (rewardId: string) => Promise<void>;
    setActiveTab: (tabValue: string | null) => void;
    handleValidateQr: (token: string) => Promise<void>;
    validatingQr: boolean;
    scannerOpened: boolean;
    onOpenScanner: () => void;
    onCloseScanner: () => void;
}

const MAX_PREVIEW_ITEMS = 3;

const SummaryTab: React.FC<SummaryTabProps> = ({
    userData, loadingUser, errorUser, progressBarData, currentTierBenefits,
    nextTierName, nextTierBenefits, displayRewards, userPoints,
    redeemingRewardId, onRedeemGift, onRedeemPoints,
    setActiveTab, handleValidateQr, validatingQr, scannerOpened,
    onOpenScanner, onCloseScanner
}) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const rewardsSummary = useMemo(() => {
        const pendingGifts = displayRewards?.filter(r => r.isGift) ?? [];
        const pointsRewards = displayRewards?.filter(r => !r.isGift && r.pointsCost > 0) ?? [];
        
        const previewItems = [...pendingGifts, ...pointsRewards].slice(0, MAX_PREVIEW_ITEMS);
        return {
            pendingGiftsCount: pendingGifts.length,
            previewItems,
            hasAnyRewards: !!displayRewards && displayRewards.length > 0
        };
    }, [displayRewards]);

    if (loadingUser && !userData) {
        return <Group justify="center" p="xl"><Loader /></Group>;
    }

    return (
        <Grid gutter="xl">
            {/* Columna Izquierda: UserInfo y Validación QR */}
            <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="xl">
                    <UserInfoDisplay
                        userData={userData}
                        loadingUser={loadingUser}
                        errorUser={errorUser}
                        progressBarData={progressBarData}
                        benefits={currentTierBenefits}
                        nextTierName={nextTierName}
                        nextTierBenefits={nextTierBenefits}
                    />
                    <QrValidationSection
                        onValidate={handleValidateQr}
                        isValidating={validatingQr}
                        scannerOpened={scannerOpened}
                        onOpenScanner={onOpenScanner}
                        onCloseScanner={onCloseScanner}
                    />
                </Stack>
            </Grid.Col>

            {/* Columna Derecha: Resumen Recompensas Y Tarjeta Acceso Carta */}
            <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="xl" style={{ height: '100%' }}>
                    
                    {/* Tarjeta de Acceso al Módulo Camarero */}
                    {userData?.isCamareroActive && userData?.businessSlug && (
                        <Paper withBorder p="lg" radius="md" shadow="sm">
                            <Group justify="space-between" align="center">
                                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                                    <Text fw={500} size="lg" truncate>
                                        {userData.businessName 
                                            ? t('customerDashboard.summary.viewMenuFor', { businessName: userData.businessName }) 
                                            : t('customerDashboard.summary.viewMenuDefaultTitle')}
                                    </Text>
                                    <Text size="sm" c="dimmed" lineClamp={2}>
                                        {t('customerDashboard.summary.viewMenuSubtitle')}
                                    </Text>
                                </Stack>
                                <Button
                                    component={Link}
                                    to={`/m/${userData.businessSlug}`}
                                    leftSection={<IconToolsKitchen2 size={18} />}
                                    variant="gradient"
                                    gradient={{ from: 'teal', to: 'lime', deg: 105 }}
                                    size="sm"
                                    style={{ flexShrink: 0 }}
                                >
                                    {t('customerDashboard.summary.viewMenuButton')}
                                </Button>
                            </Group>
                        </Paper>
                    )}

                    {/* Tarjeta de Recompensas (existente) */}
                    {userData?.isLoyaltyCoreActive && (
                        <Paper shadow="sm" p="lg" withBorder radius="md" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Stack gap="lg" style={{ flexGrow: 1 }}>
                                <Title order={4}>
                                    {rewardsSummary.pendingGiftsCount > 0 
                                        ? t('customerDashboard.summary.giftsAndRewardsTitle') 
                                        : t('customerDashboard.summary.rewardsTitle')}
                                </Title>
                                {rewardsSummary.pendingGiftsCount > 0 && (
                                    <Alert color="yellow" icon={<IconGift />} title={t('customerDashboard.summary.pendingGifts', { count: rewardsSummary.pendingGiftsCount })} variant='light' radius="md">
                                        {t('customerDashboard.summary.pendingGiftsDesc')}
                                    </Alert>
                                )}

                                {rewardsSummary.previewItems.length > 0 ? (
                                    <SimpleGrid cols={MAX_PREVIEW_ITEMS === 3 ? 3 : 2} spacing="sm" verticalSpacing="md">
                                        {rewardsSummary.previewItems.map(item => {
                                            const displayName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || item.name_en || t('common.nameNotAvailable');
                                            const isAffordable = item.isGift || (userPoints !== undefined && userPoints >= item.pointsCost);
                                            const isPointsRedeemDisabled = !isAffordable || !!redeemingRewardId;
                                            const isGiftRedeemDisabled = !!redeemingRewardId;
                                            const isThisItemLoading = redeemingRewardId === (item.isGift ? item.grantedRewardId : item.id);

                                            return (
                                                <Stack 
                                                    key={item.id + (item.isGift ? '-gift' : '-reward')} 
                                                    gap={4} 
                                                    align="center"
                                                >
                                                    <AspectRatio ratio={1 / 1} style={{ width: '80%', maxWidth: '80px' }}>
                                                        <MantineImage src={item.imageUrl || '/placeholder-reward.png'} alt={displayName} radius="sm" fallbackSrc="/placeholder-reward.png" />
                                                    </AspectRatio>
                                                    <Text size="xs" ta="center" lineClamp={2} style={{ height: '2.4em', fontWeight: 500 }}>{displayName}</Text>
                                                    {item.isGift ? (
                                                        <Badge size="xs" color="lime" variant='light' mt={2}>{t('customerDashboard.giftFree')}</Badge>
                                                    ) : (
                                                        <Text size="xs" fw={500} mt={2}>{item.pointsCost} {t('common.points')}</Text>
                                                    )}
                                                    <Button
                                                        mt={4}
                                                        size="compact-xs"
                                                        variant={item.isGift ? "filled" : "light"}
                                                        color={item.isGift ? "yellow" : "blue"}
                                                        onClick={() => {
                                                            if (item.isGift && item.grantedRewardId) { onRedeemGift(item.grantedRewardId, displayName); }
                                                            else if (!item.isGift) { onRedeemPoints(item.id); }
                                                        }}
                                                        disabled={isThisItemLoading || (item.isGift ? isGiftRedeemDisabled : isPointsRedeemDisabled)}
                                                        loading={isThisItemLoading}
                                                        fullWidth
                                                        radius="xl"
                                                        leftSection={item.isGift ? <IconGift size={14}/> : <IconCoin size={14}/>}
                                                    >
                                                        {isAffordable || item.isGift
                                                            ? t('customerDashboard.redeemButton')
                                                            : t('customerDashboard.insufficientPoints')
                                                        }
                                                    </Button>
                                                </Stack>
                                            );
                                        })}
                                    </SimpleGrid>
                                ) : (
                                    <Center style={{flexGrow: 1}}>
                                        <Text c="dimmed">{t('customerDashboard.summary.noRewardsInfo')}</Text>
                                    </Center>
                                )}
                                
                                <Box mt="auto">
                                    {rewardsSummary.hasAnyRewards && (
                                        <Button
                                            variant="light"
                                            fullWidth
                                            mt="sm" 
                                            onClick={() => setActiveTab('rewards')}
                                            radius="lg"
                                            rightSection={<IconArrowRight size={16} />}
                                        >
                                            {t('customerDashboard.summary.viewAllButtonShort')}
                                        </Button>
                                    )}
                                </Box>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Grid.Col>
        </Grid>
    );
};

export default SummaryTab;