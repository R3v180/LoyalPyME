// filename: frontend/src/components/admin/rewards/RewardForm.tsx
// Version: 2.0.0 (Integrate Image Upload & Crop)

import React, { useState, useEffect, useRef, FormEvent, SyntheticEvent } from 'react';
import axiosInstance from '../../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import {
    TextInput, Textarea, NumberInput, Button, Stack, Group, FileInput,
    Image, AspectRatio, Text, Center, Alert, Box
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
import 'react-image-crop/dist/ReactCrop.css'; // Import styles for the cropper
import { canvasPreview, canvasToBlob } from '../../../utils/canvasPreview'; // Import helper
import { useTranslation } from 'react-i18next';

// Interfaz Reward (local o importada)
interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    imageUrl?: string | null; // <-- Added imageUrl
}

// Props del componente
interface RewardFormProps {
    mode: 'add' | 'edit';
    initialData?: Reward | null;
    rewardIdToUpdate?: string | null;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

const ASPECT_RATIO = 1; // 1:1 aspect ratio
const MIN_DIMENSION = 150; // Min dimension for crop in pixels

const RewardForm: React.FC<RewardFormProps> = ({
    mode, initialData, rewardIdToUpdate, onSubmitSuccess, onCancel
}) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    // Form State (Manteniendo useState como en el original)
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [pointsCost, setPointsCost] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Image & Crop State
    const [imgSrc, setImgSrc] = useState<string>(''); // Data URL for ReactCrop
    const [crop, setCrop] = useState<Crop>(); // Crop state for ReactCrop { unit: '%', width, height, x, y }
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>(); // Completed crop in pixels
    const [imageUrl, setImageUrl] = useState<string | null>(null); // Final URL from backend
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Effect to populate form fields & image URL on edit/reset
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setPointsCost(initialData.pointsCost ?? '');
            setImageUrl(initialData.imageUrl || null); // Set initial image URL
            // Reset crop/upload states when switching to edit mode
            setImgSrc('');
            setCrop(undefined);
            setCompletedCrop(undefined);
            setUploadError(null);
        } else {
            // Reset all for 'add' mode or if initialData is missing
            setName('');
            setDescription('');
            setPointsCost('');
            setImageUrl(null); // Reset image URL
            setImgSrc('');
            setCrop(undefined);
            setCompletedCrop(undefined);
            setUploadError(null);
        }
    }, [mode, initialData]);

    // Handle file selection
    const onSelectFile = (file: File | null) => {
        if (!file) {
            setImgSrc(''); // Clear preview if file is removed
            setCrop(undefined);
            setCompletedCrop(undefined);
            return;
        }
        setCrop(undefined); // Reset crop on new file selection
        setCompletedCrop(undefined);
        setUploadError(null); // Clear previous upload errors
        setImageUrl(null); // Clear previous final URL if new file is selected

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const imageDataUrl = reader.result?.toString() || '';
            setImgSrc(imageDataUrl); // Show preview in ReactCrop
        });
        reader.readAsDataURL(file);
    };

    // Center the initial crop area when the image loads
    const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
        const { width, height, naturalWidth, naturalHeight } = e.currentTarget;

        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
            // Optional: Show error if image is too small
            setUploadError(`La imagen es demasiado pequeña. Debe ser al menos ${MIN_DIMENSION}x${MIN_DIMENSION} píxeles.`);
            setImgSrc(''); // Clear the preview
            return;
        }

        const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: cropWidthInPercent,
                },
                ASPECT_RATIO,
                width,
                height
            ),
            width,
            height
        );
        setCrop(crop);
    };

    // Handle the crop confirmation and upload
    const handleConfirmCropAndUpload = async () => {
        if (!imgRef.current || !previewCanvasRef.current || !completedCrop) {
            setUploadError('Selección de recorte o imagen no válida.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // Draw cropped image onto hidden canvas
            await canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);

            // Get Blob from canvas
            const blob = await canvasToBlob(previewCanvasRef.current, 'image/png', 0.9); // Use PNG

            if (!blob) {
                throw new Error('No se pudo crear el archivo de imagen recortada.');
            }

            // Create FormData and append the blob
            const formData = new FormData();
            formData.append('imageFile', blob, `reward-crop-${Date.now()}.png`); // Add a filename

            // Call backend upload endpoint
            const response = await axiosInstance.post<{ imageUrl: string }>('/admin/upload/reward-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data && response.data.imageUrl) {
                setImageUrl(response.data.imageUrl); // Save the final URL
                setImgSrc(''); // Clear the cropper preview
                setCrop(undefined);
                setCompletedCrop(undefined);
                notifications.show({
                    title: 'Éxito',
                    message: 'Imagen recortada y subida correctamente.',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                });
            } else {
                throw new Error('La API no devolvió una URL de imagen válida.');
            }

        } catch (err: any) {
            console.error('Error uploading cropped image:', err);
            const apiError = err.response?.data?.message || err.message || 'Error desconocido durante la subida.';
            setUploadError(`Error al subir: ${apiError}`);
            notifications.show({
                title: 'Error de Subida',
                message: `No se pudo subir la imagen: ${apiError}`,
                color: 'red',
                icon: <IconAlertCircle size={18} />,
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Handle the main form submission (Create/Update Reward)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Basic Validation (as before)
        if (!name.trim() || pointsCost === '' || pointsCost < 0) {
            notifications.show({
                title: 'Datos Inválidos',
                message: 'Por favor, rellena el nombre y un coste en puntos válido (0 o mayor).',
                color: 'orange', icon: <IconAlertCircle size={18} />,
            });
            return;
        }

        setIsSubmitting(true);

        const commonData = {
            name: name.trim(),
            description: description.trim() || null,
            pointsCost: Number(pointsCost),
            imageUrl: imageUrl, // <-- Include the uploaded image URL
        };

        try {
            let successMessage = '';
            if (mode === 'add') {
                await axiosInstance.post('/rewards', commonData);
                successMessage = t('adminRewardsPage.createSuccessMessage', { name: commonData.name });
            } else { // mode === 'edit'
                if (!rewardIdToUpdate) throw new Error("Falta el ID de la recompensa para actualizar.");
                 // For PATCH, only send changed fields + imageUrl if it changed or exists
                 // For simplicity now, we send all using PUT (can be optimized later if needed)
                await axiosInstance.put(`/rewards/${rewardIdToUpdate}`, commonData);
                successMessage = t('adminRewardsPage.updateSuccessMessage', { name: commonData.name });
            }

            notifications.show({
                title: 'Éxito', message: successMessage, color: 'green',
                icon: <IconCheck size={18} />, autoClose: 4000,
            });
            onSubmitSuccess(); // Call parent callback

        } catch (err: any) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} reward:`, err);
            const actionText = mode === 'add' ? 'añadir' : 'actualizar';
            const errorMessage = `Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
            notifications.show({
                title: 'Error', message: errorMessage, color: 'red',
                icon: <IconX size={18} />, autoClose: 6000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitButtonText = mode === 'add' ? t('adminRewardsPage.addButton') : t('common.save'); // Use 'Save' for edit mode

    // Determine image source for display
    const displayImageUrl = imgSrc || imageUrl || (mode === 'edit' && initialData?.imageUrl) || null;
    const showCropper = !!imgSrc && !imageUrl; // Show cropper only when a file is selected AND before upload succeeds

    return (
        // We need two forms or separate submit logic because upload needs FormData,
        // while reward create/update needs JSON. Let's use separate buttons.
        <Stack gap="md">
            {/* Reward Details Form */}
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <TextInput
                        label={t('component.rewardForm.nameLabel')}
                        placeholder={t('component.rewardForm.namePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        required
                        disabled={isSubmitting}
                        radius="lg"
                    />
                    <Textarea
                        label={t('component.rewardForm.descriptionLabel')}
                        placeholder={t('component.rewardForm.descriptionPlaceholder')}
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        rows={3}
                        disabled={isSubmitting}
                        radius="lg"
                    />
                    <NumberInput
                        label={t('component.rewardForm.pointsCostLabel')}
                        placeholder={t('component.rewardForm.pointsCostPlaceholder')}
                        value={pointsCost}
                        onChange={(value) => setPointsCost(typeof value === 'number' ? value : '')}
                        min={0}
                        step={1}
                        allowDecimal={false}
                        required
                        disabled={isSubmitting}
                        radius="lg"
                    />

                    {/* Image Section */}
                    <Stack gap="xs" mt="sm">
                        <Text fw={500} size="sm">Imagen de la Recompensa:</Text>
                        {displayImageUrl && !showCropper && (
                             <AspectRatio ratio={1 / 1} maw={200}>
                                <Image
                                    src={displayImageUrl}
                                    alt={`Preview ${name || 'recompensa'}`}
                                    radius="md"
                                    fallbackSrc="/placeholder-reward.png" // Ensure this exists in /public
                                />
                            </AspectRatio>
                        )}
                         {/* Placeholder if no image selected/uploaded */}
                         {!displayImageUrl && !showCropper && (
                             <AspectRatio ratio={1 / 1} maw={200}>
                                <Center bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                                    <IconPhoto size={48} color="var(--mantine-color-gray-5)" stroke={1.5} />
                                </Center>
                            </AspectRatio>
                         )}
                        <Group gap="sm">
                            <FileInput
                                placeholder="Seleccionar imagen..."
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={onSelectFile}
                                leftSection={<IconUpload size={16} />}
                                clearable // Allow removing the selected file
                                disabled={isSubmitting || isUploading}
                                style={{ flexGrow: 1 }}
                            />
                             {/* Optional Camera Button */}
                             <Button
                                variant="outline"
                                disabled
                                leftSection={<IconCamera size={16} />}
                                title="Usar cámara (Próximamente)" // Placeholder title
                            >
                                Cámara
                            </Button>
                        </Group>
                        {/* Image Cropper */}
                        {showCropper && (
                            <Box mt="md">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={ASPECT_RATIO}
                                    minWidth={MIN_DIMENSION}
                                    minHeight={MIN_DIMENSION}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        ref={imgRef}
                                        alt="Crop preview"
                                        src={imgSrc}
                                        style={{ maxHeight: '400px' }} // Limit preview height
                                        onLoad={onImageLoad}
                                    />
                                </ReactCrop>
                                <Button
                                    mt="sm"
                                    onClick={handleConfirmCropAndUpload}
                                    loading={isUploading}
                                    disabled={!completedCrop || isUploading || isSubmitting}
                                    leftSection={<IconCheck size={16} />}
                                >
                                    Confirmar Recorte y Subir
                                </Button>
                                 {/* Hidden canvas for preview generation */}
                                 <canvas
                                    ref={previewCanvasRef}
                                    style={{
                                        display: 'none', // Keep hidden
                                        border: '1px solid black',
                                        objectFit: 'contain',
                                        width: completedCrop?.width ?? 0,
                                        height: completedCrop?.height ?? 0,
                                    }}
                                />
                            </Box>
                        )}
                        {uploadError && (
                            <Alert title="Error de Imagen" color="red" icon={<IconAlertCircle size={16} />} mt="sm">
                                {uploadError}
                            </Alert>
                        )}
                    </Stack>
                    {/* End Image Section */}

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onCancel} disabled={isSubmitting || isUploading} radius="lg">
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" loading={isSubmitting} radius="lg" disabled={isUploading}>
                            {submitButtonText}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
};

export default RewardForm;