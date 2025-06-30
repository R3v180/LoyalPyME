// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/profile/ProfileInfoForm.tsx
import React, { useEffect, useState, useRef, SyntheticEvent } from 'react';
import {
    Paper, Title, Stack, TextInput, Button, Group, Alert, LoadingOverlay, Box,
    Text as MantineText,
    Image as MantineImage
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { IconDeviceFloppy, IconCheck, IconX, IconAlertCircle, IconCrop, IconCameraRotate, IconPhoto } from '@tabler/icons-react';

import { UserData } from '../../../../../../../shared/types/user.types';
import axiosInstance from '../../../../../../../shared/services/axiosInstance';
import { canvasPreview, canvasToBlob } from '../../../../../../../shared/components/utils/canvasPreview';
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    type Crop,
    type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


const profileFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().optional(),
  phone: z.string().min(1, { message: t('common.requiredField') })
           .regex(/^\+\d{9,15}$/, { message: t('registerPage.errorPhoneFormat') }),
});
type ProfileFormValues = z.infer<ReturnType<typeof profileFormSchema>>;

interface ProfileInfoFormProps {
    userData: UserData | null;
    isLoading: boolean;
    error: string | null;
    onProfileUpdate: () => void;
}

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({ userData, isLoading, error, onProfileUpdate }) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const form = useForm<ProfileFormValues>({
        initialValues: { name: '', phone: '' },
        validate: zodResolver(profileFormSchema(t)),
    });

    useEffect(() => {
        if (userData) {
            form.setValues({
                name: userData.name || '',
                phone: userData.phone || '',
            });
            setPreviewImageUrl(userData.imageUrl || null);
            form.resetDirty();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData]);
    
    // --- CORRECCIÓN CLAVE ---
    // El botón se activa si (el formulario de texto está sucio) O (hay una nueva imagen para subir)
    const hasUnsavedChanges = form.isDirty() || imageBlob !== null;

    const handleSubmit = async (values: ProfileFormValues) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            
            if (form.isDirty('name')) formData.append('name', values.name || '');
            if (form.isDirty('phone')) formData.append('phone', values.phone || '');
            if (imageBlob) formData.append('profileImage', imageBlob, 'profile-image.jpg');

            if (!hasUnsavedChanges) {
                notifications.show({ title: t('common.info'), message: t('profileForm.noChanges'), color: 'blue' });
                setIsSubmitting(false);
                return;
            }
            
            await axiosInstance.put('/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            notifications.show({ title: t('common.success'), message: t('profileForm.updateSuccess'), color: 'green', icon: <IconCheck /> });
            onProfileUpdate();
            setImageBlob(null);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || t('profileForm.updateError');
            notifications.show({ title: t('common.error'), message: errorMsg, color: 'red', icon: <IconX /> });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Paper withBorder p="lg" radius="md" style={{ position: 'relative' }}>
            <LoadingOverlay visible={isLoading || isSubmitting} />
            <Title order={4}>Información Personal</Title>
            <MantineText size="sm" c="dimmed" mb="lg">Actualiza tus datos personales.</MantineText>

            {error && <Alert color="red" icon={<IconAlertCircle />}>{error}</Alert>}
            
            {userData && (
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <Box mx="auto" w={200}>
                            <ProfileImageUploader
                                currentImageUrl={previewImageUrl}
                                onCropComplete={(blob, previewUrl) => {
                                    setImageBlob(blob);
                                    setPreviewImageUrl(previewUrl);
                                }}
                                disabled={isSubmitting}
                            />
                        </Box>
                        
                        <TextInput label="Email" value={userData.email} disabled />
                        <TextInput label="Nombre Completo" placeholder="Tu nombre y apellidos" disabled={isSubmitting} {...form.getInputProps('name')} />
                        <TextInput label="Teléfono" placeholder="+34612345678" required disabled={isSubmitting} {...form.getInputProps('phone')} />

                        <Group justify="flex-end" mt="md">
                            <Button
                                type="submit"
                                loading={isSubmitting}
                                // --- CORRECCIÓN PRINCIPAL AQUÍ ---
                                disabled={!hasUnsavedChanges || !form.isValid() || isSubmitting}
                                leftSection={<IconDeviceFloppy size={18} />}
                            >
                                {t('common.saveChanges')}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            )}
        </Paper>
    );
};

// Componente de subida/recorte específico para este formulario
const ProfileImageUploader: React.FC<{
    currentImageUrl: string | null;
    onCropComplete: (blob: Blob | null, previewUrl: string | null) => void;
    disabled?: boolean;
}> = (props) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isConfirmingCrop, setIsConfirmingCrop] = useState(false);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            props.onCropComplete(null, props.currentImageUrl); // Limpiar blob pero mantener preview
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 100 }, 1, width, height), width, height);
        setCrop(newCrop);
    };

    const handleConfirmCrop = async () => {
        if (!imgRef.current || !completedCrop) return;
        setIsConfirmingCrop(true);
        try {
            const canvas = document.createElement('canvas');
            canvasPreview(imgRef.current, canvas, completedCrop, 1, 0, 150, 150);
            const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);
            const previewUrl = blob ? URL.createObjectURL(blob) : null;
            props.onCropComplete(blob, previewUrl);
            setImgSrc('');
        } catch (e) {
            console.error("Error creating blob from canvas", e);
        } finally {
            setIsConfirmingCrop(false);
        }
    };

    return (
        <Stack align="center">
            {imgSrc ? (
                <>
                    <ReactCrop
                        crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}
                        aspect={1} minWidth={50} minHeight={50} circularCrop >
                        <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '300px' }} />
                    </ReactCrop>
                    <Group justify="center" mt="xs">
                        <Button
                            size="xs" variant="outline" color="gray"
                            onClick={() => setImgSrc('')}
                            leftSection={<IconCameraRotate size={14}/>} disabled={props.disabled || isConfirmingCrop} >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            size="xs" onClick={handleConfirmCrop}
                            leftSection={<IconCrop size={14} />} loading={isConfirmingCrop} disabled={!completedCrop || props.disabled} >
                            {t('component.rewardForm.confirmCropButton')}
                        </Button>
                    </Group>
                </>
            ) : (
                <>
                    <MantineImage
                        radius="50%" h={150} w={150} fit="cover"
                        src={props.currentImageUrl || '/default-avatar.png'}
                        fallbackSrc="/default-avatar.png"
                    />
                    <input type="file" accept="image/*" onChange={onFileChange} style={{ marginTop: '10px' }} disabled={props.disabled} />
                </>
            )}
        </Stack>
    );
};

export default ProfileInfoForm;