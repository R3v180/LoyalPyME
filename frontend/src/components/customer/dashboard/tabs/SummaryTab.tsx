// filename: frontend/src/components/customer/dashboard/tabs/SummaryTab.tsx
// Version: 1.4.1 (Simplify redemption button texts)

import React, { useMemo } from 'react';
import {
    Stack, Grid, Paper, Title, Group, Text, Box, Image as MantineImage,
    AspectRatio, Button, Alert, Loader, Center,
    SimpleGrid, Badge
} from '@mantine/core';
import { IconGift, IconArrowRight, IconCoin } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Importar Componentes Hijos y sus Props
import UserInfoDisplay, { type UserInfoDisplayProps } from '../../UserInfoDisplay';
import QrValidationSection from '../../QrValidationSection';

// Importar Tipos necesarios
import type { DisplayReward, UserData, TierBenefitData } from '../../../../types/customer';

// Props del componente (sin cambios)
interface SummaryTabProps {
    userData: UserData | null; loadingUser: boolean; errorUser: string | null;
    progressBarData: UserInfoDisplayProps['progressBarData'];
    currentTierBenefits: TierBenefitData[]; nextTierName: string | null; nextTierBenefits: TierBenefitData[];
    displayRewards: DisplayReward[] | null; userPoints: number | undefined;
    redeemingRewardId: string | null;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => Promise<void>;
    onRedeemPoints: (rewardId: string) => Promise<void>;
    setActiveTab: (tabValue: string | null) => void;
    handleValidateQr: (token: string) => Promise<void>; validatingQr: boolean;
    scannerOpened: boolean; onOpenScanner: () => void; onCloseScanner: () => void;
}

const MAX_PREVIEW_ITEMS = 6; // Mantener 6

const SummaryTab: React.FC<SummaryTabProps> = ({
    userData, loadingUser, errorUser, progressBarData, currentTierBenefits,
    nextTierName, nextTierBenefits, displayRewards, userPoints,
    redeemingRewardId, onRedeemGift, onRedeemPoints,
    setActiveTab, handleValidateQr, validatingQr, scannerOpened,
    onOpenScanner, onCloseScanner
}) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    // Memo (sin cambios)
    const rewardsSummary = useMemo(() => { const pendingGifts = displayRewards?.filter(r => r.isGift) ?? []; const pointsRewards = displayRewards?.filter(r => !r.isGift && r.pointsCost > 0) ?? []; pointsRewards.sort((a, b) => (a.pointsCost ?? 0) - (b.pointsCost ?? 0)); const nextReward = pointsRewards.length > 0 ? pointsRewards[0] : null; const previewItems = [...pendingGifts, ...pointsRewards].slice(0, MAX_PREVIEW_ITEMS); return { pendingGiftsCount: pendingGifts.length, nextReward, previewItems, hasAnyRewards: !!displayRewards && displayRewards.length > 0 }; }, [displayRewards]);

    if (loadingUser && !userData) { return <Group justify="center" p="xl"><Loader /></Group>; }

    return (
        <Grid gutter="xl">
            {/* Columna Izquierda (sin cambios) */}
            <Grid.Col span={{ base: 12, md: 7 }}> <Stack gap="xl"> <UserInfoDisplay userData={userData} loadingUser={loadingUser} errorUser={errorUser} progressBarData={progressBarData} benefits={currentTierBenefits} nextTierName={nextTierName} nextTierBenefits={nextTierBenefits} /> <QrValidationSection onValidate={handleValidateQr} isValidating={validatingQr} scannerOpened={scannerOpened} onOpenScanner={onOpenScanner} onCloseScanner={onCloseScanner} /> </Stack> </Grid.Col>

            {/* Columna Derecha: Resumen Recompensas */}
            <Grid.Col span={{ base: 12, md: 5 }}>
                <Paper shadow="sm" p="lg" withBorder radius="lg" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Stack gap="lg" style={{ flexGrow: 1 }}>
                        <Title order={4}> {rewardsSummary.pendingGiftsCount > 0 ? t('customerDashboard.summary.giftsAndRewardsTitle') : t('customerDashboard.summary.rewardsTitle')} </Title>
                        {rewardsSummary.pendingGiftsCount > 0 && ( <Alert color="yellow" icon={<IconGift />} title={t('customerDashboard.summary.pendingGifts', { count: rewardsSummary.pendingGiftsCount })} variant='light' radius="md"> {t('customerDashboard.summary.pendingGiftsDesc', 'Tienes regalos esperando ser canjeados.')} </Alert> )}

                        {/* Previsualización */}
                        {rewardsSummary.previewItems.length > 0 ? (
                            <SimpleGrid cols={3} spacing="sm" verticalSpacing="md">
                                {rewardsSummary.previewItems.map(item => {
                                     const displayName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || item.name_en || '(Sin nombre)';
                                     const isAffordable = item.isGift || (userPoints !== undefined && userPoints >= item.pointsCost);
                                     const isPointsRedeemDisabled = !isAffordable || !!redeemingRewardId; // Deshabilitado si no es asequible o algo se está canjeando
                                     const isGiftRedeemDisabled = !!redeemingRewardId; // Solo deshabilita si otra acción está en curso
                                     const isThisItemLoading = redeemingRewardId === (item.isGift ? item.grantedRewardId : item.id);

                                     return (
                                        <Stack key={item.id + (item.isGift ? '-gift' : '-reward')} gap={4} align="center">
                                            <AspectRatio ratio={1 / 1} style={{ width: '80%', maxWidth: '100px' }}>
                                                <MantineImage src={item.imageUrl || '/placeholder-reward.png'} alt={displayName} radius="sm" fallbackSrc="/placeholder-reward.png" />
                                            </AspectRatio>
                                            <Text size="xs" ta="center" lineClamp={2} style={{ height: '2.4em', fontWeight: 500 }}>{displayName}</Text>
                                            {item.isGift ? ( <Badge size="xs" color="lime" variant='light' mt={2}>{t('customerDashboard.giftFree')}</Badge> )
                                             : ( <Text size="xs" fw={500} mt={2}>{item.pointsCost} {t('common.points')}</Text> )}
                                            {/* --- BOTÓN DE CANJE ACTUALIZADO --- */}
                                            <Button
                                                mt={4}
                                                size="compact-xs"
                                                variant={item.isGift ? "filled" : "light"}
                                                color={item.isGift ? "yellow" : "blue"}
                                                onClick={() => {
                                                    if (item.isGift && item.grantedRewardId) { onRedeemGift(item.grantedRewardId, displayName); }
                                                    else if (!item.isGift) { onRedeemPoints(item.id); }
                                                }}
                                                // Deshabilitar si es regalo Y algo se está canjeando, O si es por puntos Y no asequible/algo se canjea
                                                disabled={isThisItemLoading || (item.isGift ? isGiftRedeemDisabled : isPointsRedeemDisabled)}
                                                loading={isThisItemLoading}
                                                fullWidth
                                                radius="xl"
                                                leftSection={item.isGift ? <IconGift size={14}/> : <IconCoin size={14}/>}
                                            >
                                                {/* Texto del botón simplificado */}
                                                {isAffordable || item.isGift
                                                    ? t('customerDashboard.summary.redeemButton', 'Canjear') // Nueva clave i18n
                                                    : t('customerDashboard.insufficientPoints') // Mantener si no hay puntos
                                                }
                                            </Button>
                                            {/* --- FIN BOTÓN --- */}
                                        </Stack>
                                    );
                                })}
                            </SimpleGrid>
                        ) : ( <Center style={{flexGrow: 1}}> <Text c="dimmed">{t('customerDashboard.summary.noRewardsInfo')}</Text> </Center> )}

                        {/* Botón Ver Todo */}
                        <Box mt="auto">
                            {rewardsSummary.nextReward && ( <Text size="sm">{t('customerDashboard.summary.nextReward', { name: (currentLanguage === 'es' ? rewardsSummary.nextReward.name_es : rewardsSummary.nextReward.name_en) || rewardsSummary.nextReward.name_es || rewardsSummary.nextReward.name_en || '(Recompensa)', points: rewardsSummary.nextReward.pointsCost.toLocaleString() })}</Text> )}
                            {rewardsSummary.hasAnyRewards && (
                                <Button variant="light" fullWidth mt="sm" onClick={() => setActiveTab('rewards')} radius="lg" rightSection={<IconArrowRight size={16} />}>
                                     {/* --- Texto botón acortado --- */}
                                    {t('customerDashboard.summary.viewAllButtonShort', 'Ver Todo')} {/* Nueva clave i18n */}
                                </Button>
                            )}
                        </Box>
                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
};

export default SummaryTab;