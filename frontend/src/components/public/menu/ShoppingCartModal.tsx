// frontend/src/components/public/menu/ShoppingCartModal.tsx
// Version: 0.1.4 (Add new props for "add to existing order" context)

import React from 'react';
import {
    Modal,
    Text,
    Stack,
    Group,
    Button,
    Divider,
    ScrollArea,
    Box,
    NumberInput,
    ActionIcon,
    Textarea,
    Paper,
    Tooltip,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
    IconTrash,
    IconSend,
    IconCirclePlus,
    IconCircleMinus,
    IconShoppingCartOff
} from '@tabler/icons-react';

// Interfaz OrderItemFE (debe coincidir con la de PublicMenuViewPage o importarse de un tipo común)
interface OrderItemFE {
    cartItemId: string;
    menuItemName_es: string | null;
    menuItemName_en: string | null;
    quantity: number;
    currentPricePerUnit: number;
    totalPriceForItem: number;
    notes?: string | null;
    selectedModifiers: { 
        modifierOptionId: string;
        name_es?: string | null;
        name_en?: string | null;
        priceAdjustment: number;
        modifierGroupName_es?: string | null;
        modifierGroupName_en?: string | null;
    }[];
}

interface ShoppingCartModalProps {
    opened: boolean;
    onClose: () => void;
    orderItems: OrderItemFE[];
    orderNotes: string;
    onUpdateItemQuantity: (cartItemId: string, newQuantity: number) => void;
    onRemoveItem: (cartItemId: string) => void;
    onUpdateOrderNotes: (notes: string) => void;
    onSubmitOrder: () => Promise<void>;
    isSubmittingOrder: boolean;
    onClearCart: () => void;
    // --- NUEVAS PROPS AÑADIDAS ---
    isAddingToExistingOrder?: boolean; 
    activeOrderNumber?: string | null;
}

const ShoppingCartModal: React.FC<ShoppingCartModalProps> = ({
    opened,
    onClose,
    orderItems,
    orderNotes,
    onUpdateItemQuantity,
    onRemoveItem,
    onUpdateOrderNotes,
    onSubmitOrder,
    isSubmittingOrder,
    onClearCart,
    // --- RECIBIR NUEVAS PROPS ---
    isAddingToExistingOrder,
    activeOrderNumber,
}) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const calculateSubtotal = () => {
        return orderItems.reduce((acc, item) => acc + item.totalPriceForItem, 0);
    };

    const subtotal = calculateSubtotal();
    const totalOrderAmount = subtotal;

    const handleQuantityChange = (cartItemId: string, value: number | string) => {
        const newQuantity = Number(value);
        onUpdateItemQuantity(cartItemId, Math.max(1, newQuantity));
    };

    // Determinar el título del modal y el texto del botón de envío
    const modalTitle = isAddingToExistingOrder 
        ? t('publicMenu.cart.titleAddToOrder', { orderNumber: activeOrderNumber || '' })
        : t('publicMenu.cart.title', 'Tu Pedido');
    
    const submitButtonText = isAddingToExistingOrder
        ? t('publicMenu.cart.submitAddToOrder', 'Añadir al Pedido')
        : t('publicMenu.cart.submitOrder', 'Enviar Pedido');


    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={modalTitle} // <-- Título dinámico
            size="lg"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            scrollAreaComponent={ScrollArea.Autosize}
            centered
        >
            <Stack gap="md">
                {orderItems.length > 0 && (
                    <Group justify="flex-end">
                        <Button
                            variant="outline"
                            color="red"
                            size="xs"
                            leftSection={<IconShoppingCartOff size={14} />}
                            onClick={onClearCart}
                            disabled={isSubmittingOrder}
                        >
                            {t('publicMenu.cart.clearCartButton', 'Vaciar Carrito')}
                        </Button>
                    </Group>
                )}

                {orderItems.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        {isAddingToExistingOrder 
                            ? t('publicMenu.cart.emptyAddToOrder', 'Selecciona ítems para añadir a tu pedido.')
                            : t('publicMenu.cart.empty', 'Tu carrito de pedido está vacío.')
                        }
                    </Text>
                ) : (
                    <ScrollArea.Autosize mah="40vh">
                        <Stack gap="md">
                            {orderItems.map((item) => {
                                const itemNameForLabel = (currentLanguage === 'es' && item.menuItemName_es ? item.menuItemName_es : item.menuItemName_en || item.menuItemName_es) || t('publicMenu.unnamedItem');
                                return (
                                <Paper key={item.cartItemId} p="sm" withBorder radius="sm">
                                    <Group justify="space-between" align="flex-start">
                                        <Box style={{ flex: 1 }}>
                                            <Text fw={500}>
                                                {itemNameForLabel}
                                            </Text>
                                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                                <Box ml="xs" mt={2}>
                                                    {item.selectedModifiers.map(mod => (
                                                        <Text key={mod.modifierOptionId} size="xs" c="dimmed">
                                                            + {(currentLanguage === 'es' && mod.name_es ? mod.name_es : mod.name_en || mod.name_es) || t('publicMenu.unnamedModifier')}
                                                            {mod.priceAdjustment !== 0 && ` (${mod.priceAdjustment > 0 ? '+' : ''}${mod.priceAdjustment.toFixed(2)}€)`}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}
                                            {item.notes && (
                                                <Text size="xs" c="dimmed" fs="italic" mt={2}>
                                                    {t('publicMenu.cart.itemNotesLabel', 'Notas:')} {item.notes}
                                                </Text>
                                            )}
                                        </Box>
                                        <Stack align="flex-end" gap={4}>
                                            <Text fw={500} size="sm">
                                                {item.totalPriceForItem.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}
                                            </Text>
                                            <Group gap="xs" wrap="nowrap">
                                                <ActionIcon 
                                                    variant="default" 
                                                    size="sm" 
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)} 
                                                    disabled={item.quantity <= 1 || isSubmittingOrder}
                                                    aria-label={t('publicMenu.cart.decreaseQuantity', { itemName: itemNameForLabel })}
                                                >
                                                    <IconCircleMinus size={16} />
                                                </ActionIcon>
                                                <NumberInput
                                                    value={item.quantity}
                                                    onChange={(val) => handleQuantityChange(item.cartItemId, val)}
                                                    min={1}
                                                    max={20}
                                                    step={1}
                                                    hideControls
                                                    disabled={isSubmittingOrder}
                                                    styles={{ input: { width: '40px', textAlign: 'center', paddingLeft: '0', paddingRight: '0'} }}
                                                    aria-label={t('publicMenu.cart.itemQuantity', { itemName: itemNameForLabel })}
                                                />
                                                <ActionIcon 
                                                    variant="default" 
                                                    size="sm" 
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)} 
                                                    disabled={isSubmittingOrder}
                                                    aria-label={t('publicMenu.cart.increaseQuantity', { itemName: itemNameForLabel })}
                                                >
                                                    <IconCirclePlus size={16} />
                                                </ActionIcon>
                                                <Tooltip label={t('publicMenu.cart.removeItem', 'Eliminar ítem')} withArrow>
                                                    <Box> 
                                                        <ActionIcon 
                                                            color="red" 
                                                            variant="light" 
                                                            onClick={() => onRemoveItem(item.cartItemId)} 
                                                            disabled={isSubmittingOrder}
                                                            aria-label={t('publicMenu.cart.removeItemFromOrder', { itemName: itemNameForLabel })}
                                                        >
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Box>
                                                </Tooltip>
                                            </Group>
                                        </Stack>
                                    </Group>
                                </Paper>
                            )})}
                        </Stack>
                    </ScrollArea.Autosize>
                )}

                <Divider my="sm" />

                <Textarea
                    label={t('publicMenu.cart.orderNotesLabel', 'Notas para el Pedido (Opcional)')}
                    placeholder={t('publicMenu.cart.orderNotesPlaceholder', 'Ej: Alergias generales, preferencia de entrega...')}
                    value={orderNotes}
                    onChange={(event) => onUpdateOrderNotes(event.currentTarget.value)}
                    minRows={2}
                    disabled={isSubmittingOrder}
                />

                <Divider my="sm" />

                <Group justify="space-between">
                    <Text fw={700} size="lg">
                        {isAddingToExistingOrder 
                            ? t('publicMenu.cart.totalAddItems', 'Total a Añadir:')
                            : t('publicMenu.cart.totalOrder', 'Total del Pedido:')
                        }
                    </Text>
                    <Text fw={700} size="lg">
                        {totalOrderAmount.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}
                    </Text>
                </Group>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={onClose} disabled={isSubmittingOrder}>
                        {t('publicMenu.cart.continueShopping', 'Seguir Pidiendo')}
                    </Button>
                    <Button
                        onClick={onSubmitOrder}
                        loading={isSubmittingOrder}
                        disabled={orderItems.length === 0}
                        leftSection={<IconSend size={16} />}
                        color="green"
                    >
                        {submitButtonText} {/* <-- Texto dinámico del botón */}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ShoppingCartModal;