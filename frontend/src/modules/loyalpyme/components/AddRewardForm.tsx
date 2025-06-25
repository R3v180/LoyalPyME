// filename: frontend/src/components/AddRewardForm.tsx
// Version: 1.3.1 (Fix encoding, remove logs and meta-comments)

import { useState, useEffect, FormEvent } from 'react';
import axiosInstance from '../services/axiosInstance';

// Mantine Imports
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group
} from '@mantine/core';
// Importar notifications y iconos
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';


// Interfaz Reward (local)
interface Reward {
    id: string; name: string; description?: string | null; pointsCost: number; isActive: boolean;
}

// Props del componente
interface RewardFormProps {
    mode: 'add' | 'edit';
    initialData?: Reward | null;
    rewardIdToUpdate?: string | null;
    onSubmitSuccess: () => void; // Callback en caso de éxito
    onCancel: () => void; // Callback para cancelar
}

// Componente renombrado a RewardForm consistentemente
const RewardForm: React.FC<RewardFormProps> = ({
    mode, initialData, rewardIdToUpdate, onSubmitSuccess, onCancel
}) => {

    // Estados
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [pointsCost, setPointsCost] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Efecto para popular/resetear formulario
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setPointsCost(initialData.pointsCost !== null ? initialData.pointsCost : '');
        } else {
            // Resetear para modo 'add' o si no hay initialData
            setName(''); setDescription(''); setPointsCost('');
        }
    }, [mode, initialData]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Validación frontend
        if (!name.trim()) {
            notifications.show({
                title: 'Campo Obligatorio',
                message: 'El nombre de la recompensa no puede estar vacío.',
                color: 'orange', icon: <IconAlertCircle size={18} />,
            });
            return;
        }
        if (pointsCost === '' || pointsCost < 0) {
            notifications.show({
                title: 'Campo Inválido', // Corregido: Inválido
                message: 'El coste en puntos debe ser un número igual o mayor que cero.', // Corregido: número
                color: 'orange', icon: <IconAlertCircle size={18} />,
            });
            return;
        }

        setIsSubmitting(true);

        const commonData = {
            name: name.trim(),
            description: description.trim() || null, // Enviar null si está vacío
            pointsCost: Number(pointsCost), // Asegurar que es número
        };

        try {
            let successMessage = '';
            if (mode === 'add') {
                // console.log('Submitting ADD request:', commonData); // Log eliminado
                await axiosInstance.post('/rewards', commonData);
                // console.log('Add successful'); // Log eliminado
                successMessage = `Recompensa "${commonData.name}" añadida con éxito.`; // Corregido: éxito, añadida
            } else { // mode === 'edit'
                if (!rewardIdToUpdate) throw new Error("Falta el ID de la recompensa para actualizar.");
                // console.log(`Submitting EDIT request for ${rewardIdToUpdate}:`, commonData); // Log eliminado
                await axiosInstance.patch(`/rewards/${rewardIdToUpdate}`, commonData);
                // console.log('Edit successful'); // Log eliminado
                successMessage = `Recompensa "${commonData.name}" actualizada con éxito.`; // Corregido: éxito
            }

            // Notificación de Éxito
            notifications.show({
                title: 'Éxito', // Corregido: Éxito
                message: successMessage,
                color: 'green', icon: <IconCheck size={18} />, autoClose: 4000,
            });

            onSubmitSuccess(); // Llama al callback del padre

        } catch (err: any) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} reward:`, err); // Mantener error log
            const actionText = mode === 'add' ? 'añadir' : 'actualizar';
            const errorMessage = `Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`;

            // Notificación de Error
            notifications.show({
                title: 'Error', message: errorMessage, color: 'red',
                icon: <IconX size={18} />, autoClose: 6000,
            });
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

                {/* Alert de error local eliminada */}

                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={onCancel} disabled={isSubmitting} radius="lg"> Cancelar </Button>
                    <Button type="submit" loading={isSubmitting} radius="lg"> {submitButtonText} </Button>
                </Group>
            </Stack>
        </form>
    );
};

export default RewardForm;

// End of File: frontend/src/components/AddRewardForm.tsx