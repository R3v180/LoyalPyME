// frontend/src/components/layout/AdminNavbar.tsx
// Version: 1.2.1 (Add debug logs for WAITER role)

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
    IconClipboardText,
    IconFileInvoice
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { UserData } from '../../types/customer';
import { UserRole } from '../../types/customer';

interface AdminNavbarProps {
    pathname: string;
    closeNavbar: () => void;
    userData: UserData | null;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pathname, closeNavbar, userData }) => {
    const { t } = useTranslation();

    // ---- DEBUG LOG ----
    // Loguear siempre que userData cambie o el componente se renderice con userData
    if (userData) {
        console.log("[AdminNavbar DEBUG] UserData received in props:", JSON.stringify(userData, null, 2));
        console.log(`[AdminNavbar DEBUG] Current Role: ${userData.role}, IsCamareroActive: ${userData.isCamareroActive}`);

        if (userData.role === UserRole.WAITER) {
            console.log("[AdminNavbar DEBUG - WAITER CONTEXT] Role matches WAITER.");
            const conditionForPickup = userData?.isCamareroActive === true && (userData?.role === UserRole.WAITER || userData?.role === UserRole.BUSINESS_ADMIN);
            console.log("[AdminNavbar DEBUG - WAITER CONTEXT] ShowCondition for '/admin/camarero/pickup':", conditionForPickup);

            const conditionForOrders = userData?.isCamareroActive === true && (userData?.role === UserRole.WAITER || userData?.role === UserRole.BUSINESS_ADMIN);
            console.log("[AdminNavbar DEBUG - WAITER CONTEXT] ShowCondition for '/admin/camarero/orders':", conditionForOrders);
        }
    } else {
        console.log("[AdminNavbar DEBUG] UserData is null.");
    }
    // ---- FIN DEBUG LOG ----

    const allPossibleNavLinks = [
        {
            to: "/admin/dashboard",
            labelKey: 'adminCommon.dashboard',
            icon: IconGauge,
            showCondition: userData?.role === UserRole.BUSINESS_ADMIN,
        },
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
        {
            to: "/admin/dashboard/camarero/menu-editor",
            labelKey: 'adminCamarero.manageMenu.title',
            icon: IconToolsKitchen,
            showCondition: userData?.isCamareroActive === true && userData?.role === UserRole.BUSINESS_ADMIN,
        },
        {
            to: "/admin/camarero/pickup",
            labelKey: 'waiterInterface.navLinkPickup',
            icon: IconClipboardText,
            showCondition: userData?.isCamareroActive === true &&
                           (userData?.role === UserRole.WAITER || userData?.role === UserRole.BUSINESS_ADMIN)
        },
        {
            to: "/admin/camarero/orders",
            labelKey: 'waiterOrderManagement.navLinkTitle',
            icon: IconFileInvoice,
            showCondition: userData?.isCamareroActive === true &&
                           (userData?.role === UserRole.WAITER || userData?.role === UserRole.BUSINESS_ADMIN)
        },
    ];

    const navLinksToShow = allPossibleNavLinks.filter(link => link.showCondition);
    
    // ---- DEBUG LOG ----
    if (userData?.role === UserRole.WAITER) {
      console.log("[AdminNavbar DEBUG - WAITER CONTEXT] Final navLinksToShow for WAITER:", navLinksToShow.map(l => ({ to: l.to, labelKey: l.labelKey })));
    }
    // ---- FIN DEBUG LOG ----


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