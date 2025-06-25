// frontend/src/components/admin/AdjustPointsModal.tsx
// Version 1.1.0 (Use adminCustomerService for API call)

import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Text, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form'; // zodResolver no es estrictamente necesario aquí si la validación es simple
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Customer } from '../../hooks/useAdminCustomersData';
import { useTranslation } from 'react-i18next';

// --- NUEVO: Importar el servicio ---
import * as adminCustomerService from '../../services/adminCustomerService';
// --- FIN NUEVO ---

interface AdjustPointsModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void; // Callback para refrescar datos en la página principal
}

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false); // Renombrado de isSubmitting a loading para consistencia

    const form = useForm({
        initialValues: { amount: 0, reason: '' },
        validate: {
            amount: (value) => (value === 0 ? t('validation.cannotBeZero') : null),
            // 'reason' es opcional, no necesita validación aquí a menos que cambien los requisitos
        }
    });

    useEffect(() => {
        if (opened) {
             form.reset(); // Resetear el formulario cada vez que se abre
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened]); // No necesitamos customer como dependencia si solo reseteamos

    const handleSubmit = async (values: typeof form.values) => {
        if (!customer) return;
        setLoading(true);
        try {
            // --- CAMBIO: Llamar al servicio en lugar de axiosInstance directamente ---
            await adminCustomerService.adjustCustomerPointsApi(
                customer.id,
                values.amount,
                values.reason.trim() ? values.reason.trim() : null // Enviar null si la razón está vacía
            );
            // --- FIN CAMBIO ---

            notifications.show({
                title: t('common.success'),
                message: t('adminCustomersPage.adjustPointsSuccess', { name: customer.name || customer.email }),
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess(); // Llama al callback para refrescar la tabla en la página principal
            onClose();   // Cierra el modal
        } catch (error: any) {
            console.error("Error adjusting points via modal:", error);
            const apiError = error.response?.data?.message || error.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.error'),
                message: t('adminCustomersPage.adjustPointsError', { error: apiError }),
                color: 'red',
                icon: <IconX size={18} />,
            });
            // No cerramos el modal en caso de error para que el usuario pueda corregir si es necesario
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = t('adminCustomersPage.adjustPointsModalTitle', {
        name: customer?.name || customer?.email || t('common.customer')
    });

    return (
        <Modal
            opened={opened}
            onClose={() => { if (!loading) onClose(); }} // Prevenir cierre si está enviando
            title={modalTitle}
            centered
            trapFocus // Mantener el foco dentro del modal
            closeOnClickOutside={!loading} // Prevenir cierre al hacer clic fuera si está cargando
            closeOnEscape={!loading}     // Prevenir cierre con ESC si está cargando
        >
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
                        disabled={loading}
                        data-autofocus // Enfocar este campo al abrir
                        {...form.getInputProps('amount')}
                    />
                    <TextInput
                        label={t('adminCustomersPage.adjustPointsReasonLabel')}
                        placeholder={t('adminCustomersPage.adjustPointsReasonPlaceholder')}
                        mt="md"
                        disabled={loading}
                        {...form.getInputProps('reason')}
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loading}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={!form.isValid() || form.values.amount === 0 || loading}
                        >
                            {t('adminCustomersPage.adjustPointsButton')}
                        </Button>
                    </Group>
                </form>
            ) : (
                // Esto no debería mostrarse si el modal solo se abre con un customer
                <Text c="dimmed">{t('adminCustomersPage.noCustomerSelected')}</Text>
            )}
        </Modal>
    );
};

export default AdjustPointsModal;