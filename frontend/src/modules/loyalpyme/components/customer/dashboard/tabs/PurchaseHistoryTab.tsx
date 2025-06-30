// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/PurchaseHistoryTab.tsx
// Version 2.0.0 - Final implementation with Table and Modal integration.

import React, { useState } from 'react';
import { Stack, Title, Loader, Alert, Group, Pagination, Text, Table, ActionIcon, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@mantine/hooks';
import { IconEye } from '@tabler/icons-react';

import { useCustomerPurchaseHistory } from '../../../../hooks/useCustomerPurchaseHistory';
import { CustomerOrder } from '../../../../types/history.types';
import OrderDetailModal from './OrderDetailModal';

const PurchaseHistoryTab: React.FC = () => {
    const { t, i18n } = useTranslation();
    const {
        orders,
        loading,
        error,
        currentPage,
        totalPages,
        totalItems,
        setPage,
    } = useCustomerPurchaseHistory();

    const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

    const handleViewDetails = (order: CustomerOrder) => {
        setSelectedOrder(order);
        openModal();
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return t('common.invalidDate', 'Fecha inválida');
        }
    };

    // Mapeamos los pedidos a filas de la tabla
    const rows = orders.map((order) => (
        <Table.Tr key={order.id} onClick={() => handleViewDetails(order)} style={{ cursor: 'pointer' }}>
            <Table.Td>#{order.orderNumber}</Table.Td>
            <Table.Td>{formatDate(order.paidAt)}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(Number(order.finalAmount))}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
                <Tooltip label={t('orderDetailModal.viewTooltip', 'Ver Detalle')}>
                    <ActionIcon variant="subtle" onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}>
                        <IconEye size={16} />
                    </ActionIcon>
                </Tooltip>
            </Table.Td>
        </Table.Tr>
    ));

    // Función para renderizar el contenido principal
    const renderContent = () => {
        if (loading && orders.length === 0) {
            return <Group justify="center" p="xl"><Loader /></Group>;
        }
        if (error) {
            return <Alert color="red" title="Error">{error}</Alert>;
        }
        if (orders.length === 0) {
            return <Text c="dimmed">{t('customerDashboard.historyTab.noOrders', 'Aún no tienes pedidos registrados.')}</Text>;
        }
        return (
            <Table.ScrollContainer minWidth={400}>
                <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>{t('orderDetailModal.headerOrder', 'Nº Pedido')}</Table.Th>
                            <Table.Th>{t('orderDetailModal.headerDate', 'Fecha')}</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>{t('orderDetailModal.headerTotal', 'Total')}</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>{t('common.actions', 'Acciones')}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        );
    };

    return (
        <>
            <Stack>
                <Title order={3}>{t('customerDashboard.historyTab.title', 'Mi Historial de Pedidos')}</Title>
                
                {!loading && totalItems > 0 && (
                    <Text size="sm" c="dimmed">
                        {t('customerDashboard.historyTab.totalOrders', { count: totalItems })}
                    </Text>
                )}
                
                {renderContent()}
                
                {!loading && totalPages > 1 && (
                    <Group justify="center" mt="md">
                        <Pagination total={totalPages} value={currentPage} onChange={setPage} />
                    </Group>
                )}
            </Stack>
            
            <OrderDetailModal
                opened={modalOpened}
                onClose={closeModal}
                order={selectedOrder}
            />
        </>
    );
};

export default PurchaseHistoryTab;