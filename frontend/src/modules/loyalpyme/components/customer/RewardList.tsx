// frontend/src/modules/loyalpyme/components/customer/RewardList.tsx
// VERSIÓN 2.1.0 - CORRECCIÓN DE IMPORTACIÓN

import React from 'react';
import { 
    SimpleGrid, Card, Button, Alert, Group, Text, Badge, Tooltip, Box, 
    AspectRatio, Image as MantineImage, Stack, Title // <-- Title AÑADIDO AQUÍ
} from '@mantine/core';
import { IconGift, IconAlertCircle, IconInfoCircle, IconCoin, IconCirclePlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DisplayReward } from '../../../../shared/types/user.types';

// --- PROPS REFACTORIZADAS ---
interface RewardListProps {
    rewards: DisplayReward[];
    userPoints?: number;
    redeemingRewardId: string | null;
    errorRewards: string | null;
    loadingRewards: boolean;
    onRedeemPoints: (rewardId: string) => void;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => void;
    isAcquireFlow?: boolean;
}

const RewardList: React.FC<RewardListProps> = ({
    rewards,
    userPoints,
    redeemingRewardId,
    errorRewards,
    loadingRewards,
    onRedeemPoints,
    onRedeemGift,
    isAcquireFlow = false,
}) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '?';
        try {
            return new Date(dateString).toLocaleDateString(i18n.language);
        } catch {
            return '?';
        }
    };

    if (loadingRewards) {
        return <Text>{t('common.loading', 'Cargando...')}</Text>;
    }
    
    if (errorRewards) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" mt="lg">
                {errorRewards}
            </Alert>
        );
    }

    if (rewards.length === 0) {
        const messageKey = isAcquireFlow
            ? 'customerDashboard.noRewardsInCatalog'
            : 'customerDashboard.noRewardsAvailable';
        return <Text mt="md">{t(messageKey)}</Text>;
    }
    
    return (
        <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="lg">
            {rewards.map((item) => {
                const displayName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || item.name_en || '(Sin nombre)';
                const displayDescription = (currentLanguage === 'es' ? item.description_es : item.description_en) || item.description_es || item.description_en;
                const isAffordable = item.isGift || (typeof userPoints !== 'undefined' && userPoints >= item.pointsCost);
                
                const isThisItemLoading = redeemingRewardId === (item.isGift ? item.grantedRewardId : item.id);
                const isAnyItemLoading = !!redeemingRewardId;

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
                                    <Button variant="filled" color="yellow" fullWidth mt="sm" radius="md" size="sm" onClick={() => onRedeemGift(item.grantedRewardId!, displayName)} disabled={isAnyItemLoading} loading={isThisItemLoading} leftSection={<IconGift size={16}/>}>
                                        {t('customerDashboard.redeemGiftButton')}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Group justify="space-between" align="center" mt="sm">
                                        <Text fw={500} size="sm">{item.pointsCost} {t('common.points')}</Text>
                                        {isAffordable && <Badge color="green" variant="light" size="xs">{t('customerDashboard.rewards.affordable', 'Asequible')}</Badge>}
                                    </Group>
                                    <Button
                                        variant="light" color="blue" fullWidth mt="sm" radius="md" size="sm"
                                        onClick={() => onRedeemPoints(item.id)}
                                        disabled={!isAffordable || isAnyItemLoading}
                                        loading={isThisItemLoading}
                                        leftSection={buttonIcon}
                                    >
                                        {isAffordable ? buttonText : t('customerDashboard.insufficientPoints')}
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Card>
                );
            })}
        </SimpleGrid>
    );
};

export default RewardList;