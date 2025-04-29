// filename: frontend/src/components/customer/RewardList.tsx
// Version: 1.1.1 (Fix useTranslation destructuring)

import React from 'react';
import {
    SimpleGrid, Card, Button, Skeleton, Alert, Group, Text, Badge, ThemeIcon, Tooltip, Title
} from '@mantine/core';
import { IconGift, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
// --- CAMBIO: Importar i18n también ---
import { useTranslation } from 'react-i18next';
// --- FIN CAMBIO ---

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
    // --- CAMBIO: Obtener 't' y 'i18n' ---
    const { t, i18n } = useTranslation();
    // --- FIN CAMBIO ---

    const isLoading = loadingRewards || loadingGrantedRewards;

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '?';
        try {
            // Ahora 'i18n' está disponible
            return new Date(dateString).toLocaleDateString(i18n.language);
        } catch { return '?'; }
    };

    return (
        <>
            <Title order={4} mb="md">{t('customerDashboard.rewardsSectionTitle')}</Title>

            {isLoading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {[1, 2, 3].map((i) => <Skeleton key={`sk-${i}`} height={180} />)}
                </SimpleGrid>
            ) : errorRewards ? (
                <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" mt="lg">
                   {t('customerDashboard.errorLoadingRewards', { error: errorRewards })}
                </Alert>
            ) : rewards.length === 0 ? (
                <Text>{t('customerDashboard.noRewardsAvailable')}</Text>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {rewards.map((item) => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={item.isGift ? `G-${item.grantedRewardId}` : `R-${item.id}`}>
                            {item.isGift ? (
                                <>
                                    <Group justify="space-between" mb="xs">
                                        <Title order={5}>{item.name}</Title>
                                        <ThemeIcon color="yellow" variant="light" radius="xl" size="lg">
                                             <IconGift stroke={1.5} />
                                        </ThemeIcon>
                                     </Group>
                                    {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                    <Group gap="xs" mt="md" justify='space-between'>
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
                                        variant="filled" color="yellow" fullWidth mt="md" radius="md"
                                        onClick={() => onRedeemGift(item.grantedRewardId!, item.name)}
                                        disabled={redeemingRewardId === item.grantedRewardId || !!redeemingRewardId}
                                        loading={redeemingRewardId === item.grantedRewardId}
                                        leftSection={<IconGift size={16}/>}
                                     >
                                        {t('customerDashboard.redeemGiftButton')}
                                    </Button>
                                 </>
                            ) : (
                                <>
                                    <Title order={5}>{item.name}</Title>
                                     {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                     <Text fw={500} mt="md">{item.pointsCost} {t('customerDashboard.points')}</Text>
                                     <Button
                                        variant="light" color="blue" fullWidth mt="md" radius="md"
                                        onClick={() => onRedeemPoints(item.id)}
                                        disabled={typeof userPoints === 'undefined' || userPoints < item.pointsCost || redeemingRewardId === item.id || !!redeemingRewardId}
                                        loading={redeemingRewardId === item.id}
                                        leftSection={<IconGift size={16}/>}
                                     >
                                        {typeof userPoints !== 'undefined' && userPoints >= item.pointsCost
                                            ? t('customerDashboard.redeemRewardButton')
                                            : t('customerDashboard.insufficientPoints')}
                                    </Button>
                                </>
                             )}
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </>
    );
};

export default RewardList;