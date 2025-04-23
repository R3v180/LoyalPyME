// File: frontend/src/components/AddRewardForm.tsx
// Version: 1.2.1 (Remove unused RewardFormData interface)

import { useState, useEffect, FormEvent } from 'react';
import axiosInstance from '../services/axiosInstance';

// Mantine Imports (sin cambios)
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group, Alert
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

// --- CAMBIO: Eliminar interface RewardFormData no usada ---
// interface RewardFormData {
//     name: string;
//     description: string;
//     pointsCost: number | '';
// }
// --- FIN CAMBIO ---

// Interfaz Reward (Necesaria para initialData) - SIN CAMBIOS
interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
}

// Interfaz de Props (SIN CAMBIOS)
interface RewardFormProps {
    mode: 'add' | 'edit';
    initialData?: Reward | null;
    rewardIdToUpdate?: string | null;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

// Nombre del Componente y Props (SIN CAMBIOS)
const RewardForm: React.FC<RewardFormProps> = ({
    mode,
    initialData,
    rewardIdToUpdate,
    onSubmitSuccess,
    onCancel
}) => {

    // Estados (SIN CAMBIOS)
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [pointsCost, setPointsCost] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // useEffect para popular/limpiar formulario (SIN CAMBIOS)
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setPointsCost(initialData.pointsCost !== null ? initialData.pointsCost : '');
        } else {
            setName('');
            setDescription('');
            setPointsCost('');
        }
        setError(null);
    }, [mode, initialData]);

    // handleSubmit (SIN CAMBIOS)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!name.trim()) { setError('El nombre de la recompensa es obligatorio.'); return; }
        if (pointsCost === '' || pointsCost < 0) { setError('El coste en puntos debe ser un número igual o mayor que cero.'); return; }
        setIsSubmitting(true);
        const commonData = {
            name: name.trim(),
            description: description.trim() || null,
            pointsCost: Number(pointsCost),
        };
        try {
            if (mode === 'add') {
                console.log('Submitting ADD request:', commonData);
                await axiosInstance.post('/rewards', commonData);
                console.log('Add successful');
            } else { // mode === 'edit'
                if (!rewardIdToUpdate) { throw new Error("Falta el ID de la recompensa para actualizar."); }
                console.log(`Submitting EDIT request for ${rewardIdToUpdate}:`, commonData);
                await axiosInstance.patch(`/rewards/${rewardIdToUpdate}`, commonData);
                console.log('Edit successful');
            }
            onSubmitSuccess();
        } catch (err: any) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} reward:`, err);
            const actionText = mode === 'add' ? 'añadir' : 'actualizar';
            setError(`Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Texto del botón (SIN CAMBIOS)
    const submitButtonText = mode === 'add' ? 'Añadir Recompensa' : 'Actualizar Recompensa';

    // JSX (SIN CAMBIOS)
    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="md">
                <TextInput label="Nombre de la Recompensa:" placeholder="Ej: Café Gratis" value={name} onChange={(e) => setName(e.currentTarget.value)} required disabled={isSubmitting} radius="lg" />
                <Textarea label="Descripción (Opcional):" placeholder="Ej: Un café espresso o americano" value={description} onChange={(e) => setDescription(e.currentTarget.value)} rows={3} disabled={isSubmitting} radius="lg" />
                <NumberInput label="Coste en Puntos:" placeholder="Ej: 100" value={pointsCost} onChange={(value) => setPointsCost(typeof value === 'number' ? value : '')} min={0} step={1} allowDecimal={false} required disabled={isSubmitting} radius="lg" />
                {error && ( <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="lg">{error}</Alert> )}
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={onCancel} disabled={isSubmitting} radius="lg">Cancelar</Button>
                    <Button type="submit" loading={isSubmitting} radius="lg">{submitButtonText}</Button>
                </Group>
            </Stack>
        </form>
    );
};

// Exportación (SIN CAMBIOS)
export default RewardForm;

// End of File: frontend/src/components/RewardForm.tsx