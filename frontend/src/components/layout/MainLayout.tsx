// filename: frontend/src/components/layout/MainLayout.tsx
// Version: 1.3.1 (Clean up comments)

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

// Importamos el hook de datos y los componentes de layout
import { useLayoutUserData } from '../../hooks/useLayoutUserData';
import AppHeader from './AppHeader';
import AdminNavbar from './AdminNavbar'; // Componente extraído para la navbar de admin

const MainLayout: React.FC = () => {
    // Hook para datos de usuario y logout
    const { userData, loadingUser, handleLogout } = useLayoutUserData();

    const location = useLocation(); // Necesario para determinar la ruta activa para la navbar
    const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure(); // Estado para la navbar móvil

    // Lógica para mostrar la navbar de admin solo en rutas de admin y si el usuario es admin
    const isAdminRoute = location.pathname.startsWith('/admin/dashboard');
    const showAdminNavbar = userData?.role === 'BUSINESS_ADMIN' && isAdminRoute;

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 250, // Ancho de la navbar
                breakpoint: 'sm', // Punto a partir del cual se oculta en móvil
                // Estado colapsado basado en el estado del Burger (móvil) y si debe mostrarse (desktop)
                collapsed: { mobile: !navbarOpened, desktop: !showAdminNavbar }
            }}
            padding="md" // Padding general del contenido principal
        >
            {/* Cabecera de la aplicación */}
            <AppShell.Header>
                <AppHeader
                    userData={userData}
                    loadingUser={loadingUser}
                    handleLogout={handleLogout}
                    navbarOpened={navbarOpened}
                    toggleNavbar={toggleNavbar}
                    showAdminNavbar={showAdminNavbar} // Pasar para habilitar/deshabilitar Burger
                />
            </AppShell.Header>

            {/* Navbar lateral (condicional) */}
            {/* Renderiza solo si el usuario es admin y está en una ruta de admin */}
            {showAdminNavbar && (
                <AppShell.Navbar p="md">
                    {/* Usa el componente AdminNavbar pasándole la ruta actual */}
                    <AdminNavbar pathname={location.pathname} />
                </AppShell.Navbar>
            )}

            {/* Contenido principal de la página actual (renderizado por React Router) */}
            <AppShell.Main>
                <Outlet /> {/* Aquí se renderiza el componente de la ruta hija */}
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;

// End of File: frontend/src/components/layout/MainLayout.tsx