// filename: frontend/src/components/layout/AppHeader.tsx
// Version: 1.0.1 (Fix: Remove incorrect Header import and wrapper)

import React from 'react';
import {
    Group,
    Burger,
    Title,
    Text,
    Skeleton,
    Button,
    // Header NO se importa directamente
} from '@mantine/core';
import { IconUserCircle, IconLogout } from '@tabler/icons-react';

// Interfaz simplificada para los datos del usuario (duplicada de useLayoutUserData por ahora)
// TODO: Mover a un archivo de tipos compartido (e.g., src/types/user.ts)
interface LayoutUserData {
    name?: string | null;
    email: string;
    role: string;
}

// Props que necesita el componente AppHeader
interface AppHeaderProps {
    userData: LayoutUserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
    navbarOpened: boolean;
    toggleNavbar: () => void;
    showAdminNavbar: boolean; // Para habilitar/deshabilitar el Burger
}

const AppHeader: React.FC<AppHeaderProps> = ({
    userData,
    loadingUser,
    handleLogout,
    navbarOpened,
    toggleNavbar,
    showAdminNavbar,
}) => {
    // Devolvemos directamente el Group que contiene todo el contenido del header
    return (
        <Group h="100%" px="md" justify="space-between">
            {/* Burger para el menú móvil (solo visible en 'sm' y activo si showAdminNavbar es true) */}
            <Burger
                opened={navbarOpened}
                onClick={toggleNavbar}
                hiddenFrom="sm" // Oculto en pantallas grandes
                size="sm"
                disabled={!showAdminNavbar} // Deshabilitado si la navbar de admin no se muestra
            />

            {/* Título de la Aplicación */}
            <Title order={4} style={{ flexGrow: 1 }}>LoyalPyME</Title>

            {/* Grupo de Usuario y Logout */}
            <Group gap="xs">
                {loadingUser ? (
                    // Esqueleto mientras cargan los datos del usuario
                    <Skeleton height={20} width={100} visibleFrom="xs" />
                ) : (
                    // Muestra saludo si los datos del usuario están disponibles
                    userData && (
                        <Text size="sm" visibleFrom="xs"> {/* Oculto en pantallas extra pequeñas */}
                            <IconUserCircle size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            Hola, {userData.name || userData.email || 'Usuario'}!
                        </Text>
                    )
                )}
                {/* Botón de Cerrar Sesión */}
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
    );
};

export default AppHeader;