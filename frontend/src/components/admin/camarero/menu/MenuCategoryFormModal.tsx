// frontend/src/components/admin/camarero/menu/MenuCategoryFormModal.tsx
// Version 2.0.1 (Corrected aspect ratio to 1:1 and minDimension to 150px)

import React, { useEffect } from 'react';
import {
    Modal, TextInput, Textarea, NumberInput, Switch, Button, Group, Stack, Text
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { MenuCategoryData, MenuCategoryFormData } from '../../../../types/menu.types';

// Importar el componente reutilizable
import ImageUploadCropper from '../../../utils/ImageUploadCropper';

const createCategoryFormSchema = (t: Function) => z.object({
  name_es: z.string().min(1, { message: t('common.requiredField') }),
  name_en: z.string().nullable().optional(),
  description_es: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  imageUrl: z.string().url({ message: t('validation.invalidUrl') }).nullable().optional(),
  position: z.number().min(0, { message: t('validation.minValueMin0') }),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<ReturnType<typeof createCategoryFormSchema>>;

interface MenuCategoryFormModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: MenuCategoryFormData) => Promise<void>;
    initialData?: MenuCategoryData | null;
    isSubmitting: boolean;
}

const MenuCategoryFormModal: React.FC<MenuCategoryFormModalProps> = ({
    opened,
    onClose,
    onSubmit,
    initialData,
    isSubmitting,
}) => {
    const { t } = useTranslation();
    
    const form = useForm<CategoryFormValues>({
        initialValues: {
            name_es: '', name_en: null, description_es: null, description_en: null,
            imageUrl: null, position: 0, isActive: true,
        },
        validate: zodResolver(createCategoryFormSchema(t)),
    });

    useEffect(() => {
        if (opened) {
            if (initialData) {
                form.setValues({
                    name_es: initialData.name_es, name_en: initialData.name_en || null,
                    description_es: initialData.description_es || null, description_en: initialData.description_en || null,
                    imageUrl: initialData.imageUrl || null, position: initialData.position, isActive: initialData.isActive,
                });
            } else {
                form.reset();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, initialData]);


    const handleSubmitForm = async (values: CategoryFormValues) => {
        const submitData: MenuCategoryFormData = {
            name_es: values.name_es, name_en: values.name_en?.trim() || null,
            description_es: values.description_es?.trim() || null, description_en: values.description_en?.trim() || null,
            imageUrl: values.imageUrl || null, position: values.position, isActive: values.isActive,
        };
        await onSubmit(submitData);
    };

    const handleModalClose = () => { if (!isSubmitting) onClose(); }

    return (
        <Modal
            opened={opened} onClose={handleModalClose}
            title={initialData ? t('adminCamarero.manageMenu.editCategoryTitle') : t('adminCamarero.manageMenu.addCategoryTitle')}
            centered size="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            trapFocus closeOnClickOutside={!isSubmitting} closeOnEscape={!isSubmitting}
        >
            <form onSubmit={form.onSubmit(handleSubmitForm)}>
                <Stack gap="md">
                    <TextInput label={t('component.rewardForm.nameEsLabel')} placeholder={t('adminCamarero.manageMenu.categoryNameEsPlaceholder')} required disabled={isSubmitting} {...form.getInputProps('name_es')} />
                    <TextInput label={t('component.rewardForm.nameEnLabel')} placeholder={t('adminCamarero.manageMenu.categoryNameEnPlaceholder')} disabled={isSubmitting} {...form.getInputProps('name_en')} />
                    <Textarea label={t('component.rewardForm.descriptionEsLabel')} placeholder={t('adminCamarero.manageMenu.categoryDescEsPlaceholder')} rows={2} disabled={isSubmitting} {...form.getInputProps('description_es')} />
                    <Textarea label={t('component.rewardForm.descriptionEnLabel')} placeholder={t('adminCamarero.manageMenu.categoryDescEnPlaceholder')} rows={2} disabled={isSubmitting} {...form.getInputProps('description_en')} />
                    
                    <ImageUploadCropper
                        aspectRatio={1} // <-- CORRECCIÓN AQUÍ: Cambiado de 16/9 a 1
                        minDimension={150} // <-- CORRECCIÓN AQUÍ: Cambiado de 300 a 150
                        initialImageUrl={form.values.imageUrl || null}
                        onUploadSuccess={(url) => form.setFieldValue('imageUrl', url)}
                        onUploadError={(errorMsg) => form.setFieldError('imageUrl', errorMsg)}
                        onClearImage={() => form.setFieldValue('imageUrl', null)}
                        folderName="loyalpyme/categories"
                        disabled={isSubmitting}
                        imagePreviewAltText={t('adminCamarero.menuCategoryForm.altPreview')}
                    />
                     {form.errors.imageUrl && (
                        <Text c="red" size="xs" mt={-10}>{form.errors.imageUrl}</Text>
                    )}

                    <NumberInput label={t('adminCamarero.manageMenu.categoryPositionLabel')} placeholder={t('adminCamarero.manageMenu.categoryPositionPlaceholder')} description={t('adminCamarero.manageMenu.categoryPositionDesc')} required min={0} step={1} allowDecimal={false} disabled={isSubmitting} {...form.getInputProps('position')} />
                    <Switch label={t('adminCamarero.manageMenu.categoryActiveLabel')} description={t('adminCamarero.manageMenu.categoryActiveDesc')} mt="sm" disabled={isSubmitting} {...form.getInputProps('isActive', { type: 'checkbox' })} />

                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={handleModalClose} disabled={isSubmitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" loading={isSubmitting} disabled={isSubmitting} leftSection={<IconDeviceFloppy size={18} />} >
                            {initialData ? t('common.save') : t('common.add')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default MenuCategoryFormModal;