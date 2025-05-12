// frontend/src/pages/admin/camarero/MenuManagementPage.tsx
import React, { useState } from 'react';
import { 
    Container, 
    Title, 
    Paper, 
    Stack, 
    // Text as MantineText, // Sigue sin usarse directamente aquí
    Button,
    Group     
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import MenuCategoryManager from '../../../components/admin/camarero/menu/MenuCategoryManager';
// --- DESCOMENTAR LA IMPORTACIÓN ---
import MenuItemManager from '../../../components/admin/camarero/menu/MenuItemManager'; 
import { MenuCategoryData } from '../../../types/menu.types';

const MenuManagementPage: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<MenuCategoryData | null>(null);

    // Log actualizado para diferenciar
    console.log(`[MenuManagementPage - V7 CON MenuItemManager] Categoría seleccionada: ${selectedCategory?.id || 'ninguna'}`);

    const handleViewItems = (category: MenuCategoryData) => {
        console.log(`[MenuManagementPage] handleViewItems llamada con categoría: "${category.name_es}" (ID: ${category.id})`);
        setSelectedCategory(category);
    };
    const handleBackToCategories = () => {
        setSelectedCategory(null);
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Title order={2}>
                    {t('adminCamarero.manageMenu.title')}
                </Title>

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
                                {t('adminCamarero.manageMenu.itemsSectionTitle')} - {selectedCategory.name_es}
                            </Title>
                            <Button variant="outline" onClick={handleBackToCategories}>
                                {t('common.back')} a Categorías
                            </Button>
                        </Group>
                        {/* --- DESCOMENTAR Y USAR MenuItemManager --- */}
                        <MenuItemManager 
                            categoryId={selectedCategory.id} 
                            categoryName={selectedCategory.name_es} // o el nombre en el idioma actual si lo prefieres
                        />
                    </Paper>
                )}
            </Stack>
        </Container>
    );
};

export default MenuManagementPage;