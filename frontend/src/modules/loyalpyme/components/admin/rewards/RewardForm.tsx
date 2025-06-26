// frontend/src/modules/loyalpyme/components/admin/rewards/RewardForm.tsx
// Version 3.2.1 - Fix type mismatch for initialImageUrl prop

import React, { useState, useEffect, useCallback } from 'react';
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group, Text as MantineText,
    Select, Alert, Loader, Paper
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
// --- CORRECCIÓN: Se elimina IconCheck que no se usa ---
import { IconAlertCircle, IconX } from '@tabler/icons-react';

import axiosInstance from '../../../../../shared/services/axiosInstance';
import { Reward } from '../../../../../shared/types/user.types';
import { RewardType, DiscountType } from '../../../../../shared/types/enums';
import { MenuItemData } from '../../../../camarero/types/menu.types';
import ImageUploadCropper from '../../../../../shared/components/utils/ImageUploadCropper';

const createRewardFormSchema = (t: Function) => z.object({
  name_es: z.string().min(1, { message: t('component.rewardForm.errorNameEsRequired') }),
  name_en: z.string().min(1, { message: t('component.rewardForm.errorNameEnRequired') }),
  description_es: z.string().optional(),
  description_en: z.string().optional(),
  pointsCost: z.number().min(0, { message: t('component.rewardForm.errorPointsCostInvalid') }),
  imageUrl: z.string().url({ message: t('validation.invalidUrl') }).nullable().optional(),
  type: z.nativeEnum(RewardType),
  linkedMenuItemId: z.string().optional().nullable(),
  discountType: z.nativeEnum(DiscountType).optional().nullable(),
  discountValue: z.number().optional().nullable(),
}).refine(data => data.type !== RewardType.MENU_ITEM || !!data.linkedMenuItemId, {
    message: 'Debes seleccionar un producto del menú para este tipo de recompensa.',
    path: ['linkedMenuItemId'],
}).refine(data => data.type === RewardType.MENU_ITEM || (!!data.discountType && data.discountValue != null && data.discountValue > 0), {
    message: 'Debes especificar un tipo y valor de descuento válido y mayor que cero.',
    path: ['discountValue'],
});

type RewardFormValues = z.infer<ReturnType<typeof createRewardFormSchema>>;

interface RewardFormProps {
    onSubmitSuccess: (reward: Reward) => void;
    onCancel: () => void;
    initialData?: Reward | null;
}

const RewardForm: React.FC<RewardFormProps> = ({ onSubmitSuccess, onCancel, initialData }) => {
    const { t, i18n } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
    const [loadingMenuItems, setLoadingMenuItems] = useState<boolean>(false);
    const [errorMenuItems, setErrorMenuItems] = useState<string | null>(null);

    const form = useForm<RewardFormValues>({
        initialValues: {
            name_es: '', name_en: '', description_es: '', description_en: '',
            pointsCost: 0, imageUrl: null,
            type: RewardType.DISCOUNT_ON_TOTAL,
            linkedMenuItemId: null,
            discountType: DiscountType.FIXED_AMOUNT,
            discountValue: undefined,
        },
        validate: zodResolver(createRewardFormSchema(t)),
    });

    const fetchMenuItems = useCallback(async () => {
        setLoadingMenuItems(true);
        setErrorMenuItems(null);
        try {
            const response = await axiosInstance.get<MenuItemData[]>('/camarero/admin/menu/items/all');
            setMenuItems(response.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'No se pudieron cargar los productos del menú.';
            setErrorMenuItems(msg);
        } finally {
            setLoadingMenuItems(false);
        }
    }, []);

    useEffect(() => {
        fetchMenuItems();
    }, [fetchMenuItems]);
    
    useEffect(() => {
        if (initialData) {
            form.setValues({
                name_es: initialData.name_es || '',
                name_en: initialData.name_en || '',
                description_es: initialData.description_es || '',
                description_en: initialData.description_en || '',
                pointsCost: initialData.pointsCost ?? 0,
                imageUrl: initialData.imageUrl || null,
                type: initialData.type || RewardType.DISCOUNT_ON_TOTAL,
                linkedMenuItemId: initialData.linkedMenuItemId || null,
                discountType: initialData.discountType || null,
                discountValue: initialData.discountValue ? Number(initialData.discountValue) : undefined,
            });
        } else {
            form.reset();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    const handleTypeChange = (value: string | null) => {
        const newType = value as RewardType;
        form.setFieldValue('type', newType);
        if (newType === RewardType.MENU_ITEM) {
            form.setFieldValue('discountType', null);
            form.setFieldValue('discountValue', undefined);
        } else {
            form.setFieldValue('linkedMenuItemId', null);
        }
    };
    
    const handleMenuItemChange = (value: string | null) => {
        form.setFieldValue('linkedMenuItemId', value);
        const selectedItem = menuItems.find(item => item.id === value);
        if (selectedItem) {
            form.setFieldValue('name_es', `Gratis: ${selectedItem.name_es}`);
            form.setFieldValue('name_en', `Free: ${selectedItem.name_en || selectedItem.name_es}`);
            form.setFieldValue('description_es', `Obtén un(a) ${selectedItem.name_es} gratis con tus puntos.`);
            form.setFieldValue('imageUrl', selectedItem.imageUrl || null);
        }
    };

    const handleSubmit = async (values: RewardFormValues) => {
        setIsSubmitting(true);
        const endpoint = initialData ? `/rewards/${initialData.id}` : '/rewards';
        const method = initialData ? 'patch' : 'post';

        try {
            const response = await axiosInstance[method]<Reward>(endpoint, values);
            onSubmitSuccess(response.data);
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || 'Error desconocido';
            notifications.show({ title: 'Error al Guardar', message: apiError, color: 'red', icon: <IconX /> });
        } finally {
            setIsSubmitting(false);
        }
    };

    const menuItemOptions = menuItems.map(item => ({
        value: item.id,
        label: (i18n.language === 'es' ? item.name_es : item.name_en) || item.name_es || `ID: ${item.id}`,
    }));

    const rewardTypeOptions = [
        { value: RewardType.DISCOUNT_ON_TOTAL, label: 'Descuento en el Total del Pedido' },
        { value: RewardType.DISCOUNT_ON_ITEM, label: 'Descuento en un Producto' },
        { value: RewardType.MENU_ITEM, label: 'Producto Gratis del Menú' },
    ];

    const discountTypeOptions = [
        { value: DiscountType.FIXED_AMOUNT, label: 'Importe Fijo (€)' },
        { value: DiscountType.PERCENTAGE, label: 'Porcentaje (%)' },
    ];

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
                <Select
                    label="Tipo de Recompensa" data={rewardTypeOptions} required
                    disabled={isSubmitting} {...form.getInputProps('type')} onChange={handleTypeChange}
                />

                {form.values.type === RewardType.MENU_ITEM && (
                    <Paper withBorder p="sm" radius="md">
                        <Select
                            label="Producto del Menú" placeholder="Selecciona un producto para regalar..."
                            data={menuItemOptions} searchable required
                            disabled={isSubmitting || loadingMenuItems}
                            rightSection={loadingMenuItems ? <Loader size="xs" /> : undefined}
                            error={form.errors.linkedMenuItemId || errorMenuItems}
                            {...form.getInputProps('linkedMenuItemId')}
                            onChange={handleMenuItemChange}
                        />
                         {errorMenuItems && (<Alert color="orange" icon={<IconAlertCircle size={16} />} mt="xs" p="xs" fz="xs">{errorMenuItems}</Alert>)}
                    </Paper>
                )}

                <Paper withBorder p="sm" radius="md">
                    <Stack>
                        <TextInput label="Nombre (ES)" required disabled={isSubmitting || form.values.type === RewardType.MENU_ITEM} {...form.getInputProps('name_es')} />
                        <TextInput label="Nombre (EN)" required disabled={isSubmitting || form.values.type === RewardType.MENU_ITEM} {...form.getInputProps('name_en')} />
                        <Textarea label="Descripción (ES)" rows={2} disabled={isSubmitting} {...form.getInputProps('description_es')} />
                    </Stack>
                </Paper>

                {(form.values.type === RewardType.DISCOUNT_ON_ITEM || form.values.type === RewardType.DISCOUNT_ON_TOTAL) && (
                    <Paper withBorder p="sm" radius="md">
                        <Group grow>
                            <Select label="Tipo de Descuento" data={discountTypeOptions} required disabled={isSubmitting} {...form.getInputProps('discountType')} />
                            <NumberInput label="Valor del Descuento" required min={0.01} decimalScale={2} disabled={isSubmitting} {...form.getInputProps('discountValue')} />
                        </Group>
                    </Paper>
                )}

                <NumberInput label="Coste en Puntos" required min={0} disabled={isSubmitting} {...form.getInputProps('pointsCost')} />

                <ImageUploadCropper
                    aspectRatio={1}
                    minDimension={150}
                    // --- CORRECCIÓN DE TIPO ---
                    initialImageUrl={form.values.imageUrl || null} // Aseguramos que sea string o null
                    // --- FIN CORRECCIÓN ---
                    onUploadSuccess={(url) => form.setFieldValue('imageUrl', url)}
                    onUploadError={(errorMsg) => form.setFieldError('imageUrl', errorMsg)}
                    onClearImage={() => form.setFieldValue('imageUrl', null)}
                    folderName="loyalpyme/rewards"
                    disabled={isSubmitting}
                />
                {form.errors.imageUrl && (<MantineText c="red" size="xs">{form.errors.imageUrl}</MantineText>)}

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onCancel} disabled={isSubmitting}>{t('common.cancel')}</Button>
                    <Button type="submit" loading={isSubmitting}>{t('common.save')}</Button>
                </Group>
            </Stack>
        </form>
    );
};

export default RewardForm;