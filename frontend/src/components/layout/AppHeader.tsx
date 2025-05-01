// filename: frontend/src/components/layout/AppHeader.tsx
// Version: 1.4.2 (Fix closing tag, dividers, unused imports)

import React from 'react';
// --- FIX: Remove ActionIcon, Add Divider ---
import {
    Group, Burger, Title, Text, Skeleton, Button, Menu, UnstyledButton, Box
} from '@mantine/core';
// --- FIX: Remove IconWorld ---
import { IconUserCircle, IconLogout, IconChevronDown } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import ReactCountryFlag from 'react-country-flag';
import { Link, useNavigate } from 'react-router-dom';
// --- FIX: Remove unused hook import ---
// import useLayoutUserData from '../../hooks/useLayoutUserData';
// --- END FIX ---

// Interfaces
interface LayoutUserData { name?: string | null; email: string; role: string; }
interface AppHeaderProps {
    userData: LayoutUserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
    navbarOpened?: boolean;
    toggleNavbar?: () => void;
    showAdminNavbar?: boolean;
}

// Logo Component
const Logo = () => (
    // --- FIX: Wrap Title in Link ---
    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Title order={4}>LoyalPyME</Title>
    </Link>
    // --- END FIX ---
);

const AppHeader: React.FC<AppHeaderProps> = ({
    userData,
    loadingUser,
    handleLogout,
    navbarOpened,
    toggleNavbar,
    showAdminNavbar = false,
}) => {
    const { i18n, t } = useTranslation();
    const [mobileMenuOpened, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);
    const navigate = useNavigate();

    // --- FIX: Call closeMobileMenu on language change ---
    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        closeMobileMenu();
    };
    // --- END FIX ---

    const currentCountryCode = i18n.resolvedLanguage === 'es' ? 'ES' : 'GB';
    const languages = [
        { code: 'es', name: 'Español', country: 'ES' },
        { code: 'en', name: 'English', country: 'GB' },
    ];

    // --- FIX: Call closeMobileMenu on logout ---
    const onLogoutClick = () => {
        handleLogout();
        closeMobileMenu();
        navigate('/login', { replace: true });
    };
    // --- END FIX ---

    // Internal LogoutButton component
    const LogoutButtonInternal = () => ( <Button onClick={onLogoutClick} variant="light" color="red" size="sm" leftSection={<IconLogout size={16}/>}>{t('header.logoutButton')}</Button> );

    // Internal LanguageSwitcher for Desktop
    const LanguageSwitcherDesktop = () => (
        <Menu shadow="md" width={150} trigger="hover" openDelay={100} closeDelay={200}>
            <Menu.Target>
                <UnstyledButton style={{ display: 'flex', alignItems: 'center', padding: '5px', borderRadius: 'var(--mantine-radius-sm)'}}>
                    <ReactCountryFlag countryCode={currentCountryCode} svg style={{ display: 'block', width: '1.4em', height: '1.4em' }} aria-label={currentCountryCode} />
                    <IconChevronDown size={16} stroke={1.5} style={{ marginLeft: '4px', color: 'var(--mantine-color-dimmed)' }} />
                </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>{t('header.languageLabel')}</Menu.Label>
                {languages.map((lang) => ( <Menu.Item key={lang.code} leftSection={<ReactCountryFlag countryCode={lang.country} svg style={{ fontSize: '1.1em', display:'block' }} />} onClick={() => changeLanguage(lang.code)} disabled={i18n.resolvedLanguage === lang.code}>{lang.name}</Menu.Item> ))}
            </Menu.Dropdown>
        </Menu>
    );

    return (
        <Box component="header" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} px={{ base: 'sm', sm: 'md' }}>
            {/* Grupo Izquierda */}
            <Group gap="xs">
                {showAdminNavbar && toggleNavbar && ( <Burger opened={navbarOpened ?? false} onClick={toggleNavbar} hiddenFrom="sm" size="sm"/> )}
                <Logo />
            </Group>

            {/* Grupo Derecha */}
            {loadingUser ? (
                <Skeleton height={30} width={120} />
            ) : userData ? (
                <Group gap="sm">
                    {/* Controles Escritorio */}
                    <Group visibleFrom="sm" gap="sm">
                        <Text size="sm" truncate> <IconUserCircle size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {t('header.greeting', { name: userData.name || userData.email })} </Text>
                        <LanguageSwitcherDesktop />
                        <LogoutButtonInternal />
                    </Group>
                     {/* Menú Burger Móvil */}
                     <Box hiddenFrom="sm">
                         <Menu shadow="md" width={200} opened={mobileMenuOpened} onChange={toggleMobileMenu} position="bottom-end">
                            <Menu.Target>
                                 <Burger opened={mobileMenuOpened} onClick={toggleMobileMenu} aria-label="Toggle navigation" size="sm"/>
                            </Menu.Target>
                            {/* --- FIX: Add Dividers --- */}
                            <Menu.Dropdown>
                                <Menu.Label>{userData.name || userData.email}</Menu.Label>
                                <Menu.Divider />
                                <Menu.Label>{t('header.languageLabel')}</Menu.Label>
                                {languages.map((lang) => (
                                    <Menu.Item key={lang.code} leftSection={<ReactCountryFlag countryCode={lang.country} svg style={{ fontSize: '1.1em', display:'block' }} />} onClick={() => changeLanguage(lang.code)} disabled={i18n.resolvedLanguage === lang.code}>
                                        {lang.name}
                                    </Menu.Item>
                                ))}
                                <Menu.Divider />
                                 <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={onLogoutClick}>
                                     {t('header.logoutButton')}
                                 </Menu.Item>
                            </Menu.Dropdown>
                            {/* --- END FIX --- */}
                        </Menu>
                    </Box>
                </Group>
            ) : null }
        {/* --- FIX: Add Closing Tag --- */}
        </Box>
        // --- END FIX ---
    );
};

export default AppHeader;

// End of File: frontend/src/components/layout/AppHeader.tsx