// frontend/src/components/utils/ImageUploadCropper.tsx
// Version 1.1.0 (Set default crop to 100% width)

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
import { canvasPreview, canvasToBlob } from '../../utils/canvasPreview';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../services/axiosInstance';

export interface ImageUploadCropperProps {
    aspectRatio: number;
    minDimension: number;
    outputWidth?: number;
    outputHeight?: number;
    initialImageUrl: string | null;
    onUploadSuccess: (imageUrl: string) => void;
    onUploadError: (errorMessage: string) => void;
    onClearImage: () => void;
    folderName?: string;
    disabled?: boolean;
    selectImageButtonLabel?: string;
    confirmCropButtonLabel?: string;
    removeImageButtonLabel?: string;
    cropInstructionsLabel?: string;
    imagePreviewAltText?: string;
    imageToCropAltText?: string;
}

const DEFAULT_CLOUDINARY_FOLDER = 'loyalpyme/uploads';

const ImageUploadCropper: React.FC<ImageUploadCropperProps> = ({
    aspectRatio,
    minDimension,
    outputWidth,
    outputHeight,
    initialImageUrl,
    onUploadSuccess,
    onUploadError,
    onClearImage,
    folderName = DEFAULT_CLOUDINARY_FOLDER,
    disabled = false,
    selectImageButtonLabel,
    confirmCropButtonLabel,
    removeImageButtonLabel,
    cropInstructionsLabel,
    imagePreviewAltText,
    imageToCropAltText,
}) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const [currentDisplayUrl, setCurrentDisplayUrl] = useState<string | null>(initialImageUrl);
    const [imgSrcForCropper, setImgSrcForCropper] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [internalUploadError, setInternalUploadError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        setCurrentDisplayUrl(initialImageUrl);
        if (initialImageUrl && imgSrcForCropper) {
            setImgSrcForCropper('');
            setSelectedFile(null);
            setCrop(undefined);
            setCompletedCrop(undefined);
        }
    }, [initialImageUrl, imgSrcForCropper]);


    const handleFileSelect = (file: File | null) => {
        setInternalUploadError(null);
        setSelectedFile(file);
        if (file) {
            setCrop(undefined);
            setCompletedCrop(undefined);
            setCurrentDisplayUrl(null);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrcForCropper(reader.result?.toString() || '');
            });
            reader.readAsDataURL(file);
        } else {
            setImgSrcForCropper('');
            if (initialImageUrl) {
                setCurrentDisplayUrl(initialImageUrl);
            }
        }
    };

    const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setInternalUploadError(null);

        if (naturalWidth < minDimension || naturalHeight < minDimension) {
            const errorMsg = t('common.errorImageTooSmall', { minSize: minDimension });
            setInternalUploadError(errorMsg);
            onUploadError(errorMsg);
            setImgSrcForCropper('');
            setSelectedFile(null);
            return;
        }

        // --- CAMBIO CLAVE: Cambiar width de 90 a 100 para seleccionar todo por defecto ---
        const newCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 100, // <--- ANTES 90, AHORA 100
                },
                aspectRatio,
                naturalWidth,
                naturalHeight
            ),
            naturalWidth,
            naturalHeight
        );
        // --- FIN CAMBIO CLAVE ---
        
        setCrop(newCrop);
        
        if (naturalWidth && naturalHeight) {
             setCompletedCrop({
                 unit: 'px',
                 x: (newCrop.x / 100) * naturalWidth,
                 y: (newCrop.y / 100) * naturalHeight,
                 width: (newCrop.width / 100) * naturalWidth,
                 height: (newCrop.height / 100) * naturalHeight,
             });
        }
    };

    const handleConfirmCropAndUpload = async () => {
        if (!imgRef.current || !previewCanvasRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
            const errorMsg = t('adminCamarero.menuCategoryForm.errorInvalidCropOrImage');
            setInternalUploadError(errorMsg);
            onUploadError(errorMsg);
            return;
        }
        setIsUploading(true);
        setInternalUploadError(null);
        try {
            const targetWidth = outputWidth || completedCrop.width;
            const targetHeight = outputHeight || completedCrop.height;

            await canvasPreview(
                imgRef.current,
                previewCanvasRef.current,
                completedCrop,
                1, 0,
                targetWidth,
                targetHeight
            );
            const blob = await canvasToBlob(previewCanvasRef.current);

            if (!blob) { throw new Error(t('adminCamarero.menuCategoryForm.errorCreatingCroppedFile')); }
            const formData = new FormData();
            formData.append('image', blob, selectedFile?.name || `cropped-image-${Date.now()}.png`);
            
            // Usamos la carpeta especificada en las props
            const response = await axiosInstance.post<{ url: string }>('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'X-Upload-Folder': folderName }
            });

            if (response.data && response.data.url) {
                onUploadSuccess(response.data.url);
                setCurrentDisplayUrl(response.data.url);
                setImgSrcForCropper(''); setSelectedFile(null); setCrop(undefined); setCompletedCrop(undefined);
            } else { throw new Error(t('adminCamarero.menuCategoryForm.errorApiNoUrl')); }
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            const errorMsg = t('adminCamarero.menuCategoryForm.errorUploadingWithDetail', { error: apiError });
            setInternalUploadError(errorMsg);
            onUploadError(errorMsg);
        } finally { setIsUploading(false); }
    };

    const handleRemoveImage = () => {
        setCurrentDisplayUrl(null);
        setImgSrcForCropper('');
        setSelectedFile(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setInternalUploadError(null);
        onClearImage();
    };

    const showCropper = !!imgSrcForCropper;
    const effectiveImagePreviewAlt = imagePreviewAltText || t('component.rewardForm.altImagePreview', { name: 'Imagen' });
    const effectiveImageToCropAlt = imageToCropAltText || t('component.rewardForm.altCropImage');

    return (
        <Stack gap="sm">
            <LoadingOverlay visible={isUploading} overlayProps={{ radius: "sm", blur: 2 }} />
            <Text fw={500} size="sm">{t('component.rewardForm.imageLabel')}</Text>
            {!showCropper && (
                <AspectRatio ratio={aspectRatio} maw={300} mx="auto">
                    <Center bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', border: `1px dashed var(--mantine-color-gray-4)` }}>
                        {currentDisplayUrl ? (
                            <MantineImage src={currentDisplayUrl} alt={effectiveImagePreviewAlt} radius="sm" fit="contain" style={{ maxHeight: '100%', maxWidth: '100%' }} fallbackSrc="/placeholder-image.png" />
                        ) : ( <IconPhoto size={48} color="var(--mantine-color-gray-5)" stroke={1.5} /> )}
                    </Center>
                </AspectRatio>
            )}
            {showCropper && (
                <Box mt="xs" style={{ maxWidth: 500, margin: 'auto' }}>
                    <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspectRatio} minWidth={50} minHeight={50 / aspectRatio} >
                        <img ref={imgRef} src={imgSrcForCropper} style={{ display: 'block', maxHeight: '400px', objectFit: 'contain' }} onLoad={onImageLoad} alt={effectiveImageToCropAlt} />
                    </ReactCrop>
                    {completedCrop && completedCrop.width > 0 && ( <canvas ref={previewCanvasRef} style={{ display: 'none', border: '1px solid black', objectFit: 'contain', width: completedCrop.width, height: completedCrop.height, }} /> )}
                </Box>
            )}
            <Group justify="center" mt="xs" wrap="nowrap">
                <FileInput placeholder={selectImageButtonLabel || t('component.rewardForm.selectImageButton')} accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileSelect} leftSection={<IconUpload size={16} />} clearable disabled={disabled || isUploading} style={{ flexGrow: 1, maxWidth: showCropper ? 'calc(50% - 4px)' : '100%' }} value={selectedFile} />
                {showCropper && ( <Button onClick={handleConfirmCropAndUpload} loading={isUploading} disabled={!completedCrop || isUploading || disabled} leftSection={<IconCrop size={16} />} style={{ flexGrow: 1, maxWidth: 'calc(50% - 4px)' }} > {confirmCropButtonLabel || t('component.rewardForm.confirmCropButton')} </Button> )}
            </Group>
            {imgSrcForCropper && ( <Button variant="outline" color="gray" size="xs" mt="xs" onClick={() => { setImgSrcForCropper(''); setSelectedFile(null); setCrop(undefined); setCompletedCrop(undefined); if(initialImageUrl) setCurrentDisplayUrl(initialImageUrl); }} leftSection={<IconCameraRotate size={14}/>} disabled={isUploading || disabled} fullWidth > {t('common.cancel')} {t('common.edit')} / {t('common.selectPlaceholder')} </Button> )}
            {currentDisplayUrl && !showCropper && ( <Button variant="subtle" color="red" size="xs" mt="xs" onClick={handleRemoveImage} leftSection={<IconX size={14} />} disabled={disabled || isUploading} > {removeImageButtonLabel || t('component.rewardForm.removeImageButton')} </Button> )}
            {internalUploadError && ( <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />} mt="sm" withCloseButton onClose={() => setInternalUploadError(null)} > <Text size="sm">{internalUploadError}</Text> </Alert> )}
            {cropInstructionsLabel && showCropper && <Text size="xs" c="dimmed" ta="center" mt="xs">{cropInstructionsLabel}</Text>}
        </Stack>
    );
};
export default ImageUploadCropper;