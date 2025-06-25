// frontend/src/components/admin/superadmin/SubscriptionManagementModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Tabs, Title, Text, NumberInput, Button, Group, Table, Loader, Alert, Textarea, Select, LoadingOverlay, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconHistory, IconSettings, IconCirclePlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import * as superAdminService from '../services/superAdminService';
import { SuperAdminBusiness, BusinessPayment } from '../../../types/superadmin.types';

interface SubscriptionManagementModalProps {
    opened: boolean;
    onClose: () => void;
    business: SuperAdminBusiness | null;
    onSuccess: () => void;
}

const priceFormSchema = z.object({
    monthlyPrice: z.number().min(0, { message: 'El precio debe ser 0 o mayor.' }),
    currency: z.string().length(3, { message: 'La moneda debe ser un código de 3 letras.' }),
});
type PriceFormValues = z.infer<typeof priceFormSchema>;

// --- CAMBIO: Schema del formulario de pago adaptado ---
const paymentFormSchema = z.object({
    amountPaid: z.number().min(0.01, { message: 'El importe debe ser mayor que 0.' }),
    period: z.string().min(1, { message: 'Debe seleccionar un periodo.' }), // Ej: "2025-6"
    notes: z.string().optional(),
    paymentMethod: z.string().optional(),
});
type PaymentFormValues = z.infer<typeof paymentFormSchema>;


const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({ opened, onClose, business, onSuccess }) => {
    const { i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<string | null>('config');
    const [isSaving, setIsSaving] = useState(false);
    
    const [paymentHistory, setPaymentHistory] = useState<BusinessPayment[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [errorHistory, setErrorHistory] = useState<string | null>(null);

    // --- NUEVO ESTADO para los periodos pendientes ---
    const [pendingPeriods, setPendingPeriods] = useState<{ value: string; label: string; }[]>([]);
    const [loadingPeriods, setLoadingPeriods] = useState(false);

    const priceForm = useForm<PriceFormValues>({
        initialValues: { monthlyPrice: 0, currency: 'EUR' },
        validate: zodResolver(priceFormSchema),
    });

    const paymentForm = useForm<PaymentFormValues>({
        initialValues: { amountPaid: 0, period: '', notes: '', paymentMethod: 'Manual' },
        validate: zodResolver(paymentFormSchema),
    });
    
    const fetchDropdownData = useCallback(async () => {
        if (!business) return;
        setLoadingHistory(true);
        setLoadingPeriods(true);
        setErrorHistory(null);
        
        try {
            const historyPromise = superAdminService.getPaymentHistory(business.id);
            const periodsPromise = superAdminService.getPendingPaymentPeriods(business.id);

            const [history, periods] = await Promise.all([historyPromise, periodsPromise]);
            
            setPaymentHistory(history);
            
            const formattedPeriods = periods.map(p => ({
                value: `${p.year}-${p.month}`,
                label: p.label,
            }));
            setPendingPeriods(formattedPeriods);

            // Pre-seleccionar el primer periodo pendiente en el formulario
            if (formattedPeriods.length > 0) {
                paymentForm.setFieldValue('period', formattedPeriods[0].value);
            }

        } catch (err: any) {
            setErrorHistory(err.message || "Error al cargar los datos del modal.");
        } finally {
            setLoadingHistory(false);
            setLoadingPeriods(false);
        }
    }, [business, paymentForm]);

    useEffect(() => {
        if (opened && business) {
            priceForm.setValues({ monthlyPrice: Number(business.monthlyPrice) || 0, currency: business.currency || 'EUR' });
            paymentForm.setFieldValue('amountPaid', Number(business.monthlyPrice) || 0);
            fetchDropdownData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, business]);

    const handleUpdatePrice = async (values: PriceFormValues) => {
        if (!business) return;
        setIsSaving(true);
        try {
            await superAdminService.setSubscriptionPrice(business.id, { price: values.monthlyPrice, currency: values.currency });
            notifications.show({ title: 'Éxito', message: 'Precio de suscripción actualizado.', color: 'green', icon: <IconCheck/> });
            onSuccess();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.message || error.message, color: 'red', icon: <IconAlertCircle/> });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRecordPayment = async (values: PaymentFormValues) => {
        if (!business) return;
        
        // --- CAMBIO: Extraer mes y año del valor del 'period' ---
        const [year, month] = values.period.split('-').map(Number);
        if (!year || !month) {
            notifications.show({ title: 'Error', message: 'Periodo seleccionado no válido.', color: 'red' });
            return;
        }

        setIsSaving(true);
        try {
            await superAdminService.recordPayment(business.id, {
                amountPaid: values.amountPaid,
                month: month,
                year: year,
                notes: values.notes,
                paymentMethod: values.paymentMethod
            });
            notifications.show({ title: 'Éxito', message: 'Pago registrado correctamente.', color: 'green', icon: <IconCheck/> });
            
            // Refrescar datos y resetear formulario
            paymentForm.reset();
            fetchDropdownData();
            onSuccess();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.message || error.message, color: 'red', icon: <IconAlertCircle/> });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Title order={4}>Gestionar Suscripción: {business?.name}</Title>}
            size="lg"
            centered
        >
            <LoadingOverlay visible={isSaving} />
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="config" leftSection={<IconSettings size={16} />}>Configuración</Tabs.Tab>
                    <Tabs.Tab value="payment" leftSection={<IconCirclePlus size={16} />}>Registrar Pago</Tabs.Tab>
                    <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>Historial</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="config" pt="md">
                    {/* (Sin cambios en esta pestaña) */}
                    <form onSubmit={priceForm.onSubmit(handleUpdatePrice)}>
                        <Stack>
                            <Text size="sm">Establece el precio mensual que se le cobrará a este negocio.</Text>
                            <Group grow align="flex-end">
                                <NumberInput label="Precio Mensual" required min={0} decimalScale={2} {...priceForm.getInputProps('monthlyPrice')} />
                                <Select label="Moneda" data={['EUR', 'USD']} required {...priceForm.getInputProps('currency')} />
                            </Group>
                            <Group justify="flex-end" mt="md">
                                <Button type="submit" leftSection={<IconDeviceFloppy size={16}/>} loading={isSaving}>Guardar Precio</Button>
                            </Group>
                        </Stack>
                    </form>
                </Tabs.Panel>

                <Tabs.Panel value="payment" pt="md">
                     <form onSubmit={paymentForm.onSubmit(handleRecordPayment)}>
                        <Stack>
                            <Text size="sm">Registra un pago manual para un periodo específico.</Text>
                            
                            {/* --- CAMBIO: Reemplazo de Mes/Año por un único Select --- */}
                            <Select
                                label="Periodo a Pagar"
                                placeholder={loadingPeriods ? "Cargando periodos..." : "Selecciona un mes pendiente"}
                                data={pendingPeriods}
                                required
                                disabled={pendingPeriods.length === 0}
                                {...paymentForm.getInputProps('period')}
                            />

                            <NumberInput label="Importe Pagado" required min={0.01} decimalScale={2} {...paymentForm.getInputProps('amountPaid')} />
                            <Textarea label="Notas (Opcional)" placeholder="Ej: Pago parcial, referencia de transferencia..." {...paymentForm.getInputProps('notes')} />
                             <TextInput label="Método de Pago (Opcional)" placeholder="Ej: Transferencia, Efectivo" {...paymentForm.getInputProps('paymentMethod')} />
                            <Group justify="flex-end" mt="md">
                                <Button type="submit" color="green" leftSection={<IconCheck size={16}/>} loading={isSaving} disabled={pendingPeriods.length === 0}>
                                    {pendingPeriods.length > 0 ? "Registrar Pago" : "Sin meses pendientes"}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Tabs.Panel>
                
                <Tabs.Panel value="history" pt="md">
                    <Stack>
                        {loadingHistory && <Loader />}
                        {errorHistory && <Alert color="red" title="Error">{errorHistory}</Alert>}
                        {!loadingHistory && !errorHistory && paymentHistory.length === 0 && <Text c="dimmed" ta="center">No hay pagos registrados para este negocio.</Text>}
                        {!loadingHistory && !errorHistory && paymentHistory.length > 0 && (
                            <Table.ScrollContainer minWidth={500}>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Fecha</Table.Th>
                                            <Table.Th>Periodo</Table.Th>
                                            <Table.Th ta="right">Importe</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {paymentHistory.map(p => (
                                            <Table.Tr key={p.id}>
                                                <Table.Td>{new Date(p.paymentDate).toLocaleDateString(i18n.language)}</Table.Td>
                                                <Table.Td>{`${p.month}/${p.year}`}</Table.Td>
                                                <Table.Td ta="right">{p.amountPaid.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
};

export default SubscriptionManagementModal;