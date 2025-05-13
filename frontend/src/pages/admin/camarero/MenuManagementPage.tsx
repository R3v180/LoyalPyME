// frontend/src/pages/admin/camarero/MenuManagementPage.tsx
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
import { notifications } from '@mantine/notifications'; // Para notificaciones
import { IconExternalLink } from '@tabler/icons-react'; // Icono para el botón

// Componentes hijos
import MenuCategoryManager from '../../../components/admin/camarero/menu/MenuCategoryManager';
import MenuItemManager from '../../../components/admin/camarero/menu/MenuItemManager'; 

// Tipos y Hooks
import { MenuCategoryData } from '../../../types/menu.types';
import { useLayoutUserData } from '../../../hooks/useLayoutUserData'; // Hook para obtener userData

const MenuManagementPage: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<MenuCategoryData | null>(null);
    
    // Obtener userData para acceder a isCamareroActive y businessSlug
    const { userData, loadingUser: loadingLayoutUser } = useLayoutUserData();

    // console.log(`[MenuManagementPage] Render. SelectedCategory: ${selectedCategory?.id}. UserData loading: ${loadingLayoutUser}, CamareroActive: ${userData?.isCamareroActive}, Slug: ${userData?.businessSlug}`);

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
                 message: t('adminCamarero.manageMenu.previewErrorNoSlug', "No se pudo obtener el identificador del negocio para la previsualización."), // Nueva clave i18n
                 color: 'red'
            });
        }
    };

    // Clave de traducción para el botón de previsualización
    // adminCamarero.manageMenu.previewButton = "Previsualizar Carta Pública"

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                    <Title order={2}>
                        {t('adminCamarero.manageMenu.title')}
                    </Title>
                    {/* Botón de Previsualización */}
                    {userData?.isCamareroActive && !loadingLayoutUser && ( // Mostrar solo si el módulo está activo y no estamos cargando datos de usuario
                        <Button
                            variant="outline"
                            leftSection={<IconExternalLink size={16} />}
                            onClick={handlePreviewMenu}
                            disabled={!userData?.businessSlug} // Deshabilitar si no hay slug
                            title={!userData?.businessSlug ? t('adminCamarero.manageMenu.previewDisabledTooltip', "Identificador de negocio no disponible") : undefined} // Nueva clave i18n
                        >
                            {t('adminCamarero.manageMenu.previewButton', 'Previsualizar Carta')}
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
                                {t('common.back')} {t('adminCamarero.manageMenu.toCategories', 'a Categorías')} {/* Nueva clave i18n */}
                            </Button>
                        </Group>
                        <MenuItemManager 
                            categoryId={selectedCategory.id} 
                            categoryName={selectedCategory.name_es || selectedCategory.name_en || ''}
                        />
                    </Paper>
                )}
            </Stack>
        </Container>
    );
};

export default MenuManagementPage;