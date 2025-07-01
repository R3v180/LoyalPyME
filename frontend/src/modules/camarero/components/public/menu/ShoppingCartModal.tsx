// frontend/src/modules/camarero/components/public/menu/ShoppingCartModal.tsx
// VERSIÓN 2.2.0 - REFACTORIZADO: Recibe el descuento calculado como prop

import React from 'react';
import {
    Modal, Text, Stack, Group, Button, Divider, ScrollArea, Box, NumberInput,
    ActionIcon, Textarea, Paper, Tooltip, useMantineTheme, Badge, useMantineColorScheme
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
    IconTrash, IconSend, IconCirclePlus, IconCircleMinus, IconShoppingCartOff,
    IconTicket, IconX
} from '@tabler/icons-react';
import { useLayoutUserData } from '../../../../../shared/hooks/useLayoutUserData';
import { OrderItemFE } from '../../../types/publicOrder.types';
import type { DisplayReward } from '../../../../../shared/types/user.types';

// --- PROPS REFACTORIZADAS ---
interface ShoppingCartModalProps {
    opened: boolean;
    onClose: () => void;
    orderItems: OrderItemFE[];
    orderNotes: string;
    subtotal: number; // Prop para el subtotal sin descuento
    totalWithDiscount: number; // Prop para el total FINAL ya calculado
    appliedDiscount: DisplayReward | null; // Prop para saber QUÉ descuento se aplicó
    onUpdateItemQuantity: (cartItemId: string, newQuantity: number) => void;
    onRemoveItem: (cartItemId: string) => void;
    onUpdateOrderNotes: (notes: string) => void;
    onSubmitOrder: () => Promise<void>;
    isSubmittingOrder: boolean;
    onClearCart: () => void;
    isAddingToExistingOrder?: boolean;
    activeOrderNumber?: string | null;
    onOpenRewardModal: () => void;
    onRemoveDiscount: () => void;
}

const ShoppingCartModal: React.FC<ShoppingCartModalProps> = ({
    opened, onClose, orderItems, orderNotes, subtotal, totalWithDiscount, appliedDiscount, 
    onUpdateItemQuantity, onRemoveItem, onUpdateOrderNotes, 
    onSubmitOrder, isSubmittingOrder, onClearCart,
    isAddingToExistingOrder, activeOrderNumber,
    onOpenRewardModal, onRemoveDiscount
}) => {
    const { t, i18n } = useTranslation();
    const { userData } = useLayoutUserData();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const currentLanguage = i18n.language;

    // --- LÓGICA DE CÁLCULO ELIMINADA ---
    // El cálculo del descuento ahora se hace en el componente padre (PublicMenuViewPage)
    // y se pasa a través de las props `subtotal` y `totalWithDiscount`.
    const calculatedDiscountAmount = subtotal - totalWithDiscount;

    const handleQuantityChange = (cartItemId: string, value: number | string) => {
        onUpdateItemQuantity(cartItemId, Math.max(1, Number(value)));
    };

    const modalTitle = isAddingToExistingOrder ? t('publicMenu.cart.titleAddToOrder', { orderNumber: activeOrderNumber || '' }) : t('publicMenu.cart.title');
    const submitButtonText = isAddingToExistingOrder ? t('publicMenu.cart.submitAddToOrder') : t('publicMenu.cart.submitOrder');
    
    return (
        <Modal
            opened={opened} onClose={onClose} title={modalTitle} size="lg"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            scrollAreaComponent={ScrollArea.Autosize} centered
        >
            <Stack gap="md">
                {orderItems.length > 0 && (
                    <Group justify="flex-end">
                        <Button variant="outline" color="red" size="xs" leftSection={<IconShoppingCartOff size={14} />} onClick={onClearCart} disabled={isSubmittingOrder}>
                            {t('publicMenu.cart.clearCartButton')}
                        </Button>
                    </Group>
                )}

                {orderItems.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">{isAddingToExistingOrder ? t('publicMenu.cart.emptyAddToOrder') : t('publicMenu.cart.empty')}</Text>
                ) : (
                    <ScrollArea.Autosize mah="40vh">
                        <Stack gap="md">
                            {orderItems.map((item) => {
                                const itemNameForLabel = (currentLanguage === 'es' && item.menuItemName_es ? item.menuItemName_es : item.menuItemName_en || item.menuItemName_es) || t('publicMenu.unnamedItem');
                                const isRedeemedItem = !!item.redeemedRewardId;
                                return (
                                    <Paper key={item.cartItemId} p="sm" withBorder radius="sm" bg={isRedeemedItem ? (colorScheme === 'dark' ? theme.colors.green[9] : theme.colors.green[0]) : undefined}>
                                        <Group justify="space-between" align="flex-start" wrap='nowrap'>
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                {isRedeemedItem && <Badge color="green" variant="light" mb={4}>{t('publicMenu.cart.redeemedItemBadge')}</Badge>}
                                                <Text fw={500} truncate>{itemNameForLabel}</Text>
                                                {item.selectedModifiers.length > 0 && (
                                                    <Box ml="xs" mt={2}>
                                                        {item.selectedModifiers.map(mod => (
                                                            <Text key={mod.modifierOptionId} size="xs" c="dimmed">
                                                                + {(currentLanguage === 'es' && mod.name_es ? mod.name_es : mod.name_en || mod.name_es)}
                                                                {mod.priceAdjustment !== 0 && ` (${mod.priceAdjustment > 0 ? '+' : ''}${mod.priceAdjustment.toFixed(2)}€)`}
                                                            </Text>
                                                        ))}
                                                    </Box>
                                                )}
                                                {item.notes && (<Text size="xs" c="dimmed" fs="italic" mt={2}>{t('publicMenu.cart.itemNotesLabel')} {item.notes}</Text>)}
                                            </Box>
                                            <Stack align="flex-end" gap={4} style={{ flexShrink: 0 }}>
                                                <Text fw={500} size="sm" style={{ textDecoration: isRedeemedItem ? 'line-through' : 'none' }}>
                                                    {item.totalPriceForItem.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}
                                                </Text>
                                                <Group gap="xs" wrap="nowrap">
                                                    <ActionIcon variant="default" size="sm" onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)} disabled={item.quantity <= 1 || isSubmittingOrder || isRedeemedItem}><IconCircleMinus size={16} /></ActionIcon>
                                                    <NumberInput value={item.quantity} onChange={(val) => handleQuantityChange(item.cartItemId, val)} min={1} max={20} hideControls disabled={isSubmittingOrder || isRedeemedItem} styles={{ input: { width: '40px', textAlign: 'center', padding: '0'} }} />
                                                    <ActionIcon variant="default" size="sm" onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)} disabled={isSubmittingOrder || isRedeemedItem}><IconCirclePlus size={16} /></ActionIcon>
                                                    <Tooltip label={t('publicMenu.cart.removeItem')} withArrow>
                                                        <Box><ActionIcon color="red" variant="light" onClick={() => onRemoveItem(item.cartItemId)} disabled={isSubmittingOrder}><IconTrash size={16} /></ActionIcon></Box>
                                                    </Tooltip>
                                                </Group>
                                            </Stack>
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </ScrollArea.Autosize>
                )}
                
                {userData && (
                    <>
                        <Divider my="sm" label={t('publicMenu.cart.rewardsSectionTitle')} labelPosition="center" />
                        <Button
                            variant="light"
                            color="blue"
                            fullWidth
                            onClick={onOpenRewardModal}
                            leftSection={<IconTicket size={18} />}
                        >
                            {t('publicMenu.cart.applyRewardButton')}
                        </Button>
                    </>
                )}

                <Divider my="sm" />
                <Textarea label={t('publicMenu.cart.orderNotesLabel')} placeholder={t('publicMenu.cart.orderNotesPlaceholder')} value={orderNotes} onChange={(event) => onUpdateOrderNotes(event.currentTarget.value)} minRows={2} disabled={isSubmittingOrder} />
                <Divider my="sm" />

                <Stack gap={4}>
                    <Group justify="space-between"><Text size="sm">{t('publicMenu.cart.subtotal')}</Text><Text size="sm">{subtotal.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}</Text></Group>
                    {appliedDiscount && (
                        <Group justify="space-between">
                            <Group gap="xs">
                                <Text size="sm" c="green">{t('publicMenu.cart.discountApplied')}</Text>
                                <Tooltip label="Quitar descuento">
                                    <ActionIcon size="xs" color="red" variant="subtle" onClick={onRemoveDiscount}>
                                        <IconX/>
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                            <Text size="sm" c="green">{`- ${calculatedDiscountAmount.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}`}</Text>
                        </Group>
                    )}
                    <Group justify="space-between" mt="sm">
                        <Text fw={700} size="lg">{t(isAddingToExistingOrder ? 'publicMenu.cart.totalAddItems' : 'publicMenu.cart.totalOrder')}</Text>
                        <Text fw={700} size="lg">{totalWithDiscount.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}</Text>
                    </Group>
                </Stack>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={onClose} disabled={isSubmittingOrder}>{t('publicMenu.cart.continueShopping')}</Button>
                    <Button onClick={onSubmitOrder} loading={isSubmittingOrder} disabled={orderItems.length === 0} leftSection={<IconSend size={16} />} color="green">{submitButtonText}</Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ShoppingCartModal;