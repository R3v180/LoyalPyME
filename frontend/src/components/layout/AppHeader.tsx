// filename: frontend/src/components/layout/AppHeader.tsx
// Version: 1.3.10 (Revert to react-country-flag, adjust layout)

import React from 'react';
import {
    Group,
    Burger,
    Title,
    Text,
    Skeleton,
    Button,
    Menu,
    ActionIcon, // Re-añadido ActionIcon para el botón de bandera
    } from '@mantine/core';
import { IconUserCircle, IconLogout, IconChevronDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
// --- Volver a importar ReactCountryFlag ---
import ReactCountryFlag from 'react-country-flag';
// -----------------------------------------


// Interfaces (sin cambios)
interface LayoutUserData {
    name?: string | null;
    email: string;
    role: string;
}
interface AppHeaderProps {
    userData: LayoutUserData | null;
    loadingUser: boolean;
    handleLogout: () => void;
    navbarOpened: boolean;
    toggleNavbar: () => void;
    showAdminNavbar: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    userData,
    loadingUser,
    handleLogout,
    navbarOpened,
    toggleNavbar,
    showAdminNavbar,
}) => {
    const { i18n, t } = useTranslation();

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    // Usar códigos de país ISO
    const currentCountryCode = i18n.resolvedLanguage === 'es' ? 'ES' : 'GB';


    const renderUserControls = () => {
        // ... (sin cambios) ...
        if (loadingUser) { return <Skeleton height={30} width={120} />; }
        if (userData) {
            return ( <Group gap="sm"> <Text size="sm" visibleFrom="xs"> <IconUserCircle size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {t('header.greeting', { name: userData.name || userData.email })} </Text> <Button onClick={handleLogout} variant="light" color="red" size="sm" leftSection={<IconLogout size={16}/>}> {t('header.logoutButton')} </Button> </Group> );
        }
        return null;
    };

    return (
        <Group h="100%" px="md" justify="space-between">
            {/* Burger y Título */}
            <Group>
                <Burger opened={navbarOpened} onClick={toggleNavbar} hiddenFrom="sm" size="sm" style={{ visibility: showAdminNavbar ? 'visible' : 'hidden' }} />
                 <Title order={4} >LoyalPyME</Title>
            </Group>

            {/* Grupo Derecha: Controles Usuario + [Selector Bandera + Texto Idioma] */}
            <Group gap="sm">
                 {renderUserControls()}

                 {/* --- Estructura Corregida: Menú de Bandera y Texto al lado --- */}
                 <Group gap={5} align="center">
                    <Menu shadow="md" width={150} trigger="hover" openDelay={100} closeDelay={200}>
                        <Menu.Target>
                            <ActionIcon variant="default" size="lg" aria-label="Seleccionar idioma">
                                <ReactCountryFlag
                                    countryCode={currentCountryCode}
                                    svg
                                    style={{ display: 'block', width: '1.3em', height: '1.3em' }}
                                    aria-label={currentCountryCode}
                                />
                             </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Label>{t('header.languageLabel')}</Menu.Label>
                            <Menu.Item
                                leftSection={<ReactCountryFlag countryCode="ES" svg style={{ fontSize: '1.1em', display:'block' }} />}
                                onClick={() => changeLanguage('es')}
                                disabled={i18n.resolvedLanguage === 'es'}
                            >
                                Español
                            </Menu.Item>
                            <Menu.Item
                                 leftSection={<ReactCountryFlag countryCode="GB" svg style={{ fontSize: '1.1em', display:'block' }}/>}
                                 onClick={() => changeLanguage('en')}
                                 disabled={i18n.resolvedLanguage === 'en'}
                            >
                                English
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                    {/* Texto al lado del menú */}
                    <Text size="sm" visibleFrom="xs">{t('header.languageLabel')}</Text>
                     <IconChevronDown size={14} stroke={1.5} style={{ marginLeft: '-8px', color: 'var(--mantine-color-dimmed)' }} />
                 </Group>
                 {/* --- FIN Estructura Corregida --- */}

            </Group>
        </Group>
    );
};

export default AppHeader;

// End of File: frontend/src/components/layout/AppHeader.tsx