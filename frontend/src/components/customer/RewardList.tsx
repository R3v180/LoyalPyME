// filename: frontend/src/components/customer/RewardList.tsx
// Version: 1.3.1 (Fix imports for Stack, remove Box)

import React from 'react';
import {
    SimpleGrid, Card, Button, Alert, Group, Text, Badge, Tooltip, Title,
    AspectRatio, Image, Stack // <--- Añadido Stack, quitado Box
} from '@mantine/core';
import { IconGift, IconAlertCircle, IconInfoCircle, IconCoin } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
// --- IMPORTANTE: Asegúrate que DisplayReward SÍ incluye imageUrl ---
import { DisplayReward } from '../../types/customer';


interface RewardListProps {
    rewards: DisplayReward[];
    userPoints: number | undefined;
    redeemingRewardId: string | null;
    errorRewards: string | null;
    onRedeemPoints: (rewardId: string) => void;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => void;
}

const RewardList: React.FC<RewardListProps> = ({
    rewards,
    userPoints,
    redeemingRewardId,
    errorRewards,
    onRedeemPoints,
    onRedeemGift
}) => {
    const { t, i18n } = useTranslation();

    const formatDate = (dateString: string | undefined) => {
        // ... (sin cambios)
        if (!dateString) return '?';
        try {
            return new Date(dateString).toLocaleDateString(i18n.language);
        } catch { return '?'; }
    };

    if (errorRewards) {
        // ... (sin cambios)
         return (
             <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" mt="lg">
                {t('customerDashboard.errorLoadingRewards', { error: errorRewards })}
             </Alert>
        );
    }

    if (rewards.length === 0) {
        // ... (sin cambios)
        return <Text mt="md">{t('customerDashboard.noRewardsAvailable')}</Text>;
    }

    return (
        <>
            {/* <Title order={4} mb="md">{t('customerDashboard.rewardsSectionTitle')}</Title> */}

            <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="lg">
                {rewards.map((item) => {
                    // --- Lógica de disabled (sin cambios) ---
                    const isPointsRedeemDisabled = typeof userPoints === 'undefined' ||
                                                     userPoints < item.pointsCost ||
                                                     redeemingRewardId === item.id ||
                                                     !!redeemingRewardId;
                    const isGiftRedeemDisabled = redeemingRewardId === item.grantedRewardId ||
                                                 !!redeemingRewardId;
                    const isCurrentlyRedeemingThis = redeemingRewardId === (item.isGift ? item.grantedRewardId : item.id);

                    return (
                        <Card shadow="sm" padding="sm" radius="md" withBorder key={item.isGift ? `G-${item.grantedRewardId}` : `R-${item.id}`}>
                             {/* --- CORRECCIÓN: Usar Stack --- */}
                            <Stack gap="md">
                                <AspectRatio ratio={1 / 1}>
                                    <Image
                                        // --- ¡AQUÍ ESTÁ EL USO DE imageUrl! ---
                                        src={item.imageUrl || '/placeholder-reward.png'}
                                        // --------------------------------------
                                        alt={item.name}
                                        fit="cover"
                                        radius="sm"
                                    />
                                </AspectRatio>

                                 {/* --- CORRECCIÓN: Usar Stack --- */}
                                <Stack gap="xs" style={{ flexGrow: 1 }}>
                                    <Title order={5}>{item.name}</Title>
                                    {item.description && <Text size="sm" c="dimmed" lineClamp={2}>{item.description}</Text>}
                                </Stack>

                                {/* Información y Botón (sin cambios) */}
                                {item.isGift ? (
                                    // ... (código para regalos sin cambios)
                                    <>
                                        <Group gap="xs" mt="sm" justify='space-between'>
                                            <Badge color="lime" variant='light' size="lg" radius="sm">{t('customerDashboard.giftFree')}</Badge>
                                            <Tooltip
                                                multiline w={220} withArrow position="top"
                                                label={t('customerDashboard.giftAssignedBy', { assigner: item.assignedByString, date: formatDate(item.assignedAt) })}
                                            >
                                                <Group gap={4} style={{ cursor: 'help' }}>
                                                    <IconInfoCircle size={16} stroke={1.5} style={{ display: 'block' }}/>
                                                    <Text size="xs" c="dimmed">{t('customerDashboard.giftInfo')}</Text>
                                                </Group>
                                            </Tooltip>
                                        </Group>
                                        <Button
                                            variant="filled" color="yellow" fullWidth mt="sm" radius="md" size="sm"
                                            onClick={() => onRedeemGift(item.grantedRewardId!, item.name)}
                                            disabled={isGiftRedeemDisabled}
                                            loading={isCurrentlyRedeemingThis}
                                            leftSection={<IconGift size={16}/>}
                                        >
                                            {t('customerDashboard.redeemGiftButton')}
                                        </Button>
                                    </>
                                ) : (
                                     // ... (código para recompensas por puntos sin cambios)
                                    <>
                                         <Group justify="space-between" align="center" mt="sm">
                                             <Text fw={500} size="sm">{item.pointsCost} {t('customerDashboard.points')}</Text>
                                             {(userPoints !== undefined && userPoints >= item.pointsCost) && (
                                                <Badge color="green" variant="light" size="xs">Asequible</Badge>
                                             )}
                                         </Group>
                                        <Button
                                            variant="light" color="blue" fullWidth mt="sm" radius="md" size="sm"
                                            onClick={() => onRedeemPoints(item.id)}
                                            disabled={isPointsRedeemDisabled}
                                            loading={isCurrentlyRedeemingThis}
                                            leftSection={<IconCoin size={16}/>}
                                        >
                                            {!isPointsRedeemDisabled || isCurrentlyRedeemingThis
                                                ? t('customerDashboard.redeemRewardButton')
                                                : t('customerDashboard.insufficientPoints')}
                                        </Button>
                                    </>
                                )}
                             {/* --- CORRECCIÓN: Cerrar Stack --- */}
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </>
    );
};

export default RewardList;