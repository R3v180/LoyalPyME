// filename: frontend/src/components/admin/tiers/CreateTierModal.tsx
import React, { useState } from 'react';
import { Modal, Button, Group } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';
import TierForm from './TierForm'; // Este componente también necesitará i18n
import { useTranslation } from 'react-i18next'; // Importar hook

// Tipos
interface Tier { id: string; name: string; level: number; /* ... otros campos si los devuelve la API ... */ }

// Función para crear el esquema Zod, aceptando t
const createTierFormSchema = (t: Function) => z.object({
    name: z.string().min(1, { message: t('validation.nameRequired', 'El nombre es obligatorio') }),
    level: z.number().int().min(0, { message: t('validation.levelMin0', 'El nivel debe ser 0 o mayor') }),
    minValue: z.number().min(0, { message: t('validation.minValueMin0', 'El valor mínimo debe ser 0 o mayor') }),
    description: z.string().optional(),
    benefitsDescription: z.string().optional(),
    isActive: z.boolean(),
});

// Tipo inferido del schema
type TierFormValues = z.infer<ReturnType<typeof createTierFormSchema>>;

// Props
interface CreateTierModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: (newTier: Tier) => void;
}

const CreateTierModal: React.FC<CreateTierModalProps> = ({ opened, onClose, onSuccess }) => {
    const { t } = useTranslation(); // Hook de traducción
    const [isCreating, setIsCreating] = useState<boolean>(false);

    // useForm - pasar t al resolver
    const form = useForm<TierFormValues>({
        initialValues: { name: '', level: 0, minValue: 0, description: '', benefitsDescription: '', isActive: true, },
        validate: zodResolver(createTierFormSchema(t)),
    });

    // handleSubmit
    const handleSubmit = async (values: TierFormValues) => {
        setIsCreating(true);
        try {
            const response = await axiosInstance.post<Tier>('/tiers/tiers', values);
            notifications.show({
                title: t('adminTiersManagePage.createSuccessTitle'),
                message: t('adminTiersManagePage.createSuccessMessage', { name: response.data.name }),
                color: 'green',
                icon: <IconCheck size={18} />
            });
            form.reset();
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
            console.error("Error creating tier:", err);
            const apiError = err.response?.data?.message || t('adminTiersManagePage.createErrorMessage');
            notifications.show({
                title: t('adminTiersManagePage.createErrorTitle'),
                message: apiError,
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
            title={t('adminTiersManagePage.createModalTitle')} // Usar t() para el título
            centered
            size="md"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                {/* TierForm necesita i18n internamente */}
                <TierForm form={form} />
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={handleClose} disabled={isCreating}>{t('common.cancel')}</Button>
                    <Button type="submit" loading={isCreating} leftSection={<IconDeviceFloppy size={18} />}>
                        {/* Reutilizamos la clave del botón de la página principal */}
                        {t('adminTiersManagePage.addButton')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};

export default CreateTierModal;