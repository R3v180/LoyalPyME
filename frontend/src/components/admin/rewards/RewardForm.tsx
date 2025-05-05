// filename: frontend/src/components/admin/rewards/RewardForm.tsx
// Version: 2.1.0 (Adapt useState form for i18n Reward fields)

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

// --- IMPORTAR TIPO REWARD ACTUALIZADO ---
import type { Reward } from '../../../types/customer'; // Importar tipo con name_es/en etc.


// Props del componente ACTUALIZADAS
interface RewardFormProps {
    mode: 'add' | 'edit';
    initialData?: Reward | null; // <-- Ahora espera el tipo Reward con name_es/en
    rewardIdToUpdate?: string | null;
    onSubmitSuccess: () => void; // Simplificado para no devolver la recompensa
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

    // --- ESTADOS DEL FORMULARIO ACTUALIZADOS ---
    // const [name, setName] = useState<string>(''); // Eliminado
    // const [description, setDescription] = useState<string>(''); // Eliminado
    const [name_es, setNameEs] = useState<string>(''); // Nuevo
    const [name_en, setNameEn] = useState<string>(''); // Nuevo
    const [description_es, setDescriptionEs] = useState<string>(''); // Nuevo
    const [description_en, setDescriptionEn] = useState<string>(''); // Nuevo
    const [pointsCost, setPointsCost] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    // --- FIN ESTADOS FORMULARIO ---

    // Estado de Imagen/Crop (sin cambios)
    const [imgSrc, setImgSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // --- useEffect ACTUALIZADO ---
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            // Usar nuevos campos de initialData
            setNameEs(initialData.name_es || '');
            setNameEn(initialData.name_en || '');
            setDescriptionEs(initialData.description_es || '');
            setDescriptionEn(initialData.description_en || '');
            setPointsCost(initialData.pointsCost ?? '');
            setImageUrl(initialData.imageUrl || null);
            setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined); setUploadError(null);
        } else {
            // Resetear nuevos campos
            setNameEs(''); setNameEn(''); setDescriptionEs(''); setDescriptionEn('');
            setPointsCost(''); setImageUrl(null); setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined); setUploadError(null);
        }
    }, [mode, initialData]);
    // --- FIN useEffect ---

    // Handle file selection (sin cambios)
    const onSelectFile = (file: File | null) => { /* ... (sin cambios) ... */ if (!file) { setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined); return; } setCrop(undefined); setCompletedCrop(undefined); setUploadError(null); setImageUrl(null); const reader = new FileReader(); reader.addEventListener('load', () => { const imageDataUrl = reader.result?.toString() || ''; setImgSrc(imageDataUrl); }); reader.readAsDataURL(file); };
    // onImageLoad (sin cambios)
    const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => { /* ... (sin cambios) ... */ const { width, height, naturalWidth, naturalHeight } = e.currentTarget; if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) { setUploadError(`La imagen es demasiado pequeña. Debe ser al menos ${MIN_DIMENSION}x${MIN_DIMENSION} píxeles.`); setImgSrc(''); return; } const cropWidthInPercent = (MIN_DIMENSION / width) * 100; const crop = centerCrop( makeAspectCrop( { unit: '%', width: cropWidthInPercent, }, ASPECT_RATIO, width, height ), width, height ); setCrop(crop); };

    // --- handleConfirmCropAndUpload ACTUALIZADO ---
    // Cambiar endpoint de subida si es necesario
    const handleConfirmCropAndUpload = async () => {
        if (!imgRef.current || !previewCanvasRef.current || !completedCrop) { setUploadError('Selección de recorte o imagen no válida.'); return; }
        setIsUploading(true); setUploadError(null);
        try {
            await canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
            const blob = await canvasToBlob(previewCanvasRef.current, 'image/png', 0.9);
            if (!blob) { throw new Error('No se pudo crear el archivo de imagen recortada.'); }
            const formData = new FormData();
            // --- CAMBIAR 'imageFile' por 'image' si coincide con tu backend/Multer ---
            formData.append('image', blob, `reward-crop-${Date.now()}.png`);

            // --- CAMBIAR endpoint si es necesario ---
            // const response = await axiosInstance.post<{ imageUrl: string }>('/admin/upload/reward-image', formData, {
            const response = await axiosInstance.post<{ url: string }>('/uploads/image', formData, { // Usando endpoint genérico
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // --- Asumiendo que la respuesta devuelve { url: '...' } ---
            // if (response.data && response.data.imageUrl) {
            //    setImageUrl(response.data.imageUrl);
            if (response.data && response.data.url) { // Usando .url
               setImageUrl(response.data.url); // Guardar URL final
            // --- FIN CAMBIO ---
               setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined);
               notifications.show({ title: 'Éxito', message: 'Imagen recortada y subida correctamente.', color: 'green', icon: <IconCheck size={18} />, });
            } else { throw new Error('La API no devolvió una URL de imagen válida.'); }
        } catch (err: any) { console.error('Error uploading cropped image:', err); const apiError = err.response?.data?.message || err.message || 'Error desconocido durante la subida.'; setUploadError(`Error al subir: ${apiError}`); notifications.show({ title: 'Error de Subida', message: `No se pudo subir la imagen: ${apiError}`, color: 'red', icon: <IconAlertCircle size={18} />, });
        } finally { setIsUploading(false); }
    };
     // --- FIN handleConfirmCropAndUpload ---

    // --- handleSubmit ACTUALIZADO ---
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Validación actualizada
        if (!name_es.trim() || !name_en.trim() || pointsCost === '' || pointsCost < 0) {
            notifications.show({
                title: t('component.rewardForm.errorInvalidDataTitle', 'Datos Inválidos'), // TODO: i18n
                message: t('component.rewardForm.errorInvalidDataMsg', 'Por favor, rellena los nombres en ambos idiomas y un coste en puntos válido (0 o mayor).'), // TODO: i18n
                color: 'orange', icon: <IconAlertCircle size={18} />,
            });
            return;
        }

        setIsSubmitting(true);

        // Payload actualizado con campos i18n
        const payload = {
            name_es: name_es.trim(),
            name_en: name_en.trim(),
            description_es: description_es.trim() || null,
            description_en: description_en.trim() || null,
            pointsCost: Number(pointsCost),
            imageUrl: imageUrl,
        };

        try {
            let successMessage = '';
            let savedReward: Reward | null = null; // Para obtener la recompensa guardada

            if (mode === 'add') {
                const response = await axiosInstance.post<Reward>('/rewards', payload);
                savedReward = response.data;
                successMessage = t('adminCommon.createSuccess');
            } else { // mode === 'edit'
                if (!rewardIdToUpdate) throw new Error("Falta el ID de la recompensa para actualizar.");
                // Usar PATCH para enviar solo los campos modificados sería mejor,
                // pero requiere más lógica si no se usa Mantine Form.
                // Por ahora usamos PUT que reemplaza todo (asegúrate que el backend lo soporte o cambie a PATCH).
                 const response = await axiosInstance.patch<Reward>(`/rewards/${rewardIdToUpdate}`, payload); // Cambiado a PATCH
                // const response = await axiosInstance.put<Reward>(`/rewards/${rewardIdToUpdate}`, payload);
                savedReward = response.data;
                successMessage = t('adminCommon.updateSuccess');
            }

            const displayName = savedReward?.name_es || savedReward?.name_en || '';
            notifications.show({
                title: successMessage,
                message: `Recompensa "${displayName}" guardada.`, // TODO: i18n
                color: 'green', icon: <IconCheck size={18} />, autoClose: 4000,
            });
            onSubmitSuccess(); // Llamar al callback de éxito

        } catch (err: any) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} reward:`, err);
            const actionText = mode === 'add' ? 'añadir' : 'actualizar';
            const errorMessage = `Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
            notifications.show({ title: t('common.error'), message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 });
        } finally {
            setIsSubmitting(false);
        }
    };
     // --- FIN handleSubmit ---

    const submitButtonText = mode === 'add' ? t('adminRewardsPage.addButton') : t('common.save');
    const displayImageUrl = imgSrc || imageUrl || (mode === 'edit' && initialData?.imageUrl) || null;
    const showCropper = !!imgSrc && !imageUrl;

    return (
        <Stack gap="md">
            {/* Formulario de Detalles */}
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    {/* --- CAMPOS ACTUALIZADOS --- */}
                     <TextInput
                        label={t('component.rewardForm.nameEsLabel', 'Nombre (ES)')}
                        placeholder={t('component.rewardForm.nameEsPlaceholder', 'Ej: Café Gratis')}
                        value={name_es}
                        onChange={(e) => setNameEs(e.currentTarget.value)}
                        required
                        disabled={isSubmitting}
                        radius="lg"
                    />
                     <TextInput
                        label={t('component.rewardForm.nameEnLabel', 'Nombre (EN)')}
                        placeholder={t('component.rewardForm.nameEnPlaceholder', 'E.g.: Free Coffee')}
                        value={name_en}
                        onChange={(e) => setNameEn(e.currentTarget.value)}
                        required
                        disabled={isSubmitting}
                        radius="lg"
                    />
                    <Textarea
                        label={t('component.rewardForm.descriptionEsLabel', 'Descripción (ES)')}
                        placeholder={t('component.rewardForm.descriptionEsPlaceholder', 'Ej: Un café espresso o americano')}
                        value={description_es}
                        onChange={(e) => setDescriptionEs(e.currentTarget.value)}
                        rows={3}
                        disabled={isSubmitting}
                        radius="lg"
                    />
                     <Textarea
                        label={t('component.rewardForm.descriptionEnLabel', 'Descripción (EN)')}
                        placeholder={t('component.rewardForm.descriptionEnPlaceholder', 'E.g.: One espresso or americano')}
                        value={description_en}
                        onChange={(e) => setDescriptionEn(e.currentTarget.value)}
                        rows={3}
                        disabled={isSubmitting}
                        radius="lg"
                    />
                    {/* --- FIN CAMPOS --- */}

                    <NumberInput
                        label={t('component.rewardForm.pointsCostLabel', 'Coste en Puntos:')}
                        placeholder={t('component.rewardForm.pointsCostPlaceholder', 'Ej: 100')}
                        value={pointsCost}
                        onChange={(value) => setPointsCost(typeof value === 'number' ? value : '')}
                        min={0}
                        step={1}
                        allowDecimal={false}
                        required
                        disabled={isSubmitting}
                        radius="lg"
                    />

                    {/* Sección Imagen (sin cambios funcionales) */}
                    <Stack gap="xs" mt="sm">
                         <Text fw={500} size="sm">{t('component.rewardForm.imageLabel', 'Imagen (1:1, Opcional)')}</Text>
                         {displayImageUrl && !showCropper && ( <AspectRatio ratio={1 / 1} maw={200}> <MantineImage src={displayImageUrl} alt={`Preview ${name_es || name_en || 'recompensa'}`} radius="md" fallbackSrc="/placeholder-reward.png" /> </AspectRatio> )}
                         {!displayImageUrl && !showCropper && ( <AspectRatio ratio={1 / 1} maw={200}> <Center bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)' }}> <IconPhoto size={48} color="var(--mantine-color-gray-5)" stroke={1.5} /> </Center> </AspectRatio> )}
                         <Group gap="sm">
                             <FileInput placeholder="Seleccionar imagen..." accept="image/png,image/jpeg,image/webp,image/gif" onChange={onSelectFile} leftSection={<IconUpload size={16} />} clearable disabled={isSubmitting || isUploading} style={{ flexGrow: 1 }} />
                             <Button variant="outline" disabled leftSection={<IconCamera size={16} />} title="Usar cámara (Próximamente)"> Cámara </Button>
                         </Group>
                         {showCropper && (
                            <Box mt="md">
                                <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={ASPECT_RATIO} minWidth={MIN_DIMENSION} minHeight={MIN_DIMENSION} >
                                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                     <img ref={imgRef} src={imgSrc} style={{ maxHeight: '400px' }} onLoad={onImageLoad} />
                                </ReactCrop>
                                <Button mt="sm" onClick={handleConfirmCropAndUpload} loading={isUploading} disabled={!completedCrop || isUploading || isSubmitting} leftSection={<IconCheck size={16} />} >
                                     {t('component.rewardForm.confirmCropButton', 'Confirmar Recorte y Subir')} {/* TODO: i18n */}
                                 </Button>
                                <canvas ref={previewCanvasRef} style={{ display: 'none', border: '1px solid black', objectFit: 'contain', width: completedCrop?.width ?? 0, height: completedCrop?.height ?? 0, }}/>
                             </Box>
                         )}
                        {uploadError && ( <Alert title="Error de Imagen" color="red" icon={<IconAlertCircle size={16} />} mt="sm">{uploadError}</Alert> )}
                    </Stack>
                    {/* Fin Sección Imagen */}

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onCancel} disabled={isSubmitting || isUploading} radius="lg"> {t('common.cancel')} </Button>
                        <Button type="submit" loading={isSubmitting} radius="lg" disabled={isUploading}> {submitButtonText} </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
};

export default RewardForm;