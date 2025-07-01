// frontend/src/modules/loyalpyme/components/customer/ApplyRewardModal.tsx
// VERSIÓN 4.0.2 - Completo, unificado y sin variables no utilizadas.

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Group, Stack, Text, Divider, Badge, Box, Checkbox, Paper, ScrollArea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
//import { IconTicket, IconGift } from '@tabler/icons-react';

import { Reward, GrantedReward, DisplayReward } from '../../../../shared/types/user.types';
import { RewardType } from '../../../../shared/types/enums';

export interface AppliedSelections {
  discount: DisplayReward | null;
  freeItems: DisplayReward[];
}

interface ApplyRewardModalProps {
  opened: boolean;
  onClose: () => void;
  userPoints: number;
  availableCoupons: GrantedReward[] | undefined;
  redeemableRewards: Reward[] | undefined;
  initialSelections: AppliedSelections;
  onApply: (selections: AppliedSelections) => void;
  isApplying: boolean;
  appliedLcoRewardIdOnActiveOrder: string | null;
}

const ApplyRewardModal: React.FC<ApplyRewardModalProps> = ({
    opened, onClose, userPoints, availableCoupons, redeemableRewards,
    initialSelections, onApply, isApplying, appliedLcoRewardIdOnActiveOrder,
}) => {
    const { t, i18n } = useTranslation();
    const [localSelections, setLocalSelections] = useState<AppliedSelections>(initialSelections);

    useEffect(() => {
        if (opened) {
            setLocalSelections(initialSelections);
        }
    }, [opened, initialSelections]);

    const unifiedRewards: DisplayReward[] = useMemo(() => {
        const rewardMap = new Map<string, DisplayReward>();

        (availableCoupons || []).forEach(gr => {
            const rewardData = gr.reward;
            rewardMap.set(rewardData.id, {
                isGift: true,
                grantedRewardId: gr.id,
                id: rewardData.id,
                name_es: rewardData.name_es, name_en: rewardData.name_en,
                description_es: rewardData.description_es, description_en: rewardData.description_en,
                pointsCost: 0,
                imageUrl: rewardData.imageUrl,
                type: rewardData.type,
                linkedMenuItemId: rewardData.linkedMenuItemId,
                discountType: rewardData.discountType,
                discountValue: rewardData.discountValue ? Number(rewardData.discountValue) : null,
                assignedAt: gr.assignedAt,
                assignedByString: ''
            });
        });

        (redeemableRewards || []).forEach(r => {
            if (!rewardMap.has(r.id)) {
                rewardMap.set(r.id, {
                    isGift: false,
                    id: r.id,
                    name_es: r.name_es, name_en: r.name_en,
                    description_es: r.description_es, description_en: r.description_en,
                    pointsCost: r.pointsCost,
                    imageUrl: r.imageUrl,
                    type: r.type,
                    linkedMenuItemId: r.linkedMenuItemId,
                    discountType: r.discountType,
                    discountValue: r.discountValue ? Number(r.discountValue) : null,
                });
            }
        });
        
        return Array.from(rewardMap.values());
    }, [availableCoupons, redeemableRewards]);

    const handleSelect = (item: DisplayReward) => {
        const isDiscountType = item.type === RewardType.DISCOUNT_ON_ITEM || item.type === RewardType.DISCOUNT_ON_TOTAL;
        const uniqueItemId = item.isGift ? item.grantedRewardId! : item.id;
        
        setLocalSelections(prev => {
            const newSelections = { ...prev };
            const prevDiscountId = prev.discount ? (prev.discount.isGift ? prev.discount.grantedRewardId! : prev.discount.id) : null;

            if (isDiscountType) {
                newSelections.discount = prevDiscountId === uniqueItemId ? null : item;
            } else {
                const existingIndex = prev.freeItems.findIndex(fi => (fi.isGift ? fi.grantedRewardId : fi.id) === uniqueItemId);
                if (existingIndex > -1) {
                    newSelections.freeItems = prev.freeItems.filter(fi => (fi.isGift ? fi.grantedRewardId : fi.id) !== uniqueItemId);
                } else {
                    newSelections.freeItems = [...prev.freeItems, item];
                }
            }
            return newSelections;
        });
    };

    const pointsToSpend = useMemo(() => {
        let totalCost = localSelections.freeItems.reduce((sum, item) => sum + (item.isGift ? 0 : item.pointsCost), 0);
        if (localSelections.discount && !localSelections.discount.isGift) {
            totalCost += localSelections.discount.pointsCost;
        }
        return totalCost;
    }, [localSelections]);
    
    const remainingPointsAfterSelection = userPoints - pointsToSpend;
    const canAffordSelection = remainingPointsAfterSelection >= 0;

    const isItemSelected = (item: DisplayReward) => {
        const uniqueId = item.isGift ? item.grantedRewardId! : item.id;
        const discountId = localSelections.discount ? (localSelections.discount.isGift ? localSelections.discount.grantedRewardId! : localSelections.discount.id) : null;
        return discountId === uniqueId || localSelections.freeItems.some(fi => (fi.isGift ? fi.grantedRewardId : fi.id) === uniqueId);
    };

    const handleConfirm = () => {
        if (!canAffordSelection) {
            notifications.show({ title: t('common.error'), message: t('applyRewardModal.notEnoughPoints'), color: 'red' });
            return;
        }
        onApply(localSelections);
        onClose();
    };
    
    return (
        <Modal opened={opened} onClose={onClose} title={t('applyRewardModal.title')} size="lg" centered>
            <Stack>
                {unifiedRewards.length > 0 ? (
                    <ScrollArea.Autosize mah="50vh">
                        <Stack>
                            {unifiedRewards.map(item => {
                                const isSelected = isItemSelected(item);
                                const isDiscountType = item.type.includes('DISCOUNT');
                                const canAfford = item.isGift || userPoints >= item.pointsCost;
                                
                                const isDisabled =
                                    (!isSelected && !canAfford) ||
                                    (isDiscountType && localSelections.discount !== null && !isSelected) ||
                                    (item.id === appliedLcoRewardIdOnActiveOrder && !isSelected);

                                return (
                                    <Paper key={item.id + (item.isGift ? '-gift' : '')} withBorder p="sm" radius="md" opacity={isDisabled ? 0.5 : 1}>
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={() => handleSelect(item)}
                                            disabled={isDisabled}
                                            label={
                                                <Group justify="space-between" w="100%">
                                                    <Text>{(i18n.language === 'es' ? item.name_es : item.name_en) || 'Recompensa'}</Text>
                                                    {item.isGift ? (
                                                        <Badge color="green" variant="light">Gratis (Cupón)</Badge>
                                                    ) : (
                                                        <Badge color={canAfford ? 'blue' : 'gray'}>{item.pointsCost} pts</Badge>
                                                    )}
                                                </Group>
                                            }
                                        />
                                        {isDisabled && item.id === appliedLcoRewardIdOnActiveOrder && (
                                            <Text size="xs" c="orange" mt={4}>
                                                {t('applyRewardModal.alreadyApplied')}
                                            </Text>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </ScrollArea.Autosize>
                ) : (
                    <Text c="dimmed" ta="center" p="md">{t('applyRewardModal.noRewardsInCatalog')}</Text>
                )}

                <Divider my="sm" />

                <Box p="xs" bg={!canAffordSelection ? 'red.1' : undefined} style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                    <Group justify="space-between">
                        <Stack gap={0}>
                            <Text fw={500}>{t('applyRewardModal.summary.totalCost')}</Text>
                            <Text size="sm" c={!canAffordSelection ? 'red' : 'dimmed'}>
                                {t('applyRewardModal.summary.availablePoints', { points: userPoints })}
                            </Text>
                        </Stack>
                        <Badge size="xl" color={!canAffordSelection ? 'red' : 'blue'}>
                            {t('applyRewardModal.summary.pointsBadge', { points: pointsToSpend })}
                        </Badge>
                    </Group>
                    {!canAffordSelection && (<Text c="red" size="xs" mt={4}>{t('applyRewardModal.notEnoughPoints')}</Text>)}
                </Box>
                
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose} disabled={isApplying}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={isApplying || !canAffordSelection} loading={isApplying}>
                        {t('applyRewardModal.applyButton')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ApplyRewardModal;