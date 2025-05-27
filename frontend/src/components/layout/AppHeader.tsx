// frontend/src/components/layout/AppHeader.tsx
// Version: 1.6.1 (Remove unused IconHome import and navigate variable)

import React from 'react';
import {
    Group, Burger, Skeleton, Button, Menu, UnstyledButton, Box, Text,
    Container
} from '@mantine/core';
import { 
    IconUserCircle, 
    IconLogout, 
    IconChevronDown, 
    // IconHome // <--- ELIMINADO IconHome
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import ReactCountryFlag from 'react-country-flag';
import { Link 
    // , useNavigate // <--- ELIMINADO useNavigate si no se usa
} from 'react-router-dom';

// Interfaz LayoutUserData
interface LayoutUserData {
    id: string;
    name?: string | null;
    email: string;
    role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL';
}

interface AppHeaderProps {
    userData: LayoutUserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
    navbarOpened?: boolean;
    toggleNavbar?: () => void;
    showAdminNavbar?: boolean;
}

// Componente Logo
const Logo: React.FC<{ homePath: string }> = ({ homePath }) => (
    <Link 
        to={homePath} 
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }} 
        aria-label={homePath === "/" || homePath === "/login" ? "Ir a la página de inicio de sesión" : "Ir a mi panel principal"}
    >
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
    // const navigate = useNavigate(); // <--- ELIMINADO SI NO SE USA

    let logoLinkPath = "/"; 

    if (userData) {
        if (userData.role === 'CUSTOMER_FINAL') {
            logoLinkPath = "/customer/dashboard";
        } else if (userData.role === 'BUSINESS_ADMIN') {
            logoLinkPath = "/admin/dashboard";
        } else if (userData.role === 'SUPER_ADMIN') {
            logoLinkPath = "/superadmin";
        }
    }

    const changeLanguage = (lang: string) => { i18n.changeLanguage(lang); closeMobileMenu(); };
    const currentCountryCode = i18n.resolvedLanguage === 'es' ? 'ES' : 'GB';
    const languages = [ { code: 'es', name: 'Español', country: 'ES' }, { code: 'en', name: 'English', country: 'GB' }, ];
    
    const onLogoutClick = () => { 
        handleLogout(); 
        closeMobileMenu(); 
    };

    const LogoutButtonInternal = () => ( <Button onClick={onLogoutClick} variant="light" color="red" size="sm" leftSection={<IconLogout size={16}/>}>{t('header.logoutButton')}</Button> );
    
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
        <Box component="header" h="100%">
            <Container size="lg" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Group gap="xs">
                    {showAdminNavbar && toggleNavbar && ( <Burger opened={navbarOpened ?? false} onClick={toggleNavbar} hiddenFrom="sm" size="sm"/> )}
                    <Logo homePath={logoLinkPath} />
                </Group>

                {loadingUser ? ( <Skeleton height={30} width={120} /> )
                 : userData ? (
                    <Group gap="sm">
                        <Group visibleFrom="sm" gap="sm">
                            <Text size="sm" truncate> 
                                <IconUserCircle size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
                                {t('header.greeting', { name: userData.name || userData.email })} 
                            </Text>
                            <LanguageSwitcherDesktop />
                            <LogoutButtonInternal />
                        </Group>
                         <Box hiddenFrom="sm">
                             <Menu shadow="md" width={200} opened={mobileMenuOpened} onChange={toggleMobileMenu} position="bottom-end">
                                <Menu.Target>
                                     <Burger opened={mobileMenuOpened} onClick={toggleMobileMenu} aria-label={t('header.toggleNavigation', 'Toggle navigation')} size="sm"/>
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
                ) : (
                    <Group>
                        <LanguageSwitcherDesktop /> 
                    </Group>
                )}
            </Container>
        </Box>
    );
};

export default AppHeader;