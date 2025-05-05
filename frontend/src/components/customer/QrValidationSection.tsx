// filename: frontend/src/components/customer/QrValidationSection.tsx
// Version: 2.3.0 (Disable Scan QR button on non-mobile devices)

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Group, TextInput, Button, Modal, Stack, Alert, Text, Box, Tooltip // <-- Añadido Tooltip
} from '@mantine/core';
import { IconAlertCircle, IconScan, IconTicket } from '@tabler/icons-react';
import { useQrScanner } from '../../hooks/useQrScanner';
import { useMediaQuery } from '@mantine/hooks'; // <-- Importar useMediaQuery
import { useTranslation } from 'react-i18next'; // <-- Importar i18n

// Props (sin cambios)
interface QrValidationSectionProps {
    onValidate: (token: string) => Promise<void>;
    isValidating: boolean;
    scannerOpened: boolean;
    onOpenScanner: () => void;
    onCloseScanner: () => void;
}

const QrValidationSection: React.FC<QrValidationSectionProps> = ({
    onValidate,
    isValidating,
    scannerOpened,
    onOpenScanner,
    onCloseScanner
}) => {
    const { t } = useTranslation(); // <-- Hook i18n
    const [qrTokenInput, setQrTokenInput] = useState('');
    const qrcodeRegionId = "html5qr-code-reader-region";
    // --- NUEVO: Detectar si es móvil (ajusta el breakpoint si es necesario) ---
    const isMobile = useMediaQuery('(max-width: em(768px))');
    // --- FIN NUEVO ---

    // Hook useQrScanner (sin cambios en su llamada, pero el botón ahora puede no llamarlo)
    const handleScanSuccess = useCallback((decodedText: string) => {
        if (!isValidating) {
            onValidate(decodedText);
            onCloseScanner();
        }
    }, [isValidating, onValidate, onCloseScanner]);

    const { scannerError, clearScannerError } = useQrScanner({
        qrcodeRegionId: qrcodeRegionId,
        enabled: scannerOpened, // Solo se activa si el modal se abre
        onScanSuccess: handleScanSuccess,
        config: { fps: 10, qrbox: { width: 250, height: 250 } }
    });

    // Handler envío manual (sin cambios)
    const handleManualSubmit = () => {
        if (qrTokenInput.trim() && !isValidating) {
            onValidate(qrTokenInput.trim());
        }
    };

    // Limpiar error del scanner al cerrar el modal manualmente (sin cambios)
    const handleCloseModal = () => {
        clearScannerError();
        onCloseScanner();
    };

    // --- NUEVO: Texto para el Tooltip del botón deshabilitado ---
    const scanButtonTooltip = !isMobile ? t('customerDashboard.scanButtonDisabledTooltip', 'Escanear QR solo disponible en móvil') : '';
    // --- FIN NUEVO ---

    // JSX
    return (
        <>
            <Paper shadow="sm" p="lg" mb="xl" withBorder radius="lg">
                {/* Título traducido */}
                <Title order={4} mb="md">{t('customerDashboard.validateQrSectionTitle', 'Validar Código QR')}</Title>
                <Group align="flex-end">
                     <TextInput
                        // Labels/Placeholders traducidos
                        label={t('customerDashboard.qrInputLabel', 'Introduce el código del ticket/QR')}
                        placeholder={t('customerDashboard.qrInputPlaceholder', 'Pega el código aquí...')}
                        value={qrTokenInput}
                        onChange={(event) => setQrTokenInput(event.currentTarget.value)}
                        style={{ flexGrow: 1 }}
                        disabled={isValidating || scannerOpened}
                    />
                     <Button
                        onClick={handleManualSubmit}
                        leftSection={<IconTicket size={18} />}
                        loading={isValidating && !scannerOpened}
                        disabled={!qrTokenInput.trim() || isValidating || scannerOpened}
                        variant='outline'>
                        {/* Texto botón traducido */}
                        {t('customerDashboard.validateButton', 'Validar Código')}
                    </Button>

                    {/* --- NUEVO: Tooltip alrededor del botón Scan --- */}
                    <Tooltip label={scanButtonTooltip} disabled={isMobile} withArrow position="top">
                        {/* Usamos un Box o Group como wrapper porque a veces Tooltip no funciona bien directamente sobre Button disabled */}
                        <Box>
                            <Button
                                onClick={onOpenScanner}
                                leftSection={<IconScan size={18} />}
                                // --- NUEVO: Deshabilitar si no es móvil ---
                                disabled={isValidating || !isMobile}
                                // --- FIN NUEVO ---
                                variant='gradient'
                                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                            >
                                {/* Texto botón traducido */}
                                {t('customerDashboard.scanButton', 'Escanear QR')}
                            </Button>
                        </Box>
                    </Tooltip>
                    {/* --- FIN Tooltip --- */}

                </Group>
            </Paper>

            {/* Modal (sin cambios funcionales, pero añadimos traducción) */}
            <Modal
                opened={scannerOpened}
                onClose={handleCloseModal}
                title={t('customerDashboard.scanModalTitle', 'Escanear Código QR')}
                size="auto"
                centered
            >
                <Stack>
                   <Text size="sm" ta="center" c="dimmed">{t('customerDashboard.scanInstructions', 'Apunta la cámara al código QR')}</Text>
                    <Box id={qrcodeRegionId} w="100%"></Box>
                    {scannerError && (
                        <Alert
                            icon={<IconAlertCircle size="1rem" />}
                            // Título traducido
                            title={t('customerDashboard.errorScanningQr', 'Error de Escáner')}
                            color="red"
                            withCloseButton
                            onClose={clearScannerError}
                            mt="sm"
                        >
                            {scannerError}
                        </Alert>
                     )}
                    {isValidating && <Group justify='center'><Text>{t('customerDashboard.validating', 'Validando...')}</Text></Group>}
                    <Button variant="outline" onClick={handleCloseModal} disabled={isValidating}>
                        {/* Texto botón traducido */}
                       {t('customerDashboard.scanCancelButton', 'Cancelar Escaneo')}
                    </Button>
                </Stack>
            </Modal>
        </>
    );
};

export default QrValidationSection;

// End of File: frontend/src/components/customer/QrValidationSection.tsx