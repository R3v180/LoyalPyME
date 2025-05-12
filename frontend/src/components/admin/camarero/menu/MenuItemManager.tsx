// frontend/src/components/admin/camarero/menu/MenuItemManager.tsx
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

import { useAdminMenuItems } from '../../../../hooks/useAdminMenuItems';
import { MenuItemData, MenuItemFormData } from '../../../../types/menu.types';
// Placeholder para el futuro modal de ítems - Necesitaremos crearlo
// import MenuItemFormModal from './MenuItemFormModal';

interface MenuItemManagerProps {
    categoryId: string;
    categoryName: string; 
}

const MenuItemManager: React.FC<MenuItemManagerProps> = ({ categoryId, categoryName }) => {
    const { t, i18n } = useTranslation();
    const modals = useModals();
    const currentLanguage = i18n.language;

    const {
        items,
        loading: loadingItems,
        error: errorItems,
        // addItem, // Se usará con MenuItemFormModal
        updateItem,
        deleteItem,
    } = useAdminMenuItems(categoryId);

    // Estados para el futuro modal de ítems
    // const [itemModalOpened, setItemModalOpened] = useState(false); // Comentado hasta que exista MenuItemFormModal
    // const [editingItem, setEditingItem] = useState<MenuItemData | null>(null); // Comentado
    const [isSubmittingItemForm, setIsSubmittingItemForm] = useState(false); // Para deshabilitar botones mientras el form (futuro) envía
    
    const [isUpdatingItemStatusId, setIsUpdatingItemStatusId] = useState<string | null>(null);
    const [isDeletingItemId, setIsDeletingItemId] = useState<string | null>(null);

    console.log(`[MenuItemManager] Renderizando para Categoría ID: ${categoryId} ("${categoryName}"). Items: ${items.length}, Loading: ${loadingItems}`);

    const handleOpenAddItemModal = () => {
        // setEditingItem(null);
        // setItemModalOpened(true);
        alert(t('common.upcomingFeatureTitle') + " - Modal para añadir ítem AÚN NO IMPLEMENTADO");
    };

    const handleOpenEditItemModal = (item: MenuItemData) => {
        // setEditingItem(item);
        // setItemModalOpened(true);
        alert(t('common.upcomingFeatureTitle') + ` - Modal para editar ítem AÚN NO IMPLEMENTADO: ${item.name_es}`);
    };

    const handleToggleItemAvailable = async (item: MenuItemData) => {
        setIsUpdatingItemStatusId(item.id);
        const newStatus = !item.isAvailable;
        try {
            await updateItem(item.id, { isAvailable: newStatus });
            // Notificación de éxito ya está en el hook useAdminMenuItems
        } catch (error) {
            // Notificación de error ya está en el hook useAdminMenuItems
            console.error(`Error toggling availability for item ${item.id}:`, error);
        } finally {
            setIsUpdatingItemStatusId(null);
        }
    };

    const handleDeleteItemClick = (item: MenuItemData) => {
        const itemName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || `ID ${item.id}`;
        modals.openConfirmModal({
            title: t('adminCommon.confirmDeleteTitle'),
            centered: true,
            children: ( <Text size="sm"> {t('adminCommon.confirmDeleteMessage')}{' '} Ítem: <strong>"{itemName}"</strong>? </Text> ),
            labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                setIsDeletingItemId(item.id);
                await deleteItem(item.id); // Notificación de éxito/error en el hook
                setIsDeletingItemId(null);
            },
        });
    };
    
    const handleManageModifiers = (item: MenuItemData) => {
        alert(t('common.upcomingFeatureTitle') + ` - Gestionar Modificadores para: ${item.name_es}`);
    };


    const rows = items.map((item) => {
        const displayName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || 'N/A';
        const isLoadingThisRowStatus = isUpdatingItemStatusId === item.id;
        const isLoadingThisRowDelete = isDeletingItemId === item.id;
        const disableActions = isSubmittingItemForm || !!isDeletingItemId || !!isUpdatingItemStatusId;

        return (
            <Table.Tr key={item.id}>
                <Table.Td>
                    <AspectRatio ratio={1 / 1} w={50}>
                        {item.imageUrl ? ( <MantineImage src={item.imageUrl} alt={displayName} radius="xs" fit="cover" fallbackSrc="/placeholder-item.png" /> ) // Usar un placeholder diferente para ítems
                         : ( <Center bg="gray.1" h="100%" style={{ borderRadius: 'var(--mantine-radius-xs)' }}> <IconPhoto size={20} color="var(--mantine-color-gray-5)" /> </Center> )}
                    </AspectRatio>
                </Table.Td>
                <Table.Td>
                    <Text fw={500}>{displayName}</Text>
                    {displayName !== item.name_es && item.name_es && <Text size="xs" c="dimmed">ES: {item.name_es}</Text>}
                    {displayName !== item.name_en && item.name_en && <Text size="xs" c="dimmed">EN: {item.name_en}</Text>}
                </Table.Td>
                <Table.Td ta="right">{item.price.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}</Table.Td>
                <Table.Td>{item.position}</Table.Td>
                <Table.Td>
                    <Badge color={item.isAvailable ? 'green' : 'gray'} variant="light">
                        {item.isAvailable ? t('common.active', 'Disponible') : t('common.inactive', 'No Disponible')}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('adminCamarero.manageMenu.manageModifiersTooltip', "Gestionar Modificadores")} withArrow position="top">
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
                        <Tooltip label={item.isAvailable ? t('adminRewardsPage.tooltipDeactivate', 'Marcar No Disponible') : t('adminRewardsPage.tooltipActivate', 'Marcar Disponible')} withArrow position="top" >
                           <Box>
                                <ActionIcon variant="subtle" color={item.isAvailable ? 'orange' : 'teal'} onClick={() => handleToggleItemAvailable(item)} loading={isLoadingThisRowStatus} disabled={disableActions || isLoadingThisRowDelete || (isUpdatingItemStatusId !== null && isUpdatingItemStatusId !== item.id)} >
                                    {item.isAvailable ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
                                </ActionIcon>
                            </Box>
                        </Tooltip>
                        <Tooltip label={t('common.delete')} withArrow position="top">
                            <Box>
                                <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteItemClick(item)} loading={isLoadingThisRowDelete} disabled={disableActions || isLoadingThisRowStatus || (isDeletingItemId !== null && isDeletingItemId !== item.id)} >
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
                    {t('common.add')} {t('adminCamarero.manageMenu.item', 'Ítem')}
                </Button>
            </Group>

            {loadingItems && <Group justify="center" mt="xl"><Loader /></Group>}
            {errorItems && !loadingItems && (
                <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{errorItems}</Alert>
            )}

            {!loadingItems && !errorItems && items.length === 0 && (
                <Text c="dimmed" ta="center" mt="md">
                    {t('adminCamarero.manageMenu.noItemsInCategory', 'No hay ítems en esta categoría todavía.')}
                </Text>
            )}

            {!loadingItems && !errorItems && items.length > 0 && (
                <Table.ScrollContainer minWidth={700}>
                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{width: '70px'}}>{t('component.rewardForm.imageLabel')}</Table.Th> {/* Reutilizar clave */}
                                <Table.Th>{t('common.name')}</Table.Th>
                                <Table.Th ta="right">{t('adminCamarero.manageMenu.itemPrice', 'Precio')}</Table.Th> {/* Nueva clave */}
                                <Table.Th>{t('adminCamarero.manageMenu.itemPosition', 'Pos.')}</Table.Th> {/* Nueva clave */}
                                <Table.Th>{t('adminCamarero.manageMenu.itemAvailability', 'Disponibilidad')}</Table.Th> {/* Nueva clave */}
                                <Table.Th style={{ textAlign: 'right' }}>{t('common.actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            )}

            {/* 
            // Placeholder para el futuro MenuItemFormModal
            <MenuItemFormModal
                opened={itemModalOpened}
                onClose={() => { setItemModalOpened(false); setEditingItem(null); }}
                onSubmit={handleSubmitItemForm} // Definir esta función
                initialData={editingItem}
                isSubmitting={isSubmittingItemForm}
                categoryId={categoryId} // El modal necesitará el categoryId para la creación
            />
            */}
        </Stack>
    );
};

export default MenuItemManager;