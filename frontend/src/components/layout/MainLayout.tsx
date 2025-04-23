// filename: frontend/src/components/layout/MainLayout.tsx
// --- INICIO DEL CÓDIGO COMPLETO ---
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
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
    IconLogout // Importar IconLogout
} from '@tabler/icons-react';
import axiosInstance from '../../services/axiosInstance'; // Ajustar ruta si es necesario

// Interfaz simplificada para los datos del usuario necesarios en el layout
interface LayoutUserData {
    name?: string | null;
    email: string; // Asumimos que siempre tendremos email
    role: string; // Para saber si mostrar la navbar de admin
}

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Para marcar NavLinks activos
    const [userData, setUserData] = useState<LayoutUserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();

    // Efecto para cargar datos del usuario al montar el layout
    useEffect(() => {
        const fetchUserData = async () => {
            setLoadingUser(true);
            try {
                // Intentar obtener del localStorage primero (más rápido)
                const storedUser = localStorage.getItem('user');
                let userFromStorage: LayoutUserData | null = null;
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        // Asegurarse de que tenemos los campos mínimos
                        if (parsed && parsed.email && parsed.role) {
                           userFromStorage = { email: parsed.email, name: parsed.name, role: parsed.role };
                        }
                    } catch (e) { console.error("Failed to parse user from localStorage", e); }
                }

                if (userFromStorage) {
                     setUserData(userFromStorage);
                } else {
                    // Si no está en localStorage o falla, pedir a la API
                     console.log("Fetching user profile from API for layout...");
                     const response = await axiosInstance.get<LayoutUserData>('/profile'); // Asume que /profile devuelve al menos email y role
                     setUserData(response.data);
                     // Opcional: Guardar en localStorage para la próxima vez? Depende de la estrategia
                     // localStorage.setItem('user', JSON.stringify(response.data));
                }

            } catch (error) {
                console.error("Error fetching user data for layout:", error);
                // Si falla la carga del perfil (ej: token expirado), desloguear
                handleLogout();
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserData();
    }, []); // Se ejecuta solo una vez al montar el Layout

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true }); // Usar replace para no volver atrás al layout
    };

    // Determinar si mostrar la Navbar de Admin
    // Podríamos basarlo en el rol o en la ruta actual
    const isAdminRoute = location.pathname.startsWith('/admin/dashboard');
    const showAdminNavbar = userData?.role === 'BUSINESS_ADMIN' && isAdminRoute;

    return (
        <AppShell
            header={{ height: 60 }}
            // Navbar condicional: solo se muestra si showAdminNavbar es true
            navbar={{
                width: 250,
                breakpoint: 'sm',
                collapsed: { mobile: !navbarOpened, desktop: !showAdminNavbar } // Colapsada en desktop si no es admin
            }}
            padding="md"
        >
            {/* Header común para todos los usuarios logueados */}
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    {/* Botón Burger: solo visible si la navbar debe mostrarse (Admin en móvil) */}
                    <Burger
                        opened={navbarOpened}
                        onClick={toggleNavbar}
                        hiddenFrom="sm"
                        size="sm"
                        disabled={!showAdminNavbar} // Deshabilitado si no es admin
                    />
                     {/* Título */}
                     <Title order={4} style={{ flexGrow: 1 }}>LoyalPyME</Title> {/* Título más genérico */}

                     {/* Saludo y Botón Logout */}
                    <Group gap="xs">
                        {loadingUser ? (
                           <Skeleton height={20} width={100} />
                        ) : (
                           <Text size="sm" visibleFrom="xs">
                                {/* Icono opcional */}
                               <IconUserCircle size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                               Hola, {userData?.name || userData?.email || 'Usuario'}!
                           </Text>
                        )}
                        <Button
                           onClick={handleLogout}
                           variant="light" // Quizás un estilo más sutil
                           size="sm"
                           leftSection={<IconLogout size={16}/>}
                        >
                            Cerrar Sesión
                        </Button>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* Navbar específica de Admin (se renderiza solo si showAdminNavbar es true) */}
            {showAdminNavbar && (
                <AppShell.Navbar p="md">
                    {/* Copiamos los NavLink de AdminDashboardPage aquí */}
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
                     <NavLink
                        label="Clientes (próx.)"
                        leftSection={<IconUsers size="1rem" stroke={1.5} />}
                        disabled
                    />
                    {/* Puedes añadir más links de admin aquí */}
                </AppShell.Navbar>
            )}

            {/* Contenido Principal: Aquí se renderizará el componente de la ruta actual */}
            <AppShell.Main>
                <Outlet /> {/* ¡IMPORTANTE! Renderiza el componente hijo de la ruta */}
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;
// --- FIN DEL CÓDIGO COMPLETO ---