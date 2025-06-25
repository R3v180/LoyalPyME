// filename: frontend/src/components/admin/BulkAdjustPointsModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal, NumberInput, TextInput, Button, Group, Stack
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { IconPlusMinus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next'; // Importar hook

// Tipo inferido del esquema
type FormValues = z.infer<ReturnType<typeof createValidationSchema>>;

// Función para crear el esquema de validación (para poder usar t())
const createValidationSchema = (t: Function) => z.object({
  amount: z.number().refine(val => val !== 0, { message: t('validation.cannotBeZero', 'La cantidad no puede ser cero') }),
  reason: z.string().optional(),
});

interface BulkAdjustPointsModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>; // La función que manejará la lógica de envío y notificaciones
    numberOfCustomers: number;
}

const BulkAdjustPointsModal: React.FC<BulkAdjustPointsModalProps> = ({
    opened,
    onClose,
    onSubmit,
    numberOfCustomers
}) => {
    const { t } = useTranslation(); // Hook de traducción
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        initialValues: { amount: 0, reason: '', },
        // Pasar t al crear el schema
        validate: zodResolver(createValidationSchema(t)),
    });

    useEffect(() => {
        if (opened) {
            form.reset();
            setIsSubmitting(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened]);

    const handleSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit(values);
            // Notificaciones y cierre manejados por el padre
        } catch (error) {
            console.error("Error during bulk adjust points submission callback:", error);
            // Notificación de error manejada por el padre
        } finally {
            // Decidimos si resetear isSubmitting aquí o dejarlo al padre/reapertura
            // setIsSubmitting(false);
        }
    };

    // Usar t() para el título del modal
    const modalTitle = t('adminCustomersPage.bulkAdjustPointsModalTitle', { count: numberOfCustomers });

    return (
        <Modal
            opened={opened}
            onClose={() => { if(!isSubmitting) onClose(); }} // Prevenir cierre si está enviando
            title={modalTitle}
            centered
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <NumberInput
                        label={t('adminCustomersPage.bulkAdjustPointsAmountLabel')}
                        placeholder={t('adminCustomersPage.bulkAdjustPointsAmountPlaceholder')}
                        required
                        allowNegative
                        {...form.getInputProps('amount')}
                        disabled={isSubmitting}
                        data-autofocus // Enfocar este campo al abrir
                    />
                    <TextInput
                        label={t('adminCustomersPage.bulkAdjustPointsReasonLabel')}
                        placeholder={t('adminCustomersPage.bulkAdjustPointsReasonPlaceholder')}
                        {...form.getInputProps('reason')}
                        disabled={isSubmitting}
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={isSubmitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            leftSection={<IconPlusMinus size={16} />}
                            disabled={!form.isValid() || form.values.amount === 0 || isSubmitting}
                        >
                            {t('adminCustomersPage.bulkAdjustPointsButton')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default BulkAdjustPointsModal;