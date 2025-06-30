// frontend/src/modules/camarero/components/public/order/OrderBillView.tsx
// Version 1.1.0 - Corrected type imports and added explicit types to map callbacks.
import React from 'react';
import { Paper, Text, Stack, Group, Divider, Box, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// --- CORRECCIÓN 1: Ruta de importación corregida ---
import { PublicOrderStatusInfo, PublicOrderItemStatusInfo, PublicModifierStatusInfo } from '../../../../types/publicOrder.types';

interface OrderBillViewProps {
  orderData: PublicOrderStatusInfo;
}

const OrderBillView: React.FC<OrderBillViewProps> = ({ orderData }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // Extraemos los datos necesarios
  const { items, totalAmount, discountAmount, finalAmount } = orderData;

  const formatCurrency = (value: number) => {
    return value.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' });
  };

  return (
    <Paper withBorder p="lg" radius="md" mt="md">
      <Stack gap="md">
        {/* Cabecera de la factura */}
        <Group justify="space-between" align="baseline">
          <Text fw={500}>{t('orderBillView.item', 'Ítem')}</Text>
          <Group gap="xl">
            <Text fw={500} style={{ width: '80px', textAlign: 'right' }}>{t('orderBillView.price', 'Precio')}</Text>
            <Text fw={500} style={{ width: '80px', textAlign: 'right' }}>{t('orderBillView.total', 'Total')}</Text>
          </Group>
        </Group>
        <Divider />

        {/* Lista de Ítems */}
        <Stack gap="sm">
          {items.map((item: PublicOrderItemStatusInfo) => {
            const isRedeemedItem = item.priceAtPurchase === 0 && item.totalItemPrice === 0;
            const itemName = item.itemNameSnapshot || t('orderBillView.unnamedItem', 'Ítem sin nombre');
            
            return (
              <Box key={item.id}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={500} truncate>
                      {item.quantity}x {itemName}
                    </Text>
                    {isRedeemedItem && <Badge color="green" variant="light" size="sm" mt={4} style={{width: 'fit-content'}}>{t('orderBillView.reward', 'Recompensa')}</Badge>}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <Box ml="sm" mt={4}>
                        {/* --- CORRECCIÓN 2: Tipado explícito para 'mod' e 'index' --- */}
                        {item.selectedModifiers.map((mod: PublicModifierStatusInfo, index: number) => (
                          <Text key={index} size="xs" c="dimmed">
                            + {mod.optionNameSnapshot}
                            {mod.optionPriceAdjustmentSnapshot > 0 && ` (${formatCurrency(mod.optionPriceAdjustmentSnapshot)})`}
                          </Text>
                        ))}
                      </Box>
                    )}
                  </Stack>
                  <Group gap="xl" wrap="nowrap">
                     <Text size="sm" style={{ width: '80px', textAlign: 'right', textDecoration: isRedeemedItem ? 'line-through' : 'none' }}>
                        {formatCurrency(item.priceAtPurchase)}
                    </Text>
                    <Text fw={500} size="sm" style={{ width: '80px', textAlign: 'right' }}>
                        {formatCurrency(item.totalItemPrice)}
                    </Text>
                  </Group>
                </Group>
              </Box>
            );
          })}
        </Stack>

        <Divider mt="sm"/>

        {/* Sección de Totales */}
        <Stack gap={4} align="flex-end">
            <Group justify="space-between" style={{ width: '250px' }}>
                <Text size="sm">{t('orderBillView.subtotal', 'Subtotal')}:</Text>
                <Text size="sm">{formatCurrency(totalAmount)}</Text>
            </Group>
            {discountAmount !== null && discountAmount > 0 && (
                <Group justify="space-between" style={{ width: '250px' }}>
                    <Text size="sm" c="green">{t('orderBillView.discount', 'Descuento')}:</Text>
                    <Text size="sm" c="green">{formatCurrency(-discountAmount)}</Text>
                </Group>
            )}
            <Group justify="space-between" style={{ width: '250px' }} mt="xs">
                <Text fw={700} size="lg">{t('orderBillView.finalTotal', 'TOTAL A PAGAR')}:</Text>
                <Text fw={700} size="lg">{formatCurrency(finalAmount)}</Text>
            </Group>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default OrderBillView;