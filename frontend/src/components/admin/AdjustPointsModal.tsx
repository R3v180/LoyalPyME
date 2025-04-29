// filename: frontend/src/components/admin/AdjustPointsModal.tsx
// Version: 1.1.2 (Fix encoding, imports, comments)

import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Text, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

// --- FIX: Importar Customer desde el hook correcto ---
import { Customer } from '../../hooks/useAdminCustomersData';
// --- FIN FIX ---

interface AdjustPointsModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void; // Callback para refrescar datos
}

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const form = useForm({
        initialValues: { amount: 0, reason: '' },
        validate: { amount: (value) => (value === 0 ? 'La cantidad no puede ser cero' : null), }
    });

    // Resetear form cuando el modal se abre o el cliente cambia
    useEffect(() => {
        if (opened) {
             form.reset();
        }
    }, [opened, customer, form]); // Añadir form a dependencias es más correcto

    const handleSubmit = async (values: typeof form.values) => {
        if (!customer) return;
        setLoading(true);
        try {
            const payload = {
                amount: values.amount,
                reason: values.reason || null // Enviar null si está vacío
            };
            // La llamada POST ya era correcta
            await axiosInstance.post(`/admin/customers/${customer.id}/adjust-points`, payload);
            notifications.show({
                title: 'Éxito', // Corregido: Éxito
                message: `Puntos ajustados correctamente para ${customer.name || customer.email}.`, // Corregido: correctamente
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error adjusting points:", error);
            notifications.show({
                title: 'Error',
                message: `No se pudo ajustar los puntos: ${error.response?.data?.message || error.message}`,
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={`Ajustar Puntos para ${customer?.name || customer?.email || 'Cliente'}`} centered>
            {customer ? (
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Text size="sm" mb="md">Puntos actuales: {customer.points}</Text>
                    <NumberInput
                        label="Cantidad a Añadir/Restar"
                        placeholder="Ej: 50 (añadir) o -20 (restar)"
                        required
                        allowNegative
                        {...form.getInputProps('amount')}
                    />
                    <TextInput
                        label="Razón (Opcional)" // Corregido: Razón
                        placeholder="Ej: Corrección manual, Bonificación especial" // Corregido: Corrección, Bonificación
                        mt="md"
                        {...form.getInputProps('reason')}
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" loading={loading}>Ajustar Puntos</Button>
                    </Group>
                </form>
            ) : (
                <Text c="dimmed">No se ha seleccionado ningún cliente.</Text> // Corregido: ningún
            )}
        </Modal>
    );
};

export default AdjustPointsModal;

// End of File: frontend/src/components/admin/AdjustPointsModal.tsx