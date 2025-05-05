// filename: frontend/src/components/customer/QrValidationSection.tsx
// Version: 2.3.2 (Remove isMobile check, Add console log for isValidating prop)

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Group, TextInput, Button, Modal, Stack, Alert, Text, Box, 
} from '@mantine/core';
import { IconAlertCircle, IconScan, IconTicket } from '@tabler/icons-react';
import { useQrScanner } from '../../hooks/useQrScanner'; // Asume v1.2.1 con try/catch
// useMediaQuery ya no es necesario
import { useTranslation } from 'react-i18next';

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
    isValidating, // <-- La prop que queremos comprobar
    scannerOpened,
    onOpenScanner,
    onCloseScanner
}) => {
    const { t } = useTranslation();
    const [qrTokenInput, setQrTokenInput] = useState('');
    const qrcodeRegionId = "html5qr-code-reader-region";

    // --- Log de Depuración ---
    console.log('[QrValidationSection] Rendering. isValidating =', isValidating);
    // --- Fin Log ---

    const handleScanSuccess = useCallback((decodedText: string) => { if (!isValidating) { onValidate(decodedText); onCloseScanner(); } }, [isValidating, onValidate, onCloseScanner]);
    const { scannerError, clearScannerError } = useQrScanner({ qrcodeRegionId: qrcodeRegionId, enabled: scannerOpened, onScanSuccess: handleScanSuccess, config: { fps: 10, qrbox: { width: 250, height: 250 } } });
    const handleManualSubmit = () => { if (qrTokenInput.trim() && !isValidating) { onValidate(qrTokenInput.trim()); } };
    const handleCloseModal = () => { clearScannerError(); onCloseScanner(); };

    return (
        <>
            <Paper shadow="sm" p="lg" mb="xl" withBorder radius="lg">
                <Title order={4} mb="md">{t('customerDashboard.validateQrSectionTitle')}</Title>
                <Group align="flex-end">
                     <TextInput label={t('customerDashboard.qrInputLabel')} placeholder={t('customerDashboard.qrInputPlaceholder')} value={qrTokenInput} onChange={(event) => setQrTokenInput(event.currentTarget.value)} style={{ flexGrow: 1 }} disabled={isValidating || scannerOpened} />
                     <Button onClick={handleManualSubmit} leftSection={<IconTicket size={18} />} loading={isValidating && !scannerOpened} disabled={!qrTokenInput.trim() || isValidating || scannerOpened} variant='outline'> {t('customerDashboard.validateButton')} </Button>
                    {/* --- Botón Scan: ELIMINADA condición !isMobile de 'disabled' --- */}
                    <Button
                        onClick={onOpenScanner}
                        leftSection={<IconScan size={18} />}
                        disabled={isValidating} // <-- SOLO deshabilitado si isValidating es true
                        variant='gradient'
                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                    >
                        {t('customerDashboard.scanButton')}
                    </Button>
                    {/* --- FIN CAMBIO --- */}
                </Group>
            </Paper>

            {/* Modal (sin cambios aquí) */}
            <Modal opened={scannerOpened} onClose={handleCloseModal} title={t('customerDashboard.scanModalTitle')} size="auto" centered>
                <Stack>
                   <Text size="sm" ta="center" c="dimmed">{t('customerDashboard.scanInstructions')}</Text>
                    <Box id={qrcodeRegionId} w="100%"></Box>
                    {/* El error del scanner ahora se mostrará aquí si no hay cámara */}
                    {scannerError && ( <Alert icon={<IconAlertCircle size="1rem" />} title={t('customerDashboard.errorScanningQr')} color="red" withCloseButton onClose={clearScannerError} mt="sm"> {scannerError} </Alert> )}
                    {isValidating && <Group justify='center'><Text>{t('customerDashboard.validating')}</Text></Group>}
                    <Button variant="outline" onClick={handleCloseModal} disabled={isValidating}> {t('customerDashboard.scanCancelButton')} </Button>
                </Stack>
            </Modal>
        </>
    );
};

export default QrValidationSection;

// End of File: frontend/src/components/customer/QrValidationSection.tsx