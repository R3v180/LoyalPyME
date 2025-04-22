// File: frontend/src/components/GenerateQrCode.tsx
// Version: 1.1.2 (Correct NumberInput onChange type handling)

import { useState } from 'react';
import axiosInstance from '../services/axiosInstance';

// --- Mantine Imports ---
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
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

// Interfaz para la respuesta esperada
interface QrCodeData {
  qrToken: string;
  amount: number;
}

const GenerateQrCode: React.FC = () => {
  const [amount, setAmount] = useState<number | ''>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<QrCodeData | null>(null);

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
      const requestData = {
        amount: amount, // amount ya es number aquí debido a la validación anterior
        ticketNumber: ticketNumber.trim()
      };
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

  return (
    <Stack gap="md">
      <NumberInput
        label="Importe de la Venta (€):"
        placeholder="Ej: 15.50"
        value={amount}
        // --- CORRECCIÓN FINAL AQUÍ ---
        // Aseguramos pasar number o '' a setAmount
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

      {/* --- Área de Resultados / Errores con Mantine --- */}
      <Box mt="md" style={{ minHeight: '80px' }}>
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
        {generatedData && (
          <Paper withBorder p="sm" radius="lg">
            <Group gap="xs" mb="xs">
                 <IconCheck size={16} color="var(--mantine-color-green-7)" />
                 <Text fw={500} size="sm">¡Datos QR Generados!</Text>
            </Group>
            <Text size="sm">Utiliza el siguiente token para generar la imagen del código QR:</Text>
            <Text size="sm" mt={4}><strong>Token:</strong> <Code>{generatedData.qrToken}</Code></Text>
            <Text size="sm"><strong>Importe asociado:</strong> {generatedData.amount.toFixed(2)} €</Text>
            <Text size="xs" c="dimmed" mt="xs">(En un futuro, aquí se mostraría la imagen QR directamente)</Text>
          </Paper>
        )}
        {!isLoading && !error && !generatedData && (
           <Text size="sm" c="dimmed">Introduce importe y número de ticket para generar los datos del QR.</Text>
        )}
      </Box>
    </Stack>
  );
};

export default GenerateQrCode;

// End of File: frontend/src/components/GenerateQrCode.tsx