// frontend/src/components/admin/camarero/menu/MenuCategoryManager.tsx
import React, { useState } from 'react';
import {
    Button,
    Text, 
    Stack,
    Group,
    Loader,
    Alert,
    Table,
    ActionIcon,
    Badge,
    Image as MantineImage,
    AspectRatio,
    Center,
    Tooltip,
    Box // <--- AÑADIDO Box
} from '@mantine/core';
import { IconPlus, IconAlertCircle, IconPencil, IconTrash, IconPhoto, IconPlayerPlay, IconPlayerStop, IconListDetails } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useModals } from '@mantine/modals';

import { useAdminMenuCategories } from '../../../hooks/useAdminMenuCategories';
import { MenuCategoryData, MenuCategoryFormData } from '../../../types/menu.types';
import MenuCategoryFormModal from './MenuCategoryFormModal';

interface MenuCategoryManagerProps {
    onSelectCategoryForItems: (category: MenuCategoryData) => void;
}

const MenuCategoryManager: React.FC<MenuCategoryManagerProps> = ({ onSelectCategoryForItems }) => {
    const { t, i18n } = useTranslation();
    const modals = useModals();
    const currentLanguage = i18n.language;

    const {
        categories,
        loading: loadingCategories,
        error: errorCategories,
        addCategory,
        updateCategory,
        deleteCategory,
    } = useAdminMenuCategories();

    const [modalOpened, setModalOpened] = useState(false);
    const [editingCategory, setEditingCategory] = useState<MenuCategoryData | null>(null);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    // console.log("[MenuCategoryManager - V2 con Prop] Renderizando. Categorías:", categories.length, "Loading:", loadingCategories);

    const handleOpenAddModal = () => { setEditingCategory(null); setModalOpened(true); };
    const handleOpenEditModal = (category: MenuCategoryData) => { setEditingCategory(category); setModalOpened(true); };
    const handleCloseModal = () => { setModalOpened(false); setEditingCategory(null); };

    const handleSubmitCategoryForm = async (formData: MenuCategoryFormData) => {
        setIsSubmittingForm(true);
        let success = false;
        if (editingCategory) {
            const result = await updateCategory(editingCategory.id, formData);
            if (result) success = true;
        } else {
            const result = await addCategory(formData);
            if (result) success = true;
        }
        if (success) { handleCloseModal(); }
        setIsSubmittingForm(false);
    };

    const handleDeleteCategoryClick = (category: MenuCategoryData) => {
        const categoryName = (currentLanguage === 'es' ? category.name_es : category.name_en) || category.name_es || `ID ${category.id}`;
        modals.openConfirmModal({
            title: t('adminCommon.confirmDeleteTitle'), centered: true,
            children: ( <Text size="sm"> {t('adminCommon.confirmDeleteMessage')}{' '} {t('adminCamarero.manageMenu.category')}: <strong>"{categoryName}"</strong>? </Text> ),
            labels: { confirm: t('common.delete'), cancel: t('common.cancel') }, confirmProps: { color: 'red' },
            onConfirm: async () => { setIsDeletingId(category.id); await deleteCategory(category.id); setIsDeletingId(null); },
        });
    };

    const handleToggleCategoryActive = async (category: MenuCategoryData) => {
        setIsUpdatingStatusId(category.id);
        const newStatus = !category.isActive;
        try { await updateCategory(category.id, { isActive: newStatus }); }
        catch (error) { console.error(`Error toggling status for category ${category.id}:`, error); }
        finally { setIsUpdatingStatusId(null); }
    };

    const rows = categories.map((category) => {
        const displayName = (currentLanguage === 'es' ? category.name_es : category.name_en) || category.name_es || 'N/A';
        const isLoadingThisRowStatus = isUpdatingStatusId === category.id;
        const isLoadingThisRowDelete = isDeletingId === category.id;
        const disableActions = isSubmittingForm || !!isDeletingId || !!isUpdatingStatusId;

        return (
            <Table.Tr key={category.id}>
                <Table.Td>
                    <AspectRatio ratio={16 / 9} w={60}>
                        {category.imageUrl ? ( <MantineImage src={category.imageUrl} alt={displayName} radius="xs" fit="contain" /> )
                         : ( <Center bg="gray.1" h="100%" style={{ borderRadius: 'var(--mantine-radius-xs)' }}> <IconPhoto size={24} color="var(--mantine-color-gray-5)" /> </Center> )}
                    </AspectRatio>
                </Table.Td>
                <Table.Td>
                    <Text fw={500}>{displayName}</Text>
                    {displayName !== category.name_es && category.name_es && <Text size="xs" c="dimmed">ES: {category.name_es}</Text>}
                    {displayName !== category.name_en && category.name_en && <Text size="xs" c="dimmed">EN: {category.name_en}</Text>}
                </Table.Td>
                <Table.Td>{category.position}</Table.Td>
                <Table.Td> <Badge color={category.isActive ? 'green' : 'gray'} variant="light"> {category.isActive ? t('common.active') : t('common.inactive')} </Badge> </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        {/* Clave de traducción: "adminCamarero.manageMenu.viewItemsTooltip": "Ver/Gestionar Ítems de esta Categoría" */}
                        <Tooltip label={t('adminCamarero.manageMenu.viewItemsTooltip')} withArrow position="top">
                            <Box> {/* <--- Envolver ActionIcon en Box */}
                                <ActionIcon variant="subtle" color="cyan" onClick={() => onSelectCategoryForItems(category)} disabled={disableActions || isLoadingThisRowStatus || isLoadingThisRowDelete} >
                                    <IconListDetails size={16} />
                                </ActionIcon>
                            </Box>
                        </Tooltip>
                        
                        <Tooltip label={t('common.edit')} withArrow position="top">
                            <Box> {/* <--- Envolver ActionIcon en Box */}
                                <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEditModal(category)} disabled={disableActions || isLoadingThisRowStatus || isLoadingThisRowDelete} >
                                    <IconPencil size={16} />
                                </ActionIcon>
                            </Box>
                        </Tooltip>

                        <Tooltip label={category.isActive ? t('adminRewardsPage.tooltipDeactivate') : t('adminRewardsPage.tooltipActivate')} withArrow position="top" >
                            <Box> {/* <--- Envolver ActionIcon en Box */}
                                <ActionIcon variant="subtle" color={category.isActive ? 'orange' : 'teal'} onClick={() => handleToggleCategoryActive(category)} loading={isLoadingThisRowStatus} disabled={disableActions || isLoadingThisRowDelete || (isUpdatingStatusId !== null && isUpdatingStatusId !== category.id)} >
                                    {category.isActive ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
                                </ActionIcon>
                            </Box>
                        </Tooltip>

                        <Tooltip label={t('common.delete')} withArrow position="top">
                            <Box> {/* <--- Envolver ActionIcon en Box */}
                                <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteCategoryClick(category)} loading={isLoadingThisRowDelete} disabled={disableActions || isLoadingThisRowStatus || (isDeletingId !== null && isDeletingId !== category.id)} >
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
        <Stack gap="md">
            <Group justify="space-between">
                {/* Clave de traducción: "adminCamarero.manageMenu.category": "Categoría" */}
                <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddModal} disabled={loadingCategories || isSubmittingForm || !!isDeletingId || !!isUpdatingStatusId} >
                    {t('common.add')} {t('adminCamarero.manageMenu.category')}
                </Button>
            </Group>
            {loadingCategories && <Group justify="center" mt="xl"><Loader /></Group>}
            {errorCategories && !loadingCategories && ( <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{errorCategories}</Alert> )}
            {!loadingCategories && !errorCategories && categories.length === 0 && ( <Text c="dimmed" ta="center" mt="md">{t('common.noItems')}</Text> )}
            {!loadingCategories && !errorCategories && categories.length > 0 && (
                <Table.ScrollContainer minWidth={600}>
                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{width: '80px'}}>{t('component.rewardForm.imageLabel')}</Table.Th>
                                <Table.Th>{t('common.name')}</Table.Th>
                                <Table.Th>{t('adminCamarero.manageMenu.categoryPositionLabel')}</Table.Th>
                                <Table.Th>{t('common.status')}</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>{t('common.actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            )}
            <MenuCategoryFormModal opened={modalOpened} onClose={handleCloseModal} onSubmit={handleSubmitCategoryForm} initialData={editingCategory} isSubmitting={isSubmittingForm} />
        </Stack>
    );
};

export default MenuCategoryManager;