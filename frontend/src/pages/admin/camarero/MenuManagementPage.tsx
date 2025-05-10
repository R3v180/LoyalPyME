// frontend/src/pages/admin/camarero/MenuManagementPage.tsx
import React from 'react'; // FC ya no es necesario con la nueva sintaxis de componentes
import { Container, Title, Paper, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// En el futuro, importaremos aquí los componentes para gestionar categorías, ítems, etc.
// import MenuCategoryManager from '../../../components/admin/camarero/menu/MenuCategoryManager';

const MenuManagementPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Title order={2}>
                    {t('adminCamarero.manageMenu.title', 'Gestión de Carta Digital')}
                </Title>

                <Paper shadow="sm" p="lg" withBorder radius="lg">
                    <Title order={4} mb="md">
                        {t('adminCamarero.manageMenu.categoriesSectionTitle', 'Categorías del Menú')}
                    </Title>
                    {/* 
                        Aquí irá el componente MenuCategoryManager para CRUD de categorías.
                        Por ahora, un placeholder.
                    */}
                    <p>{t('common.upcomingFeatureTitle')} - {t('adminCamarero.manageMenu.categoryManagerPlaceholder', 'Gestor de Categorías aquí...')}</p>
                </Paper>

                <Paper shadow="sm" p="lg" withBorder radius="lg">
                     <Title order={4} mb="md">
                        {t('adminCamarero.manageMenu.itemsSectionTitle', 'Ítems del Menú')}
                    </Title>
                    {/* 
                        Aquí irá el componente para gestionar ítems, probablemente
                        seleccionando una categoría primero.
                    */}
                    <p>{t('common.upcomingFeatureTitle')} - {t('adminCamarero.manageMenu.itemManagerPlaceholder', 'Gestor de Ítems aquí...')}</p>
                </Paper>

                {/* 
                    Podríamos tener una sección separada para modificadores globales si aplica,
                    o se gestionarán directamente desde cada ítem.
                */}

            </Stack>
        </Container>
    );
};

export default MenuManagementPage;