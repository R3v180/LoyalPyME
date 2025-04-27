// filename: frontend/src/components/layout/MainLayout.tsx
// Version: 1.3.0 (Refactor: Use AdminNavbar component)

import React from 'react';
// Link ya no se usa directamente aquí
import { Outlet, useLocation } from 'react-router-dom';
import {
    AppShell,
    // NavLink ya no es necesario aquí
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
// Iconos de NavLink ya no son necesarios aquí
// import { IconGauge, IconGift, IconQrcode, IconUsers, IconStairsUp, IconSettings } from '@tabler/icons-react';

// Importamos el hook de datos y los componentes de layout extraídos
import { useLayoutUserData } from '../../hooks/useLayoutUserData';
import AppHeader from './AppHeader';
import AdminNavbar from './AdminNavbar'; // Importamos el nuevo componente Navbar

const MainLayout: React.FC = () => {
    // Hook para datos de usuario y logout
    const { userData, loadingUser, handleLogout } = useLayoutUserData();

    const location = useLocation(); // Necesitamos location para pasar el pathname
    const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();

    // Lógica para mostrar la navbar de admin (sin cambios)
    const isAdminRoute = location.pathname.startsWith('/admin/dashboard');
    const showAdminNavbar = userData?.role === 'BUSINESS_ADMIN' && isAdminRoute;

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 250,
                breakpoint: 'sm',
                collapsed: { mobile: !navbarOpened, desktop: !showAdminNavbar }
            }}
            padding="md"
        >
            {/* Header (Ya refactorizado) */}
            <AppShell.Header>
                <AppHeader
                    userData={userData}
                    loadingUser={loadingUser}
                    handleLogout={handleLogout}
                    navbarOpened={navbarOpened}
                    toggleNavbar={toggleNavbar}
                    showAdminNavbar={showAdminNavbar}
                />
            </AppShell.Header>

            {/* --- Navbar Refactorizada --- */}
            {/* Renderiza condicionalmente la Navbar si el usuario es admin y está en ruta de admin */}
            {showAdminNavbar && (
                <AppShell.Navbar p="md">
                    {/* Usamos el componente AdminNavbar y le pasamos el pathname actual */}
                    <AdminNavbar pathname={location.pathname} />
                </AppShell.Navbar>
            )}
            {/* --- Fin Navbar Refactorizada --- */}

            {/* Contenido Principal (sin cambios) */}
            <AppShell.Main>
                <Outlet /> {/* Renderiza el componente hijo de la ruta */}
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;
// --- FIN DEL CÓDIGO COMPLETO ---