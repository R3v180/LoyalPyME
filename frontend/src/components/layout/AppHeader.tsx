// filename: frontend/src/components/layout/AppHeader.tsx
// Version: 1.5.1 (Constrain header content width using Container)

import React from 'react';
// Imports necesarios
import {
    Group, Burger, Skeleton, Button, Menu, UnstyledButton, Box, Text,
    Container // <--- AÑADIR Container
} from '@mantine/core';
import { IconUserCircle, IconLogout, IconChevronDown } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import ReactCountryFlag from 'react-country-flag';
import { Link, useNavigate } from 'react-router-dom';

// Interfaces (sin cambios)
interface LayoutUserData { name?: string | null; email: string; role: string; }
interface AppHeaderProps {
    userData: LayoutUserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
    navbarOpened?: boolean;
    toggleNavbar?: () => void;
    showAdminNavbar?: boolean;
}

// Componente Logo (sin cambios desde la versión con imagen)
const Logo = () => (
    <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
        <img
            src="/loyalpymelogo.jpg"
            alt="LoyalPyME Logo"
            style={{ height: '40px', width: 'auto', display: 'block' }}
        />
    </Link>
);

const AppHeader: React.FC<AppHeaderProps> = ({
    userData, loadingUser, handleLogout, navbarOpened, toggleNavbar, showAdminNavbar = false,
}) => {
    const { i18n, t } = useTranslation();
    const [mobileMenuOpened, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);
    const navigate = useNavigate();

    // --- Lógica interna (changeLanguage, onLogoutClick, etc. sin cambios) ---
    const changeLanguage = (lang: string) => { /* ... */ i18n.changeLanguage(lang); closeMobileMenu(); };
    const currentCountryCode = i18n.resolvedLanguage === 'es' ? 'ES' : 'GB';
    const languages = [ { code: 'es', name: 'Español', country: 'ES' }, { code: 'en', name: 'English', country: 'GB' }, ];
    const onLogoutClick = () => { /* ... */ handleLogout(); closeMobileMenu(); navigate('/login', { replace: true }); };
    const LogoutButtonInternal = () => ( <Button onClick={onLogoutClick} variant="light" color="red" size="sm" leftSection={<IconLogout size={16}/>}>{t('header.logoutButton')}</Button> );
    const LanguageSwitcherDesktop = () => ( /* ... código sin cambios ... */
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
    // --- FIN Lógica interna ---

    // --- JSX Principal MODIFICADO ---
    return (
        // El Box exterior ya no necesita controlar el layout principal
        <Box component="header" h="100%">
            {/* Añadimos el Container aquí */}
            <Container size="lg" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Grupo Izquierda (sin cambios internos) */}
                <Group gap="xs">
                    {showAdminNavbar && toggleNavbar && ( <Burger opened={navbarOpened ?? false} onClick={toggleNavbar} hiddenFrom="sm" size="sm"/> )}
                    <Logo />
                </Group>

                {/* Grupo Derecha (sin cambios internos) */}
                {loadingUser ? ( <Skeleton height={30} width={120} /> )
                 : userData ? (
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
                            </Menu>
                         </Box>
                    </Group>
                ) : null }
            {/* Fin Grupo Derecha */}
            </Container>
             {/* Fin Container */}
        </Box>
         // Fin Box exterior
    );
    // --- FIN JSX MODIFICADO ---
};

export default AppHeader;