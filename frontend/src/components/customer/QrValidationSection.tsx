// filename: frontend/src/components/customer/QrValidationSection.tsx
// Version: 2.2.0 (Refactored to use useQrScanner hook, cleaned)

import React, { useState, useCallback } from 'react'; // Quitamos useEffect, useRef
import {
    Paper, Title, Group, TextInput, Button, Modal, Stack, Alert, Text, Box
} from '@mantine/core';
import { IconAlertCircle, IconScan, IconTicket } from '@tabler/icons-react';
// Ya no necesitamos importar nada de html5-qrcode aquí
// Importamos nuestro nuevo hook
import { useQrScanner } from '../../hooks/useQrScanner'; // Ajusta la ruta si es necesario

// Props (sin cambios)
interface QrValidationSectionProps {
    onValidate: (token: string) => Promise<void>; // Callback cuando se valida (manual o scan)
    isValidating: boolean; // Estado de carga global
    scannerOpened: boolean; // Si el modal del scanner está abierto
    onOpenScanner: () => void; // Función para abrir el modal
    onCloseScanner: () => void; // Función para cerrar el modal
}

const QrValidationSection: React.FC<QrValidationSectionProps> = ({
    onValidate,
    isValidating,
    scannerOpened,
    onOpenScanner,
    onCloseScanner
}) => {
    // Estado solo para el input manual
    const [qrTokenInput, setQrTokenInput] = useState('');

    // ID del div para el scanner
    const qrcodeRegionId = "html5qr-code-reader-region";

    // --- Hook useQrScanner ---
    // Definimos el callback para cuando el scanner lee un código
    const handleScanSuccess = useCallback((decodedText: string) => {
        if (!isValidating) { // Doble check por si acaso
             console.log(`[QrValidationSection] Scan successful: ${decodedText}`);
            onValidate(decodedText); // Llama al validador principal
            onCloseScanner(); // Cierra el modal después de escanear
        }
    }, [isValidating, onValidate, onCloseScanner]);

    // Llamamos al hook, pasándole las opciones
    const { scannerError, clearScannerError } = useQrScanner({
        qrcodeRegionId: qrcodeRegionId,
        enabled: scannerOpened, // El scanner se activa/desactiva según el estado del modal
        onScanSuccess: handleScanSuccess,
        // onScanError: (msg) => console.warn("Scanner error callback:", msg), // Opcional: manejar errores del scanner
        config: { fps: 10, qrbox: { width: 250, height: 250 } } // Config específica
    });
    // --- Fin Hook ---

    // Handler envío manual (sin cambios)
    const handleManualSubmit = () => {
        if (qrTokenInput.trim() && !isValidating) {
            onValidate(qrTokenInput.trim());
        }
    };

    // Limpiar error del scanner al cerrar el modal manualmente
    const handleCloseModal = () => {
        clearScannerError();
        onCloseScanner();
    };

    // El useEffect complejo ha sido eliminado y reemplazado por el hook useQrScanner

    // JSX
    return (
        <>
            <Paper shadow="sm" p="lg" mb="xl" withBorder>
                <Title order={4} mb="md">Validar Código QR</Title>
                <Group align="flex-end">
                    <TextInput
                        label="Introduce el código del ticket/QR" // Corregido: Introduce, código
                        placeholder="Pega el código aquí..."
                        value={qrTokenInput}
                        onChange={(event) => setQrTokenInput(event.currentTarget.value)}
                        style={{ flexGrow: 1 }}
                        disabled={isValidating || scannerOpened} // Deshabilitar si valida o si el scanner está abierto
                    />
                    <Button
                        onClick={handleManualSubmit}
                        leftSection={<IconTicket size={18} />}
                        loading={isValidating && !scannerOpened} // Loading solo si valida MANualmente
                        disabled={!qrTokenInput.trim() || isValidating || scannerOpened}
                        variant='outline'>
                        Validar Código {/* Corregido: Código */}
                    </Button>
                    <Button
                        onClick={onOpenScanner} // Abre el modal
                        leftSection={<IconScan size={18} />}
                        disabled={isValidating} // Deshabilitar solo si está validando
                        variant='gradient'
                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                    >
                        Escanear QR
                    </Button>
                </Group>
            </Paper>

            {/* El Modal ahora es más simple */}
            <Modal
                opened={scannerOpened}
                onClose={handleCloseModal} // Usar handler que limpia error
                title="Escanear Código QR" // Corregido: Código
                size="auto" // Ajustar tamaño automáticamente
                centered
            >
                <Stack>
                    <Text size="sm" ta="center" c="dimmed">Apunta la cámara al código QR</Text> {/* Corregido: cámara, código */}
                    {/* Div donde el hook renderizará la vista de la cámara */}
                    <Box id={qrcodeRegionId} w="100%"></Box>
                    {/* Mostrar error del hook si existe */}
                    {scannerError && (
                        <Alert
                            icon={<IconAlertCircle size="1rem" />}
                            title="Error de Escáner" // Corregido: Escáner
                            color="red"
                            withCloseButton
                            onClose={clearScannerError} // Limpiar error al cerrar alerta
                            mt="sm"
                        >
                            {scannerError}
                        </Alert>
                    )}
                    {/* Indicador de validación (si se está validando DESPUÉS de escanear) */}
                    {isValidating && <Group justify='center'><Text>Validando...</Text></Group>}
                    <Button variant="outline" onClick={handleCloseModal} disabled={isValidating}>
                        Cancelar Escaneo {/* Corregido: Escaneo */}
                    </Button>
                </Stack>
            </Modal>
        </>
    );
};

export default QrValidationSection;

// End of File: frontend/src/components/customer/QrValidationSection.tsx