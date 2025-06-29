// frontend/src/modules/loyalpyme/components/customer/RewardList.tsx
// Version 1.6.0 - Added isAcquireFlow prop to dynamically change button text

import React from 'react';
import {
    SimpleGrid, Card, Button, Alert, Group, Text, Badge, Tooltip, Title,
    AspectRatio, Image as MantineImage, Stack, Box
} from '@mantine/core';
import { IconGift, IconAlertCircle, IconInfoCircle, IconCoin, IconCirclePlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
// --- RUTA CORREGIDA ---
import { DisplayReward } from '../../../../shared/types/user.types';

// --- PROPS ACTUALIZADAS ---
interface RewardListProps {
    rewards: DisplayReward[];
    userPoints: number | undefined;
    redeemingRewardId: string | null;
    errorRewards: string | null;
    loadingRewards: boolean;
    loadingGrantedRewards: boolean;
    onRedeemPoints: (rewardId: string) => void;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => void;
    isAcquireFlow?: boolean; // <-- Nuevo prop para cambiar el comportamiento
}

const RewardList: React.FC<RewardListProps> = ({
    rewards,
    userPoints,
    redeemingRewardId,
    errorRewards,
    // loadingRewards, // Descomentar si se usan para mostrar loaders individuales
    // loadingGrantedRewards,
    onRedeemPoints,
    onRedeemGift,
    isAcquireFlow = false // <-- Valor por defecto
}) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const formatDate = (dateString: string | undefined) => { if (!dateString) return '?'; try { return new Date(dateString).toLocaleDateString(i18n.language); } catch { return '?'; } };

    if (errorRewards) { return ( <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" mt="lg"> {t('customerDashboard.errorLoadingRewards', { error: errorRewards })} </Alert> ); }
    if (rewards.length === 0 && !isAcquireFlow) { return <Text mt="md">{t('customerDashboard.noRewardsAvailable')}</Text>; }
    if (rewards.length === 0 && isAcquireFlow) { return <Text mt="md">{t('customerDashboard.noRewardsInCatalog')}</Text>; }


    return (
        <>
            <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="lg">
                {rewards.map((item) => {
                    const displayName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || item.name_en || '(Sin nombre)';
                    const displayDescription = (currentLanguage === 'es' ? item.description_es : item.description_en) || item.description_es || item.description_en;
                    const isPointsRedeemDisabled = typeof userPoints === 'undefined' || userPoints < item.pointsCost || redeemingRewardId === item.id || !!redeemingRewardId;
                    const isGiftRedeemDisabled = redeemingRewardId === item.grantedRewardId || !!redeemingRewardId;
                    const isCurrentlyRedeemingThis = redeemingRewardId === (item.isGift ? item.grantedRewardId : item.id);

                    // --- LÓGICA DE BOTÓN ACTUALIZADA ---
                    const buttonText = isAcquireFlow
                        ? t('customerDashboard.acquireRewardButton', 'Obtener por {{count}} Puntos', { count: item.pointsCost })
                        : t('customerDashboard.redeemRewardButton', 'Canjear Recompensa');
                    
                    const buttonIcon = isAcquireFlow ? <IconCirclePlus size={16}/> : <IconCoin size={16}/>;

                    return (
                        <Card shadow="sm" padding="sm" radius="md" withBorder key={item.isGift ? `G-${item.grantedRewardId}` : `R-${item.id}`}>
                            <Stack gap="md">
                                <AspectRatio ratio={1 / 1}>
                                    <MantineImage src={item.imageUrl || '/placeholder-reward.png'} alt={displayName} fit="cover" radius="sm" fallbackSrc="/placeholder-reward.png" />
                                </AspectRatio>
                                <Stack gap="xs" style={{ flexGrow: 1 }}>
                                    <Title order={5}>{displayName}</Title>
                                    {displayDescription && <Text size="sm" c="dimmed" lineClamp={2}>{displayDescription}</Text>}
                                </Stack>
                                {item.isGift ? (
                                    <>
                                        <Group gap="xs" mt="sm" justify='space-between'>
                                            <Badge color="lime" variant='light' size="lg" radius="sm">{t('customerDashboard.giftFree')}</Badge>
                                            <Tooltip multiline w={220} withArrow position="top" label={t('customerDashboard.giftAssignedBy', { assigner: item.assignedByString, date: formatDate(item.assignedAt) })}>
                                                <Box style={{ display: 'inline-block', cursor: 'help' }}>
                                                    <Group gap={4}>
                                                        <IconInfoCircle size={16} stroke={1.5} style={{ display: 'block' }}/>
                                                        <Text size="xs" c="dimmed">{t('customerDashboard.giftInfo')}</Text>
                                                    </Group>
                                                </Box>
                                            </Tooltip>
                                        </Group>
                                        <Button variant="filled" color="yellow" fullWidth mt="sm" radius="md" size="sm" onClick={() => onRedeemGift(item.grantedRewardId!, displayName)} disabled={isGiftRedeemDisabled} loading={isCurrentlyRedeemingThis} leftSection={<IconGift size={16}/>}> {t('customerDashboard.redeemGiftButton')} </Button>
                                    </>
                                ) : (
                                    <>
                                        <Group justify="space-between" align="center" mt="sm">
                                            <Text fw={500} size="sm">{item.pointsCost} {t('common.points')}</Text>
                                            {(userPoints !== undefined && userPoints >= item.pointsCost) && ( <Badge color="green" variant="light" size="xs">Asequible</Badge> )}
                                        </Group>
                                        <Button
                                            variant="light"
                                            color="blue"
                                            fullWidth
                                            mt="sm"
                                            radius="md"
                                            size="sm"
                                            onClick={() => onRedeemPoints(item.id)}
                                            disabled={isPointsRedeemDisabled}
                                            loading={isCurrentlyRedeemingThis}
                                            leftSection={buttonIcon}
                                        >
                                            {!isPointsRedeemDisabled || isCurrentlyRedeemingThis
                                                ? buttonText
                                                : t('customerDashboard.insufficientPoints')}
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </>
    );
};

export default RewardList;