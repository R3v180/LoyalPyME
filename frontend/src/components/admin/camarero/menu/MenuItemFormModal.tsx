// frontend/src/components/admin/camarero/menu/MenuItemFormModal.tsx
import React, { useEffect, useState, useRef, SyntheticEvent } from 'react';
import {
    Modal, TextInput, Textarea, NumberInput, Switch, Button, Group, Stack, FileInput,
    AspectRatio, Image as MantineImage, Center, Text as MantineText,
    Alert, Box, MultiSelect, NativeScrollArea // <--- NativeScrollArea importado
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { IconDeviceFloppy, IconUpload, IconPhoto, IconX, IconCheck, IconAlertCircle, IconCurrencyEuro } from '@tabler/icons-react';
import { MenuItemData, MenuItemFormData } from '../../../../types/menu.types';
import axiosInstance from '../../../../services/axiosInstance';
import { notifications } from '@mantine/notifications';

import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview, canvasToBlob } from '../../../../utils/canvasPreview'; 

const ASPECT_RATIO_ITEM = 1; 
const MIN_DIMENSION_ITEM = 150; 

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
    preparationTime: z.number().min(0).nullable().optional(),
    calories: z.number().min(0).nullable().optional(),
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
    // categoryId, // No se usa directamente en el form
}) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const form = useForm<ItemFormValues>({
        initialValues: {
            name_es: '', name_en: null, description_es: null, description_en: null,
            price: 0, imageUrl: null, allergens: [], tags: [],
            isAvailable: true, position: 0, preparationTime: null, calories: null,
            kdsDestination: null, sku: null,
        },
        validate: zodResolver(createItemFormSchema(t)),
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
                    name_es: initialData.name_es,
                    name_en: initialData.name_en || null,
                    description_es: initialData.description_es || null,
                    description_en: initialData.description_en || null,
                    price: initialData.price, 
                    imageUrl: initialData.imageUrl || null,
                    allergens: initialData.allergens || [],
                    tags: initialData.tags || [],
                    isAvailable: initialData.isAvailable,
                    position: initialData.position,
                    preparationTime: initialData.preparationTime || null,
                    calories: initialData.calories || null,
                    kdsDestination: initialData.kdsDestination || null,
                    sku: initialData.sku || null,
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
        if (naturalWidth < MIN_DIMENSION_ITEM || naturalHeight < MIN_DIMENSION_ITEM) {
            setUploadError(t('component.rewardForm.errorImageTooSmall', { minSize: MIN_DIMENSION_ITEM }));
            setImgSrcForCropper(''); return;
        }
        const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, ASPECT_RATIO_ITEM, width, height), width, height);
        setCrop(newCrop);
        
        const imageAspectRatio = naturalWidth / naturalHeight;
        let initialCropWidthPx, initialCropHeightPx;

        if (imageAspectRatio > ASPECT_RATIO_ITEM) { 
            initialCropHeightPx = naturalHeight * 0.9; 
            initialCropWidthPx = initialCropHeightPx * ASPECT_RATIO_ITEM;
        } else { 
            initialCropWidthPx = naturalWidth * 0.9; 
            initialCropHeightPx = initialCropWidthPx / ASPECT_RATIO_ITEM;
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
            setUploadError('Recorte o imagen no válida.'); return;
        }
        setIsUploadingImage(true); setUploadError(null);
        try {
            await canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
            const blob = await canvasToBlob(previewCanvasRef.current);
            if (!blob) { throw new Error('No se pudo crear el archivo de imagen recortada.'); }
            const formData = new FormData();
            formData.append('image', blob, `item-crop-${Date.now()}.png`);
            const response = await axiosInstance.post<{ url: string }>('/uploads/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (response.data && response.data.url) {
               form.setFieldValue('imageUrl', response.data.url);
               notifications.show({ title: t('common.success'), message: t('component.rewardForm.imageUploadSuccess'), color: 'green', icon: <IconCheck /> });
               setImgSrcForCropper(''); setImageFile(null);
            } else { throw new Error('La API no devolvió una URL válida.'); }
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || 'Error subiendo imagen.';
            setUploadError(`Error al subir: ${apiError}`);
            notifications.show({ title: t('common.error'), message: t('component.rewardForm.imageUploadError', {error: apiError}), color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleRemoveCurrentImageUrl = () => {
        form.setFieldValue('imageUrl', null); setImgSrcForCropper(''); setImageFile(null);
    };

    const handleSubmitForm = async (values: ItemFormValues) => {
        if (imgSrcForCropper && !values.imageUrl) {
            notifications.show({ title: t('common.info'), message: t('adminCamarero.manageMenu.pendingImageUpload'), color: 'yellow' });
            return;
        }
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
    
    const handleModalClose = () => { if (!isSubmitting && !isUploadingImage) { onClose(); } }
    const displayImageUrl = form.values.imageUrl;
    const showCropper = !!imgSrcForCropper;
    const cropInstructionsText = t('component.rewardForm.cropInstructions'); 

    const allergenOptions = ['GLUTEN', 'LACTOSE', 'NUTS', 'SOY', 'FISH', 'CRUSTACEANS', 'CELERY', 'MUSTARD', 'SESAME', 'SULPHITES', 'LUPIN', 'MOLLUSCS'];
    const tagOptions = ['VEGAN', 'VEGETARIAN', 'SPICY', 'NEW', 'POPULAR', 'HOUSE_SPECIAL'];

    // Extraer props para MultiSelect para claridad y evitar problemas de tipo con el spread
    const allergenInputProps = form.getInputProps('allergens');
    const tagInputProps = form.getInputProps('tags');

    return (
        <Modal
            opened={opened} onClose={handleModalClose}
            title={initialData ? t('adminCamarero.manageMenu.editItemTitle', 'Editar Ítem') : t('adminCamarero.manageMenu.addItemTitle', 'Añadir Nuevo Ítem')}
            centered size="xl" 
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            trapFocus closeOnClickOutside={!isSubmitting && !isUploadingImage} closeOnEscape={!isSubmitting && !isUploadingImage}
            scrollAreaComponent={NativeScrollArea} // <--- USAR NativeScrollArea importado
        >
            <form onSubmit={form.onSubmit(handleSubmitForm)}>
                <Stack gap="md">
                    <Group grow> 
                        <TextInput label={t('component.rewardForm.nameEsLabel')} placeholder={t('adminCamarero.manageMenu.itemNameEsPlaceholder', 'Ej: Hamburguesa Clásica')} required disabled={isSubmitting || isUploadingImage} {...form.getInputProps('name_es')} />
                        <TextInput label={t('component.rewardForm.nameEnLabel')} placeholder={t('adminCamarero.manageMenu.itemNameEnPlaceholder', 'Ej: Classic Burger')} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('name_en')} />
                    </Group>
                    <Textarea label={t('component.rewardForm.descriptionEsLabel')} placeholder={t('adminCamarero.manageMenu.itemDescEsPlaceholder', 'Descripción detallada en español...')} rows={3} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('description_es')} />
                    <Textarea label={t('component.rewardForm.descriptionEnLabel')} placeholder={t('adminCamarero.manageMenu.itemDescEnPlaceholder', 'Detailed description in English...')} rows={3} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('description_en')} />
                    
                    <NumberInput
                        label={t('adminCamarero.manageMenu.itemPrice', 'Precio')}
                        placeholder="0.00"
                        required
                        min={0}
                        step={0.01} 
                        decimalScale={2}
                        fixedDecimalScale
                        leftSection={<IconCurrencyEuro size={16} />}
                        disabled={isSubmitting || isUploadingImage}
                        {...form.getInputProps('price')}
                    />

                    <Stack gap="xs" mt="sm">
                        <MantineText fw={500} size="sm">{t('component.rewardForm.imageLabel')}</MantineText>
                        {!showCropper && ( <AspectRatio ratio={ASPECT_RATIO_ITEM} maw={200}><Center bg="gray.1" style={{borderRadius:'var(--mantine-radius-md)'}}>{displayImageUrl ? <MantineImage src={displayImageUrl} alt="Vista previa" radius="md" fallbackSrc="/placeholder-item.png"/> : <IconPhoto size={38} color="var(--mantine-color-gray-5)" stroke={1.5}/>}</Center></AspectRatio> )}
                        <Group><FileInput placeholder={t('component.rewardForm.selectImageButton')} accept="image/*" onChange={handleImageFileChange} leftSection={<IconUpload size={16}/>} clearable value={imageFile} disabled={isSubmitting || isUploadingImage || showCropper} style={{flexGrow:1}} /></Group>
                        {showCropper && ( <Box mt="md"> <MantineText size="sm" mb="xs">{cropInstructionsText}</MantineText> <ReactCrop crop={crop} onChange={(_,pC)=>setCrop(pC)} onComplete={c=>setCompletedCrop(c)} aspect={ASPECT_RATIO_ITEM} minWidth={MIN_DIMENSION_ITEM/5} minHeight={MIN_DIMENSION_ITEM/5/ASPECT_RATIO_ITEM}><img ref={imgRef} src={imgSrcForCropper} style={{maxHeight:'300px',display:imgSrcForCropper?'block':'none'}} onLoad={onImageLoadForCropper} alt="Recortar"/></ReactCrop> <Button mt="sm" onClick={handleConfirmCropAndUpload} loading={isUploadingImage} disabled={!completedCrop || isUploadingImage || isSubmitting || !imgSrcForCropper} leftSection={<IconCheck size={16}/>}>{t('component.rewardForm.confirmCropButton')}</Button> {completedCrop && completedCrop.width>0 && <canvas ref={previewCanvasRef} style={{display:'none',border:'1px solid black',objectFit:'contain',width:completedCrop.width,height:completedCrop.height}}/>} </Box> )}
                        {displayImageUrl && !showCropper && ( <Button variant="outline" color="red" size="xs" mt="xs" onClick={handleRemoveCurrentImageUrl} leftSection={<IconX size={14}/>} disabled={isSubmitting || isUploadingImage} style={{alignSelf:'flex-start'}}>{t('component.rewardForm.removeImageButton')}</Button> )}
                        {uploadError && ( <Alert title={t('common.error')} color="red" icon={<IconAlertCircle/>} mt="sm" withCloseButton onClose={()=>setUploadError(null)}><MantineText>{uploadError}</MantineText></Alert> )}
                    </Stack>

                    <MultiSelect
                        label={t('adminCamarero.manageMenu.itemAllergens', 'Alérgenos')}
                        placeholder={t('adminCamarero.manageMenu.itemAllergensPlaceholder', 'Selecciona o escribe alérgenos')}
                        data={allergenOptions} 
                        searchable
                        // @ts-expect-error creatable is a valid prop for Mantine v7 MultiSelect, but there might be a typing conflict.
                        creatable 
                        getCreateLabel={(query: string) => `+ Añadir "${query}"`} // query tipado como string
                        disabled={isSubmitting || isUploadingImage}
                        value={allergenInputProps.value}
                        onChange={allergenInputProps.onChange}
                        error={form.errors.allergens} // Acceder al error del formulario
                    />
                     <MultiSelect
                        label={t('adminCamarero.manageMenu.itemTags', 'Etiquetas')}
                        placeholder={t('adminCamarero.manageMenu.itemTagsPlaceholder', 'Selecciona o escribe etiquetas')}
                        data={tagOptions}
                        searchable
                        // @ts-expect-error creatable is a valid prop for Mantine v7 MultiSelect, but there might be a typing conflict.
                        creatable
                        getCreateLabel={(query: string) => `+ Añadir "${query}"`} // query tipado como string
                        disabled={isSubmitting || isUploadingImage}
                        value={tagInputProps.value}
                        onChange={tagInputProps.onChange}
                        error={form.errors.tags} // Acceder al error del formulario
                    />
                    <Group grow>
                        <NumberInput label={t('adminCamarero.manageMenu.itemPosition', 'Posición')} placeholder="0" min={0} step={1} allowDecimal={false} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('position')} />
                        <NumberInput label={t('adminCamarero.manageMenu.itemPrepTime', 'Tiempo Prep. (min)')} placeholder={t('common.optional')} min={0} step={1} allowDecimal={false} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('preparationTime')} />
                    </Group>
                     <Group grow>
                        <NumberInput label={t('adminCamarero.manageMenu.itemCalories', 'Calorías (kcal)')} placeholder={t('common.optional')} min={0} step={1} allowDecimal={false} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('calories')} />
                        <TextInput label={t('adminCamarero.manageMenu.itemSku', 'SKU / Ref.')} placeholder={t('common.optional')} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('sku')} />
                    </Group>
                    <TextInput label={t('adminCamarero.manageMenu.itemKds', 'Destino KDS')} placeholder={t('adminCamarero.manageMenu.itemKdsPlaceholder', 'Ej: Cocina, Barra')} description={t('adminCamarero.manageMenu.itemKdsDesc', 'Para sistemas de pantalla en cocina/barra (opcional)')} disabled={isSubmitting || isUploadingImage} {...form.getInputProps('kdsDestination')} />
                    <Switch label={t('adminCamarero.manageMenu.itemIsAvailable', 'Ítem Disponible')} description={t('adminCamarero.manageMenu.itemIsAvailableDesc', 'Si no está disponible, no se mostrará a los clientes.')} mt="sm" disabled={isSubmitting || isUploadingImage} {...form.getInputProps('isAvailable', { type: 'checkbox' })} />
                    
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={handleModalClose} disabled={isSubmitting || isUploadingImage}>{t('common.cancel')}</Button>
                        <Button type="submit" loading={isSubmitting} disabled={isSubmitting || isUploadingImage || !!(imgSrcForCropper && !form.values.imageUrl)} leftSection={<IconDeviceFloppy size={18} />} >
                            {initialData ? t('common.save') : t('common.add')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default MenuItemFormModal;