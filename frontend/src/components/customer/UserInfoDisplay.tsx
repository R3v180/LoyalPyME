// filename: frontend/src/components/customer/UserInfoDisplay.tsx
// Version: 1.0.0 (Component to display user info card)

import React from 'react';
import {
    Paper,
    Group,
    Stack,
    Title,
    Text,
    Badge,
    Skeleton,
    Alert // Mantener Alert por si pasamos un error en el futuro
} from '@mantine/core';
import { IconUserCircle, IconAlertCircle } from '@tabler/icons-react';

// Interfaz UserData (copiada/adaptada de CustomerDashboardPage)
// Idealmente, este tipo vendría de un archivo central de tipos
interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    role: string; // Aunque no se use aquí directamente, es parte del objeto
    currentTier?: {
        id: string;
        name: string;
    } | null;
}

// Props que espera este componente
interface UserInfoDisplayProps {
    loading: boolean;
    userData: UserData | null;
    error?: string | null; // Prop opcional para mostrar errores de carga de usuario
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ loading, userData, error }) => {

    // Si hay error y no hay datos, mostrar alerta
    if (error && !userData && !loading) {
        return (
             <Paper shadow="sm" p="lg" mb="xl" withBorder>
                 <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                     {error || 'No se pudieron cargar los datos del usuario.'}
                 </Alert>
             </Paper>
        );
    }

    // Si está cargando, mostrar Skeletons
    if (loading) {
        return (
            <Paper shadow="sm" p="lg" mb="xl" withBorder>
                <Group justify="space-between" align="flex-start">
                     <Stack w="100%">
                         <Skeleton height={30} width="60%" />
                         <Skeleton height={50} width="40%" />
                         <Skeleton height={25} width="30%" mt="sm" />
                     </Stack>
                </Group>
            </Paper>
        );
    }

    // Si no está cargando y no hay datos (caso raro, pero posible)
    if (!userData) {
         return (
             <Paper shadow="sm" p="lg" mb="xl" withBorder>
                 <Text c="dimmed">No se encontraron datos del usuario.</Text>
             </Paper>
         );
    }

    // Si todo está bien, mostrar los datos del usuario
    return (
        <Paper shadow="sm" p="lg" mb="xl" withBorder>
            <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                    <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconUserCircle size={28} />
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
                                Básico
                            </Badge>
                        )}
                    </Group>
                </Stack>
                {/* Aquí podríamos añadir un botón para editar perfil en el futuro si quisiéramos */}
            </Group>
        </Paper>
    );
};

export default UserInfoDisplay;