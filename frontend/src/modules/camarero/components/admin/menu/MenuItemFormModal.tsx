// frontend/src/components/admin/camarero/menu/MenuItemFormModal.tsx
// Version 2.0.0 (Refactored to use ImageUploadCropper component)

import React, { useEffect } from 'react';
import {
    Modal, TextInput, Textarea, NumberInput, Switch, Button, Group, Stack, MultiSelect, 
    NativeScrollArea, Title, useMantineTheme, Box, Text as MantineText
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
    IconDeviceFloppy, IconCurrencyEuro, IconSettings
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { MenuItemData, MenuItemFormData } from '../../../types/menu.types';

// Importar el componente reutilizable
import ImageUploadCropper from '../../../../../shared/components/utils/ImageUploadCropper';
import ModifierGroupsManagementModal from './ModifierGroupsManagementModal';

// El schema de Zod no cambia
const createItemFormSchema = (t: Function) => z.object({
    name_es: z.string().min(1, { message: t('common.requiredField') }),
    name_en: z.string().nullable().optional(),
    description_es: z.string().nullable().optional(),
    description_en: z.string().nullable().optional(),
    price: z.number().min(0, { message: t('validation.minValueMin0') }),
    imageUrl: z.string().url({ message: t('validation.invalidUrl') }).nullable().optional(),
    allergens: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isAvailable: z.boolean(),
    position: z.number().min(0, { message: t('validation.minValueMin0') }),
    preparationTime: z.number().min(0, { message: t('common.errorMustBePositiveOrZero') }).nullable().optional(),
    calories: z.number().min(0, { message: t('common.errorMustBePositiveOrZero') }).nullable().optional(),
    kdsDestination: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
});

type ItemFormValues = z.infer<ReturnType<typeof createItemFormSchema>>;

interface MenuItemFormModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: MenuItemFormData) => Promise<void>;
    initialData?: MenuItemData | null;
    isSubmitting: boolean;
    categoryId: string;
}

const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
    opened,
    onClose,
    onSubmit,
    initialData,
    isSubmitting,
}) => {
    const { t } = useTranslation();
    const theme = useMantineTheme();
    
    const form = useForm<ItemFormValues>({
        initialValues: {
            name_es: '', name_en: null, description_es: null, description_en: null,
            price: 0, imageUrl: null, allergens: [], tags: [],
            isAvailable: true, position: 0, preparationTime: null, calories: null,
            kdsDestination: null, sku: null,
        },
        validate: zodResolver(createItemFormSchema(t)),
    });

    const [groupsModalOpened, { open: openGroupsModal, close: closeGroupsModal }] = useDisclosure(false);

    useEffect(() => {
        if (opened) {
            if (initialData) {
                form.setValues({
                    name_es: initialData.name_es, name_en: initialData.name_en || null,
                    description_es: initialData.description_es || null, description_en: initialData.description_en || null,
                    price: initialData.price, imageUrl: initialData.imageUrl || null,
                    allergens: initialData.allergens || [], tags: initialData.tags || [],
                    isAvailable: initialData.isAvailable, position: initialData.position,
                    preparationTime: initialData.preparationTime || null, calories: initialData.calories || null,
                    kdsDestination: initialData.kdsDestination || null, sku: initialData.sku || null,
                });
            } else {
                form.reset();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, initialData]);

    const handleSubmitForm = async (values: ItemFormValues) => {
        const submitData: MenuItemFormData = {
            ...values,
            name_en: values.name_en?.trim() || null,
            description_es: values.description_es?.trim() || null,
            description_en: values.description_en?.trim() || null,
            imageUrl: values.imageUrl || null,
            allergens: values.allergens || [],
            tags: values.tags || [],
            preparationTime: values.preparationTime ?? null,
            calories: values.calories ?? null,
            kdsDestination: values.kdsDestination?.trim() || null,
            sku: values.sku?.trim() || null,
        };
        await onSubmit(submitData);
    };

    const handleModalClose = () => { if (!isSubmitting) onClose(); }
    
    const allergenOptions = ['GLUTEN', 'LACTOSE', 'NUTS', 'SOY', 'FISH', 'CRUSTACEANS', 'CELERY', 'MUSTARD', 'SESAME', 'SULPHITES', 'LUPIN', 'MOLLUSCS'].map(val => ({value: val, label: t(`adminCamarero.menuItem.allergen.${val}`, val)}));
    const tagOptions = ['VEGAN', 'VEGETARIAN', 'SPICY', 'NEW', 'POPULAR', 'HOUSE_SPECIAL'].map(val => ({value: val, label: t(`adminCamarero.menuItem.tag.${val}`, val)}));

    const allergenInputProps = form.getInputProps('allergens');
    const tagInputProps = form.getInputProps('tags');

    const menuItemIdForGroupsModal = initialData ? initialData.id : null;
    const menuItemDisplayNameForModal = initialData ? (initialData.name_es || initialData.name_en || t('adminCamarero.manageMenu.itemFallbackName')) : t('adminCamarero.manageMenu.itemNew');

    return (
        <>
            <Modal
                opened={opened} onClose={handleModalClose}
                title={initialData ? t('adminCamarero.manageMenu.editItemTitle') : t('adminCamarero.manageMenu.addItemTitle')}
                centered size="xl"
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
                trapFocus closeOnClickOutside={!isSubmitting} closeOnEscape={!isSubmitting}
                scrollAreaComponent={NativeScrollArea}
            >
                <form onSubmit={form.onSubmit(handleSubmitForm)}>
                    <Stack gap="md">
                        <Group grow>
                            <TextInput label={t('component.rewardForm.nameEsLabel')} placeholder={t('adminCamarero.manageMenu.itemNameEsPlaceholder')} required disabled={isSubmitting} {...form.getInputProps('name_es')} />
                            <TextInput label={t('component.rewardForm.nameEnLabel')} placeholder={t('adminCamarero.manageMenu.itemNameEnPlaceholder')} disabled={isSubmitting} {...form.getInputProps('name_en')} />
                        </Group>
                        <Textarea label={t('component.rewardForm.descriptionEsLabel')} placeholder={t('adminCamarero.manageMenu.itemDescEsPlaceholder')} rows={3} disabled={isSubmitting} {...form.getInputProps('description_es')} />
                        <Textarea label={t('component.rewardForm.descriptionEnLabel')} placeholder={t('adminCamarero.manageMenu.itemDescEnPlaceholder')} rows={3} disabled={isSubmitting} {...form.getInputProps('description_en')} />

                        <NumberInput
                            label={t('adminCamarero.manageMenu.itemPrice')}
                            placeholder="0.00" required min={0} step={0.01} decimalScale={2} fixedDecimalScale
                            leftSection={<IconCurrencyEuro size={16} />}
                            disabled={isSubmitting}
                            {...form.getInputProps('price')}
                        />
                        
                        <ImageUploadCropper
                            aspectRatio={1}
                            minDimension={150}
                            initialImageUrl={form.values.imageUrl || null}
                            onUploadSuccess={(url) => form.setFieldValue('imageUrl', url)}
                            onUploadError={(errorMsg) => form.setFieldError('imageUrl', errorMsg)}
                            onClearImage={() => form.setFieldValue('imageUrl', null)}
                            folderName="loyalpyme/menu-items"
                            disabled={isSubmitting}
                            imagePreviewAltText={t('adminCamarero.menuItemForm.altPreview')}
                            imageToCropAltText={t('adminCamarero.menuItemForm.altCropImage')}
                        />
                         {form.errors.imageUrl && (
                            <MantineText c="red" size="xs" mt={-10}>{form.errors.imageUrl}</MantineText>
                        )}

                        <MultiSelect
                            label={t('adminCamarero.manageMenu.itemAllergens')}
                            placeholder={t('adminCamarero.manageMenu.itemAllergensPlaceholder')}
                            data={allergenOptions}
                            searchable
                            // @ts-expect-error creatable is a valid prop for Mantine v7 MultiSelect
                            creatable
                            getCreateLabel={(query: string) => `+ ${t('common.add')} "${query}"`}
                            disabled={isSubmitting}
                            {...allergenInputProps}
                        />
                        <MultiSelect
                            label={t('adminCamarero.manageMenu.itemTags')}
                            placeholder={t('adminCamarero.manageMenu.itemTagsPlaceholder')}
                            data={tagOptions}
                            searchable
                            // @ts-expect-error creatable is a valid prop for Mantine v7 MultiSelect
                            creatable
                            getCreateLabel={(query: string) => `+ ${t('common.add')} "${query}"`}
                            disabled={isSubmitting}
                            {...tagInputProps}
                        />
                        <Group grow>
                            <NumberInput label={t('adminCamarero.manageMenu.itemPosition')} placeholder="0" min={0} step={1} allowDecimal={false} disabled={isSubmitting} {...form.getInputProps('position')} />
                            <NumberInput label={t('adminCamarero.manageMenu.itemPrepTime')} placeholder={t('common.optional')} min={0} step={1} allowDecimal={false} disabled={isSubmitting} {...form.getInputProps('preparationTime')} />
                        </Group>
                        <Group grow>
                            <NumberInput label={t('adminCamarero.manageMenu.itemCalories')} placeholder={t('common.optional')} min={0} step={1} allowDecimal={false} disabled={isSubmitting} {...form.getInputProps('calories')} />
                            <TextInput label={t('adminCamarero.manageMenu.itemSku')} placeholder={t('common.optional')} disabled={isSubmitting} {...form.getInputProps('sku')} />
                        </Group>
                        <TextInput label={t('adminCamarero.manageMenu.itemKds')} placeholder={t('adminCamarero.manageMenu.itemKdsPlaceholder')} description={t('adminCamarero.manageMenu.itemKdsDesc')} disabled={isSubmitting} {...form.getInputProps('kdsDestination')} />
                        <Switch label={t('adminCamarero.manageMenu.itemIsAvailable')} description={t('adminCamarero.manageMenu.itemIsAvailableDesc')} mt="sm" disabled={isSubmitting} {...form.getInputProps('isAvailable', { type: 'checkbox' })} />

                        {initialData && (
                            <Box mt="lg" pt="lg" style={{ borderTop: `1px solid ${theme.colors.gray[3]}` }}>
                                <Group justify="space-between" mb="sm">
                                    <Title order={5}>{t('adminCamarero.manageMenu.modifierGroupsTitle')}</Title>
                                    <Button
                                        variant="outline" size="xs"
                                        leftSection={<IconSettings size={16} />}
                                        onClick={openGroupsModal}
                                        disabled={isSubmitting}
                                    >
                                        {t('adminCamarero.manageMenu.manageGroupsButton')}
                                    </Button>
                                </Group>
                                <MantineText size="xs" c="dimmed" mb="md">
                                    {t('adminCamarero.manageMenu.modifierGroupsDescription')}
                                </MantineText>
                            </Box>
                        )}

                        <Group justify="flex-end" mt="lg">
                            <Button variant="default" onClick={handleModalClose} disabled={isSubmitting}>{t('common.cancel')}</Button>
                            <Button type="submit" loading={isSubmitting} leftSection={<IconDeviceFloppy size={18} />} >
                                {initialData ? t('common.save') : t('common.add')}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {initialData && menuItemIdForGroupsModal && (
                <ModifierGroupsManagementModal
                    opened={groupsModalOpened}
                    onClose={closeGroupsModal}
                    menuItemId={menuItemIdForGroupsModal}
                    menuItemName={menuItemDisplayNameForModal}
                />
            )}
        </>
    );
};

export default MenuItemFormModal;