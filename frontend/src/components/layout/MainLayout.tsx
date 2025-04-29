// filename: frontend/src/components/layout/MainLayout.tsx
// Version: 1.4.0 (Pass closeNavbar prop to AdminNavbar) - VERIFICAR ESTA VERSIÓN

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useLayoutUserData } from '../../hooks/useLayoutUserData';
import AppHeader from './AppHeader';
import AdminNavbar from './AdminNavbar'; // Asegúrate que AdminNavbar acepta closeNavbar

const MainLayout: React.FC = () => {
    const { userData, loadingUser, handleLogout } = useLayoutUserData();
    const location = useLocation();
    // Obtenemos 'close' y lo renombramos a 'closeNavbar' para claridad si quieres, o usar 'close' directamente
    const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure();

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

            {showAdminNavbar && (
                <AppShell.Navbar p="md">
                    {/* --- ASEGÚRATE QUE ESTA ES LA LÍNEA QUE TIENES --- */}
                    <AdminNavbar
                        pathname={location.pathname}
                        closeNavbar={closeNavbar} // <-- Se pasa closeNavbar, NO onNavLinkClick
                    />
                    {/* --- FIN ASEGURARSE --- */}
                </AppShell.Navbar>
            )}

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;

// End of File: frontend/src/components/layout/MainLayout.tsx