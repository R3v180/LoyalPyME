// frontend/src/shared/components/utils/ImageUploadCropper.tsx
import React, { useState, useRef, SyntheticEvent, useEffect } from 'react';
import {
    FileInput, Button, Group, AspectRatio, Image as MantineImage,
    Center, Text, Alert, Box, Stack, LoadingOverlay
} from '@mantine/core';
import {
    IconUpload, IconPhoto, IconX, IconAlertCircle, IconCrop, IconCameraRotate
} from '@tabler/icons-react';
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    type Crop,
    type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview, canvasToBlob } from './canvasPreview';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../services/axiosInstance';

export interface ImageUploadCropperProps {
    aspectRatio: number;
    minDimension: number;
    initialImageUrl: string | null;
    onUploadSuccess: (imageUrl: string) => void;
    onUploadError: (errorMessage: string) => void;
    onClearImage: () => void; // AUNQUE NO SE USA, la mantenemos por consistencia con otros componentes
    folderName?: string;
    disabled?: boolean;
    imagePreviewAltText?: string;
    imageToCropAltText?: string;
}

const DEFAULT_CLOUDINARY_FOLDER = 'loyalpyme/uploads';

const ImageUploadCropper: React.FC<ImageUploadCropperProps> = ({
    aspectRatio,
    minDimension,
    initialImageUrl,
    onUploadSuccess,
    onUploadError,
    onClearImage, // Recibimos la prop aunque no la usemos aquí directamente
    folderName = DEFAULT_CLOUDINARY_FOLDER,
    disabled = false,
    imagePreviewAltText,
    imageToCropAltText,
}) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const [imgSrcForCropper, setImgSrcForCropper] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (initialImageUrl) {
            setImgSrcForCropper('');
            setSelectedFile(null);
        }
    }, [initialImageUrl]);

    const handleFileSelect = (file: File | null) => {
        setInternalError(null);
        onUploadError('');
        setSelectedFile(file);
        if (file) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrcForCropper(reader.result?.toString() || ''));
            reader.readAsDataURL(file);
        } else {
            setImgSrcForCropper('');
        }
    };

    const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth < minDimension || naturalHeight < minDimension) {
            const errorMsg = t('common.errorImageTooSmall', { minSize: minDimension });
            setInternalError(errorMsg);
            onUploadError(errorMsg);
            setImgSrcForCropper('');
            return;
        }
        const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 100 }, aspectRatio, naturalWidth, naturalHeight), naturalWidth, naturalHeight);
        setCrop(newCrop);
    };

    const handleConfirmCropAndUpload = async () => {
        if (!imgRef.current || !completedCrop || completedCrop.width === 0) {
            const errorMsg = "Recorte de imagen inválido.";
            setInternalError(errorMsg);
            onUploadError(errorMsg);
            return;
        }
        setIsUploading(true);
        setInternalError(null);
        onUploadError('');
        try {
            const canvas = document.createElement('canvas');
            canvasPreview(imgRef.current, canvas, completedCrop, 1, 0, completedCrop.width, completedCrop.height);
            const blob = await canvasToBlob(canvas);
            if (!blob) throw new Error("No se pudo crear el archivo de imagen.");
            
            const formData = new FormData();
            formData.append('image', blob, selectedFile?.name || `cropped.png`);
            
            const response = await axiosInstance.post<{ url: string }>('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'X-Upload-Folder': folderName }
            });

            if (response.data && response.data.url) {
                onUploadSuccess(response.data.url);
                setImgSrcForCropper('');
            } else {
                throw new Error("La API no devolvió una URL de imagen válida.");
            }
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            setInternalError(apiError);
            onUploadError(apiError);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setImgSrcForCropper('');
        setSelectedFile(null);
        onClearImage(); // Usamos la prop aquí
    };
    
    const showCropper = !!imgSrcForCropper;
    const effectiveImagePreviewAlt = imagePreviewAltText || 'Preview';

    return (
        <Stack gap="sm">
            <LoadingOverlay visible={isUploading} />
            
            {showCropper ? (
                <Box>
                    <ReactCrop
                        crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspectRatio} minWidth={minDimension} minHeight={minDimension / aspectRatio} >
                        <img ref={imgRef} src={imgSrcForCropper} onLoad={onImageLoad} alt={imageToCropAltText || 'Crop'} style={{ maxHeight: 300 }} />
                    </ReactCrop>
                </Box>
            ) : (
                <AspectRatio ratio={aspectRatio} maw={300} mx="auto">
                    <Center bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', border: `1px dashed var(--mantine-color-gray-4)` }}>
                        {initialImageUrl ? (
                            <MantineImage src={initialImageUrl} alt={effectiveImagePreviewAlt} radius="sm" fit="contain" style={{ maxHeight: '100%', maxWidth: '100%' }} fallbackSrc="/placeholder-image.png" />
                        ) : ( <IconPhoto size={48} color="var(--mantine-color-gray-5)" stroke={1.5} /> )}
                    </Center>
                </AspectRatio>
            )}

            <Group justify="center" mt="xs" wrap="nowrap">
                <FileInput
                    placeholder={t('component.rewardForm.selectImageButton')}
                    leftSection={<IconUpload size={16} />}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    value={selectedFile}
                    clearable
                    disabled={disabled || isUploading}
                    style={{ flexGrow: 1 }}
                />
                {showCropper && (
                    <Button onClick={handleConfirmCropAndUpload} loading={isUploading} disabled={!completedCrop || disabled} leftSection={<IconCrop size={16} />}>
                        {t('component.rewardForm.confirmCropButton')}
                    </Button>
                )}
            </Group>

            {(initialImageUrl && !showCropper) && (
                <Button variant="subtle" color="red" size="xs" mt="xs" onClick={handleRemoveImage} leftSection={<IconX size={14} />} disabled={disabled || isUploading}>
                    {t('component.rewardForm.removeImageButton')}
                </Button>
            )}

            {showCropper && (
                 <Button variant="outline" color="gray" size="xs" mt="xs" onClick={() => { setImgSrcForCropper(''); setSelectedFile(null); }} leftSection={<IconCameraRotate size={14}/>} disabled={isUploading || disabled} fullWidth >
                    {t('common.cancel')}
                 </Button>
            )}

            {internalError && (
                <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />} mt="sm" withCloseButton onClose={() => setInternalError(null)}>
                    <Text size="sm">{internalError}</Text>
                </Alert>
            )}
        </Stack>
    );
};

export default ImageUploadCropper;