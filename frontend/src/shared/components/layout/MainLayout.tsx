// frontend/src/components/layout/MainLayout.tsx
// Version 1.0.1 (Correct logic for showing AdminNavbar for WAITER and other staff roles)

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useLayoutUserData } from '../../hooks/useLayoutUserData';
import AppHeader from './AppHeader';
import AdminNavbar from './AdminNavbar';
import { UserRole } from '../../types/user.types';

const MainLayout: React.FC = () => {
    const { userData, loadingUser, handleLogout } = useLayoutUserData();
    const location = useLocation();
    const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure();

    // ---- LÓGICA MODIFICADA PARA MOSTRAR AdminNavbar ----
    // Determinar si la ruta actual es una ruta de "admin" en general
    const isAnyAdminRoute = location.pathname.startsWith('/admin/');

    // Definir qué roles deben ver la AdminNavbar en las rutas /admin/*
    const rolesThatSeeAdminNavbar: UserRole[] = [
        UserRole.BUSINESS_ADMIN,
        UserRole.WAITER,
        UserRole.KITCHEN_STAFF,
        UserRole.BAR_STAFF
        // SUPER_ADMIN tiene su propia ruta /superadmin y no usa esta navbar
    ];

    // AdminNavbar se muestra si el usuario tiene uno de los roles permitidos Y está en una ruta /admin/*
    const showAdminNavbar = userData?.role &&
                            rolesThatSeeAdminNavbar.includes(userData.role) &&
                            isAnyAdminRoute;
    // ---- FIN LÓGICA MODIFICADA ----


    // Debug log para la condición de la navbar
    // console.log(`[MainLayout] Path: ${location.pathname}, Role: ${userData?.role}, isAnyAdminRoute: ${isAnyAdminRoute}, showAdminNavbar: ${showAdminNavbar}`);

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 250,
                breakpoint: 'sm',
                // Mostrar/ocultar navbar si showAdminNavbar es true y navbarOpened es true (para móvil)
                collapsed: { mobile: !navbarOpened || !showAdminNavbar, desktop: !showAdminNavbar }
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
                    // El burger del header debe aparecer si showAdminNavbar es true,
                    // independientemente de si la navbar está colapsada o no en desktop.
                    showAdminNavbar={showAdminNavbar}
                />
            </AppShell.Header>

            {/* Mostrar AdminNavbar solo si showAdminNavbar es true */}
            {showAdminNavbar && (
                <AppShell.Navbar p="md">
                    <AdminNavbar
                        pathname={location.pathname}
                        closeNavbar={closeNavbar}
                        userData={userData}
                    />
                </AppShell.Navbar>
            )}

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;