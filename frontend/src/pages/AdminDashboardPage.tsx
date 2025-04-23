// File: frontend/src/pages/AdminDashboardPage.tsx
// Version: 1.5.5 (Fix active state logic for Tier NavLinks)

import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';

import {
    AppShell, Burger, Group, Button, Title, Text, Box, NavLink
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconGauge, IconGift, IconQrcode, IconUsers, IconStairsUp, IconSettings
} from '@tabler/icons-react';


const AdminDashboardPage: React.FC = () => {
    // Estados y hooks (sin cambios)
    const navigate = useNavigate();
    const [userName, setUserName] = useState<string | null>(null);
    const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();
    const location = useLocation();

    // useEffect y handleLogout (sin cambios)
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) { try { const parsedUser = JSON.parse(storedUser); setUserName(parsedUser.name || parsedUser.email || 'Admin'); } catch (e) { console.error("Error parsing user data", e); setUserName('Admin'); } } else { setUserName('Admin'); }
    }, []);
    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    // RENDER PRINCIPAL
    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !navbarOpened } }}
            padding="md"
        >
             {/* AppShell.Header (sin cambios) */}
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

              {/* AppShell.Navbar MODIFICADA */}
              <AppShell.Navbar p="md">
                  {/* Links existentes */}
                  <NavLink
                      label="Dashboard"
                      leftSection={<IconGauge size="1rem" stroke={1.5} />}
                      component={Link}
                      to="/admin/dashboard"
                      active={location.pathname === '/admin/dashboard'} // Exact match
                  />
                 <NavLink
                      label="Recompensas"
                      leftSection={<IconGift size="1rem" stroke={1.5} />}
                      component={Link}
                      to="/admin/dashboard/rewards"
                      active={location.pathname === '/admin/dashboard/rewards'} // Exact match
                  />
                  <NavLink
                      label="Generar QR"
                      leftSection={<IconQrcode size="1rem" stroke={1.5} />}
                      component={Link}
                      to="/admin/dashboard/generate-qr"
                      active={location.pathname === '/admin/dashboard/generate-qr'} // Exact match
                  />

                 {/* --- ENLACES PARA TIERS --- */}
                 <NavLink
                      label="Gestionar Niveles"
                      leftSection={<IconStairsUp size="1rem" stroke={1.5} />}
                      component={Link}
                      to="/admin/dashboard/tiers/manage"
                      // --- CORRECCIÓN: Usar comparación exacta ---
                      active={location.pathname === '/admin/dashboard/tiers/manage'}
                      // --- FIN CORRECCIÓN ---
                  />
                 <NavLink
                      label="Config. Niveles"
                      leftSection={<IconSettings size="1rem" stroke={1.5} />}
                      component={Link}
                      to="/admin/dashboard/tiers/settings"
                      active={location.pathname === '/admin/dashboard/tiers/settings'} // Exact match (ya estaba bien)
                  />
                  {/* --- FIN ENLACES TIERS --- */}

                 <NavLink
                      label="Clientes (próx.)"
                      leftSection={<IconUsers size="1rem" stroke={1.5} />}
                      disabled
                  />
              </AppShell.Navbar>

              {/* AppShell.Main (sin cambios) */}
              <AppShell.Main>
                  <Outlet />
                  <Box mt="xl" pt="xl" style={{ textAlign: 'center' }}>
                      <Text c="dimmed" size="sm">LoyalPyME v1.0 MVP</Text>
                  </Box>
             </AppShell.Main>

        </AppShell>
    );
};

export default AdminDashboardPage;

// End of File: frontend/src/pages/AdminDashboardPage.tsx