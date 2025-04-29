// filename: frontend/src/components/admin/tiers/CreateTierModal.tsx
// Version: 1.0.4 (Remove meta-comment)

import React, { useState } from 'react';
import { Modal, Button, Group } from '@mantine/core'; // Imports ya estaban limpios
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';
import TierForm from './TierForm'; // Importar el componente del formulario

// Tipos
interface Tier { id: string; name: string; level: number; /* ... otros campos si los devuelve la API ... */ }
const tierFormSchema = z.object({
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    level: z.number().int().min(0, { message: 'El nivel debe ser 0 o mayor' }),
    minValue: z.number().min(0, { message: 'El valor mínimo debe ser 0 o mayor' }),
    description: z.string().optional(),
    benefitsDescription: z.string().optional(),
    isActive: z.boolean(),
});
type TierFormValues = z.infer<typeof tierFormSchema>;

// Props
interface CreateTierModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: (newTier: Tier) => void;
}

const CreateTierModal: React.FC<CreateTierModalProps> = ({ opened, onClose, onSuccess }) => {
    const [isCreating, setIsCreating] = useState<boolean>(false);

    // useForm
    const form = useForm<TierFormValues>({
        initialValues: { name: '', level: 0, minValue: 0, description: '', benefitsDescription: '', isActive: true, },
        validate: zodResolver(tierFormSchema),
    });

    // handleSubmit
    const handleSubmit = async (values: TierFormValues) => {
        setIsCreating(true);
        try {
            const response = await axiosInstance.post<Tier>('/tiers/tiers', values); // Asume endpoint correcto
            notifications.show({
                 title: 'Nivel Creado',
                 message: `El nivel "${response.data.name}" se ha creado correctamente.`,
                 color: 'green',
                 icon: <IconCheck size={18} />
            });
            form.reset();
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
             console.error("Error creating tier:", err);
             notifications.show({
                 title: 'Error al Crear',
                 message: err.response?.data?.message || "No se pudo crear el nivel.",
                 color: 'red',
                 icon: <IconAlertCircle size={18} />
             });
        } finally {
             setIsCreating(false);
        }
    };

    // handleClose
    const handleClose = () => { form.reset(); onClose(); }

    // JSX
    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Crear Nuevo Nivel"
            centered
            size="md"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TierForm form={form} />
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={handleClose} disabled={isCreating}>Cancelar</Button>
                    <Button type="submit" loading={isCreating} leftSection={<IconDeviceFloppy size={18} />}>
                        Crear Nivel
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};

export default CreateTierModal;

// End of File: frontend/src/components/admin/tiers/CreateTierModal.tsx