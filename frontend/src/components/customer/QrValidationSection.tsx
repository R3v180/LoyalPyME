// filename: frontend/src/components/customer/QrValidationSection.tsx
// Version: 1.0.1 (Fix: Remove unused IconX import)

import React, { useState } from 'react';
import {
    Paper, Title, Group, TextInput, Button, Modal, Stack, Alert, Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
// IconX eliminado de esta importación
import { IconTicket, IconScan, IconAlertCircle } from '@tabler/icons-react';
import { QrReader } from 'react-qr-reader';

interface QrValidationSectionProps {
    onValidate: (token: string) => void;
    isValidating: boolean;
}

const QrValidationSection: React.FC<QrValidationSectionProps> = ({ onValidate, isValidating }) => {
    // --- Estado Interno del Componente ---
    const [qrTokenInput, setQrTokenInput] = useState('');
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    const [scannerError, setScannerError] = useState<string | null>(null);

    // --- Handlers Internos ---
    const handleManualSubmit = () => {
        if (qrTokenInput.trim() && !isValidating) {
            onValidate(qrTokenInput.trim());
        }
    };

    const handleScanResult = (result: any, error: any) => {
        if (error && !isValidating) {
            console.error("Scanner Result Error:", error);
            setScannerError("Error al escanear o leer el código QR.");
        } else if (result?.text && !isValidating) {
            console.log("QR Scanned:", result.text);
            setScannerError(null);
            onValidate(result.text);
        }
    };

    const handleCloseScanner = () => {
        setScannerError(null);
        closeScanner();
    };

    return (
        <>
            {/* Sección Principal (Formulario) */}
            <Paper shadow="sm" p="lg" mb="xl" withBorder>
                <Title order={4} mb="md">Validar Código QR</Title>
                <Group align="flex-end">
                    <TextInput
                        label="Introduce el código del ticket/QR"
                        placeholder="Pega el código aquí..."
                        value={qrTokenInput}
                        onChange={(event) => setQrTokenInput(event.currentTarget.value)}
                        style={{ flexGrow: 1 }}
                        disabled={isValidating}
                    />
                    <Button
                        onClick={handleManualSubmit}
                        leftSection={<IconTicket size={18} />}
                        loading={isValidating && !scannerOpened}
                        disabled={!qrTokenInput.trim() || isValidating}
                        variant='outline'
                    >
                        Validar Código
                    </Button>
                    <Button
                        onClick={openScanner}
                        leftSection={<IconScan size={18} />}
                        disabled={isValidating}
                        variant='gradient'
                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                    >
                        Escanear QR
                    </Button>
                </Group>
            </Paper>

            {/* Modal del Escáner */}
            <Modal opened={scannerOpened} onClose={handleCloseScanner} title="Escanear Código QR" size="md">
                <Stack>
                    <QrReader
                        scanDelay={500}
                        constraints={{ facingMode: 'environment' }}
                        containerStyle={{ width: '100%' }}
                        videoContainerStyle={{ width: '100%', paddingTop: '75%' }}
                        videoStyle={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                        onResult={handleScanResult}
                    />
                    {scannerError && (
                        <Alert
                            icon={<IconAlertCircle size="1rem" />} // Usa IconAlertCircle
                            title="Error de Escaneo"
                            color="red"
                            withCloseButton
                            onClose={() => setScannerError(null)}
                        >
                            {scannerError}
                        </Alert>
                    )}
                    <Text ta="center" c="dimmed" mt="sm">Apunta la cámara al código QR del ticket</Text>
                    {isValidating && <Group justify='center'><Text>Validando...</Text></Group>}
                    <Button variant="outline" onClick={handleCloseScanner} disabled={isValidating}>
                        Cancelar Escaneo
                    </Button>
                </Stack>
            </Modal>
        </>
    );
};

export default QrValidationSection;