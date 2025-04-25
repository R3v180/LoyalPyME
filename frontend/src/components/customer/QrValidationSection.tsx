// filename: frontend/src/components/customer/QrValidationSection.tsx
// Version: 1.0.0 (Extracted QR Validation logic and UI)

import React, { useState } from 'react';
import {
    Paper, Title, Group, TextInput, Button, Modal, Stack, Alert, Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconScan, IconTicket, IconX } from '@tabler/icons-react';
import axiosInstance from '../../services/axiosInstance'; // <-- Verifica esta ruta desde aquí
import { QrReader } from 'react-qr-reader';
import { AxiosError } from 'axios';

// Props que necesita este componente del padre
interface QrValidationSectionProps {
    onValidateSuccess: () => void; // Callback para refrescar datos en el padre
}

const QrValidationSection: React.FC<QrValidationSectionProps> = ({ onValidateSuccess }) => {
    // Estados que movimos desde CustomerDashboardPage
    const [qrTokenInput, setQrTokenInput] = useState('');
    const [validatingQr, setValidatingQr] = useState(false);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    const [scannerError, setScannerError] = useState<string | null>(null);

    // Handler para Validar QR (movido desde CustomerDashboardPage)
    // La única diferencia es que llama a onValidateSuccess en lugar de fetchData directamente
    const handleValidateQr = async (token: string | null | undefined) => {
        if (!token) {
            notifications.show({ title: 'Error', message: 'Token QR inválido.', color: 'red', icon: <IconX/> });
            return;
        }
        setValidatingQr(true);
        setScannerError(null); // Limpiar error del escáner al intentar validar
        try {
            // Llamada API (sin cambios)
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({
                title: 'Éxito', message: `${response.data.message} Has ganado ${response.data.pointsEarned} puntos.`,
                color: 'green', icon: <IconCircleCheck />,
            });
            setQrTokenInput(''); // Limpiar input
            closeScanner();     // Cerrar modal si estaba abierto
            onValidateSuccess(); // <-- Llama al callback del padre para refrescar datos

        } catch (err) {
            console.error("Error validating QR:", err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message)
                           ? err.response.data.message
                           : (err instanceof Error ? err.message : 'Error desconocido al validar QR.');
            notifications.show({ title: 'Error de Validación', message: errorMsg, color: 'red', icon: <IconAlertCircle />, });
            // Si el modal del escáner estaba abierto, mostrar el error ahí también
            if (scannerOpened) {
                setScannerError(errorMsg);
            }
        } finally {
            setValidatingQr(false);
        }
    };

    // JSX que movimos desde CustomerDashboardPage
    return (
        <>
            {/* Sección Paper para Validar QR */}
            <Paper shadow="sm" p="lg" mb="xl" withBorder>
                <Title order={4} mb="md">Validar Código QR</Title>
                <Group align="flex-end">
                    <TextInput
                        label="Introduce el código del ticket/QR"
                        placeholder="Pega el código aquí..."
                        value={qrTokenInput}
                        onChange={(event) => setQrTokenInput(event.currentTarget.value)}
                        style={{ flexGrow: 1 }}
                        disabled={validatingQr}
                    />
                    <Button
                        onClick={() => handleValidateQr(qrTokenInput)}
                        leftSection={<IconTicket size={18}/>}
                        loading={validatingQr && !scannerOpened} // Loading solo en este botón si el modal no está abierto
                        disabled={!qrTokenInput.trim() || validatingQr}
                        variant='outline'
                    >
                        Validar Código
                    </Button>
                    <Button
                        onClick={openScanner}
                        leftSection={<IconScan size={18}/>}
                        disabled={validatingQr} // Deshabilitar si ya se está validando por input
                        variant='gradient'
                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                    >
                        Escanear QR
                    </Button>
                </Group>
            </Paper>

            {/* Modal del Escáner QR (ahora parte de este componente) */}
            <Modal opened={scannerOpened} onClose={closeScanner} title="Escanear Código QR" size="md">
                <Stack>
                    <QrReader
                        scanDelay={500} // Aumentar un poco el delay puede ayudar
                        constraints={{ facingMode: 'environment' }}
                        containerStyle={{ width: '100%' }}
                        videoContainerStyle={{ width: '100%', paddingTop: '75%' }} // Ratio 4:3 approx
                        videoStyle={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onResult={(result: any, error: any) => {
                            if (error && !validatingQr) { // Mostrar error solo si no estamos ya validando
                                console.error("Scanner Result Error:", error?.message);
                                setScannerError("Error al escanear. Asegúrate de dar permisos a la cámara e inténtalo de nuevo.");
                            } else if (result && !validatingQr) { // Procesar solo si no estamos ya validando
                                console.log("QR Scanned:", result?.text);
                                handleValidateQr(result?.text); // Llama al handler principal
                            }
                        }}
                    />
                    {/* Mostrar error específico del escáner aquí */}
                    {scannerError && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Escaneo" color="red" withCloseButton onClose={() => setScannerError(null)}>
                            {scannerError}
                        </Alert>
                    )}
                    <Text ta="center" c="dimmed" mt="sm">Apunta la cámara al código QR del ticket</Text>
                     {/* Añadir un botón de loading/cancelar dentro del modal */}
                     {validatingQr && <Group justify='center'><Text>Validando...</Text></Group>}
                     <Button variant="outline" onClick={closeScanner} disabled={validatingQr}>
                         Cancelar Escaneo
                     </Button>
                </Stack>
            </Modal>
        </>
    );
};

export default QrValidationSection;