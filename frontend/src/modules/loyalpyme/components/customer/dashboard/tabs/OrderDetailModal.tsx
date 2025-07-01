// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/OrderDetailModal.tsx
// Version 1.2.1 - Added missing `appliedLcoRewardId` property in adapter function.

import React from 'react';
import { Modal, Stack, Title, Group, Text, Divider, Button, ScrollArea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconPdf, IconMail } from '@tabler/icons-react';

import OrderBillView from '../../../../../camarero/components/public/menu/order/OrderBillView';
import { PublicOrderStatusInfo } from '../../../../../camarero/types/publicOrder.types';
import { CustomerOrder } from '../../../../types/history.types';
import { OrderStatus, OrderItemStatus } from '../../../../../../shared/types/user.types';


interface OrderDetailModalProps {
    opened: boolean;
    onClose: () => void;
    order: CustomerOrder | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ opened, onClose, order }) => {
    const { t, i18n } = useTranslation();

    if (!order) return null;

    const adaptOrderDataForBillView = (historialOrder: CustomerOrder): PublicOrderStatusInfo => {
        const totalAmount = Number(historialOrder.items.reduce((sum, item) => sum + Number(item.totalItemPrice), 0));
        const finalAmount = Number(historialOrder.finalAmount);
        
        return {
            orderId: historialOrder.id,
            orderNumber: historialOrder.orderNumber,
            orderStatus: OrderStatus.PAID, 
            tableIdentifier: null,
            orderNotes: null,
            createdAt: historialOrder.paidAt || new Date().toISOString(),
            isBillRequested: true,
            totalAmount: totalAmount,
            finalAmount: finalAmount,
            discountAmount: totalAmount - finalAmount,
            // --- CORRECCIÓN: Añadir la propiedad que faltaba ---
            appliedLcoRewardId: historialOrder.appliedLcoRewardId || null,
            // --- FIN CORRECCIÓN ---
            items: historialOrder.items.map(item => ({
                id: item.itemNameSnapshot || Math.random().toString(), 
                itemNameSnapshot: item.itemNameSnapshot,
                quantity: item.quantity,
                status: OrderItemStatus.SERVED,
                priceAtPurchase: Number(item.priceAtPurchase),
                totalItemPrice: Number(item.totalItemPrice),
                selectedModifiers: item.selectedModifiers.map(mod => ({
                    optionNameSnapshot: mod.optionNameSnapshot,
                    optionPriceAdjustmentSnapshot: Number(mod.optionPriceAdjustmentSnapshot)
                }))
            }))
        };
    };

    const billData = adaptOrderDataForBillView(order);
    const formattedDate = order.paidAt ? new Date(order.paidAt).toLocaleString(i18n.language) : t('common.invalidDate');

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Stack gap={0}>
                    <Title order={4}>{t('orderDetailModal.title')}</Title>
                    <Text size="sm" c="dimmed">#{order.orderNumber} - {formattedDate}</Text>
                </Stack>
            }
            size="lg"
            centered
            scrollAreaComponent={ScrollArea.Autosize}
        >
            <Stack>
                <OrderBillView orderData={billData} />
                
                <Divider my="sm" />

                <Group justify="flex-end">
                    <Button variant="outline" leftSection={<IconPdf size={16} />} disabled>
                        {t('orderDetailModal.downloadPdf')}
                    </Button>
                    <Button variant="outline" leftSection={<IconMail size={16} />} disabled>
                        {t('orderDetailModal.sendByEmail')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default OrderDetailModal;