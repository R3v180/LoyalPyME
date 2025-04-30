// filename: frontend/src/components/customer/RewardList.tsx
// Version: 1.2.1 (Adjust internal card spacing and grid columns)

import React from 'react';
import {
    SimpleGrid, Card, Button, Skeleton, Alert, Group, Text, Badge, Tooltip, Title,
    AspectRatio, Box, Stack
} from '@mantine/core';
import { IconGift, IconAlertCircle, IconInfoCircle, IconPhoto, IconCoin } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { DisplayReward } from '../../hooks/useCustomerRewardsData';


interface RewardListProps {
    rewards: DisplayReward[];
    userPoints: number | undefined;
    redeemingRewardId: string | null;
    loadingRewards: boolean;
    loadingGrantedRewards: boolean;
    errorRewards: string | null;
    onRedeemPoints: (rewardId: string) => void;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => void;
}

const RewardList: React.FC<RewardListProps> = ({
    rewards,
    userPoints,
    redeemingRewardId,
    loadingRewards,
    loadingGrantedRewards,
    errorRewards,
    onRedeemPoints,
    onRedeemGift
}) => {
    const { t, i18n } = useTranslation();

    const isLoading = loadingRewards || loadingGrantedRewards;

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '?';
        try {
            return new Date(dateString).toLocaleDateString(i18n.language);
        } catch { return '?'; }
    };

    return (
        <>
            <Title order={4} mb="md">{t('customerDashboard.rewardsSectionTitle')}</Title>

            {isLoading ? (
                // --- MODIFICACIÓN: Ajustar cols en Skeleton ---
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                {/* --- FIN MODIFICACIÓN --- */}
                    {[1, 2, 3].map((i) => ( // Mostrar 3 skeletons aunque ahora sean 2 cols en md
                        <Stack key={`sk-${i}`} gap="md"> {/* Aumentar gap skeleton */}
                             <Skeleton height={100} />
                             <Skeleton height={20} width="70%" />
                             <Skeleton height={15} mt={5} />
                             <Skeleton height={15} mt={5} width="90%" />
                             <Skeleton height={36} mt={10} />
                        </Stack>
                    ))}
                </SimpleGrid>
            ) : errorRewards ? (
                <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" mt="lg">
                   {t('customerDashboard.errorLoadingRewards', { error: errorRewards })}
                </Alert>
            ) : rewards.length === 0 ? (
                <Text>{t('customerDashboard.noRewardsAvailable')}</Text>
            ) : (
                // --- MODIFICACIÓN: Ajustar cols y mantener spacing ---
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                {/* Cambiado md:3 a sm:2 para dar más ancho */}
                {/* --- FIN MODIFICACIÓN --- */}
                    {rewards.map((item) => {
                         const isPointsRedeemDisabled = typeof userPoints === 'undefined' ||
                                                        userPoints < item.pointsCost ||
                                                        redeemingRewardId === item.id ||
                                                        !!redeemingRewardId;
                         const isGiftRedeemDisabled = redeemingRewardId === item.grantedRewardId ||
                                                      !!redeemingRewardId;
                        return (
                            <Card shadow="sm" padding="sm" radius="md" withBorder key={item.isGift ? `G-${item.grantedRewardId}` : `R-${item.id}`}>
                                {/* --- MODIFICACIÓN: Aumentar gap del Stack principal --- */}
                                <Stack gap="md">
                                {/* --- FIN MODIFICACIÓN --- */}
                                    {/* Placeholder Imagen */}
                                    <AspectRatio ratio={16 / 9}>
                                        <Box bg="gray.1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IconPhoto size={32} color="var(--mantine-color-gray-5)" stroke={1.5}/>
                                        </Box>
                                    </AspectRatio>

                                    {/* Contenido */}
                                    <Stack gap="xs" style={{ flexGrow: 1 }}>
                                        <Title order={5}>{item.name}</Title>
                                        {item.description && <Text size="sm" c="dimmed" lineClamp={2}>{item.description}</Text>}
                                    </Stack>

                                    {/* Información y Botón */}
                                    {item.isGift ? (
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
                                                loading={redeemingRewardId === item.grantedRewardId}
                                                leftSection={<IconGift size={16}/>}
                                            >
                                                {t('customerDashboard.redeemGiftButton')}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Text fw={500} size="sm" mt="sm">{item.pointsCost} {t('customerDashboard.points')}</Text>
                                            <Button
                                                variant="light" color="blue" fullWidth mt="sm" radius="md" size="sm"
                                                onClick={() => onRedeemPoints(item.id)}
                                                disabled={isPointsRedeemDisabled}
                                                loading={redeemingRewardId === item.id}
                                                leftSection={<IconCoin size={16}/>}
                                            >
                                                {!isPointsRedeemDisabled || redeemingRewardId === item.id
                                                    ? t('customerDashboard.redeemRewardButton')
                                                    : t('customerDashboard.insufficientPoints')}
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            )}
        </>
    );
};

export default RewardList;

// End of File: frontend/src/components/customer/RewardList.tsx