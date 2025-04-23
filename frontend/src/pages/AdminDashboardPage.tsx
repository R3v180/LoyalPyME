// File: frontend/src/pages/AdminDashboardPage.tsx
// Version: 1.5.3 (Cleanup unused imports/code for Layout component)

// Solo importamos lo necesario para React y el Routing/Layout básico
import React, { useState, useEffect } from 'react'; // Mantenemos useState/useEffect para userName
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';

// Solo importamos componentes de Mantine usados en el Layout (AppShell, Header, Navbar, Main, Footer)
import {
    AppShell, Burger, Group, Button, Title, Text, Box, NavLink
} from '@mantine/core';
// Solo importamos hooks de Mantine usados aquí
import { useDisclosure } from '@mantine/hooks';
// Solo importamos iconos usados en el Layout (Navbar, Header)
import {
    IconGauge, IconGift, IconQrcode, IconUsers
} from '@tabler/icons-react';

// Ya no necesitamos axiosInstance, RewardForm, GenerateQrCode, ni la mayoría de los otros
// componentes/iconos/hooks de Mantine aquí. Se usarán en los componentes hijos.
// Tampoco necesitamos la interfaz Reward ni el tipo ActionLoading aquí.


const AdminDashboardPage: React.FC = () => {
    // Estados y hooks solo para el Layout
    const navigate = useNavigate();
    const [userName, setUserName] = useState<string | null>(null);
    const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();
    const location = useLocation();

    // useEffect para obtener nombre de usuario (se mantiene)
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        // Simplificado: asumimos que 'user' en localStorage tiene al menos 'email'
        if (storedUser) { try { const parsedUser = JSON.parse(storedUser); setUserName(parsedUser.name || parsedUser.email || 'Admin'); } catch (e) { console.error("Error parsing user data", e); setUserName('Admin'); } } else { setUserName('Admin'); }
    }, []);

    // handleLogout (se mantiene)
    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    // RENDER PRINCIPAL - Layout Limpio
    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !navbarOpened } }}
            padding="md"
        >
             <AppShell.Header>
                  <Group h="100%" px="md" justify="space-between">
                      <Burger opened={navbarOpened} onClick={toggleNavbar} hiddenFrom="sm" size="sm" />
                      <Title order={3} hiddenFrom="sm">LoyalPyME Admin</Title>
                      <Title order={4} visibleFrom="sm">LoyalPyME Admin</Title>
                      <Group gap="xs">
                          <Text size="sm" visibleFrom="xs">Bienvenido, {userName || 'Admin'}!</Text>
                          <Button onClick={handleLogout}>Cerrar Sesión</Button>
                      </Group>
                  </Group>
             </AppShell.Header>

              <AppShell.Navbar p="md">
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
                      label="Clientes (próx.)"
                      leftSection={<IconUsers size="1rem" stroke={1.5} />}
                      disabled
                  />
             </AppShell.Navbar>

             <AppShell.Main>
                 <Outlet /> {/* Aquí se renderizarán los componentes hijos */}
                 <Box mt="xl" pt="xl" style={{ textAlign: 'center' }}>
                     <Text c="dimmed" size="sm">LoyalPyME v1.0 MVP</Text>
                 </Box>
             </AppShell.Main>

        </AppShell>
    );
};

export default AdminDashboardPage;

// End of File: frontend/src/pages/AdminDashboardPage.tsx