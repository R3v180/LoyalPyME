// frontend/src/components/layout/AdminNavbar.tsx
// Version: 1.1.0 (Add Waiter Pickup Station link)

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
    IconToolsKitchen,
    IconClipboardText, // <--- NUEVO ICONO IMPORTADO (o el que prefieras)
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { UserData } from '../../types/customer';
import { UserRole } from '../../types/customer'; // <--- IMPORTAR UserRole

interface AdminNavbarProps {
    pathname: string;
    closeNavbar: () => void;
    userData: UserData | null;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pathname, closeNavbar, userData }) => {
    const { t } = useTranslation();

    const allPossibleNavLinks = [
        {
            to: "/admin/dashboard",
            labelKey: 'adminCommon.dashboard',
            icon: IconGauge,
            // Condición: Siempre mostrar para BUSINESS_ADMIN. Otros roles de staff NO deberían ver esto.
            showCondition: userData?.role === UserRole.BUSINESS_ADMIN,
        },
        // --- Enlaces LoyalPyME Core (LCo) ---
        {
            to: "/admin/dashboard/rewards",
            labelKey: 'adminCommon.rewards',
            icon: IconGift,
            showCondition: userData?.isLoyaltyCoreActive === true && userData?.role === UserRole.BUSINESS_ADMIN,
        },
        {
            to: "/admin/dashboard/generate-qr",
            labelKey: 'adminCommon.generateQr',
            icon: IconQrcode,
            showCondition: userData?.isLoyaltyCoreActive === true && userData?.role === UserRole.BUSINESS_ADMIN,
        },
        {
            to: "/admin/dashboard/customers",
            labelKey: 'adminCommon.customers',
            icon: IconUsers,
            // Mostrar si LCo o Camarero están activos y el rol es BUSINESS_ADMIN
            showCondition: (userData?.isLoyaltyCoreActive === true || userData?.isCamareroActive === true) && userData?.role === UserRole.BUSINESS_ADMIN,
        },
        {
            to: "/admin/dashboard/tiers/manage",
            labelKey: 'adminCommon.manageTiers',
            icon: IconStairsUp,
            showCondition: userData?.isLoyaltyCoreActive === true && userData?.role === UserRole.BUSINESS_ADMIN,
        },
        {
            to: "/admin/dashboard/tiers/settings",
            labelKey: 'adminCommon.tierSettings',
            icon: IconSettings,
            showCondition: userData?.isLoyaltyCoreActive === true && userData?.role === UserRole.BUSINESS_ADMIN,
        },
        // --- Enlaces Módulo Camarero (LC) para BUSINESS_ADMIN ---
        {
            to: "/admin/dashboard/camarero/menu-editor",
            labelKey: 'adminCamarero.manageMenu.title',
            icon: IconToolsKitchen,
            showCondition: userData?.isCamareroActive === true && userData?.role === UserRole.BUSINESS_ADMIN,
        },
        // --- NUEVO ENLACE PARA ESTACIÓN DE RECOGIDA DEL CAMARERO ---
        // Este enlace debe ser visible para WAITER y BUSINESS_ADMIN si el módulo Camarero está activo.
        // El KDS tiene su propia ruta directa (/admin/kds) y no suele estar en esta navbar.
        {
            to: "/admin/waiter/pickup", // Ruta que definimos en index.tsx
            labelKey: 'waiterInterface.navLinkPickup', // Clave de i18n para "Recoger Pedidos" o "Pickup Station"
            icon: IconClipboardText, // O IconTruckDelivery, IconBellRinging, etc.
            showCondition: userData?.isCamareroActive === true &&
                           (userData?.role === UserRole.WAITER || userData?.role === UserRole.BUSINESS_ADMIN)
        },
    ];

    // Filtrar enlaces visibles (sin cambios)
    const navLinksToShow = allPossibleNavLinks.filter(link => link.showCondition);
    // console.log("[AdminNavbar] userData PROPS received:", JSON.stringify(userData, null, 2)); // Descomentar para debug si es necesario
    // console.log("[AdminNavbar] Links to show:", navLinksToShow.map(l => l.labelKey)); // Descomentar para debug si es necesario

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