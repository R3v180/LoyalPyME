// File: frontend/src/components/GenerateQrCode.tsx
// Version: 1.2.0 (Display actual QR Code image using qrcode.react)

import { useState } from 'react';
import axiosInstance from '../services/axiosInstance';
// NUEVO: Importar QRCodeCanvas
import { QRCodeCanvas } from 'qrcode.react';

// Mantine Imports (sin cambios)
import {
    TextInput,
    NumberInput,
    Button,
    Stack,
    Alert,
    Loader,
    Paper,
    Text,
    Code,
    Box,
    Group,
    Center, // NUEVO: Para centrar el QR
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

// Interfaz (sin cambios)
interface QrCodeData {
    qrToken: string;
    amount: number;
}

const GenerateQrCode: React.FC = () => {
    // Estados (sin cambios)
    const [amount, setAmount] = useState<number | ''>('');
    const [ticketNumber, setTicketNumber] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedData, setGeneratedData] = useState<QrCodeData | null>(null);

    // handleGenerateClick (sin cambios)
    const handleGenerateClick = async () => {
        setError(null);
        setGeneratedData(null);
        if (amount === '' || amount <= 0) {
            setError('El importe debe ser un número positivo.');
            return;
        }
        if (!ticketNumber || ticketNumber.trim() === '') {
            setError('El número de ticket es obligatorio.');
            return;
        }
        setIsLoading(true);
        try {
            const requestData = { amount: amount, ticketNumber: ticketNumber.trim() };
            const response = await axiosInstance.post<QrCodeData>('/points/generate-qr', requestData);
            setGeneratedData(response.data);
            setAmount('');
            setTicketNumber('');
        } catch (err: any) {
            console.error('Error generating QR code data:', err);
            setError(`Error al generar QR: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // JSX
    return (
        <Stack gap="md">
            {/* Inputs y Botón (sin cambios) */}
            <NumberInput
                label="Importe de la Venta (€):"
                placeholder="Ej: 15.50"
                value={amount}
                onChange={(value) => setAmount(typeof value === 'number' ? value : '')}
                min={0.01}
                step={0.01}
                decimalScale={2}
                fixedDecimalScale
                required
                radius="lg"
                disabled={isLoading}
            />
            <TextInput
                label="Número de Ticket:"
                placeholder="Ej: T-12345"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.currentTarget.value)}
                required
                radius="lg"
                disabled={isLoading}
            />
            <Box>
                 <Button onClick={handleGenerateClick} loading={isLoading} radius="lg">
                     Generar Datos QR
                 </Button>
            </Box>

            {/* Área de Resultados / Errores */}
            <Box mt="md" style={{ minHeight: '150px' }}> {/* Aumentar altura mínima para el QR */}
                {isLoading && (
                    <Group justify="center"><Loader size="sm" /></Group>
                )}
                {error && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Error"
                        color="red"
                        radius="lg"
                        withCloseButton
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}
                {/* MODIFICADO: Mostrar la imagen QR real */}
                {generatedData && (
                    <Paper withBorder p="sm" radius="lg">
                        <Group gap="xs" mb="xs">
                            <IconCheck size={16} color="var(--mantine-color-green-7)" />
                            <Text fw={500} size="sm">¡QR Generado para {generatedData.amount.toFixed(2)} €!</Text>
                        </Group>
                        <Text size="sm" mb="md">Pídele al cliente que escanee este código para obtener sus puntos.</Text>
                        {/* NUEVO: Renderizar el componente QRCodeCanvas */}
                        <Center>
                            <QRCodeCanvas
                                value={generatedData.qrToken} // El token es el valor del QR
                                size={128} // Tamaño del QR en píxeles
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"L"} // Nivel de corrección de errores (L, M, Q, H)
                                includeMargin={false}
                                // imageSettings={{ // Opcional: para añadir un logo en el centro
                                //   src: "logo_url",
                                //   x: undefined,
                                //   y: undefined,
                                //   height: 24,
                                //   width: 24,
                                //   excavate: true,
                                // }}
                            />
                        </Center>
                        {/* Mostramos el token también por si falla el escaneo */}
                        <Text size="xs" c="dimmed" mt="md">Token (para referencia): <Code>{generatedData.qrToken}</Code></Text>
                        {/* Eliminamos el texto placeholder anterior */}
                    </Paper>
                )}
                 {/* FIN MODIFICACIÓN */}
                {!isLoading && !error && !generatedData && (
                   <Text size="sm" c="dimmed">Introduce importe y número de ticket para generar los datos del QR.</Text>
                )}
            </Box>
        </Stack>
    );
};

export default GenerateQrCode;

// End of File: frontend/src/components/GenerateQrCode.tsx