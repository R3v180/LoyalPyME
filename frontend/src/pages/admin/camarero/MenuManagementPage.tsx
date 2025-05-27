// frontend/src/pages/admin/camarero/MenuManagementPage.tsx
// Version 1.0.1 (Remove categoryName prop from MenuItemManager call)

import React, { useState } from 'react';
import { 
    Container, 
    Title, 
    Paper, 
    Stack, 
    Button,
    Group     
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications'; 
import { IconExternalLink } from '@tabler/icons-react'; 

// Componentes hijos
import MenuCategoryManager from '../../../components/admin/camarero/menu/MenuCategoryManager';
import MenuItemManager from '../../../components/admin/camarero/menu/MenuItemManager'; 

// Tipos y Hooks
import { MenuCategoryData } from '../../../types/menu.types';
import { useLayoutUserData } from '../../../hooks/useLayoutUserData'; 

const MenuManagementPage: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<MenuCategoryData | null>(null);
    
    const { userData, loadingUser: loadingLayoutUser } = useLayoutUserData();

    const handleViewItems = (category: MenuCategoryData) => {
        setSelectedCategory(category);
    };
    const handleBackToCategories = () => {
        setSelectedCategory(null);
    };

    const handlePreviewMenu = () => {
        if (userData?.businessSlug) {
            window.open(`/m/${userData.businessSlug}`, '_blank');
        } else {
            console.error("[MenuManagementPage] Business slug no disponible para previsualizar el menú.");
            notifications.show({
                 title: t('common.error'),
                 message: t('adminCamarero.manageMenu.previewErrorNoSlug'),
                 color: 'red'
            });
        }
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                    <Title order={2}>
                        {t('adminCamarero.manageMenu.title')}
                    </Title>
                    {userData?.isCamareroActive && !loadingLayoutUser && (
                        <Button
                            variant="outline"
                            leftSection={<IconExternalLink size={16} />}
                            onClick={handlePreviewMenu}
                            disabled={!userData?.businessSlug}
                            title={!userData?.businessSlug ? t('adminCamarero.manageMenu.previewDisabledTooltip') : undefined}
                        >
                            {t('adminCamarero.manageMenu.previewButton')}
                        </Button>
                    )}
                </Group>

                {!selectedCategory ? (
                    <Paper shadow="sm" p="lg" withBorder radius="lg">
                        <Title order={4} mb="md">
                            {t('adminCamarero.manageMenu.categoriesSectionTitle')}
                        </Title>
                        <MenuCategoryManager 
                            onSelectCategoryForItems={handleViewItems}
                        />
                    </Paper>
                ) : (
                    <Paper shadow="sm" p="lg" withBorder radius="lg">
                        <Group justify="space-between" mb="md">
                            <Title order={4}>
                                {t('adminCamarero.manageMenu.itemsSectionTitle')} - {selectedCategory.name_es || selectedCategory.name_en}
                            </Title>
                            <Button variant="outline" onClick={handleBackToCategories}>
                                {t('common.back')} {t('adminCamarero.manageMenu.toCategories')}
                            </Button>
                        </Group>
                        <MenuItemManager 
                            categoryId={selectedCategory.id} 
                            // categoryName={selectedCategory.name_es || selectedCategory.name_en || ''} // <-- LÍNEA ELIMINADA
                        />
                    </Paper>
                )}
            </Stack>
        </Container>
    );
};

export default MenuManagementPage;