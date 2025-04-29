// filename: frontend/src/pages/admin/AdminGenerateQr.tsx
// Version: 1.0.1 (Clean up comments)

import React from 'react';
import GenerateQrCode from '../../components/GenerateQrCode';
import { Paper, Stack, Title } from '@mantine/core';

const AdminGenerateQr: React.FC = () => {
    return (
        <Paper shadow="xs" p="lg" withBorder radius="lg">
            <Stack gap="md">
                <Title order={2}>Generar QR de Puntos</Title>
                <GenerateQrCode />
            </Stack>
        </Paper>
    );
};

export default AdminGenerateQr;

// End of File: frontend/src/pages/admin/AdminGenerateQr.tsx