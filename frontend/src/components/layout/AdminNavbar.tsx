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
    IconToolsKitchen,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { UserData } from '../../types/customer';

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
            showCondition: true
        },
        {
            to: "/admin/dashboard/rewards",
            labelKey: 'adminCommon.rewards',
            icon: IconGift,
            showCondition: userData?.isLoyaltyCoreActive === true
        },
        {
            to: "/admin/dashboard/generate-qr",
            labelKey: 'adminCommon.generateQr',
            icon: IconQrcode,
            showCondition: userData?.isLoyaltyCoreActive === true
        },
        {
            to: "/admin/dashboard/customers",
            labelKey: 'adminCommon.customers',
            icon: IconUsers,
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
        // Enlace para Gestión de Menú del Módulo Camarero
        {
            to: "/admin/dashboard/camarero/menu-editor", // Ruta final
            labelKey: 'adminCamarero.manageMenu.title', // Clave de i18n para el título de la página
            icon: IconToolsKitchen,
            showCondition: userData?.isCamareroActive === true
        },
        // Puedes añadir más enlaces para el módulo Camarero aquí
        // {
        //     to: "/admin/dashboard/camarero/tables",
        //     labelKey: 'adminCamarero.manageTables', // Deberás crear esta clave i18n
        //     icon: IconTable, // Necesitarías importar IconTable de @tabler/icons-react
        //     showCondition: userData?.isCamareroActive === true
        // },
    ];

    const navLinksToShow = allPossibleNavLinks.filter(link => link.showCondition);
    // console.log("[AdminNavbar] userData PROPS received:", JSON.stringify(userData, null, 2));
    // console.log("[AdminNavbar] Links to show:", navLinksToShow.map(l => l.labelKey));


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