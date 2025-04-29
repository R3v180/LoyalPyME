// filename: frontend/src/components/layout/AdminNavbar.tsx
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
import { useTranslation } from 'react-i18next'; // Importar hook

interface AdminNavbarProps {
    pathname: string;
    closeNavbar: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pathname, closeNavbar }) => {
    const { t } = useTranslation(); // Hook de traducción

    // Usar t() para definir las etiquetas
    const navLinks = [
        { to: "/admin/dashboard", label: t('adminCommon.dashboard'), icon: IconGauge },
        { to: "/admin/dashboard/rewards", label: t('adminCommon.rewards'), icon: IconGift },
        { to: "/admin/dashboard/generate-qr", label: t('adminCommon.generateQr'), icon: IconQrcode },
        { to: "/admin/dashboard/customers", label: t('adminCommon.customers'), icon: IconUsers },
        { to: "/admin/dashboard/tiers/manage", label: t('adminCommon.manageTiers'), icon: IconStairsUp },
        { to: "/admin/dashboard/tiers/settings", label: t('adminCommon.tierSettings'), icon: IconSettings },
    ];

    return (
        <>
            {navLinks.map((link) => (
                <NavLink
                    key={link.to}
                    label={link.label} // La etiqueta ya viene traducida
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