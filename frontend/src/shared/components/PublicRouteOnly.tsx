// frontend/src/shared/components/PublicRouteOnly.tsx (NUEVO ARCHIVO)
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useLayoutUserData } from '../hooks/useLayoutUserData';
import { UserRole } from '../types/user.types';
import { Loader, Center } from '@mantine/core';

const PublicRouteOnly: React.FC = () => {
    const { userData, loadingUser } = useLayoutUserData();

    // Muestra un loader mientras se verifica el estado de autenticación.
    // Esto previene un "parpadeo" donde se muestra la página de login por un instante
    // antes de que se carguen los datos del usuario y se produzca la redirección.
    if (loadingUser) {
        return (
            <Center style={{ height: '100vh' }}>
                <Loader />
            </Center>
        );
    }

    // Si, una vez terminada la carga, hay datos de usuario...
    if (userData) {
        // Determina a dónde redirigir basándose en el rol del usuario.
        let redirectTo = '/'; // Fallback por si hay un rol no manejado

        switch (userData.role) {
            case UserRole.CUSTOMER_FINAL:
                redirectTo = '/customer/dashboard';
                break;
            case UserRole.BUSINESS_ADMIN:
                redirectTo = '/admin/dashboard';
                break;
            case UserRole.SUPER_ADMIN:
                redirectTo = '/superadmin';
                break;
            case UserRole.WAITER:
                redirectTo = '/admin/camarero/pickup';
                break;
            case UserRole.KITCHEN_STAFF:
            case UserRole.BAR_STAFF:
                redirectTo = '/admin/kds';
                break;
        }
        
        // Redirige al usuario a su página principal. 'replace' evita que pueda
        // volver a la página de login con el botón de "atrás" del navegador.
        return <Navigate to={redirectTo} replace />;
    }

    // Si no hay datos de usuario (y la carga ha terminado), significa que no está
    // autenticado, por lo que se le permite ver la ruta pública anidada (login, register, etc.).
    return <Outlet />;
};

export default PublicRouteOnly;