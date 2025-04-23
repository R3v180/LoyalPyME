// File: frontend/src/pages/admin/AdminOverview.tsx
// Version: 1.0.0 (Placeholder component for the main admin dashboard view)

import React from 'react';
import { Paper, Title, Text, Stack } from '@mantine/core';

const AdminOverview: React.FC = () => {
    return (
        <Paper shadow="xs" p="lg" withBorder radius="lg">
            <Stack>
                <Title order={2}>Dashboard Principal</Title>
                <Text c="dimmed">
                    Bienvenido al panel de administración.
                </Text>
                <Text>
                    (Aquí se podrían mostrar estadísticas rápidas, gráficos, o accesos directos a las secciones principales).
                </Text>
                 {/* Añadir contenido del dashboard aquí en el futuro */}
            </Stack>
        </Paper>
    );
};

export default AdminOverview;

// End of File: frontend/src/pages/admin/AdminOverview.tsx