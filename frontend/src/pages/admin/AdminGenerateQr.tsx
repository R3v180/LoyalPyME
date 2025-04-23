// File: frontend/src/pages/admin/AdminGenerateQr.tsx
// Version: 1.0.0 (Component for Generate QR Section)

import React from 'react';

// Importar el componente que contiene la lógica y el formulario
import GenerateQrCode from '../../components/GenerateQrCode'; // Ajusta si la ruta relativa es diferente

// Importar componentes de Mantine para layout básico
import { Paper, Stack, Title } from '@mantine/core';

const AdminGenerateQr: React.FC = () => {
    return (
        // Usamos Paper para mantener consistencia visual con otras secciones
        <Paper shadow="xs" p="lg" withBorder radius="lg">
            <Stack gap="md">
                <Title order={2}>Generar QR de Puntos</Title>
                {/* Renderizamos el componente que ya teníamos */}
                <GenerateQrCode />
            </Stack>
        </Paper>
    );
};

export default AdminGenerateQr;

// End of File: frontend/src/pages/admin/AdminGenerateQr.tsx