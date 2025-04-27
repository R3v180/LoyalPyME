// filename: frontend/src/components/admin/BulkAdjustPointsModal.tsx
// Version: 1.0.2 (Fix: Remove further unused imports)

import React, { useState, useEffect } from 'react'; // useState, useEffect
import {
    Modal, NumberInput, TextInput, Button, Group, Stack
    // Loader, Alert eliminados
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
// IconAlertCircle eliminado
import { IconPlusMinus } from '@tabler/icons-react';

// Esquema de validación con Zod
const schema = z.object({
  amount: z.number().refine(val => val !== 0, { message: 'La cantidad no puede ser cero' }),
  reason: z.string().optional(),
});

// Tipo inferido del esquema
type FormValues = z.infer<typeof schema>;

interface BulkAdjustPointsModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    numberOfCustomers: number;
}

const BulkAdjustPointsModal: React.FC<BulkAdjustPointsModalProps> = ({
    opened,
    onClose,
    onSubmit,
    numberOfCustomers
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        initialValues: { amount: 0, reason: '', },
        validate: zodResolver(schema),
    });

    // Resetear formulario cuando se abre el modal
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
        } catch (error) {
            console.error("Error during bulk adjust points submission:", error);
            // La notificación de error la muestra el padre
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalTitle = `Ajustar Puntos para ${numberOfCustomers} Cliente(s) Seleccionado(s)`;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={modalTitle}
            centered
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <NumberInput
                        label="Cantidad a Añadir/Restar"
                        placeholder="Ej: 50 (añadir) o -20 (restar)"
                        required
                        allowNegative
                        {...form.getInputProps('amount')}
                        disabled={isSubmitting}
                        data-autofocus
                    />
                    <TextInput
                        label="Razón (Opcional)"
                        placeholder="Ej: Bonificación masiva, Corrección general"
                        {...form.getInputProps('reason')}
                        disabled={isSubmitting}
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            leftSection={<IconPlusMinus size={16} />}
                            disabled={!form.isValid() || form.values.amount === 0}
                        >
                            Ajustar Puntos Masivamente
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default BulkAdjustPointsModal;