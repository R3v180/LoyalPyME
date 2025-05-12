// frontend/src/components/admin/camarero/menu/MenuCategoryFormModal.tsx
import React, { useEffect, useState, useRef, SyntheticEvent } from 'react';
import {
    Modal, TextInput, Textarea, NumberInput, Switch, Button, Group, Stack, FileInput,
    AspectRatio, Image as MantineImage, Center, Text as MantineText,
    Alert,
    Box,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { IconDeviceFloppy, IconUpload, IconPhoto, IconX, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { MenuCategoryData, MenuCategoryFormData } from '../../../../types/menu.types';
import axiosInstance from '../../../../services/axiosInstance';
import { notifications } from '@mantine/notifications';

import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    type Crop,
    type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview, canvasToBlob } from '../../../../utils/canvasPreview';

const ASPECT_RATIO_CATEGORY = 1;
const MIN_DIMENSION_CATEGORY = 150;

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
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const form = useForm<CategoryFormValues>({
        initialValues: {
            name_es: '', name_en: null, description_es: null, description_en: null,
            imageUrl: null, position: 0, isActive: true,
        },
        validate: zodResolver(createCategoryFormSchema(t)),
    });

    const [imgSrcForCropper, setImgSrcForCropper] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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
                form.setFieldValue('imageUrl', null);
            }
            setImgSrcForCropper(''); setImageFile(null);
            setCrop(undefined); setCompletedCrop(undefined);
            setUploadError(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, initialData]);

    const handleImageFileChange = (file: File | null) => {
        setUploadError(null); setImageFile(file);
        if (file) {
            setCrop(undefined); setCompletedCrop(undefined);
            form.setFieldValue('imageUrl', null);
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrcForCropper(reader.result?.toString() || ''));
            reader.readAsDataURL(file);
        } else {
            setImgSrcForCropper('');
        }
    };

    const onImageLoadForCropper = (e: SyntheticEvent<HTMLImageElement>) => {
        const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
        setUploadError(null);
        if (naturalWidth < MIN_DIMENSION_CATEGORY || naturalHeight < MIN_DIMENSION_CATEGORY) {
            setUploadError(t('common.errorImageTooSmall', { minSize: MIN_DIMENSION_CATEGORY }));
            setImgSrcForCropper(''); return;
        }
        const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, ASPECT_RATIO_CATEGORY, width, height), width, height);
        setCrop(newCrop);

        const imageAspectRatio = naturalWidth / naturalHeight;
        let initialCropWidthPx, initialCropHeightPx;

        if (imageAspectRatio > ASPECT_RATIO_CATEGORY) {
            initialCropHeightPx = naturalHeight * 0.9;
            initialCropWidthPx = initialCropHeightPx * ASPECT_RATIO_CATEGORY;
        } else {
            initialCropWidthPx = naturalWidth * 0.9;
            initialCropHeightPx = initialCropWidthPx / ASPECT_RATIO_CATEGORY;
        }
        initialCropWidthPx = Math.min(initialCropWidthPx, naturalWidth);
        initialCropHeightPx = Math.min(initialCropHeightPx, naturalHeight);

        setCompletedCrop({
             x: (naturalWidth - initialCropWidthPx) / 2,
             y: (naturalHeight - initialCropHeightPx) / 2,
             width: initialCropWidthPx,
             height: initialCropHeightPx,
             unit: 'px'
        });
    };

    const handleConfirmCropAndUpload = async () => {
        if (!imgRef.current || !previewCanvasRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
            setUploadError(t('adminCamarero.menuCategoryForm.errorInvalidCropOrImage')); return;
        }
        setIsUploadingImage(true); setUploadError(null);
        try {
            await canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
            const blob = await canvasToBlob(previewCanvasRef.current);
            if (!blob) { throw new Error(t('adminCamarero.menuCategoryForm.errorCreatingCroppedFile')); }
            const formData = new FormData();
            formData.append('image', blob, `category-crop-${Date.now()}.png`);
            const response = await axiosInstance.post<{ url: string }>('/uploads/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (response.data && response.data.url) {
               form.setFieldValue('imageUrl', response.data.url);
               notifications.show({ title: t('common.success'), message: t('adminCamarero.menuCategoryForm.imageUploadSuccess'), color: 'green', icon: <IconCheck /> });
               setImgSrcForCropper(''); setImageFile(null);
            } else { throw new Error(t('adminCamarero.menuCategoryForm.errorApiNoUrl')); }
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            setUploadError(t('adminCamarero.menuCategoryForm.errorUploadingWithDetail', { error: apiError }));
            notifications.show({ title: t('common.error'), message: t('adminCamarero.menuCategoryForm.imageUploadError', {error: apiError}), color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleRemoveCurrentImageUrl = () => {
        form.setFieldValue('imageUrl', null); setImgSrcForCropper(''); setImageFile(null);
    };

    const handleSubmitForm = async (values: CategoryFormValues) => {
        if (imgSrcForCropper && !values.imageUrl) {
            notifications.show({ title: t('common.info'), message: t('adminCamarero.manageMenu.pendingImageUpload'), color: 'yellow' });
            return;
        }
        const submitData: MenuCategoryFormData = {
            name_es: values.name_es, name_en: values.name_en?.trim() || null,
            description_es: values.description_es?.trim() || null, description_en: values.description_en?.trim() || null,
            imageUrl: values.imageUrl || null, position: values.position, isActive: values.isActive,
        };
        await onSubmit(submitData);
    };

    const handleModalClose = () => {
        if (!isSubmitting && !isUploadingImage) { onClose(); }
    }

    const displayImageUrl = form.values.imageUrl;
    const showCropper = !!imgSrcForCropper;
    const cropInstructionsText = t('component.rewardForm.cropInstructions');

    return (
        <Modal
            opened={opened} onClose={handleModalClose}
            title={initialData ? t('adminCamarero.manageMenu.editCategoryTitle') : t('adminCamarero.manageMenu.addCategoryTitle')}
            centered size="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            trapFocus closeOnClickOutside={!isSubmitting && !isUploadingImage} closeOnEscape={!isSubmitting && !isUploadingImage}
        >
            <form onSubmit={form.onSubmit(handleSubmitForm)}>
                <Stack gap="md">
                    <TextInput label={t('component.rewardForm.nameEsLabel')} placeholder={t('adminCamarero.manageMenu.categoryNameEsPlaceholder')} required disabled={isSubmitting || isUploadingImage} {...form.getInputProps('name_es')} />
                    <TextInput label={t('component.rewardForm.nameEnLabel')} placeholder={t('adminCamarero.manageMenu.categoryNameEnPlaceholder')} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('name_en')} />
                    <Textarea label={t('component.rewardForm.descriptionEsLabel')} placeholder={t('adminCamarero.manageMenu.categoryDescEsPlaceholder')} rows={2} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('description_es')} />
                    <Textarea label={t('component.rewardForm.descriptionEnLabel')} placeholder={t('adminCamarero.manageMenu.categoryDescEnPlaceholder')} rows={2} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('description_en')} />

                    <Stack gap="xs" mt="sm">
                        <MantineText fw={500} size="sm">{t('component.rewardForm.imageLabel')}</MantineText>
                        {!showCropper && (
                            <AspectRatio ratio={ASPECT_RATIO_CATEGORY} maw={300}>
                                {displayImageUrl ? (
                                    <MantineImage src={displayImageUrl} alt={t('adminCamarero.menuCategoryForm.altPreview')} radius="md" fallbackSrc="/placeholder-category.png" />
                                ) : (
                                    <Center bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)' }}><IconPhoto size={48} color="var(--mantine-color-gray-5)" stroke={1.5} /></Center>
                                )}
                            </AspectRatio>
                        )}
                        <Group>
                            <FileInput placeholder={t('component.rewardForm.selectImageButton')} accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageFileChange} leftSection={<IconUpload size={16} />} clearable value={imageFile} disabled={isSubmitting || isUploadingImage || showCropper} style={{ flexGrow: 1 }} />
                        </Group>
                        {showCropper && (
                            <Box mt="md">
                                <MantineText size="sm" mb="xs">{cropInstructionsText}</MantineText>
                                <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}
                                    aspect={ASPECT_RATIO_CATEGORY}
                                    minWidth={MIN_DIMENSION_CATEGORY / 5}
                                    minHeight={MIN_DIMENSION_CATEGORY / 5 / ASPECT_RATIO_CATEGORY}
                                >
                                    <img ref={imgRef} src={imgSrcForCropper} style={{ maxHeight: '400px', display: imgSrcForCropper ? 'block' : 'none' }} onLoad={onImageLoadForCropper} alt={t('adminCamarero.menuCategoryForm.altCropImage')} />
                                </ReactCrop>
                                <Button mt="sm" onClick={handleConfirmCropAndUpload} loading={isUploadingImage} disabled={!completedCrop || isUploadingImage || isSubmitting || !imgSrcForCropper} leftSection={<IconCheck size={16} />} >
                                    {t('component.rewardForm.confirmCropButton')}
                                </Button>
                                {completedCrop && completedCrop.width > 0 && ( <canvas ref={previewCanvasRef} style={{ display: 'none', border: '1px solid black', objectFit: 'contain', width: completedCrop.width, height: completedCrop.height, }} /> )}
                            </Box>
                        )}
                        {displayImageUrl && !showCropper && (
                            <Button variant="outline" color="red" size="xs" mt="xs" onClick={handleRemoveCurrentImageUrl} leftSection={<IconX size={14}/>} disabled={isSubmitting || isUploadingImage} style={{ alignSelf: 'flex-start' }} >
                                {t('component.rewardForm.removeImageButton')}
                            </Button>
                        )}
                        {uploadError && (
                            <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />} mt="sm" withCloseButton onClose={() => setUploadError(null)}>
                                <MantineText>{uploadError}</MantineText>
                            </Alert>
                        )}
                    </Stack>

                    <NumberInput label={t('adminCamarero.manageMenu.categoryPositionLabel')} placeholder={t('adminCamarero.manageMenu.categoryPositionPlaceholder')} description={t('adminCamarero.manageMenu.categoryPositionDesc')} required min={0} step={1} allowDecimal={false} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('position')} />
                    <Switch label={t('adminCamarero.manageMenu.categoryActiveLabel')} description={t('adminCamarero.manageMenu.categoryActiveDesc')} mt="sm" disabled={isSubmitting || isUploadingImage} {...form.getInputProps('isActive', { type: 'checkbox' })} />

                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={handleModalClose} disabled={isSubmitting || isUploadingImage}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" loading={isSubmitting} disabled={isSubmitting || isUploadingImage || !!(imgSrcForCropper && !form.values.imageUrl)} leftSection={<IconDeviceFloppy size={18} />} >
                            {initialData ? t('common.save') : t('common.add')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default MenuCategoryFormModal;