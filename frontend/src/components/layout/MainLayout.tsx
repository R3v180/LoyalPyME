// frontend/src/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useLayoutUserData } from '../../hooks/useLayoutUserData'; // Hook que provee userData
import AppHeader from './AppHeader';
import AdminNavbar from './AdminNavbar';

const MainLayout: React.FC = () => {
    const { userData, loadingUser, handleLogout } = useLayoutUserData(); // Obtenemos userData de aquí
    const location = useLocation();
    const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure();

    // Determinar si se debe mostrar la AdminNavbar
    // Solo para BUSINESS_ADMIN y si está en una ruta de admin
    const isAdminRoute = location.pathname.startsWith('/admin/dashboard');
    const showAdminNavbar = userData?.role === 'BUSINESS_ADMIN' && isAdminRoute;

    // El Super Admin podría tener una navbar diferente o ninguna si su panel es simple.
    // Por ahora, el MainLayout no le mostrará la AdminNavbar de BUSINESS_ADMIN.
    // Si el Super Admin necesitara una navbar, se manejaría en su propia página o un layout específico.

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 250,
                breakpoint: 'sm',
                // Mostrar/ocultar navbar según si es admin y la navbar está abierta (móvil)
                collapsed: { mobile: !navbarOpened, desktop: !showAdminNavbar }
            }}
            padding="md"
        >
            <AppShell.Header>
                <AppHeader
                    userData={userData} // userData ya se pasa a AppHeader
                    loadingUser={loadingUser}
                    handleLogout={handleLogout}
                    navbarOpened={navbarOpened}
                    toggleNavbar={toggleNavbar}
                    showAdminNavbar={showAdminNavbar} // Para el burger de AppHeader
                />
            </AppShell.Header>

            {/* Mostrar AdminNavbar solo si showAdminNavbar es true */}
            {showAdminNavbar && (
                <AppShell.Navbar p="md">
                    <AdminNavbar
                        pathname={location.pathname}
                        closeNavbar={closeNavbar}
                        userData={userData} // <-- PASAR userData AQUÍ
                    />
                </AppShell.Navbar>
            )}

            <AppShell.Main>
                <Outlet /> {/* Aquí se renderizan las páginas hijas */}
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;