// frontend/src/modules/loyalpyme/components/admin/rewards/RewardForm.tsx
// Version 3.5.1 - Fix type mismatch on form.setValues

import React, { useState, useEffect, useCallback } from 'react';
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group, Text as MantineText,
    Select, Alert, Loader, Paper, Switch, Box
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconX } from '@tabler/icons-react';

import axiosInstance from '../../../../../shared/services/axiosInstance';
import { Reward } from '../../../../../shared/types/user.types';
import { RewardType, DiscountType } from '../../../../../shared/types/enums';
import { MenuItemData } from '../../../../camarero/types/menu.types';
import ImageUploadCropper from '../../../../../shared/components/utils/ImageUploadCropper';
import { useLayoutUserData } from '../../../../../shared/hooks/useLayoutUserData';

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
  kdsDestination: z.string().optional().nullable(),
})
.refine(data => {
    if (data.type === RewardType.MENU_ITEM) return !!data.linkedMenuItemId;
    return true;
}, {
    message: 'Debes seleccionar un producto del menú para este tipo de recompensa.',
    path: ['linkedMenuItemId'],
})
.refine(data => {
    if (data.type === RewardType.DISCOUNT_ON_ITEM || data.type === RewardType.DISCOUNT_ON_TOTAL) {
        return !!data.discountType && data.discountValue != null && data.discountValue > 0;
    }
    return true;
}, {
    message: 'Debes especificar un tipo y valor de descuento válido y mayor que cero.',
    path: ['discountValue'],
})
.refine(data => {
    if (data.type === RewardType.GENERIC_FREE_PRODUCT) return !!data.kdsDestination;
    return true;
}, {
    message: 'Debes seleccionar un destino de preparación para el producto genérico.',
    path: ['kdsDestination'],
});

type RewardFormValues = z.infer<ReturnType<typeof createRewardFormSchema>>;

interface RewardFormProps {
    onSubmitSuccess: (reward: Reward) => void;
    onCancel: () => void;
    initialData?: Reward | null;
}

const RewardForm: React.FC<RewardFormProps> = ({ onSubmitSuccess, onCancel, initialData }) => {
    const { t, i18n } = useTranslation();
    const { userData } = useLayoutUserData();
    const isCamareroActive = userData?.isCamareroActive === true;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
    const [loadingMenuItems, setLoadingMenuItems] = useState<boolean>(false);
    const [errorMenuItems, setErrorMenuItems] = useState<string | null>(null);
    const [isSpecificItemDiscount, setIsSpecificItemDiscount] = useState<boolean>(false);

    const form = useForm<RewardFormValues>({
        initialValues: {
            name_es: '', name_en: '', description_es: '', description_en: '',
            pointsCost: 0, imageUrl: null,
            type: RewardType.GENERIC_FREE_PRODUCT,
            linkedMenuItemId: null,
            discountType: DiscountType.FIXED_AMOUNT,
            discountValue: undefined,
            kdsDestination: null,
        },
        validate: zodResolver(createRewardFormSchema(t)),
    });

    const fetchMenuItems = useCallback(async () => {
        if (!isCamareroActive) return;
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
    }, [isCamareroActive]);

    useEffect(() => {
        if (isCamareroActive) {
            fetchMenuItems();
        }
    }, [isCamareroActive, fetchMenuItems]);
    
    useEffect(() => {
        if (initialData) {
            // --- CORRECCIÓN: Usar '||' para transformar 'null' a un valor válido para el form ---
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
                kdsDestination: initialData.kdsDestination || null,
            });
            // --- FIN DE LA CORRECCIÓN ---

            if (initialData.type === RewardType.DISCOUNT_ON_ITEM && !!initialData.linkedMenuItemId) {
                setIsSpecificItemDiscount(true);
            } else {
                setIsSpecificItemDiscount(false);
            }
        } else {
            form.reset();
            form.setFieldValue('type', isCamareroActive ? RewardType.MENU_ITEM : RewardType.GENERIC_FREE_PRODUCT);
            setIsSpecificItemDiscount(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, isCamareroActive]);

    const handleTypeChange = (value: string | null) => {
        const newType = value as RewardType;
        form.setFieldValue('type', newType);
        
        setIsSpecificItemDiscount(false);
        form.setFieldValue('linkedMenuItemId', null);
        form.setFieldValue('kdsDestination', null);
        
        if (newType !== RewardType.MENU_ITEM) {
            form.setFieldValue('name_es', '');
            form.setFieldValue('name_en', '');
            form.setFieldValue('description_es', '');
            form.setFieldValue('description_en', '');
        }

        if (newType === RewardType.MENU_ITEM || newType === RewardType.GENERIC_FREE_PRODUCT) {
            form.setFieldValue('discountType', null);
            form.setFieldValue('discountValue', undefined);
        } else {
            if (!form.values.discountType) form.setFieldValue('discountType', DiscountType.FIXED_AMOUNT);
        }
    };
    
    const handleMenuItemChange = (value: string | null) => {
        form.setFieldValue('linkedMenuItemId', value);
        const selectedItem = menuItems.find(item => item.id === value);
        if (selectedItem) {
            if (form.values.type === RewardType.MENU_ITEM) {
                form.setFieldValue('name_es', `Gratis: ${selectedItem.name_es}`);
                form.setFieldValue('name_en', `Free: ${selectedItem.name_en || selectedItem.name_es}`);
                form.setFieldValue('description_es', `Obtén un(a) ${selectedItem.name_es} gratis con tus puntos.`);
                form.setFieldValue('imageUrl', selectedItem.imageUrl || null);
            }
        }
    };

    const handleToggleSpecificDiscount = (checked: boolean) => {
        setIsSpecificItemDiscount(checked);
        if (!checked) {
            form.setFieldValue('linkedMenuItemId', null);
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
        { value: RewardType.GENERIC_FREE_PRODUCT, label: 'Producto Genérico Gratis (Manual)' },
        ...(isCamareroActive ? [{ value: RewardType.MENU_ITEM, label: 'Producto Gratis (de la Carta)' }] : []),
        { value: RewardType.DISCOUNT_ON_TOTAL, label: 'Descuento en el Total del Pedido' },
        { value: RewardType.DISCOUNT_ON_ITEM, label: 'Descuento en un Producto' },
    ];

    const discountTypeOptions = [
        { value: DiscountType.FIXED_AMOUNT, label: 'Importe Fijo (€)' },
        { value: DiscountType.PERCENTAGE, label: 'Porcentaje (%)' },
    ];
    
    const kdsDestinationOptions = [
        { value: 'COCINA', label: 'Cocina' },
        { value: 'BARRA', label: 'Barra' },
        { value: 'ALMACEN', label: 'Almacén / Otro' },
    ];

    const isNameDisabled = isSubmitting || form.values.type === RewardType.MENU_ITEM;

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
                <Select
                    label="Tipo de Recompensa" data={rewardTypeOptions} required
                    disabled={isSubmitting} {...form.getInputProps('type')} onChange={handleTypeChange}
                />

                {isCamareroActive && form.values.type === RewardType.MENU_ITEM && (
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
                        <TextInput label="Nombre (ES)" required disabled={isNameDisabled} {...form.getInputProps('name_es')} />
                        <TextInput label="Nombre (EN)" required disabled={isNameDisabled} {...form.getInputProps('name_en')} />
                        <Textarea label="Descripción (ES)" rows={2} disabled={isSubmitting} {...form.getInputProps('description_es')} />
                        <Textarea label="Descripción (EN)" rows={2} disabled={isSubmitting} {...form.getInputProps('description_en')} />
                    </Stack>
                </Paper>

                {form.values.type === RewardType.GENERIC_FREE_PRODUCT && (
                    <Paper withBorder p="sm" radius="md">
                        <Select
                            label="Destino de Preparación (KDS)"
                            placeholder="Elige dónde se prepara este producto"
                            data={kdsDestinationOptions}
                            required
                            disabled={isSubmitting}
                            {...form.getInputProps('kdsDestination')}
                        />
                    </Paper>
                )}

                {(form.values.type === RewardType.DISCOUNT_ON_ITEM || form.values.type === RewardType.DISCOUNT_ON_TOTAL) && (
                    <Paper withBorder p="sm" radius="md">
                        <Stack>
                            <Group grow>
                                <Select label="Tipo de Descuento" data={discountTypeOptions} required disabled={isSubmitting} {...form.getInputProps('discountType')} />
                                <NumberInput label="Valor del Descuento" required min={0.01} decimalScale={2} disabled={isSubmitting} {...form.getInputProps('discountValue')} />
                            </Group>
                            
                            {form.values.type === RewardType.DISCOUNT_ON_ITEM && isCamareroActive && (
                                <Box mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                                    <Switch
                                        label="Aplicar este descuento a un producto específico"
                                        checked={isSpecificItemDiscount}
                                        onChange={(event) => handleToggleSpecificDiscount(event.currentTarget.checked)}
                                        disabled={isSubmitting}
                                    />
                                    {isSpecificItemDiscount && (
                                        <Select
                                            label="Producto Específico para el Descuento"
                                            placeholder="Selecciona un producto..."
                                            data={menuItemOptions}
                                            searchable
                                            required
                                            mt="xs"
                                            disabled={isSubmitting || loadingMenuItems}
                                            rightSection={loadingMenuItems ? <Loader size="xs" /> : undefined}
                                            error={form.errors.linkedMenuItemId || errorMenuItems}
                                            {...form.getInputProps('linkedMenuItemId')}
                                        />
                                    )}
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                )}

                <NumberInput label="Coste en Puntos" required min={0} disabled={isSubmitting} {...form.getInputProps('pointsCost')} />

                <ImageUploadCropper
                    aspectRatio={1}
                    minDimension={150}
                    initialImageUrl={form.values.imageUrl || null}
                    onUploadSuccess={(url) => form.setFieldValue('imageUrl', url)}
                    onUploadError={(errorMsg) => form.setFieldError('imageUrl', errorMsg)}
                    onClearImage={() => form.setFieldValue('imageUrl', null) }
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