// filename: frontend/src/components/layout/AdminNavbar.tsx
// Version: 1.0.0 (Initial component extraction)

import React from 'react';
import { Link } from 'react-router-dom';
import { NavLink } from '@mantine/core';
import {
    IconGauge,
    IconGift,
    IconQrcode,
    IconUsers,
    IconStairsUp,
    IconSettings,
} from '@tabler/icons-react';

// Props que necesita el componente AdminNavbar
interface AdminNavbarProps {
    pathname: string; // Para determinar qué enlace está activo
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pathname }) => {
    // Array de configuración para los enlaces de navegación
    // Facilita añadir/quitar/modificar enlaces en el futuro
    const navLinks = [
        { to: "/admin/dashboard", label: "Dashboard", icon: IconGauge },
        { to: "/admin/dashboard/rewards", label: "Recompensas", icon: IconGift },
        { to: "/admin/dashboard/generate-qr", label: "Generar QR", icon: IconQrcode },
        { to: "/admin/dashboard/customers", label: "Clientes", icon: IconUsers },
        { to: "/admin/dashboard/tiers/manage", label: "Gestionar Niveles", icon: IconStairsUp },
        { to: "/admin/dashboard/tiers/settings", label: "Config. Niveles", icon: IconSettings },
    ];

    return (
        <>
            {navLinks.map((link) => (
                <NavLink
                    key={link.to}
                    label={link.label}
                    leftSection={<link.icon size="1rem" stroke={1.5} />}
                    component={Link}
                    to={link.to}
                    active={pathname === link.to} // Comprueba si la ruta actual coincide
                />
            ))}
        </>
    );
};

export default AdminNavbar;