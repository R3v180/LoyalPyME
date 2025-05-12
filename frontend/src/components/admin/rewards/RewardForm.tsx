// frontend/src/components/admin/rewards/RewardForm.tsx
import React, { useState, useEffect, useRef, FormEvent, SyntheticEvent } from 'react';
import axiosInstance from '../../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group, FileInput,
    Image as MantineImage, AspectRatio, Text, Center, Alert, Box
} from '@mantine/core';
import {
    IconAlertCircle, IconCheck, IconX, IconUpload, IconCamera, IconPhoto
} from '@tabler/icons-react';
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    Crop,
    PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview, canvasToBlob } from '../../../utils/canvasPreview';
import { useTranslation } from 'react-i18next';
import type { Reward } from '../../../types/customer';

interface RewardFormProps {
    mode: 'add' | 'edit';
    initialData?: Reward | null;
    rewardIdToUpdate?: string | null;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

const RewardForm: React.FC<RewardFormProps> = ({
    mode, initialData, rewardIdToUpdate, onSubmitSuccess, onCancel
}) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const [name_es, setNameEs] = useState<string>('');
    const [name_en, setNameEn] = useState<string>('');
    const [description_es, setDescriptionEs] = useState<string>('');
    const [description_en, setDescriptionEn] = useState<string>('');
    const [pointsCost, setPointsCost] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [imgSrc, setImgSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setNameEs(initialData.name_es || '');
            setNameEn(initialData.name_en || '');
            setDescriptionEs(initialData.description_es || '');
            setDescriptionEn(initialData.description_en || '');
            setPointsCost(initialData.pointsCost ?? '');
            setImageUrl(initialData.imageUrl || null);
            setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined); setUploadError(null);
        } else {
            setNameEs(''); setNameEn(''); setDescriptionEs(''); setDescriptionEn('');
            setPointsCost(''); setImageUrl(null); setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined); setUploadError(null);
        }
    }, [mode, initialData]);

    const onSelectFile = (file: File | null) => {
        if (!file) {
            setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined);
            return;
        }
        setCrop(undefined); setCompletedCrop(undefined); setUploadError(null); setImageUrl(null);
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const imageDataUrl = reader.result?.toString() || '';
            setImgSrc(imageDataUrl);
        });
        reader.readAsDataURL(file);
    };

    const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
        const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
        setUploadError(null);

        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
            setUploadError(t('component.rewardForm.errorImageTooSmall', { minSize: MIN_DIMENSION })); // Clave i18n
            setImgSrc('');
            return;
        }

        const imageAspectRatio = naturalWidth / naturalHeight;
        let initialCropWidthPx: number;
        let initialCropHeightPx: number;

        if (imageAspectRatio > ASPECT_RATIO) {
            initialCropHeightPx = naturalHeight;
            initialCropWidthPx = initialCropHeightPx * ASPECT_RATIO;
        } else {
            initialCropWidthPx = naturalWidth;
            initialCropHeightPx = initialCropWidthPx / ASPECT_RATIO;
        }

        const cropWidthPercent = (initialCropWidthPx / naturalWidth) * 100;

        const newCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: cropWidthPercent,
                },
                ASPECT_RATIO,
                width,
                height
            ),
            width,
            height
        );
        setCrop(newCrop);
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
            setUploadError(t('component.rewardForm.errorInvalidCrop')); // Clave i18n
            return;
        }
        setIsUploading(true); setUploadError(null);
        try {
            await canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
            const blob = await canvasToBlob(previewCanvasRef.current, 'image/png', 0.9);
            if (!blob) { throw new Error(t('component.rewardForm.errorCreatingCroppedFile')); } // Clave i18n

            const formData = new FormData();
            formData.append('image', blob, `reward-crop-${Date.now()}.png`);

            const response = await axiosInstance.post<{ url: string }>('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data && response.data.url) {
               setImageUrl(response.data.url);
               setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined);
               notifications.show({ title: t('common.success'), message: t('component.rewardForm.imageUploadSuccess'), color: 'green', icon: <IconCheck size={18} />, });
            } else { throw new Error(t('component.rewardForm.errorApiNoUrl')); } // Clave i18n
        } catch (err: any) {
            console.error('Error uploading cropped image:', err);
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            setUploadError(t('component.rewardForm.errorUploadingWithDetail', { error: apiError })); // Clave i18n
            notifications.show({ title: t('common.error'), message: t('component.rewardForm.imageUploadError', {error: apiError}), color: 'red', icon: <IconAlertCircle size={18} />, });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name_es.trim() || !name_en.trim() || pointsCost === '' || pointsCost < 0) {
            notifications.show({
                title: t('component.rewardForm.errorInvalidDataTitle'),
                message: t('component.rewardForm.errorInvalidDataMsg'),
                color: 'orange', icon: <IconAlertCircle size={18} />,
            });
            return;
        }
        setIsSubmitting(true);
        const payload = {
            name_es: name_es.trim(), name_en: name_en.trim(),
            description_es: description_es.trim() || null, description_en: description_en.trim() || null,
            pointsCost: Number(pointsCost), imageUrl: imageUrl,
        };
        try {
            let successMessage = '';
            let savedReward: Reward | null = null;
            if (mode === 'add') {
                const response = await axiosInstance.post<Reward>('/rewards', payload);
                savedReward = response.data;
                successMessage = t('adminCommon.createSuccess');
            } else {
                if (!rewardIdToUpdate) throw new Error(t('component.rewardForm.errorMissingIdForUpdate')); // Clave i18n
                const response = await axiosInstance.patch<Reward>(`/rewards/${rewardIdToUpdate}`, payload);
                savedReward = response.data;
                successMessage = t('adminCommon.updateSuccess');
            }
            const displayName = savedReward?.name_es || savedReward?.name_en || t('component.rewardForm.rewardFallbackName'); // Clave i18n para fallback
            notifications.show({
                title: successMessage,
                message: t('adminRewardsPage.updateSuccessMessage', { name: displayName }), // Ya usa t()
                color: 'green', icon: <IconCheck size={18} />, autoClose: 4000,
            });
            onSubmitSuccess();
        } catch (err: any) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} reward:`, err);
            const errorMessage = t('adminCommon.saveError') + `: ${err.response?.data?.message || err.message || t('common.errorUnknown')}`;
            notifications.show({ title: t('common.error'), message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitButtonText = mode === 'add' ? t('adminRewardsPage.addButton') : t('common.save');
    const displayImageUrlForPreview = imageUrl || (mode === 'edit' && initialData?.imageUrl && !imgSrc ? initialData.imageUrl : null);
    const showCropper = !!imgSrc && !imageUrl;

    return (
        <Stack gap="md">
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                     <TextInput label={t('component.rewardForm.nameEsLabel')} placeholder={t('component.rewardForm.nameEsPlaceholder')} value={name_es} onChange={(e) => setNameEs(e.currentTarget.value)} required disabled={isSubmitting} radius="lg" />
                     <TextInput label={t('component.rewardForm.nameEnLabel')} placeholder={t('component.rewardForm.nameEnPlaceholder')} value={name_en} onChange={(e) => setNameEn(e.currentTarget.value)} required disabled={isSubmitting} radius="lg" />
                    <Textarea label={t('component.rewardForm.descriptionEsLabel')} placeholder={t('component.rewardForm.descriptionEsPlaceholder')} value={description_es} onChange={(e) => setDescriptionEs(e.currentTarget.value)} rows={2} disabled={isSubmitting} radius="lg" />
                     <Textarea label={t('component.rewardForm.descriptionEnLabel')} placeholder={t('component.rewardForm.descriptionEnPlaceholder')} value={description_en} onChange={(e) => setDescriptionEn(e.currentTarget.value)} rows={2} disabled={isSubmitting} radius="lg" />
                    <NumberInput label={t('component.rewardForm.pointsCostLabel')} placeholder={t('component.rewardForm.pointsCostPlaceholder')} value={pointsCost} onChange={(value) => setPointsCost(typeof value === 'number' ? value : '')} min={0} step={1} allowDecimal={false} required disabled={isSubmitting} radius="lg" />

                    <Stack gap="xs" mt="sm">
                         <Text fw={500} size="sm">{t('component.rewardForm.imageLabel')}</Text>
                         {displayImageUrlForPreview && !showCropper && ( <AspectRatio ratio={1 / 1} maw={200}><MantineImage src={displayImageUrlForPreview} alt={t('component.rewardForm.altImagePreview', { name: name_es || name_en || t('component.rewardForm.rewardFallbackName') })} radius="md" fallbackSrc="/placeholder-reward.png" /></AspectRatio> )}
                         {!displayImageUrlForPreview && !showCropper && ( <AspectRatio ratio={1 / 1} maw={200}><Center bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)' }}><IconPhoto size={48} color="var(--mantine-color-gray-5)" stroke={1.5} /></Center></AspectRatio> )}
                         <Group gap="sm">
                             <FileInput placeholder={t('component.rewardForm.selectImageButton')} accept="image/png,image/jpeg,image/webp,image/gif" onChange={onSelectFile} leftSection={<IconUpload size={16} />} clearable disabled={isSubmitting || isUploading} style={{ flexGrow: 1 }} value={null} />
                             <Button variant="outline" disabled leftSection={<IconCamera size={16} />} title={t('common.upcomingFeatureTitle')}> {t('common.camera')} </Button>
                         </Group>
                         {showCropper && (
                            <Box mt="md">
                                <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={ASPECT_RATIO} minWidth={MIN_DIMENSION} minHeight={MIN_DIMENSION} circularCrop={false} >
                                     <img ref={imgRef} src={imgSrc} style={{ maxHeight: '400px', display: imgSrc ? 'block' : 'none' }} onLoad={onImageLoad} alt={t('component.rewardForm.altCropImage')} />
                                </ReactCrop>
                                <Button mt="sm" onClick={handleConfirmCropAndUpload} loading={isUploading} disabled={!completedCrop || isUploading || isSubmitting || !imgSrc} leftSection={<IconCheck size={16} />} >
                                     {t('component.rewardForm.confirmCropButton')}
                                 </Button>
                                {completedCrop && completedCrop.width > 0 && <canvas ref={previewCanvasRef} style={{ display: 'none', border: '1px solid black', objectFit: 'contain', width: completedCrop.width, height: completedCrop.height, }}/>}
                             </Box>
                         )}
                        {uploadError && ( <Alert title={t('common.error')} color="red" icon={<IconAlertCircle size={16} />} mt="sm" withCloseButton onClose={()=>setUploadError(null)}>{uploadError}</Alert> )}
                    </Stack>

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onCancel} disabled={isSubmitting || isUploading} radius="lg"> {t('common.cancel')} </Button>
                        <Button type="submit" loading={isSubmitting} radius="lg" disabled={isUploading || showCropper}> {submitButtonText} </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
};

export default RewardForm;