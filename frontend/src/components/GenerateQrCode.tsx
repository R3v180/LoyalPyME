// filename: frontend/src/components/GenerateQrCode.tsx
// Version: 1.2.1 (Fix encoding, remove meta-comments)

import { useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { QRCodeCanvas } from 'qrcode.react'; // Importar componente QR

// Mantine Imports
import {
    TextInput, NumberInput, Button, Stack, Alert, Loader,
    Paper, Text, Code, Box, Group, Center
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

// Interfaz para datos del QR
interface QrCodeData {
    qrToken: string;
    amount: number;
}

const GenerateQrCode: React.FC = () => {
    // Estados
    const [amount, setAmount] = useState<number | ''>('');
    const [ticketNumber, setTicketNumber] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedData, setGeneratedData] = useState<QrCodeData | null>(null);

    // Handler para generar
    const handleGenerateClick = async () => {
        setError(null);
        setGeneratedData(null);
        // Validaciones básicas
        if (amount === '' || amount <= 0) {
            setError('El importe debe ser un número positivo.'); // Corregido: número
            return;
        }
        if (!ticketNumber || ticketNumber.trim() === '') {
            setError('El número de ticket es obligatorio.'); // Corregido: número
            return;
        }
        setIsLoading(true);
        try {
            const requestData = { amount: Number(amount), ticketNumber: ticketNumber.trim() };
            const response = await axiosInstance.post<QrCodeData>('/points/generate-qr', requestData);
            setGeneratedData(response.data);
            // Limpiar formulario tras éxito
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
            {/* Inputs y Botón */}
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
                label="Número de Ticket:" // Corregido: Número
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
            <Box mt="md" style={{ minHeight: '200px' }}> {/* Ajustar altura mínima si es necesario */}
                {isLoading && (
                    <Group justify="center"><Loader size="sm" /></Group>
                )}
                {error && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Error" color="red" radius="lg"
                        withCloseButton onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}
                {/* Mostrar la imagen QR real */}
                {generatedData && (
                    <Paper withBorder p="md" radius="lg" mt="sm"> {/* Añadido mt="sm" */}
                        <Group gap="xs" mb="xs">
                            <IconCheck size={16} color="var(--mantine-color-green-7)" />
                            <Text fw={500} size="sm">¡QR Generado para {generatedData.amount.toFixed(2)} €!</Text>
                        </Group>
                        <Text size="sm" mb="md">Pídele al cliente que escanee este código para obtener sus puntos.</Text>
                        {/* Renderizar el componente QRCodeCanvas */}
                        <Center>
                            <QRCodeCanvas
                                value={generatedData.qrToken} // El token es el valor del QR
                                size={160} // Un poco más grande
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"L"} // Nivel de corrección de errores
                                includeMargin={true} // Añadir margen blanco
                            />
                        </Center>
                        <Text size="xs" c="dimmed" mt="md" ta="center">Token (ref.): <Code>{generatedData.qrToken}</Code></Text>
                    </Paper>
                )}
                 {/* Mensaje inicial */}
                 {!isLoading && !error && !generatedData && (
                     <Text size="sm" c="dimmed">Introduce importe y número de ticket para generar los datos del QR.</Text>
                 )}
            </Box>
        </Stack>
    );
};

export default GenerateQrCode;

// End of File: frontend/src/components/GenerateQrCode.tsx