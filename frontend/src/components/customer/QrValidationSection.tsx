// filename: frontend/src/components/customer/QrValidationSection.tsx
// Version: 2.1.2 (Fix TS errors in useEffect cleanup)

import React, { useState, useEffect, useRef } from 'react';
import {
    Paper, Title, Group, TextInput, Button, Modal, Stack, Alert, Text, Box
} from '@mantine/core';
import { IconAlertCircle, IconScan, IconTicket } from '@tabler/icons-react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode'; // Quitado Html5QrcodeError

// Props
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
    const [qrTokenInput, setQrTokenInput] = useState('');
    const [scannerError, setScannerError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const qrcodeRegionId = "html5qr-code-reader-region";
    const initTimeoutRef = useRef<number | null>(null);

    // Handler envío manual
    const handleManualSubmit = () => { if (qrTokenInput.trim() && !isValidating) { onValidate(qrTokenInput.trim()); } };

    // useEffect para controlar escáner
    useEffect(() => {
        let scannerInstance: Html5Qrcode | null = null; // Variable local para el scanner

        if (scannerOpened) {
            // @ts-ignore
            initTimeoutRef.current = setTimeout(() => {
                if (document.getElementById(qrcodeRegionId)) { // Solo inicializar si el div existe y no hay instancia
                    console.log("Initializing Html5Qrcode...");
                    // Crear instancia nueva CADA VEZ que se abre el modal (más seguro para limpieza)
                    scannerInstance = new Html5Qrcode(qrcodeRegionId, false);
                    html5QrCodeRef.current = scannerInstance; // Guardar ref si se necesita fuera del timeout

                    const qrCodeSuccessCallback = (decodedText: string, decodedResult: Html5QrcodeResult) => {
                         if (!isValidating && scannerOpened) {
                            console.log(`Code matched = ${decodedText}`, decodedResult);
                            setScannerError(null);
                            // Intentar limpiar antes de cerrar (puede ser redundante con el cleanup del effect)
                             try {
                                 if (scannerInstance?.isScanning) {
                                     scannerInstance.stop();
                                     console.log("Scanner stopped on success.");
                                 }
                                 scannerInstance?.clear();
                             } catch(e) { console.error("Minor error during cleanup after success:", e); }

                            onValidate(decodedText);
                            onCloseScanner();
                         }
                    };
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                    const qrCodeErrorCallback = (_errorMessage: string, _error: any) => { /* Log comentado */ };

                    try {
                         console.log("Attempting to start scanner...");
                         scannerInstance.start( { facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, qrCodeSuccessCallback, qrCodeErrorCallback )
                           .then(() => { console.log("Html5Qrcode scanner started successfully."); })
                           .catch((err) => { console.error("Unable to start scanning.", err); setScannerError(`No se pudo iniciar la cámara: ${err?.message || err}`); onCloseScanner(); });
                    } catch (err: any) { console.error("Html5Qrcode constructor/start failed:", err); setScannerError(`No se pudo inicializar el escáner: ${err?.message || err}`); onCloseScanner(); }
                } else { console.error(`Element ${qrcodeRegionId} not found.`); setScannerError("Error: Contenedor no encontrado."); }
            }, 50);
        }

        // Función de Limpieza del useEffect
        return () => {
            if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); }
            console.log("Cleanup Effect Triggered. Attempting to clear scanner if exists...");
            // Usamos la referencia guardada para limpiar
            const scannerToClear = html5QrCodeRef.current;
            if (scannerToClear) {
                html5QrCodeRef.current = null; // Limpiar referencia inmediatamente
                // --- CORRECCIÓN: Usar try/catch síncrono y llamar sin await ---
                try {
                    // Comprobar estado antes de parar puede evitar errores si ya paró
                    if (typeof scannerToClear.getState === 'function' &&
                        scannerToClear.getState() === /* Html5QrcodeScannerState.SCANNING */ 2) {
                         console.log("Scanner state is SCANNING, calling stop...");
                         scannerToClear.stop(); // Llamada síncrona (o que devuelve promesa que no esperamos)
                         console.log("stop() called.");
                    } else {
                         console.log("Scanner state is not SCANNING, skipping stop().");
                    }
                    // Limpiar UI siempre
                    console.log("Calling clear()...");
                    scannerToClear.clear(); // Llamada síncrona
                    console.log("Scanner clear() called.");
                } catch (error: any) {
                    console.error("Failed to stop/clear html5-qrcode scanner on cleanup.", error);
                }
                // ----------------------------------------------------------
            } else {
                 console.log("No active scanner instance found in ref during cleanup.");
            }
        };
    // Depender solo de scannerOpened para controlar montaje/desmontaje del scanner
    }, [scannerOpened, isValidating, onValidate, onCloseScanner]); // Añadir dependencias usadas en callbacks si es necesario


    // JSX (Sin cambios)
    return (
        <>
            <Paper shadow="sm" p="lg" mb="xl" withBorder>
               <Title order={4} mb="md">Validar Código QR</Title>
                <Group align="flex-end">
                    <TextInput label="Introduce el código del ticket/QR" placeholder="Pega el código aquí..." value={qrTokenInput} onChange={(event) => setQrTokenInput(event.currentTarget.value)} style={{ flexGrow: 1 }} disabled={isValidating} />
                    <Button onClick={handleManualSubmit} leftSection={<IconTicket size={18} />} loading={isValidating && !scannerOpened} disabled={!qrTokenInput.trim() || isValidating} variant='outline'> Validar Código </Button>
                    <Button onClick={onOpenScanner} leftSection={<IconScan size={18} />} disabled={isValidating} variant='gradient' gradient={{ from: 'blue', to: 'cyan', deg: 90 }}> Escanear QR </Button>
                </Group>
            </Paper>
            <Modal opened={scannerOpened} onClose={onCloseScanner} title="Escanear Código QR" size="auto" centered>
                <Stack>
                    <Text size="sm" ta="center" c="dimmed">Apunta la cámara al código QR</Text>
                    <Box id={qrcodeRegionId} w="100%"></Box>
                    {scannerError && ( <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Escaneo" color="red" withCloseButton onClose={() => setScannerError(null)} mt="sm"> {scannerError} </Alert> )}
                    {isValidating && <Group justify='center'><Text>Validando...</Text></Group>}
                    <Button variant="outline" onClick={onCloseScanner} disabled={isValidating}> Cancelar Escaneo </Button>
                </Stack>
            </Modal>
        </>
    );
};

export default QrValidationSection;