// filename: frontend/src/components/customer/dashboard/tabs/SummaryTab.tsx
// Version: 1.3.4 (Increase reward preview items to 6)

import React, { useMemo } from 'react';
import {
    Stack, Grid, Paper, Title, Group, Text, Box, Image as MantineImage,
    AspectRatio, Button, Alert, Loader, Center,
    SimpleGrid, Badge
} from '@mantine/core';
import { IconGift } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Importar Componentes Hijos y sus Props
import UserInfoDisplay, { type UserInfoDisplayProps } from '../../UserInfoDisplay';
import QrValidationSection from '../../QrValidationSection';

// Importar Tipos necesarios
import type { DisplayReward, UserData, TierBenefitData } from '../../../../types/customer';


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
    setActiveTab: (tabValue: string | null) => void;
    handleValidateQr: (token: string) => Promise<void>;
    validatingQr: boolean;
    scannerOpened: boolean;
    onOpenScanner: () => void;
    onCloseScanner: () => void;
}

// --- Constante ACTUALIZADA ---
const MAX_PREVIEW_ITEMS = 6; // Mostrar hasta 6 items
// --- Fin Constante ---

const SummaryTab: React.FC<SummaryTabProps> = ({
    userData,
    loadingUser,
    errorUser,
    progressBarData,
    currentTierBenefits,
    nextTierName,
    nextTierBenefits,
    displayRewards,
    setActiveTab,
    handleValidateQr,
    validatingQr,
    scannerOpened,
    onOpenScanner,
    onCloseScanner
}) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    // Memo para preparar datos de resumen (ahora usa MAX_PREVIEW_ITEMS = 6)
    const rewardsSummary = useMemo(() => {
        const pendingGifts = displayRewards?.filter(r => r.isGift) ?? [];
        const pointsRewards = displayRewards?.filter(r => !r.isGift) ?? [];
        pointsRewards.sort((a, b) => (a.pointsCost ?? 0) - (b.pointsCost ?? 0));
        const nextReward = pointsRewards.length > 0 ? pointsRewards[0] : null;
        // Slice usa la constante actualizada
        const previewItems = [...pendingGifts, ...pointsRewards].slice(0, MAX_PREVIEW_ITEMS);
        console.log('[DEBUG SummaryTab] previewItems:', previewItems);
        return { pendingGiftsCount: pendingGifts.length, nextReward, previewItems, hasAnyRewards: !!displayRewards && displayRewards.length > 0 };
    }, [displayRewards]);


    if (loadingUser && !userData) { return <Group justify="center" p="xl"><Loader /></Group>; }

    return (
        <Grid gutter="xl">
            {/* Columna Izquierda: Info Usuario y QR (sin cambios) */}
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

            {/* Columna Derecha: Resumen Recompensas */}
            <Grid.Col span={{ base: 12, md: 5 }}>
                <Paper shadow="sm" p="lg" withBorder radius="lg" style={{ height: '100%' }}>
                    <Stack gap="lg">
                        <Title order={4}> {rewardsSummary.pendingGiftsCount > 0 ? t('customerDashboard.summary.giftsAndRewardsTitle') : t('customerDashboard.summary.rewardsTitle')} </Title>

                        {rewardsSummary.pendingGiftsCount > 0 && ( <Alert color="yellow" icon={<IconGift />} title={t('customerDashboard.summary.pendingGifts', { count: rewardsSummary.pendingGiftsCount })} variant='light' radius="md"> {t('customerDashboard.summary.pendingGiftsDesc', 'Tienes regalos esperando ser canjeados.')} </Alert> )}

                        {rewardsSummary.previewItems.length > 0 ? (
                            // Mantener 3 columnas, se harán 2 filas si hay 6 items
                            <SimpleGrid cols={3} spacing="sm" verticalSpacing="md">
                                {rewardsSummary.previewItems.map(item => {
                                     const displayName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || item.name_en || '(Sin nombre)';
                                     return (
                                        <Stack key={item.id + (item.isGift ? '-gift' : '-reward')} gap={4} align="center">
                                            <AspectRatio ratio={1 / 1} style={{ width: '80%', maxWidth: '100px' }}>
                                                <MantineImage src={item.imageUrl || '/placeholder-reward.png'} alt={displayName} radius="sm" fallbackSrc="/placeholder-reward.png" />
                                            </AspectRatio>
                                            <Text size="xs" ta="center" lineClamp={2} style={{ height: '2.4em' }}>{displayName}</Text>
                                            {item.isGift && <Badge size="xs" color="lime" variant='outline'>{t('customerDashboard.giftFree')}</Badge>}
                                            {!item.isGift && <Text size="xs" fw={500}>{item.pointsCost} {t('common.points')}</Text>}
                                        </Stack>
                                    );
                                })}
                            </SimpleGrid>
                        ) : ( <Center> <Text c="dimmed">{t('customerDashboard.summary.noRewardsInfo')}</Text> </Center> )}

                        <Box mt="auto">
                            {rewardsSummary.nextReward && ( <Text size="sm">{t('customerDashboard.summary.nextReward', { name: (currentLanguage === 'es' ? rewardsSummary.nextReward.name_es : rewardsSummary.nextReward.name_en) || rewardsSummary.nextReward.name_es || rewardsSummary.nextReward.name_en || '(Recompensa)', points: rewardsSummary.nextReward.pointsCost.toLocaleString() })}</Text> )}
                            {rewardsSummary.hasAnyRewards && ( <Button variant="light" fullWidth mt="sm" onClick={() => setActiveTab('rewards')} radius="lg"> {t('customerDashboard.summary.viewAllButton')} </Button> )}
                        </Box>

                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
};

export default SummaryTab;