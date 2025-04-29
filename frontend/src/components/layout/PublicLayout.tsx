// filename: frontend/src/components/layout/PublicLayout.tsx
// Nuevo layout simple para páginas públicas, solo incluye el Header.

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; // Necesario para AppHeader
import { useLayoutUserData } from '../../hooks/useLayoutUserData'; // Necesario para AppHeader
import AppHeader from './AppHeader'; // Importamos el header existente

const PublicLayout: React.FC = () => {
    // Necesitamos obtener los datos y el estado de la navbar para pasarlos al AppHeader
    const { userData, loadingUser, handleLogout } = useLayoutUserData();
    // Aunque no mostramos la navbar aquí, AppHeader necesita el estado y el toggle para el Burger en móvil
    const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();

    return (
        <AppShell
            header={{ height: 60 }}
            // NO definimos navbar aquí
            padding="md" // Mantenemos padding general
        >
            {/* Cabecera (la misma que en MainLayout) */}
            <AppShell.Header>
                <AppHeader
                    userData={userData}
                    loadingUser={loadingUser}
                    handleLogout={handleLogout}
                    navbarOpened={navbarOpened}
                    toggleNavbar={toggleNavbar}
                    showAdminNavbar={false} // Nunca mostramos navbar admin en layout público
                />
            </AppShell.Header>

            {/* Contenido principal de la página pública actual */}
            <AppShell.Main>
                <Outlet /> {/* Aquí se renderiza LoginPage, RegisterPage, etc. */}
            </AppShell.Main>
        </AppShell>
    );
};

export default PublicLayout;

// End of File: frontend/src/components/layout/PublicLayout.tsx