// frontend/src/components/admin/rewards/RewardForm.tsx
// Version 2.0.2 (Remove unused imports)

import { useState, useEffect } from 'react';
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group, Text as MantineText
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../../../../shared/services/axiosInstance';
import type { Reward } from '../../../../../shared/types/user.types';

// Importar el nuevo componente reutilizable
import ImageUploadCropper from '../../../../../shared/components/utils/ImageUploadCropper';

// Schema de Zod para la validación del formulario
const createRewardFormSchema = (t: Function) => z.object({
  name_es: z.string().min(1, { message: t('component.rewardForm.errorNameEsRequired') }),
  name_en: z.string().min(1, { message: t('component.rewardForm.errorNameEnRequired') }),
  description_es: z.string().optional(),
  description_en: z.string().optional(),
  pointsCost: z.number().min(0, { message: t('component.rewardForm.errorPointsCostInvalid') }),
  imageUrl: z.string().url({ message: t('validation.invalidUrl') }).nullable().optional(),
});

type RewardFormValues = z.infer<ReturnType<typeof createRewardFormSchema>>;

interface RewardFormProps {
    mode: 'add' | 'edit';
    initialData?: Reward | null;
    rewardIdToUpdate?: string | null;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

const RewardForm: React.FC<RewardFormProps> = ({
    mode, initialData, rewardIdToUpdate, onSubmitSuccess, onCancel
}) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const form = useForm<RewardFormValues>({
        initialValues: {
            name_es: '', name_en: '', description_es: '', description_en: '',
            pointsCost: 0, imageUrl: null,
        },
        validate: zodResolver(createRewardFormSchema(t)),
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            form.setValues({
                name_es: initialData.name_es || '',
                name_en: initialData.name_en || '',
                description_es: initialData.description_es || '',
                description_en: initialData.description_en || '',
                pointsCost: initialData.pointsCost ?? 0,
                imageUrl: initialData.imageUrl || null,
            });
        } else {
            form.reset();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, initialData]);

    const handleSubmit = async (values: RewardFormValues) => {
        setIsSubmitting(true);
        const payload = {
            ...values,
            description_es: values.description_es?.trim() || null,
            description_en: values.description_en?.trim() || null,
        };
        
        try {
            let successMessage = '';
            let savedReward: Reward | null = null;
            if (mode === 'add') {
                const response = await axiosInstance.post<Reward>('/rewards', payload);
                savedReward = response.data;
                successMessage = t('adminRewardsPage.createSuccessMessage', { name: savedReward.name_es });
            } else {
                if (!rewardIdToUpdate) throw new Error(t('component.rewardForm.errorMissingIdForUpdate'));
                const response = await axiosInstance.patch<Reward>(`/rewards/${rewardIdToUpdate}`, payload);
                savedReward = response.data;
                successMessage = t('adminRewardsPage.updateSuccessMessage', { name: savedReward.name_es });
            }
            
            notifications.show({
                title: t('common.success'),
                message: successMessage,
                color: 'green', icon: <IconCheck size={18} />,
            });
            onSubmitSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.error'),
                message: errorMessage,
                color: 'red', icon: <IconX size={18} />,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitButtonText = mode === 'add' ? t('adminRewardsPage.addButton') : t('common.save');

    return (
        <Stack gap="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label={t('component.rewardForm.nameEsLabel')} placeholder={t('component.rewardForm.nameEsPlaceholder')} required disabled={isSubmitting} {...form.getInputProps('name_es')} />
                    <TextInput label={t('component.rewardForm.nameEnLabel')} placeholder={t('component.rewardForm.nameEnPlaceholder')} required disabled={isSubmitting} {...form.getInputProps('name_en')} />
                    <Textarea label={t('component.rewardForm.descriptionEsLabel')} placeholder={t('component.rewardForm.descriptionEsPlaceholder')} rows={2} disabled={isSubmitting} {...form.getInputProps('description_es')} />
                    <Textarea label={t('component.rewardForm.descriptionEnLabel')} placeholder={t('component.rewardForm.descriptionEnPlaceholder')} rows={2} disabled={isSubmitting} {...form.getInputProps('description_en')} />
                    <NumberInput label={t('component.rewardForm.pointsCostLabel')} placeholder={t('component.rewardForm.pointsCostPlaceholder')} min={0} step={1} required disabled={isSubmitting} {...form.getInputProps('pointsCost')} />
                    
                    {/* Componente reutilizable de subida y recorte */}
                    <ImageUploadCropper
                        aspectRatio={1}
                        minDimension={150}
                        initialImageUrl={form.values.imageUrl || null}
                        onUploadSuccess={(url) => form.setFieldValue('imageUrl', url)}
                        onUploadError={(errorMsg) => form.setFieldError('imageUrl', errorMsg)}
                        onClearImage={() => form.setFieldValue('imageUrl', null)}
                        folderName="loyalpyme/rewards"
                        disabled={isSubmitting}
                        imagePreviewAltText={t('component.rewardForm.altImagePreview', { name: form.values.name_es })}
                    />
                    {form.errors.imageUrl && (
                        <MantineText c="red" size="xs" mt={-10}>{form.errors.imageUrl}</MantineText>
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onCancel} disabled={isSubmitting}> {t('common.cancel')} </Button>
                        <Button type="submit" loading={isSubmitting}> {submitButtonText} </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
};

export default RewardForm;