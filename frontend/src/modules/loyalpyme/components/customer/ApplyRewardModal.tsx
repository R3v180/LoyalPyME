// frontend/src/modules/loyalpyme/components/customer/ApplyRewardModal.tsx
// Version 1.2.0 (Removed icon prop from Radio to fix type error)

import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Stack, Radio, Text, ScrollArea, Paper } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { GrantedReward } from '../../../../shared/types/user.types';
// --- CAMBIO: Se elimina la importación del icono que da problemas ---
// import { IconDiscount2 } from '@tabler/icons-react';

interface ApplyRewardModalProps {
    opened: boolean;
    onClose: () => void;
    coupons: GrantedReward[];
    onApply: (grantedRewardId: string) => void;
    isApplying: boolean;
}

const ApplyRewardModal: React.FC<ApplyRewardModalProps> = ({
    opened,
    onClose,
    coupons,
    onApply,
    isApplying
}) => {
    const { t, i18n } = useTranslation();
    const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

    // Resetear la selección cada vez que el modal se abre
    useEffect(() => {
        if (opened) {
            setSelectedCouponId(null);
        }
    }, [opened]);

    const handleConfirm = () => {
        if (selectedCouponId) {
            onApply(selectedCouponId);
        }
    };
    
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={t('orderStatusPage.applyRewardModal.title', 'Aplicar una Recompensa')}
            centered
            size="md"
        >
            <Stack>
                <Text size="sm">
                    {t('orderStatusPage.applyRewardModal.description', 'Selecciona uno de tus cupones disponibles para aplicarlo a este pedido.')}
                </Text>
                <ScrollArea.Autosize mah="40vh" p="xs">
                    <Radio.Group
                        value={selectedCouponId}
                        onChange={setSelectedCouponId}
                        name="availableCoupons"
                    >
                        <Stack>
                            {coupons.map((coupon) => (
                                <Paper withBorder p="sm" radius="md" key={coupon.id}>
                                    <Radio
                                        value={coupon.id}
                                        label={
                                            <Stack gap={0} ml="sm">
                                                <Text fw={500}>{(i18n.language === 'es' ? coupon.reward.name_es : coupon.reward.name_en) || 'Recompensa sin nombre'}</Text>
                                                <Text size="xs" c="dimmed">{(i18n.language === 'es' ? coupon.reward.description_es : coupon.reward.description_en)}</Text>
                                            </Stack>
                                        }
                                        // --- CORRECCIÓN AQUÍ: Se ha eliminado la prop 'icon' por completo ---
                                    />
                                </Paper>
                            ))}
                        </Stack>
                    </Radio.Group>
                </ScrollArea.Autosize>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose} disabled={isApplying}>
                        {t('common.cancel', 'Cancelar')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedCouponId || isApplying}
                        loading={isApplying}
                    >
                        {t('orderStatusPage.applyRewardModal.confirmButton', 'Aplicar Recompensa')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ApplyRewardModal;