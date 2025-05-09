// frontend/src/components/layout/AdminNavbar.tsx
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
    IconToolsKitchen, // Para módulo Camarero
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Importar UserData desde el archivo de tipos central
import type { UserData } from '../../types/customer'; // Ajusta la ruta si es necesario

interface AdminNavbarProps {
    pathname: string;
    closeNavbar: () => void;
    userData: UserData | null; // userData ahora es del tipo UserData completo
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pathname, closeNavbar, userData }) => {
    const { t } = useTranslation();

    // Definimos todos los enlaces posibles con una condición para mostrarlos
    const allPossibleNavLinks = [
        {
            to: "/admin/dashboard",
            labelKey: 'adminCommon.dashboard',
            icon: IconGauge,
            showCondition: true // El dashboard principal siempre se muestra para un BUSINESS_ADMIN
        },
        {
            to: "/admin/dashboard/rewards",
            labelKey: 'adminCommon.rewards',
            icon: IconGift,
            showCondition: userData?.isLoyaltyCoreActive === true
        },
        {
            to: "/admin/dashboard/generate-qr", // QR de puntos (LCo)
            labelKey: 'adminCommon.generateQr',
            icon: IconQrcode,
            showCondition: userData?.isLoyaltyCoreActive === true
        },
        {
            to: "/admin/dashboard/customers",
            labelKey: 'adminCommon.customers',
            icon: IconUsers,
            // Mostrar Clientes si CUALQUIERA de los módulos principales está activo,
            // o si se considera una función base del admin.
            showCondition: userData?.isLoyaltyCoreActive === true || userData?.isCamareroActive === true
        },
        {
            to: "/admin/dashboard/tiers/manage",
            labelKey: 'adminCommon.manageTiers',
            icon: IconStairsUp,
            showCondition: userData?.isLoyaltyCoreActive === true
        },
        {
            to: "/admin/dashboard/tiers/settings",
            labelKey: 'adminCommon.tierSettings',
            icon: IconSettings,
            showCondition: userData?.isLoyaltyCoreActive === true
        },
        // Enlaces PLACEHOLDER para el Módulo Camarero
        {
            to: "/admin/dashboard/camarero/menu",
            labelKey: 'adminCamarero.manageMenu', // Necesitarás añadir esta clave i18n
            icon: IconToolsKitchen,
            showCondition: userData?.isCamareroActive === true
        },
        // Podrías añadir más enlaces para Camarero aquí (ej: mesas, personal, etc.)
        // {
        //     to: "/admin/dashboard/camarero/tables",
        //     labelKey: 'adminCamarero.manageTables',
        //     icon: IconTable, // Necesitarías importar IconTable
        //     showCondition: userData?.isCamareroActive === true
        // },
    ];

    // Filtramos los enlaces que se deben mostrar
    const navLinksToShow = allPossibleNavLinks.filter(link => link.showCondition);

    // Añadimos un pequeño log para ver qué userData recibe AdminNavbar
    // console.log("[AdminNavbar] userData received:", userData);

    return (
        <>
            {navLinksToShow.map((link) => (
                <NavLink
                    key={link.to}
                    label={t(link.labelKey)}
                    leftSection={<link.icon size="1rem" stroke={1.5} />}
                    component={Link}
                    to={link.to}
                    active={pathname.startsWith(link.to) && (pathname === link.to || pathname.startsWith(link.to + '/'))}
                    onClick={closeNavbar}
                />
            ))}
        </>
    );
};

export default AdminNavbar;