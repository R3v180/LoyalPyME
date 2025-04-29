// filename: frontend/src/components/admin/AdjustPointsModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Text, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Customer } from '../../hooks/useAdminCustomersData';
import { useTranslation } from 'react-i18next'; // Importar hook

interface AdjustPointsModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void; // Callback para refrescar datos
}

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    const { t } = useTranslation(); // Hook de traducción
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: { amount: 0, reason: '' },
        // Usar t() para el mensaje de validación
        validate: {
            amount: (value) => (value === 0 ? t('validation.cannotBeZero', 'La cantidad no puede ser cero') : null),
        }
    });

    useEffect(() => {
        if (opened) {
             form.reset();
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, customer]); // form no es necesario como dependencia si no cambia su referencia

    const handleSubmit = async (values: typeof form.values) => {
        if (!customer) return;
        setLoading(true);
        try {
            const payload = {
                amount: values.amount,
                reason: values.reason || null
            };
            await axiosInstance.post(`/admin/customers/${customer.id}/adjust-points`, payload);
            notifications.show({
                title: t('common.success'),
                message: t('adminCustomersPage.adjustPointsSuccess', { name: customer.name || customer.email }),
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error adjusting points:", error);
            const apiError = error.response?.data?.message || error.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.error'),
                message: t('adminCustomersPage.adjustPointsError', { error: apiError }),
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = t('adminCustomersPage.adjustPointsModalTitle', {
        name: customer?.name || customer?.email || t('common.customer', 'Cliente')
    });

    return (
        <Modal opened={opened} onClose={onClose} title={modalTitle} centered>
            {customer ? (
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Text size="sm" mb="md">
                        {t('adminCustomersPage.adjustPointsCurrent', { points: customer.points })}
                    </Text>
                    <NumberInput
                        label={t('adminCustomersPage.adjustPointsAmountLabel')}
                        placeholder={t('adminCustomersPage.adjustPointsAmountPlaceholder')}
                        required
                        allowNegative
                        {...form.getInputProps('amount')}
                    />
                    <TextInput
                        label={t('adminCustomersPage.adjustPointsReasonLabel')}
                        placeholder={t('adminCustomersPage.adjustPointsReasonPlaceholder')}
                        mt="md"
                        {...form.getInputProps('reason')}
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
                        <Button type="submit" loading={loading}>{t('adminCustomersPage.adjustPointsButton')}</Button>
                    </Group>
                </form>
            ) : (
                <Text c="dimmed">{t('adminCustomersPage.noCustomerSelected', 'No se ha seleccionado ningún cliente.')}</Text>
            )}
        </Modal>
    );
};

export default AdjustPointsModal;