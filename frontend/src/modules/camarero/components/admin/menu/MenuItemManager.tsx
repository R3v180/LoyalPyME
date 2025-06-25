// frontend/src/components/admin/camarero/menu/MenuItemManager.tsx
// Version 1.0.1 (Remove unused categoryName prop)

import React, { useState } from 'react';
import {
    Box, Button, Text, Stack, Group, Loader, Alert,
    Table, ActionIcon, Badge, Tooltip,
    Image as MantineImage, AspectRatio, Center,
} from '@mantine/core';
import {
    IconPlus, IconAlertCircle, IconPencil, IconTrash, IconPhoto,
    IconPlayerPlay, IconPlayerStop, IconFileDescription
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useModals } from '@mantine/modals';
import { notifications } from '@mantine/notifications'; // Añadido para handleManageModifiers

import { useAdminMenuItems } from '../../../hooks/useAdminMenuItems';
import { MenuItemData, MenuItemFormData } from '../../../types/menu.types';
import MenuItemFormModal from './MenuItemFormModal';

interface MenuItemManagerProps {
    categoryId: string;
    // categoryName: string; // <-- PROP ELIMINADA
}

// --- CORRECCIÓN: Quitar categoryName de la desestructuración ---
const MenuItemManager: React.FC<MenuItemManagerProps> = ({ categoryId /*, categoryName*/ }) => {
    const { t, i18n } = useTranslation();
    const modals = useModals();
    const currentLanguage = i18n.language;

    const {
        items,
        loading: loadingItems,
        error: errorItems,
        addItem,
        updateItem,
        deleteItem,
    } = useAdminMenuItems(categoryId);

    const [itemModalOpened, setItemModalOpened] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
    const [isSubmittingItemForm, setIsSubmittingItemForm] = useState(false);
    const [isUpdatingItemStatusId, setIsUpdatingItemStatusId] = useState<string | null>(null);
    const [isDeletingItemId, setIsDeletingItemId] = useState<string | null>(null);

    const handleOpenAddItemModal = () => {
        setEditingItem(null);
        setItemModalOpened(true);
    };

    const handleOpenEditItemModal = (item: MenuItemData) => {
        setEditingItem(item);
        setItemModalOpened(true);
    };

    const handleCloseItemModal = () => {
        setItemModalOpened(false);
        setEditingItem(null);
    };

    const handleSubmitItemForm = async (formData: MenuItemFormData) => {
        setIsSubmittingItemForm(true);
        let success = false;
        if (editingItem) {
            const result = await updateItem(editingItem.id, formData);
            if (result) success = true;
        } else {
            const result = await addItem(formData);
            if (result) success = true;
        }
        if (success) {
            handleCloseItemModal();
        }
        setIsSubmittingItemForm(false);
    };

    const handleToggleItemAvailable = async (item: MenuItemData) => {
        setIsUpdatingItemStatusId(item.id);
        const newStatus = !item.isAvailable;
        try {
            // Asegurarse de que solo se envía el campo que se quiere actualizar
            await updateItem(item.id, { isAvailable: newStatus });
        } catch (error) {
            console.error(`Error toggling availability for item ${item.id}:`, error);
            // La notificación de error ya la maneja el hook si ocurre
        } finally {
            setIsUpdatingItemStatusId(null);
        }
    };

    const handleDeleteItemClick = (item: MenuItemData) => {
        const itemName = (currentLanguage === 'es' && item.name_es) ? item.name_es : (item.name_en || item.name_es || t('adminCamarero.manageMenu.itemFallbackName'));
        modals.openConfirmModal({
            title: t('adminCommon.confirmDeleteTitle'),
            centered: true,
            children: ( <Text size="sm"> {t('adminCommon.confirmDeleteMessage')}{' '} {t('adminCamarero.manageMenu.itemLabel')}: <strong>"{itemName}"</strong>? </Text> ),
            labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                setIsDeletingItemId(item.id);
                await deleteItem(item.id); // El hook maneja la notificación
                setIsDeletingItemId(null);
            },
        });
    };
    
    const handleManageModifiers = (item: MenuItemData) => {
        const itemName = (currentLanguage === 'es' && item.name_es) ? item.name_es : (item.name_en || item.name_es || t('adminCamarero.manageMenu.itemFallbackName'));
        // Implementación real para abrir el modal de modificadores
        // Esto es solo un placeholder:
        notifications.show({
             title: t('common.upcomingFeatureTitle'),
             message: `${t('adminCamarero.manageMenu.manageModifiersTooltip')} para: ${itemName} (ID: ${item.id})`,
             color: 'blue'
        });
        console.log("Abrir modal de modificadores para el ítem:", item.id, itemName);
    };


    const rows = items.map((item) => {
        const displayName = (currentLanguage === 'es' && item.name_es) ? item.name_es : (item.name_en || item.name_es || t('common.nameNotAvailable'));
        const isLoadingThisRowStatus = isUpdatingItemStatusId === item.id;
        const isLoadingThisRowDelete = isDeletingItemId === item.id;
        const disableActions = isSubmittingItemForm || !!isDeletingItemId || !!isUpdatingItemStatusId;
        const itemAvailabilityText = item.isAvailable ? t('adminCamarero.manageMenu.itemAvailable') : t('adminCamarero.manageMenu.itemNotAvailable');
        const tooltipToggleAvailable = item.isAvailable ? t('adminCamarero.manageMenu.markNotAvailable') : t('adminCamarero.manageMenu.markAvailable');

        return (
            <Table.Tr key={item.id}>
                <Table.Td>
                    <AspectRatio ratio={1 / 1} w={50}>
                        {item.imageUrl ? ( <MantineImage src={item.imageUrl} alt={displayName} radius="xs" fit="cover" fallbackSrc="/placeholder-item.png" /> )
                         : ( <Center bg="gray.1" h="100%" style={{ borderRadius: 'var(--mantine-radius-xs)' }}> <IconPhoto size={20} color="var(--mantine-color-gray-5)" /> </Center> )}
                    </AspectRatio>
                </Table.Td>
                <Table.Td>
                    <Text fw={500}>{displayName}</Text>
                    {displayName !== item.name_es && item.name_es && <Text size="xs" c="dimmed">ES: {item.name_es}</Text>}
                    {displayName !== item.name_en && item.name_en && <Text size="xs" c="dimmed">EN: {item.name_en}</Text>}
                </Table.Td>
                <Table.Td ta="right">{Number(item.price).toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}</Table.Td>
                <Table.Td>{item.position}</Table.Td>
                <Table.Td>
                    <Badge color={item.isAvailable ? 'green' : 'gray'} variant="light">
                        {itemAvailabilityText}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('adminCamarero.manageMenu.manageModifiersTooltip')} withArrow position="top">
                            <Box>
                                <ActionIcon variant="subtle" color="violet" onClick={() => handleManageModifiers(item)} disabled={disableActions || isLoadingThisRowStatus || isLoadingThisRowDelete}>
                                    <IconFileDescription size={16} />
                                </ActionIcon>
                            </Box>
                        </Tooltip>
                        <Tooltip label={t('common.edit')} withArrow position="top">
                            <Box>
                                <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEditItemModal(item)} disabled={disableActions || isLoadingThisRowStatus || isLoadingThisRowDelete} >
                                    <IconPencil size={16} />
                                </ActionIcon>
                            </Box>
                        </Tooltip>
                        <Tooltip label={tooltipToggleAvailable} withArrow position="top" >
                           <Box>
                                <ActionIcon
                                    variant="subtle"
                                    color={item.isAvailable ? "orange" : "teal"}
                                    onClick={() => handleToggleItemAvailable(item)}
                                    loading={isLoadingThisRowStatus}
                                    disabled={disableActions || isLoadingThisRowDelete || (isUpdatingItemStatusId !== null && isUpdatingItemStatusId !== item.id)}
                                >
                                    {item.isAvailable ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
                                </ActionIcon>
                            </Box>
                        </Tooltip>
                        <Tooltip label={t('common.delete')} withArrow position="top">
                            <Box>
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleDeleteItemClick(item)}
                                    loading={isLoadingThisRowDelete}
                                    disabled={disableActions || isLoadingThisRowStatus || (isDeletingItemId !== null && isDeletingItemId !== item.id)}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Box>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Stack gap="md" mt="lg">
            <Group justify="space-between">
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleOpenAddItemModal}
                    disabled={loadingItems || isSubmittingItemForm || !!isDeletingItemId || !!isUpdatingItemStatusId}
                >
                    {t('common.add')} {t('adminCamarero.manageMenu.itemLabel')}
                </Button>
            </Group>

            {loadingItems && <Group justify="center" mt="xl"><Loader /></Group>}
            {errorItems && !loadingItems && (
                <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{errorItems}</Alert>
            )}

            {!loadingItems && !errorItems && items.length === 0 && (
                <Text c="dimmed" ta="center" mt="md">
                    {t('adminCamarero.manageMenu.noItemsInCategory')}
                </Text>
            )}

            {!loadingItems && !errorItems && items.length > 0 && (
                <Table.ScrollContainer minWidth={700}>
                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{width: '70px'}}>{t('adminCamarero.manageMenu.itemImageLabel')}</Table.Th>
                                <Table.Th>{t('common.name')}</Table.Th>
                                <Table.Th ta="right">{t('adminCamarero.manageMenu.itemPrice')}</Table.Th>
                                <Table.Th>{t('adminCamarero.manageMenu.itemPosition')}</Table.Th>
                                <Table.Th>{t('adminCamarero.manageMenu.itemAvailability')}</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>{t('common.actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            )}

            {categoryId && ( // categoryId existe porque es una prop requerida
                 <MenuItemFormModal
                    opened={itemModalOpened}
                    onClose={handleCloseItemModal}
                    onSubmit={handleSubmitItemForm}
                    initialData={editingItem}
                    isSubmitting={isSubmittingItemForm}
                    categoryId={categoryId}
                />
            )}
        </Stack>
    );
};

export default MenuItemManager;