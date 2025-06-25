// filename: frontend/src/pages/admin/AdminGenerateQr.tsx
import React from 'react';
import GenerateQrCode from '../../components/GenerateQrCode';
import { Paper, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const AdminGenerateQr: React.FC = () => {
    const { t } = useTranslation();

    return (
        <Paper shadow="xs" p="lg" withBorder radius="lg">
            <Stack gap="md">
                {/* Usamos la clave del título de la tarjeta de acceso rápido que ya teníamos */}
                <Title order={2}>{t('adminOverview.cardQrTitle')}</Title>
                <GenerateQrCode />
            </Stack>
        </Paper>
    );
};

export default AdminGenerateQr;