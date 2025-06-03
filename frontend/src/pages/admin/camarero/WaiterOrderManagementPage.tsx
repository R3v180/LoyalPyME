// frontend/src/pages/admin/camarero/WaiterOrderManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Title,
    Text,
    Loader,
    Alert,
    Paper,
    Stack,
    Group,
    Button,
    Table,
    Badge,
    SegmentedControl,
    // Modal, // Para el futuro modal de detalles de pago
    // TextInput, // Para el futuro modal de detalles de pago
} from '@mantine/core';
import {
    IconAlertCircle,
    IconCash, // Para el botón de "Marcar como Pagado"
    //IconReceipt2, // Para "Pedir Cuenta" (si se añade aquí)
    IconReload,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react'; // Para notificaciones

// Suponiendo que estos tipos y servicios se crearán/adaptarán:
import { WaiterOrderListItemDto } from '../../../types/camarero.types'; // Asegúrate que este DTO exista y se importe
import { OrderStatus } from '../../../types/customer'; // Usaremos el enum de OrderStatus
import axiosInstance from '../../../services/axiosInstance'; // Para las llamadas API

// Hook para los datos (aún por crear)
// import { useWaiterOrders } from '../../../hooks/useWaiterOrders';

const WaiterOrderManagementPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    // Estado para los pedidos
    const [orders, setOrders] = useState<WaiterOrderListItemDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(OrderStatus.PENDING_PAYMENT); // Filtro inicial
    const [markingPaidOrderId, setMarkingPaidOrderId] = useState<string | null>(null);

    // Opciones para el filtro de estado
    const statusFilterOptions = [
        { label: t('waiterOrderManagement.statusOptionPendingPayment', 'Pendientes de Pago'), value: OrderStatus.PENDING_PAYMENT },
        { label: t('waiterOrderManagement.statusOptionCompleted', 'Completados (No Pagados)'), value: OrderStatus.COMPLETED },
        { label: t('orderStatusPage.orderStatus.all_items_ready', 'Listos para Entregar'), value: OrderStatus.ALL_ITEMS_READY },
        { label: t('orderStatusPage.orderStatus.in_progress', 'En Progreso'), value: OrderStatus.IN_PROGRESS },
        { label: t('orderStatusPage.orderStatus.received', 'Recibidos'), value: OrderStatus.RECEIVED },
        { label: t('waiterOrderManagement.statusOptionPaid', 'Pagados'), value: OrderStatus.PAID },
        { label: t('waiterOrderManagement.statusOptionAll', 'Todos los Pedidos'), value: 'ALL' }, // 'ALL' es un valor especial
    ];

    // Función para cargar pedidos
    const fetchOrders = useCallback(async (status?: string) => {
        setLoading(true);
        setError(null);
        console.log(`[WaiterOrderMgmt] Fetching orders with status filter: ${status || 'Default (from service)'}`);
        try {
            const params: { status?: string } = {};
            if (status && status !== 'ALL') {
                params.status = status;
            }
            // El endpoint es /api/camarero/staff/orders
            const response = await axiosInstance.get<WaiterOrderListItemDto[]>('/camarero/staff/orders', { params });
            setOrders(response.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorLoadingData');
            setError(msg);
            notifications.show({ title: t('common.error'), message: msg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setLoading(false);
        }
    }, [t]);

    // Carga inicial y cuando cambia el filtro
    useEffect(() => {
        fetchOrders(selectedStatusFilter);
    }, [fetchOrders, selectedStatusFilter]);

    // Handler para marcar como pagado
    const handleMarkAsPaid = async (orderId: string, orderNumber: string) => {
        if (markingPaidOrderId) return; // Evitar clics múltiples

        setMarkingPaidOrderId(orderId);
        // Por ahora, un payload simple. En el futuro, un modal para 'method' y 'notes'.
        const payload = {
            method: "EFECTIVO_CAJA", // Valor por defecto para la prueba
            notes: `Pagado por camarero UI (MVP) - ${new Date().toLocaleTimeString()}`
        };

        try {
            await axiosInstance.post(`/camarero/staff/order/${orderId}/mark-as-paid`, payload);
            notifications.show({
                title: t('common.success'),
                message: t('waiterOrderManagement.markAsPaidSuccess', { orderNumber: orderNumber }),
                color: 'green',
                icon: <IconCheck />,
            });
            fetchOrders(selectedStatusFilter); // Refrescar la lista
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.error'),
                message: t('waiterOrderManagement.markAsPaidError', { orderNumber: orderNumber, error: msg }),
                color: 'red',
                icon: <IconX />,
            });
        } finally {
            setMarkingPaidOrderId(null);
        }
    };

    const getStatusBadgeColor = (status: OrderStatus): string => {
        switch (status) {
            case OrderStatus.PENDING_PAYMENT: return 'orange';
            case OrderStatus.COMPLETED: return 'blue';
            case OrderStatus.PAID: return 'green';
            case OrderStatus.CANCELLED: return 'red';
            case OrderStatus.RECEIVED: return 'gray';
            case OrderStatus.IN_PROGRESS: return 'cyan';
            case OrderStatus.PARTIALLY_READY: return 'yellow';
            case OrderStatus.ALL_ITEMS_READY: return 'lime';
            default: return 'gray';
        }
    };

    const rows = orders.map((order) => {
        const isThisOrderLoading = markingPaidOrderId === order.orderId;
        const canMarkAsPaid = order.status === OrderStatus.PENDING_PAYMENT || order.status === OrderStatus.COMPLETED;
        
        return (
            <Table.Tr key={order.orderId}>
                <Table.Td>{order.orderNumber}</Table.Td>
                <Table.Td>{order.tableIdentifier || 'N/A'}</Table.Td>
                <Table.Td ta="right">
                    {order.finalAmount.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}
                </Table.Td>
                <Table.Td>
                    <Badge color={getStatusBadgeColor(order.status)} variant="light">
                        {t(`orderStatusPage.orderStatus.${order.status.toLowerCase()}`, order.status)}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Text size="xs" c="dimmed">
                        {new Date(order.createdAt).toLocaleString(currentLanguage, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Group justify="flex-end">
                        {canMarkAsPaid && (
                            <Button
                                size="xs"
                                color="green"
                                leftSection={<IconCash size={14} />}
                                onClick={() => handleMarkAsPaid(order.orderId, order.orderNumber)}
                                loading={isThisOrderLoading}
                                disabled={!!markingPaidOrderId && !isThisOrderLoading}
                            >
                                {t('waiterOrderManagement.buttonMarkAsPaid')}
                            </Button>
                        )}
                        {/* Aquí podríamos añadir más acciones, como "Pedir Cuenta" si el estado lo permite */}
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Group justify="space-between">
                    <Title order={2}>{t('waiterOrderManagement.title')}</Title>
                    <Button
                        onClick={() => fetchOrders(selectedStatusFilter)}
                        leftSection={<IconReload size={16} />}
                        variant="outline"
                        loading={loading && orders.length > 0} // Mostrar loading si ya hay datos y se refresca
                        disabled={loading || !!markingPaidOrderId}
                    >
                        {t('orderStatusPage.refreshButton')}
                    </Button>
                </Group>

                <SegmentedControl
                    data={statusFilterOptions}
                    value={selectedStatusFilter}
                    onChange={setSelectedStatusFilter}
                    disabled={loading || !!markingPaidOrderId}
                />

                {loading && orders.length === 0 && <Group justify="center" mt="xl"><Loader /></Group>}
                {error && !loading && (
                    <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && orders.length === 0 && (
                    <Paper p="xl" shadow="xs" withBorder mt="md">
                        <Text ta="center" c="dimmed">
                            {t('waiterOrderManagement.noOrdersFound')}
                        </Text>
                    </Paper>
                )}

                {!loading && !error && orders.length > 0 && (
                    <Table.ScrollContainer minWidth={700}>
                        <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t('waiterOrderManagement.tableHeaderOrderNum')}</Table.Th>
                                    <Table.Th>{t('waiterOrderManagement.tableHeaderTable')}</Table.Th>
                                    <Table.Th ta="right">{t('waiterOrderManagement.tableHeaderTotal')}</Table.Th>
                                    <Table.Th>{t('waiterOrderManagement.tableHeaderStatus')}</Table.Th>
                                    <Table.Th>{t('common.registered')}</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>{t('common.actions')}</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{rows}</Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                )}
            </Stack>
        </Container>
    );
};

export default WaiterOrderManagementPage;