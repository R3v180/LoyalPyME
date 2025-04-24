// filename: frontend/src/components/admin/AdjustPointsModal.tsx
// Version: 1.1.1 (Fix API POST URL - remove leading /api)

import React, { useState, useEffect, FormEvent } from 'react';
import {
    Modal, Button, Stack, NumberInput, Textarea, Group, Text, LoadingOverlay, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import axiosInstance from '../../services/axiosInstance'; // Ruta correcta

// Importar el tipo Customer desde la página padre
import { Customer } from '../../pages/admin/AdminCustomerManagementPage';

// Props que recibirá el modal
interface AdjustPointsModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null; // Usar tipo compartido
    onSuccess: () => void;
}

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
    opened,
    onClose,
    customer,
    onSuccess
}) => {
    const [pointsToAdd, setPointsToAdd] = useState<number | ''>('');
    const [reason, setReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Resetear estado (sin cambios)
    useEffect(() => {
        if (!opened) {
            setPointsToAdd(''); setReason(''); setError(null); setIsSubmitting(false);
        }
    }, [opened, customer]);

    // handleSubmit CORREGIDO
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setError(null);
        if (pointsToAdd === '' || pointsToAdd === 0) { setError('Debes indicar una cantidad de puntos a añadir o restar (no puede ser cero).'); return; }
        if (!customer) { setError('No se ha seleccionado un cliente válido.'); return; }
        setIsSubmitting(true); const amount = Number(pointsToAdd);
        try {
            console.log(`[AdjustPoints] Sending request for customer ${customer.id}: amount=${amount}, reason=${reason}`);

            // --- LLAMADA API CORREGIDA: Quitamos el /api inicial ---
            await axiosInstance.post(
                `/admin/customers/${customer.id}/adjust-points`, // SIN /api al principio
                 {
                    amount: amount,
                    reason: reason.trim() || null
                 }
            );
            // ------------------------------------------------------

            notifications.show({ title: 'Éxito', message: `Se han ajustado ${amount} puntos para ${customer.name || customer.email}.`, color: 'green', icon: <IconCheck size={18} />, autoClose: 4000, });
            onSuccess(); onClose();
        } catch (err: any) {
            console.error(`[AdjustPoints] Error adjusting points for customer ${customer?.id}:`, err);
            const errorMsg = err.response?.data?.message || `Error al ajustar puntos: ${err.message || 'Error desconocido'}`;
            setError(errorMsg); notifications.show({ title: 'Error al Ajustar Puntos', message: errorMsg, color: 'red', icon: <IconX size={18} />, autoClose: 6000, });
        } finally { setIsSubmitting(false); }
    };

    if (!customer) return null;

    // JSX del Modal (sin cambios)
    return (
        <Modal opened={opened} onClose={onClose} title={`Ajustar Puntos para ${customer.name || customer.email}`} centered radius="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
            <LoadingOverlay visible={isSubmitting} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Text size="sm">Introduce la cantidad de puntos a añadir (positivo) o restar (negativo).</Text>
                    <NumberInput label="Puntos a Añadir/Restar" placeholder="Ej: 50 o -20" value={pointsToAdd} onChange={(value) => setPointsToAdd(typeof value === 'number' ? value : '')} allowNegative required radius="lg" data-autofocus />
                    <Textarea label="Motivo del ajuste (Opcional)" placeholder="Ej: Compensación por retraso, Bonus especial..." value={reason} onChange={(event) => setReason(event.currentTarget.value)} rows={3} radius="lg" />
                    {error && (<Alert title="Error" color="red" icon={<IconAlertCircle size={16}/>} radius="lg" withCloseButton onClose={() => setError(null)}>{error}</Alert>)}
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose} disabled={isSubmitting} radius="lg"> Cancelar </Button>
                        <Button type="submit" loading={isSubmitting} radius="lg"> Confirmar Ajuste </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default AdjustPointsModal;