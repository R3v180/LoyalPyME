// File: frontend/src/components/AddRewardForm.tsx
// Version: 1.3.0 (Integrate Mantine Notifications)

import { useState, useEffect, FormEvent } from 'react';
import axiosInstance from '../services/axiosInstance';

// Mantine Imports
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group
    // --- CAMBIO: Quitar Alert ---
    // Alert
    // --- FIN CAMBIO ---
} from '@mantine/core';
// --- CAMBIO: Importar notifications y iconos ---
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react'; // IconAlertCircle se quita si no hay validación con Alert
// --- FIN CAMBIO ---


// Interfaz Reward (local, sin cambios)
interface Reward {
    id: string; name: string; description?: string | null; pointsCost: number; isActive: boolean;
}

// Props del componente (sin cambios)
interface RewardFormProps {
    mode: 'add' | 'edit';
    initialData?: Reward | null;
    rewardIdToUpdate?: string | null;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

// Nombre del componente (mantenemos export como RewardForm)
const RewardForm: React.FC<RewardFormProps> = ({
    mode, initialData, rewardIdToUpdate, onSubmitSuccess, onCancel
}) => {

    // Estados
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [pointsCost, setPointsCost] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    // --- CAMBIO: Quitar estado de error local ---
    // const [error, setError] = useState<string | null>(null);
    // --- FIN CAMBIO ---

    // useEffect para popular formulario (sin cambios)
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setPointsCost(initialData.pointsCost !== null ? initialData.pointsCost : '');
        } else {
            setName(''); setDescription(''); setPointsCost('');
        }
        // setError(null); // Ya no usamos error local
    }, [mode, initialData]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // setError(null); // Ya no usamos error local

        // --- CAMBIO: Validación frontend con notificaciones ---
        if (!name.trim()) {
            notifications.show({
                title: 'Campo Obligatorio',
                message: 'El nombre de la recompensa no puede estar vacío.',
                color: 'orange',
                icon: <IconAlertCircle size={18} />,
            });
            return;
        }
        if (pointsCost === '' || pointsCost < 0) {
            notifications.show({
                title: 'Campo Inválido',
                message: 'El coste en puntos debe ser un número igual o mayor que cero.',
                color: 'orange',
                icon: <IconAlertCircle size={18} />,
            });
            return;
        }
        // --- FIN CAMBIO ---

        setIsSubmitting(true);

        const commonData = {
            name: name.trim(),
            description: description.trim() || null,
            pointsCost: Number(pointsCost),
        };

        try {
            let successMessage = '';
            if (mode === 'add') {
                console.log('Submitting ADD request:', commonData);
                await axiosInstance.post('/rewards', commonData);
                console.log('Add successful');
                successMessage = `Recompensa "${commonData.name}" añadida con éxito.`;
            } else { // mode === 'edit'
                if (!rewardIdToUpdate) throw new Error("Falta el ID de la recompensa para actualizar.");
                console.log(`Submitting EDIT request for ${rewardIdToUpdate}:`, commonData);
                await axiosInstance.patch(`/rewards/${rewardIdToUpdate}`, commonData);
                console.log('Edit successful');
                successMessage = `Recompensa "${commonData.name}" actualizada con éxito.`;
            }

            // --- CAMBIO: Notificación de Éxito ---
            notifications.show({
                title: 'Éxito',
                message: successMessage,
                color: 'green',
                icon: <IconCheck size={18} />,
                autoClose: 4000, // Cerrar automáticamente después de 4 segundos
            });
            // --- FIN CAMBIO ---

            onSubmitSuccess(); // Llama al callback del padre

        } catch (err: any) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} reward:`, err);
            const actionText = mode === 'add' ? 'añadir' : 'actualizar';
            const errorMessage = `Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`;

            // --- CAMBIO: Notificación de Error ---
            notifications.show({
                title: 'Error',
                message: errorMessage,
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: 6000, // Dar más tiempo para leer errores
            });
            // Ya no usamos setError(errorMessage);
            // --- FIN CAMBIO ---

        } finally {
            setIsSubmitting(false);
        }
    };

    const submitButtonText = mode === 'add' ? 'Añadir Recompensa' : 'Actualizar Recompensa';

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="md">
                <TextInput label="Nombre de la Recompensa:" placeholder="Ej: Café Gratis" value={name} onChange={(e) => setName(e.currentTarget.value)} required disabled={isSubmitting} radius="lg" />
                <Textarea label="Descripción (Opcional):" placeholder="Ej: Un café espresso o americano" value={description} onChange={(e) => setDescription(e.currentTarget.value)} rows={3} disabled={isSubmitting} radius="lg" />
                <NumberInput label="Coste en Puntos:" placeholder="Ej: 100" value={pointsCost} onChange={(value) => setPointsCost(typeof value === 'number' ? value : '')} min={0} step={1} allowDecimal={false} required disabled={isSubmitting} radius="lg" />

                {/* --- CAMBIO: Eliminar Alert de error --- */}
                {/* {error && ( <Alert ... >{error}</Alert> )} */}
                {/* --- FIN CAMBIO --- */}

                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={onCancel} disabled={isSubmitting} radius="lg"> Cancelar </Button>
                    <Button type="submit" loading={isSubmitting} radius="lg"> {submitButtonText} </Button>
                </Group>
            </Stack>
        </form>
    );
};

export default RewardForm;

// End of File: frontend/src/components/AddRewardForm.tsx // (Nombre de archivo original, export como RewardForm)