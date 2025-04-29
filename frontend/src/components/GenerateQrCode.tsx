// filename: frontend/src/components/GenerateQrCode.tsx
import { useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { QRCodeCanvas } from 'qrcode.react';
import {
    TextInput, NumberInput, Button, Stack, Alert, Loader,
    Paper, Text, Code, Box, Group, Center
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface QrCodeData {
    qrToken: string;
    amount: number;
}

const GenerateQrCode: React.FC = () => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<number | ''>('');
    const [ticketNumber, setTicketNumber] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedData, setGeneratedData] = useState<QrCodeData | null>(null);

    const handleGenerateClick = async () => {
        setError(null);
        setGeneratedData(null);

        if (amount === '' || amount <= 0) {
            setError(t('component.generateQr.errorAmountPositive'));
            return;
        }
        if (!ticketNumber || ticketNumber.trim() === '') {
            setError(t('component.generateQr.errorTicketRequired'));
            return;
        }
        setIsLoading(true);
        try {
            const requestData = { amount: Number(amount), ticketNumber: ticketNumber.trim() };
            const response = await axiosInstance.post<QrCodeData>('/points/generate-qr', requestData);
            setGeneratedData(response.data);
            setAmount('');
            setTicketNumber('');
        } catch (err: any) {
            console.error('Error generating QR code data:', err);
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown'); // Clave común para error desconocido
            setError(t('component.generateQr.errorGeneric', { error: apiError }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Stack gap="md">
            <NumberInput
                label={t('component.generateQr.amountLabel')}
                placeholder={t('component.generateQr.amountPlaceholder')}
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
                label={t('component.generateQr.ticketLabel')}
                placeholder={t('component.generateQr.ticketPlaceholder')}
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.currentTarget.value)}
                required
                radius="lg"
                disabled={isLoading}
            />
            <Box>
                <Button onClick={handleGenerateClick} loading={isLoading} radius="lg">
                    {t('component.generateQr.buttonText')}
                </Button>
            </Box>

            <Box mt="md" style={{ minHeight: '200px' }}>
                {isLoading && (
                    <Group justify="center"><Loader size="sm" /></Group>
                )}
                {error && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title={t('common.error')}
                        color="red"
                        radius="lg"
                        withCloseButton
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}
                {generatedData && (
                    <Paper withBorder p="md" radius="lg" mt="sm">
                        <Group gap="xs" mb="xs">
                            <IconCheck size={16} color="var(--mantine-color-green-7)" />
                            <Text fw={500} size="sm">
                                {t('component.generateQr.successMessage', { amount: generatedData.amount.toFixed(2) })}
                            </Text>
                        </Group>
                        <Text size="sm" mb="md">
                            {t('component.generateQr.successInstructions')}
                        </Text>
                        <Center>
                            <QRCodeCanvas
                                value={generatedData.qrToken}
                                size={160}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"L"}
                                includeMargin={true}
                            />
                        </Center>
                        <Text size="xs" c="dimmed" mt="md" ta="center">
                            {t('component.generateQr.tokenRef')}{' '}
                            <Code>{generatedData.qrToken}</Code>
                        </Text>
                    </Paper>
                )}
                 {!isLoading && !error && !generatedData && (
                     <Text size="sm" c="dimmed">{t('component.generateQr.initialPrompt', 'Introduce importe y número de ticket para generar los datos del QR.')}</Text>
                 )}
            </Box>
        </Stack>
    );
};

export default GenerateQrCode;