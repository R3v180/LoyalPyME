// filename: frontend/src/components/customer/UserInfoDisplay.tsx
// Version: 1.1.0 (Implement i18n using useTranslation)

import React from 'react';
import {
    Paper, Stack, Skeleton, Title, Text, Group, Badge, Alert
} from '@mantine/core';
import { IconUserCircle, IconAlertCircle } from '@tabler/icons-react';
// --- NUEVO: Importar hook de traducción ---
import { useTranslation } from 'react-i18next';
// --- FIN NUEVO ---

// Importar tipos (sin cambios)
import { UserData } from '../../hooks/useUserProfileData'; // Ajusta ruta si es necesario

interface UserInfoDisplayProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ userData, loadingUser, errorUser }) => {
    // --- NUEVO: Obtener función t ---
    const { t } = useTranslation();
    // --- FIN NUEVO ---

    // --- JSX MODIFICADO ---
    return (
        <Paper shadow="sm" p="lg" mb="xl" withBorder>
            {loadingUser ? (
                <Stack w="100%">
                    <Skeleton height={30} width="60%" />
                    <Skeleton height={50} width="40%" />
                    <Skeleton height={25} width="30%" mt="sm" />
                </Stack>
            ) : userData ? (
                <Stack gap="xs">
                    <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconUserCircle size={28} stroke={1.5} />
                        {userData.name || userData.email} {/* El nombre/email no se traduce */}
                    </Title>
                    {/* Usar t() para " Puntos" */}
                    <Text size="xl" fw={700} c="blue">
                        {userData.points} {t('customerDashboard.points')}
                    </Text>
                    <Group mt="sm">
                         {/* Usar t() para "Nivel Actual:" */}
                        <Text fw={500}>{t('customerDashboard.currentTier')}</Text>
                        {userData.currentTier ? (
                            <Badge color="teal" size="lg" variant="light">
                                {userData.currentTier.name} {/* El nombre del nivel viene de BD */}
                            </Badge>
                         ) : (
                             // Usar t() para "Básico"
                            <Badge color="gray" size="lg" variant="light">
                                {t('customerDashboard.baseTier')}
                             </Badge>
                        )}
                    </Group>
                </Stack>
            ) : (
                 // Usar t() para título y mensaje del Alert
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title={t('customerDashboard.errorLoadingProfileTitle')}
                    color="red"
                >
                    {/* El error específico viene de la prop, pero usamos t() para el default */}
                    {errorUser || t('customerDashboard.errorLoadingProfileDefault')}
                </Alert>
            )}
        </Paper>
     // --- FIN JSX MODIFICADO ---
    );
};

export default UserInfoDisplay;

// End of File: frontend/src/components/customer/UserInfoDisplay.tsx