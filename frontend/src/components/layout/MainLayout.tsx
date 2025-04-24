// filename: frontend/src/components/layout/MainLayout.tsx
// Version: 1.0.1 (Activate Customer NavLink)

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'; // Asegúrate que Link está importado
import {
    AppShell,
    Burger,
    Group,
    Button,
    Title,
    Text,
    NavLink,
    Skeleton
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconGauge,
    IconGift,
    IconQrcode,
    IconUsers,
    IconStairsUp,
    IconSettings,
    IconUserCircle,
    IconLogout
} from '@tabler/icons-react';
import axiosInstance from '../../services/axiosInstance';

// Interfaz simplificada para los datos del usuario necesarios en el layout
interface LayoutUserData {
    name?: string | null;
    email: string;
    role: string;
}

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState<LayoutUserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();

    // Efecto para cargar datos del usuario (sin cambios)
    useEffect(() => {
        const fetchUserData = async () => {
            setLoadingUser(true);
            try {
                const storedUser = localStorage.getItem('user');
                let userFromStorage: LayoutUserData | null = null;
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        if (parsed && parsed.email && parsed.role) {
                            userFromStorage = { email: parsed.email, name: parsed.name, role: parsed.role };
                        }
                    } catch (e) { console.error("Failed to parse user from localStorage", e); }
                }

                if (userFromStorage) {
                    setUserData(userFromStorage);
                } else {
                    console.log("Fetching user profile from API for layout...");
                    const response = await axiosInstance.get<LayoutUserData>('/profile');
                    setUserData(response.data);
                }

            } catch (error) {
                console.error("Error fetching user data for layout:", error);
                handleLogout();
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
    };

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
            {/* Header común (sin cambios) */}
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Burger
                        opened={navbarOpened}
                        onClick={toggleNavbar}
                        hiddenFrom="sm"
                        size="sm"
                        disabled={!showAdminNavbar}
                    />
                    <Title order={4} style={{ flexGrow: 1 }}>LoyalPyME</Title>
                    <Group gap="xs">
                        {loadingUser ? (
                            <Skeleton height={20} width={100} />
                        ) : (
                            <Text size="sm" visibleFrom="xs">
                                <IconUserCircle size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Hola, {userData?.name || userData?.email || 'Usuario'}!
                            </Text>
                        )}
                        <Button
                            onClick={handleLogout}
                            variant="light"
                            size="sm"
                            leftSection={<IconLogout size={16}/>}
                        >
                            Cerrar Sesión
                        </Button>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* Navbar específica de Admin (condicional) */}
            {showAdminNavbar && (
                <AppShell.Navbar p="md">
                    {/* Links existentes (sin cambios) */}
                    <NavLink
                        label="Dashboard"
                        leftSection={<IconGauge size="1rem" stroke={1.5} />}
                        component={Link}
                        to="/admin/dashboard"
                        active={location.pathname === '/admin/dashboard'}
                    />
                   <NavLink
                       label="Recompensas"
                       leftSection={<IconGift size="1rem" stroke={1.5} />}
                       component={Link}
                       to="/admin/dashboard/rewards"
                       active={location.pathname === '/admin/dashboard/rewards'}
                   />
                   <NavLink
                       label="Generar QR"
                       leftSection={<IconQrcode size="1rem" stroke={1.5} />}
                       component={Link}
                       to="/admin/dashboard/generate-qr"
                       active={location.pathname === '/admin/dashboard/generate-qr'}
                   />
                   <NavLink
                       label="Gestionar Niveles"
                       leftSection={<IconStairsUp size="1rem" stroke={1.5} />}
                       component={Link}
                       to="/admin/dashboard/tiers/manage"
                       active={location.pathname === '/admin/dashboard/tiers/manage'}
                   />
                   <NavLink
                       label="Config. Niveles"
                       leftSection={<IconSettings size="1rem" stroke={1.5} />}
                       component={Link}
                       to="/admin/dashboard/tiers/settings"
                       active={location.pathname === '/admin/dashboard/tiers/settings'}
                   />
                    {/* --- NavLink DE CLIENTES MODIFICADO --- */}
                    <NavLink
                        label="Clientes" // Sin "(próx.)"
                        leftSection={<IconUsers size="1rem" stroke={1.5} />}
                        component={Link} // Usar Link para navegar
                        to="/admin/dashboard/customers" // Apuntar a la nueva ruta
                        active={location.pathname === '/admin/dashboard/customers'} // Marcar si está activo
                        // Ya no está 'disabled'
                    />
                    {/* --- FIN NavLink MODIFICADO --- */}
                </AppShell.Navbar>
            )}

            {/* Contenido Principal (sin cambios) */}
            <AppShell.Main>
                <Outlet /> {/* Renderiza el componente hijo de la ruta */}
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;
// --- FIN DEL CÓDIGO COMPLETO ---