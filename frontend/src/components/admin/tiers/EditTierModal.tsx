// filename: frontend/src/components/admin/tiers/EditTierModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Group } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';
import TierForm from './TierForm'; // Este componente también necesita i18n
import { useTranslation } from 'react-i18next'; // Importar hook

// --- Tipos ---
interface Tier {
    id: string;
    name: string;
    level: number;
    minValue: number;
    description: string | null;
    benefitsDescription: string | null;
    isActive: boolean;
}

// Función para crear el esquema Zod, aceptando t
const createTierFormSchema = (t: Function) => z.object({
    name: z.string().min(1, { message: t('validation.nameRequired', 'El nombre es obligatorio') }),
    level: z.number().int().min(0, { message: t('validation.levelMin0', 'El nivel debe ser 0 o mayor') }),
    minValue: z.number().min(0, { message: t('validation.minValueMin0', 'El valor mínimo debe ser 0 o mayor') }),
    description: z.string().optional(),
    benefitsDescription: z.string().optional(),
    isActive: z.boolean(),
});

type TierFormValues = z.infer<ReturnType<typeof createTierFormSchema>>;
// --- Fin Tipos ---

// --- Props del Componente ---
interface EditTierModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tier: Tier | null;
}
// --- Fin Props ---

const EditTierModal: React.FC<EditTierModalProps> = ({ opened, onClose, onSuccess, tier }) => {
    const { t } = useTranslation(); // Hook de traducción
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const form = useForm<TierFormValues>({
        initialValues: {
            name: '', level: 0, minValue: 0, description: '',
            benefitsDescription: '', isActive: true,
        },
        validate: zodResolver(createTierFormSchema(t)), // Pasar t al resolver
    });

    useEffect(() => {
        if (tier && opened) {
            form.setValues({
                name: tier.name,
                level: tier.level,
                minValue: tier.minValue,
                description: tier.description ?? '',
                benefitsDescription: tier.benefitsDescription ?? '',
                isActive: tier.isActive,
            });
        } else if (!opened) {
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tier, opened]);

    const handleSubmit = async (values: TierFormValues) => {
        if (!tier) return;
        setIsSaving(true);
        try {
            await axiosInstance.put(`/tiers/tiers/${tier.id}`, values);
            notifications.show({
                title: t('adminTiersManagePage.updateSuccessTitle'),
                message: t('adminTiersManagePage.updateSuccessMessage', { name: values.name }),
                color: 'green',
                icon: <IconCheck size={18} />
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(`Error updating tier ${tier.id}:`, err);
            const apiError = err.response?.data?.message || t('adminTiersManagePage.updateErrorMessage');
            notifications.show({
                title: t('adminTiersManagePage.updateErrorTitle'),
                message: apiError,
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        onClose();
    }

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            // Usar t() para el título
            title={t('adminTiersManagePage.editModalTitle', { name: tier?.name || '' })}
            centered
            size="md"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                {/* TierForm necesita i18n internamente */}
                <TierForm form={form} />
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={handleClose} disabled={isSaving}>{t('common.cancel')}</Button>
                    <Button type="submit" loading={isSaving} leftSection={<IconDeviceFloppy size={18} />}>
                        {t('common.save')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};

export default EditTierModal;