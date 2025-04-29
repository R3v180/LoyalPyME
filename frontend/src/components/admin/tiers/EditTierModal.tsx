// filename: frontend/src/components/admin/tiers/EditTierModal.tsx
// Version: 1.0.1 (Assume component path, fix encoding, clean comments)

import React, { useState, useEffect } from 'react';
import { Modal, Button, Group } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance'; // Ajusta ruta si es necesario
import TierForm from './TierForm'; // Reutilizamos el mismo formulario

// --- Tipos ---
interface Tier { // Tipo completo necesario para inicializar el form
    id: string;
    name: string;
    level: number;
    minValue: number;
    description: string | null;
    benefitsDescription: string | null;
    isActive: boolean;
}

// Esquema Zod (el mismo que para crear)
const tierFormSchema = z.object({
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    level: z.number().int().min(0, { message: 'El nivel debe ser 0 o mayor' }),
    minValue: z.number().min(0, { message: 'El valor mínimo debe ser 0 o mayor' }), // Corregido: mínimo
    description: z.string().optional(),
    benefitsDescription: z.string().optional(),
    isActive: z.boolean(),
});
type TierFormValues = z.infer<typeof tierFormSchema>;
// --- Fin Tipos ---

// --- Props del Componente ---
interface EditTierModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void; // Callback para refrescar la lista
    tier: Tier | null;     // El Tier a editar (o null si no hay)
}
// --- Fin Props ---

const EditTierModal: React.FC<EditTierModalProps> = ({ opened, onClose, onSuccess, tier }) => {
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const form = useForm<TierFormValues>({
        initialValues: {
            name: '', level: 0, minValue: 0, description: '',
            benefitsDescription: '', isActive: true,
        },
        validate: zodResolver(tierFormSchema),
    });

    // Efecto para cargar datos del Tier cuando el modal se abre o el Tier cambia
    useEffect(() => {
        if (tier && opened) {
            // Seteamos los valores del formulario con los datos del Tier
            form.setValues({
                name: tier.name,
                level: tier.level,
                minValue: tier.minValue,
                // Manejar posibles null para campos opcionales
                description: tier.description ?? '',
                benefitsDescription: tier.benefitsDescription ?? '',
                isActive: tier.isActive,
            });
        } else if (!opened) {
            // Si el modal se cierra, reseteamos el formulario
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tier, opened]);


    const handleSubmit = async (values: TierFormValues) => {
        if (!tier) return; // Seguridad

        setIsSaving(true);
        try {
            await axiosInstance.put(`/tiers/tiers/${tier.id}`, values);
            notifications.show({
                 title: 'Nivel Actualizado',
                 message: `El nivel "${values.name}" se ha actualizado correctamente.`,
                 color: 'green',
                 icon: <IconCheck size={18} />
            });
            onSuccess(); // Llamar al callback para refrescar la lista
            onClose(); // Cerrar el modal
        } catch (err: any) {
             console.error(`Error updating tier ${tier.id}:`, err);
             notifications.show({
                 title: 'Error al Actualizar',
                 message: err.response?.data?.message || "No se pudo actualizar el nivel.",
                 color: 'red',
                 icon: <IconAlertCircle size={18} />
             });
        } finally {
             setIsSaving(false);
        }
    };

    // Función para manejar el cierre (no necesita reset explícito por el useEffect)
    const handleClose = () => {
        onClose();
    }

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={`Editar Nivel: ${tier?.name || ''}`}
            centered
            size="md"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                {/* Renderizamos el mismo TierForm */}
                <TierForm form={form} />

                {/* Botones de acción */}
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" loading={isSaving} leftSection={<IconDeviceFloppy size={18} />}>
                        Guardar Cambios
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};

export default EditTierModal;

// End of File: frontend/src/components/admin/tiers/EditTierModal.tsx