// filename: frontend/src/components/customer/UserInfoDisplay.tsx
// Version: 1.0.1 (Fix character encoding)

import React from 'react';
import {
    Paper, Stack, Skeleton, Title, Text, Group, Badge, Alert
} from '@mantine/core';
import { IconUserCircle, IconAlertCircle } from '@tabler/icons-react';

// Importamos el tipo UserData (idealmente desde un archivo centralizado)
// TODO: Mover UserData a src/types/user.ts o similar
import { UserData } from '../../hooks/useUserProfileData'; // Ajusta la ruta si es necesario

interface UserInfoDisplayProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ userData, loadingUser, errorUser }) => {
    return (
        <Paper shadow="sm" p="lg" mb="xl" withBorder>
            {loadingUser ? (
                // Skeleton mientras carga
                <Stack w="100%">
                    <Skeleton height={30} width="60%" />
                    <Skeleton height={50} width="40%" />
                    <Skeleton height={25} width="30%" mt="sm" />
                </Stack>
            ) : userData ? (
                // Mostrar datos si existen
                <Stack gap="xs">
                    <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconUserCircle size={28} stroke={1.5} />
                        {userData.name || userData.email}
                    </Title>
                    <Text size="xl" fw={700} c="blue">
                        {userData.points} Puntos
                    </Text>
                    <Group mt="sm">
                        <Text fw={500}>Nivel Actual:</Text>
                        {userData.currentTier ? (
                            <Badge color="teal" size="lg" variant="light">
                                {userData.currentTier.name}
                            </Badge>
                        ) : (
                            <Badge color="gray" size="lg" variant="light">
                                Básico {/* Corregido: Básico */}
                            </Badge>
                        )}
                    </Group>
                </Stack>
            ) : (
                // Mostrar error si existe y no hay datos
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Perfil" color="red">
                    {errorUser || 'No se pudieron cargar los datos del usuario.'}
                </Alert>
            )}
        </Paper>
    );
};

export default UserInfoDisplay;

// End of File: frontend/src/components/customer/UserInfoDisplay.tsx