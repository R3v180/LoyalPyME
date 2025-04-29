// filename: frontend/src/components/admin/BulkAdjustPointsModal.tsx
// Version: 1.0.3 (Fix encoding, remove meta-comments)

import React, { useState, useEffect } from 'react';
import {
    Modal, NumberInput, TextInput, Button, Group, Stack
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
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
    onSubmit: (values: FormValues) => Promise<void>; // La función que manejará la lógica de envío y notificaciones
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
            setIsSubmitting(false); // Asegurarse de resetear estado de envío también
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened]); // No incluir form aquí para evitar bucles si la referencia cambia

    const handleSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit(values); // Llama a la función onSubmit pasada por el padre
            // El padre (AdminCustomerManagementPage) se encarga de las notificaciones y de cerrar el modal si onSubmit tiene éxito
        } catch (error) {
            console.error("Error during bulk adjust points submission callback:", error);
            // El padre ya debería mostrar notificación de error si onSubmit rechaza la promesa
        } finally {
            // No reseteamos isSubmitting aquí si el padre no cierra el modal en caso de error
            // Lo hacemos en el useEffect al reabrir o al cerrar explícitamente.
            // setIsSubmitting(false);
        }
    };

    const modalTitle = `Ajustar Puntos para ${numberOfCustomers} Cliente(s) Seleccionado(s)`;

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
                        label="Cantidad a Añadir/Restar"
                        placeholder="Ej: 50 (añadir) o -20 (restar)"
                        required
                        allowNegative
                        {...form.getInputProps('amount')}
                        disabled={isSubmitting}
                        data-autofocus // Enfocar este campo al abrir
                    />
                    <TextInput
                        label="Razón (Opcional)" // Corregido: Razón
                        placeholder="Ej: Bonificación masiva, Corrección general" // Corregido: Bonificación, Corrección
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
                            // Deshabilitar si el form no es válido o amount es 0
                            disabled={!form.isValid() || form.values.amount === 0 || isSubmitting}
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

// End of File: frontend/src/components/admin/BulkAdjustPointsModal.tsx