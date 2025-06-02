// frontend/src/pages/PublicMenuViewPage.tsx
// Version: 1.6.10 (Remove unused PublicMenuModifierOption import)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Title, Loader, Alert, Text, Stack, Paper, Image, Group,
    useMantineTheme, Button, useMantineColorScheme 
} from '@mantine/core';
import {
    IconAlertCircle, IconShoppingCartPlus, IconShoppingCart, IconCheck,
    IconInfoCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

import {
    PublicDigitalMenuData,
    PublicMenuItem,
    ModifierUiType
    // PublicMenuModifierOption // <-- Eliminada esta importación
} from '../types/menu.types';

import CategoryAccordion from '../components/public/menu/CategoryAccordion';
import { MenuItemCardConfiguringState } from '../components/public/menu/MenuItemCard';
import ShoppingCartModal from '../components/public/menu/ShoppingCartModal';

import { OrderStatus as PageOrderStatus, PublicOrderStatusInfo as PagePublicOrderStatusInfo } from './OrderStatusPage';

export interface SelectedModifierFE {
    modifierOptionId: string;
    name_es?: string | null;
    name_en?: string | null;
    priceAdjustment: number;
    modifierGroupName_es?: string | null;
    modifierGroupName_en?: string | null;
}

export interface OrderItemFE {
    cartItemId: string;
    menuItemId: string;
    menuItemName_es: string | null;
    menuItemName_en: string | null;
    quantity: number;
    basePrice: number;
    currentPricePerUnit: number;
    totalPriceForItem: number;
    notes?: string | null;
    selectedModifiers: SelectedModifierFE[];
}

interface CreateOrderItemModifierDto {
    modifierOptionId: string;
}
interface CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: CreateOrderItemModifierDto[] | null;
}
interface CreateOrderPayloadDto {
    tableIdentifier?: string | null;
    customerId?: string | null; 
    orderNotes?: string | null;
    items: CreateOrderItemDto[];
    businessId?: string;
}

export interface AddOrderItemDtoFE { 
    menuItemId: string;
    quantity: number;
    selectedModifiers?: Array<{ modifierOptionId: string }>;
}
export interface AddItemsToOrderPayloadDtoFE { 
    items: AddOrderItemDtoFE[];
    customerNotes?: string;
}

interface BackendOrderResponse {
    id: string; 
    orderNumber?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

interface ConfiguringItemState {
    itemDetails: PublicMenuItem;
    quantity: number;
    selectedOptionsByGroup: Record<string, string[] | string>;
    currentUnitPrice: number;
    itemNotes: string;
    areModifiersValid: boolean;
}

const LOCAL_STORAGE_CART_KEY_PREFIX = 'loyalpyme_public_cart_';
const LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX = 'loyalpyme_public_order_notes_';
const ACTIVE_ORDER_INFO_KEY_PREFIX = 'loyalpyme_active_order_info_'; 

const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const { businessSlug, tableIdentifier } = useParams<{ businessSlug: string; tableIdentifier?: string }>();
    const navigate = useNavigate();

    const cartStorageKey = `${LOCAL_STORAGE_CART_KEY_PREFIX}${businessSlug || 'default'}${tableIdentifier ? `_${tableIdentifier}` : ''}`;
    const notesStorageKey = `${LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX}${businessSlug || 'default'}${tableIdentifier ? `_${tableIdentifier}` : ''}`;
    const activeOrderKey = businessSlug ? `${ACTIVE_ORDER_INFO_KEY_PREFIX}${businessSlug}${tableIdentifier ? `_${tableIdentifier}` : ''}` : null;

    const [menuData, setMenuData] = useState<PublicDigitalMenuData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
    
    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItemFE[]>(() => {
        const savedCart = localStorage.getItem(cartStorageKey);
        try { return savedCart ? JSON.parse(savedCart) : []; } 
        catch (e) { console.error("Error parsing cart from localStorage", e); return []; }
    });
    const [orderNotes, setOrderNotes] = useState<string>(() => {
        return localStorage.getItem(notesStorageKey) || '';
    });

    const [isCartOpen, { open: openCart, close: closeCart }] = useDisclosure(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [configuringItem, setConfiguringItem] = useState<ConfiguringItemState | null>(null);
    
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
    const [canCurrentlyAddToExistingOrder, setCanCurrentlyAddToExistingOrder] = useState<boolean>(false);
    const [loadingActiveOrderStatus, setLoadingActiveOrderStatus] = useState<boolean>(false);

    const canAddMoreItemsToOrderStatus = useCallback((status: PageOrderStatus | undefined): boolean => {
        if (!status) return false;
        return [
            PageOrderStatus.RECEIVED, PageOrderStatus.IN_PROGRESS, PageOrderStatus.PARTIALLY_READY,
            PageOrderStatus.ALL_ITEMS_READY, PageOrderStatus.COMPLETED 
        ].includes(status);
    }, []);

    useEffect(() => {
        if (activeOrderKey) {
            const storedActiveOrderInfo = localStorage.getItem(activeOrderKey);
            if (storedActiveOrderInfo) {
                try {
                    const parsedInfo = JSON.parse(storedActiveOrderInfo);
                    if (parsedInfo.orderId && parsedInfo.orderNumber) {
                        setActiveOrderId(parsedInfo.orderId);
                        setActiveOrderNumber(parsedInfo.orderNumber);
                        setCurrentOrderItems([]); 
                        setOrderNotes('');      

                        setLoadingActiveOrderStatus(true);
                        axios.get<PagePublicOrderStatusInfo>(`${API_BASE_URL}/order/${parsedInfo.orderId}/status`)
                            .then(response => {
                                if (response.data && canAddMoreItemsToOrderStatus(response.data.orderStatus)) {
                                    setCanCurrentlyAddToExistingOrder(true);
                                } else {
                                    setCanCurrentlyAddToExistingOrder(false);
                                    setActiveOrderId(null); setActiveOrderNumber(null);
                                    localStorage.removeItem(activeOrderKey);
                                }
                            })
                            .catch(() => {
                                setCanCurrentlyAddToExistingOrder(false);
                                setActiveOrderId(null); setActiveOrderNumber(null);
                                localStorage.removeItem(activeOrderKey);
                            })
                            .finally(() => {
                                setLoadingActiveOrderStatus(false);
                            });
                    } else {
                        localStorage.removeItem(activeOrderKey);
                        setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
                    }
                } catch (e) {
                    localStorage.removeItem(activeOrderKey);
                    setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
                }
            } else {
                setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
            }
        } else {
            setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
        }
    }, [activeOrderKey, canAddMoreItemsToOrderStatus]);

    useEffect(() => {
        if (!activeOrderId) { 
            localStorage.setItem(cartStorageKey, JSON.stringify(currentOrderItems));
        }
    }, [currentOrderItems, cartStorageKey, activeOrderId]);

    useEffect(() => {
        if (!activeOrderId) { 
            localStorage.setItem(notesStorageKey, orderNotes);
        }
    }, [orderNotes, notesStorageKey, activeOrderId]);

    const fetchPublicMenu = useCallback(async () => {
        if (!businessSlug) { setError(t('error.missingBusinessSlug')); setLoading(false); return; }
        setLoading(true); setError(null);
        try {
            const response = await axios.get<PublicDigitalMenuData>(`${API_BASE_URL}/menu/business/${businessSlug}`);
            if (response.data) {
                const parsedMenuData = {
                    ...response.data,
                    categories: response.data.categories.map(c => ({
                        ...c, 
                        items: c.items.map(i => ({
                            ...i, 
                            price: parseFloat(String(i.price)), 
                            modifierGroups: Array.isArray(i.modifierGroups) ? i.modifierGroups.map(g => ({
                                ...g, 
                                options: Array.isArray(g.options) ? g.options.map(o => ({
                                    ...o, 
                                    priceAdjustment: parseFloat(String(o.priceAdjustment)) 
                                })) : [] 
                            })) : [] 
                        }))
                    }))
                };
                setMenuData(parsedMenuData);
                if (parsedMenuData.categories.length > 0 && !activeOrderId) { 
                    setActiveAccordionItems([parsedMenuData.categories[0].id]);
                } else if (activeOrderId) {
                    setActiveAccordionItems([]); 
                }
            } else { throw new Error(t('error.noMenuDataReceived')); }
        } catch (err: any) { setError(err.response?.data?.message || err.message || t('common.errorUnknown')); setMenuData(null); } 
        finally { setLoading(false); }
    }, [businessSlug, t, activeOrderId]);

    useEffect(() => { fetchPublicMenu(); }, [fetchPublicMenu]);

    const calculatePriceAndValidate = useCallback((itemDetails: PublicMenuItem, selectedOptions: Record<string, string[] | string>): { newPrice: number; isValid: boolean } => {
        let newPrice = itemDetails.price; 
        let isValid = true;
        
        if (Array.isArray(itemDetails.modifierGroups)) {
            for (const group of itemDetails.modifierGroups) {
                const selections = selectedOptions[group.id];
                let count = 0;
                let currentSelectionsForGroup: string[] = [];

                if (Array.isArray(selections)) {
                    currentSelectionsForGroup = selections.filter(s => s && s.trim() !== '');
                    count = currentSelectionsForGroup.length;
                } else if (typeof selections === 'string' && selections.trim() !== '') {
                    currentSelectionsForGroup = [selections.trim()];
                    count = 1;
                }
                
                if (group.isRequired && count < group.minSelections) {
                    isValid = false;
                }
                if (count > group.maxSelections) {
                    isValid = false;
                }
                if (group.uiType === ModifierUiType.RADIO && count > 1) {
                    isValid = false;
                }
                
                if(Array.isArray(group.options)) {
                    currentSelectionsForGroup.forEach(optionId => { 
                        const option = group.options.find(opt => opt.id === optionId); 
                        if (option) {
                            newPrice += option.priceAdjustment;
                        }
                    });
                }
            }
        }
        return { newPrice, isValid };
    }, []);

    useEffect(() => { 
        if (configuringItem) {
            const { newPrice, isValid } = calculatePriceAndValidate(configuringItem.itemDetails, configuringItem.selectedOptionsByGroup);
            if (newPrice !== configuringItem.currentUnitPrice || isValid !== configuringItem.areModifiersValid) {
                setConfiguringItem(prev => prev ? { ...prev, currentUnitPrice: newPrice, areModifiersValid: isValid } : null);
            }
        }
    }, [configuringItem, calculatePriceAndValidate]);
    
    const handleStartConfigureItem = (item: PublicMenuItem) => {
        const initialSelectedOptions: Record<string, string[] | string> = {};
        if (Array.isArray(item.modifierGroups)) {
            item.modifierGroups.forEach(group => {
                const optionsAvailable = Array.isArray(group.options) ? group.options : [];
                const defaultOptions = optionsAvailable.filter(opt => opt.isDefault && opt.isAvailable); // Usa isAvailable aquí
                
                if (group.uiType === ModifierUiType.RADIO) { 
                    let defaultRadioOptionId = '';
                    if (defaultOptions.length > 0) {
                        defaultRadioOptionId = defaultOptions[0].id;
                    } else if (optionsAvailable.length > 0 && group.isRequired && group.minSelections === 1) {
                        const firstAvailableOption = optionsAvailable.find(opt => opt.isAvailable); // Busca primera disponible
                        if (firstAvailableOption) {
                            defaultRadioOptionId = firstAvailableOption.id;
                        }
                    }
                    initialSelectedOptions[group.id] = defaultRadioOptionId;
                } else { // CHECKBOX
                    initialSelectedOptions[group.id] = defaultOptions.map(opt => opt.id);
                }
            });
        }
        const {newPrice, isValid} = calculatePriceAndValidate(item, initialSelectedOptions);
        setConfiguringItem({ 
            itemDetails: item, 
            quantity: 1, 
            selectedOptionsByGroup: initialSelectedOptions, 
            currentUnitPrice: newPrice, 
            itemNotes: '', 
            areModifiersValid: isValid 
        });
    };
    const handleCancelConfiguration = () => setConfiguringItem(null);
    const handleConfigQuantityChange = (newQuantity: number) => setConfiguringItem(prev => prev ? { ...prev, quantity: newQuantity } : null);
    const handleConfigModifierSelectionChange = (groupId: string, newSelection: string | string[]) => {
        setConfiguringItem(prev => {
            if (!prev) return null;
            return { 
                ...prev, 
                selectedOptionsByGroup: { 
                    ...prev.selectedOptionsByGroup, 
                    [groupId]: newSelection 
                } 
            };
        });
    };
    const handleConfigNotesChange = (newNotes: string) => setConfiguringItem(prev => prev ? { ...prev, itemNotes: newNotes } : null);
    
    const handleConfigAddToCart = () => {
        if (!configuringItem || !configuringItem.areModifiersValid) {
            notifications.show({
                title: t('publicMenu.invalidSelectionTitle', "Selección Inválida"),
                message: t('publicMenu.invalidSelectionMsg', "Por favor, revisa los modificadores obligatorios."),
                color: 'orange'
            });
            return;
        }
        const { itemDetails, quantity, selectedOptionsByGroup, currentUnitPrice, itemNotes } = configuringItem;

        const flatSelectedModifiers: SelectedModifierFE[] = [];
        if (Array.isArray(itemDetails.modifierGroups)) {
            Object.entries(selectedOptionsByGroup).forEach(([groupId, optionSelections]) => {
                const group = itemDetails.modifierGroups!.find(g => g.id === groupId);
                if (!group || !Array.isArray(group.options)) return; 
                
                const ids = Array.isArray(optionSelections) 
                    ? optionSelections.filter(s => s && s.trim() !== '')
                    : ( (typeof optionSelections === 'string' && optionSelections.trim() !== '') ? [optionSelections.trim()] : [] );
                
                ids.forEach(optId => {
                    const option = group.options.find(o => o.id === optId);
                    if (option) {
                        flatSelectedModifiers.push({
                            modifierOptionId: option.id,
                            name_es: option.name_es,
                            name_en: option.name_en,
                            priceAdjustment: option.priceAdjustment,
                            modifierGroupName_es: group.name_es,
                            modifierGroupName_en: group.name_en,
                        });
                    }
                });
            });
        }

        const sortedModifierOptionIds = flatSelectedModifiers.map(m => m.modifierOptionId).sort().join(',');
        const notesHash = itemNotes ? `_notes-${itemNotes.toLocaleLowerCase().replace(/\s/g, '')}` : '';
        const cartItemId = `${itemDetails.id}${flatSelectedModifiers.length > 0 ? `-[${sortedModifierOptionIds}]` : ''}${notesHash}`;

        const existingCartItemIndex = currentOrderItems.findIndex(ci => ci.cartItemId === cartItemId);

        if (existingCartItemIndex > -1) {
            const updatedItems = [...currentOrderItems];
            const existing = updatedItems[existingCartItemIndex];
            existing.quantity += quantity;
            existing.totalPriceForItem = existing.currentPricePerUnit * existing.quantity;
            setCurrentOrderItems(updatedItems);
        } else {
            const newCartItem: OrderItemFE = {
                cartItemId: cartItemId, 
                menuItemId: itemDetails.id,
                menuItemName_es: itemDetails.name_es,
                menuItemName_en: itemDetails.name_en,
                quantity: quantity,
                basePrice: itemDetails.price,
                currentPricePerUnit: currentUnitPrice,
                totalPriceForItem: currentUnitPrice * quantity,
                notes: itemNotes || undefined,
                selectedModifiers: flatSelectedModifiers,
            };
            setCurrentOrderItems(prev => [...prev, newCartItem]);
        }

        notifications.show({
            title: t('publicMenu.itemAddedTitle'),
            message: t('publicMenu.itemAddedMessage', { itemName: itemDetails.name_es || itemDetails.name_en || t('publicMenu.unnamedItem'), quantity: quantity }),
            color: 'green',
            icon: <IconShoppingCartPlus size={18} />
        });
        setConfiguringItem(null);
    };
    const handleSimpleAddToCart = (item: PublicMenuItem, quantity: number) => {
        const cartItemId = item.id; const existingCartItemIndex = currentOrderItems.findIndex(ci => ci.cartItemId === cartItemId && (!ci.selectedModifiers || ci.selectedModifiers.length === 0) && !ci.notes);
        if (existingCartItemIndex > -1) { const updatedItems = [...currentOrderItems]; const existing = updatedItems[existingCartItemIndex]; existing.quantity += quantity; existing.totalPriceForItem = existing.currentPricePerUnit * existing.quantity; setCurrentOrderItems(updatedItems);
        } else { const newCartItem: OrderItemFE = { cartItemId: cartItemId, menuItemId: item.id, menuItemName_es: item.name_es, menuItemName_en: item.name_en, quantity: quantity, basePrice: item.price, currentPricePerUnit: item.price, totalPriceForItem: item.price * quantity, selectedModifiers: [], }; setCurrentOrderItems(prev => [...prev, newCartItem]); }
        notifications.show({ title: t('publicMenu.itemAddedTitle'), message: t('publicMenu.itemAddedMessage', { itemName: item.name_es || item.name_en || t('publicMenu.unnamedItem'), quantity: quantity }), color: 'green', icon: <IconShoppingCartPlus size={18} /> });
    };
    const handleUpdateItemQuantityInCart = useCallback((cartItemId: string, newQuantity: number) => {
        setCurrentOrderItems(prevItems => prevItems.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQuantity, totalPriceForItem: item.currentPricePerUnit * newQuantity } : item ).filter(item => item.quantity > 0));
    }, []);
    const handleRemoveItemFromCart = useCallback((cartItemId: string) => {
        setCurrentOrderItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    }, []);
    const handleClearCart = useCallback(() => {
        setCurrentOrderItems([]); setOrderNotes('');
        notifications.show({ title: t('publicMenu.cart.clearedTitle'), message: t('publicMenu.cart.clearedMsg'), color: 'blue', });
    }, [t]);

    const handleSubmitOrder = useCallback(async () => {
        if (currentOrderItems.length === 0) {
            notifications.show({ 
                title: t('publicMenu.cart.errorTitle'), 
                message: activeOrderId && canCurrentlyAddToExistingOrder 
                    ? t('publicMenu.cart.errorEmptyAddToExisting', "Añade ítems al carrito antes de enviarlos a tu pedido existente.") 
                    : t('publicMenu.cart.errorEmpty'), 
                color: 'orange' 
            });
            return;
        }
        setIsSubmittingOrder(true);

        if (activeOrderId && canCurrentlyAddToExistingOrder) {
            const payloadItemsFE: AddOrderItemDtoFE[] = currentOrderItems.map(feItem => ({
                menuItemId: feItem.menuItemId,
                quantity: feItem.quantity,
                selectedModifiers: feItem.selectedModifiers.map(sm => ({ modifierOptionId: sm.modifierOptionId })),
            }));

            const addItemsPayload: AddItemsToOrderPayloadDtoFE = {
                items: payloadItemsFE,
                customerNotes: orderNotes.trim() || undefined,
            };
            
            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (businessSlug) {
                    headers['x-loyalpyme-business-slug'] = businessSlug;
                }

                const response = await axios.post<BackendOrderResponse>(
                    `${API_BASE_URL}/order/${activeOrderId}/items`, 
                    addItemsPayload,
                    { headers }
                );
                
                notifications.show({
                    title: t('publicMenu.cart.itemsAddedSuccessTitle', "Ítems Añadidos"),
                    message: t('publicMenu.cart.itemsAddedSuccessMsg', { orderNumber: activeOrderNumber || response.data.orderNumber || activeOrderId }), 
                    color: 'green', autoClose: 4000, icon: <IconCheck size={18} />
                });

                setCurrentOrderItems([]); 
                setOrderNotes('');       
                closeCart();             
                navigate(`/order-status/${activeOrderId}`, { 
                    state: { 
                        orderNumber: activeOrderNumber || response.data.orderNumber, 
                        businessSlug: businessSlug,
                        tableIdentifier: tableIdentifier 
                    } 
                });

            } catch (err: any) {
                const errMsg = err.response?.data?.message || err.message || t('publicMenu.cart.orderErrorMsg');
                notifications.show({ 
                    title: t('publicMenu.cart.addItemsErrorTitle', "Error al Añadir Ítems"), 
                    message: errMsg, 
                    color: 'red',
                    icon: <IconAlertCircle size={18} /> 
                });
            } finally {
                setIsSubmittingOrder(false);
            }

        } else { 
            if (!businessSlug) {
                 notifications.show({ title: t('publicMenu.cart.errorTitle'), message: t('error.missingBusinessSlug'), color: 'red' });
                 setIsSubmittingOrder(false);
                 return;
            }
            const payloadItems: CreateOrderItemDto[] = currentOrderItems.map(feItem => ({
                menuItemId: feItem.menuItemId,
                quantity: feItem.quantity,
                notes: feItem.notes || null,
                selectedModifierOptions: feItem.selectedModifiers.length > 0
                    ? feItem.selectedModifiers.map(sm => ({ modifierOptionId: sm.modifierOptionId }))
                    : null,
            }));
            let customerIdForPayload: string | null = null;
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser && parsedUser.id && parsedUser.role === 'CUSTOMER_FINAL') {
                        customerIdForPayload = parsedUser.id;
                    }
                } catch (e) { console.warn("Could not parse user from localStorage for order submission:", e); }
            }
            const orderPayload: CreateOrderPayloadDto = {
                items: payloadItems,
                orderNotes: orderNotes.trim() || null,
                tableIdentifier: tableIdentifier || null,
                customerId: customerIdForPayload,
            };
            try {
                const response = await axios.post<BackendOrderResponse>(`${API_BASE_URL}/order/${businessSlug}`, orderPayload);
                const orderIdFromResponse = response.data.id; 
                const orderNumberFromResponse = response.data.orderNumber; 
                notifications.show({
                    title: t('publicMenu.cart.orderSuccessTitle'),
                    message: t('publicMenu.cart.orderSuccessMsg', { orderNumber: orderNumberFromResponse || orderIdFromResponse }), 
                    color: 'green', autoClose: 4000, icon: <IconCheck size={18} />
                });
                if (activeOrderKey && orderIdFromResponse && orderNumberFromResponse) {
                    const activeOrderData = { orderId: orderIdFromResponse, orderNumber: orderNumberFromResponse, savedAt: Date.now() };
                    localStorage.setItem(activeOrderKey, JSON.stringify(activeOrderData));
                }
                setCurrentOrderItems([]); 
                setOrderNotes('');       
                closeCart();             
                navigate(`/order-status/${orderIdFromResponse}`, { 
                    state: { 
                        orderNumber: orderNumberFromResponse, 
                        businessSlug: businessSlug,
                        tableIdentifier: tableIdentifier 
                    } 
                });
            } catch (err: any) {
                const errMsg = err.response?.data?.message || err.message || t('publicMenu.cart.orderErrorMsg');
                notifications.show({ 
                    title: t('publicMenu.cart.orderErrorTitle'), 
                    message: errMsg, 
                    color: 'red',
                    icon: <IconAlertCircle size={18} /> 
                });
            } finally {
                setIsSubmittingOrder(false);
            }
        }
    }, [
        businessSlug, currentOrderItems, orderNotes, tableIdentifier, t, 
        closeCart, navigate, activeOrderKey, 
        activeOrderId, canCurrentlyAddToExistingOrder, activeOrderNumber
    ]);
    
    if (loading || loadingActiveOrderStatus) { 
        return ( <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> <Loader size="xl" /> </Container> ); 
    }
    if (error) { return ( <Container size="md" py="xl"> <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md"> {error} </Alert> </Container> ); }
    if (!menuData) { return ( <Container size="md" py="xl"> <Text ta="center" c="dimmed">{t('publicMenu.menuNotAvailable')}</Text> </Container> ); }

    const menuItemCardConfigState: MenuItemCardConfiguringState | null = configuringItem ? { quantity: configuringItem.quantity, selectedOptionsByGroup: configuringItem.selectedOptionsByGroup, currentUnitPrice: configuringItem.currentUnitPrice, itemNotes: configuringItem.itemNotes, areModifiersValid: configuringItem.areModifiersValid } : null;
    const totalCartItems = currentOrderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCartAmount = currentOrderItems.reduce((sum, item) => sum + item.totalPriceForItem, 0);
    const topOffsetForCartBar = typeof theme.spacing.md === 'number' ? theme.spacing.md + 10 : 26;

    const cartButtonText = activeOrderId && canCurrentlyAddToExistingOrder 
        ? t('publicMenu.cart.addItemsToOrderButton', { count: totalCartItems, orderNumber: activeOrderNumber }) 
        : t('publicMenu.cart.viewOrderItems', { count: totalCartItems });

    return (
        <>
            <Container size="lg" py="xl">
                <Stack gap="xl">
                    <Group justify="center" align="center" wrap="nowrap">
                        {menuData.businessLogoUrl && (<Image src={menuData.businessLogoUrl} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" />)}
                        <Title order={1} ta="center" style={{ flexShrink: 1, minWidth: 0 }}>{menuData.businessName}</Title>
                    </Group>

                    {activeOrderId && canCurrentlyAddToExistingOrder && !configuringItem && (
                        <Paper shadow="md" p="lg" radius="md" withBorder mb="xl" 
                            bg={colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.blue[0]}
                        >
                            <Group justify="space-between" align="center">
                                <Group>
                                    <IconInfoCircle size={24} color={theme.colors.blue[6]} />
                                    <Stack gap={0}>
                                        <Text fw={500}>
                                            {t('publicMenu.activeOrder.addingToOrderTitle', {orderNumber: activeOrderNumber})}
                                        </Text>
                                        <Text size="sm">
                                            {t('publicMenu.activeOrder.addingToOrderMsg')}
                                        </Text>
                                    </Stack>
                                </Group>
                                <Button variant="outline" size="xs" component={Link} to={`/order-status/${activeOrderId}`}
                                    state={{ orderNumber: activeOrderNumber, businessSlug: businessSlug, tableIdentifier: tableIdentifier }}
                                >
                                    {t('publicMenu.activeOrder.viewStatusButton')}
                                </Button>
                            </Group>
                        </Paper>
                    )}
                     {activeOrderId && !canCurrentlyAddToExistingOrder && !loadingActiveOrderStatus && !configuringItem && (
                        <Paper shadow="md" p="lg" radius="md" withBorder mb="xl" 
                            bg={colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0]}
                        >
                            <Group justify="space-between" align="center">
                                 <Group>
                                    <IconAlertCircle size={24} color={theme.colors.orange[6]} />
                                    <Stack gap={0}>
                                        <Text fw={500}>
                                            {t('publicMenu.activeOrder.cannotAddTitle', {orderNumber: activeOrderNumber})}
                                        </Text>
                                        <Text size="sm">
                                             {t('publicMenu.activeOrder.cannotAddMsg')}
                                        </Text>
                                    </Stack>
                                </Group>
                                <Button variant="outline" size="xs"
                                    onClick={() => { 
                                        if(activeOrderKey) localStorage.removeItem(activeOrderKey);
                                        setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
                                    }}
                                >
                                    {t('publicMenu.activeOrder.startNewButtonAlt', 'Crear Pedido Nuevo')}
                                </Button>
                            </Group>
                        </Paper>
                    )}

                    {currentOrderItems.length > 0 && (!activeOrderId || (activeOrderId && canCurrentlyAddToExistingOrder)) && !configuringItem && (
                        <Paper p={0} shadow="xs" withBorder={false} radius="md" style={{ position: 'sticky', top: topOffsetForCartBar, zIndex: 200 }} >
                            <Button fullWidth size="lg" variant="gradient" 
                                gradient={{ from: theme.primaryColor, to: theme.colors[theme.primaryColor][4], deg: 105 }}
                                onClick={openCart}
                                disabled={isCartOpen} 
                                styles={{ root: { height: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}` }, label: { width: '100%' } }}
                            >
                                <Group justify="space-between" style={{ width: '100%' }}>
                                    <Group gap="xs">
                                        <IconShoppingCart size={22} stroke={1.8} />
                                        <Text fw={500} inherit> {cartButtonText} </Text>
                                    </Group>
                                    <Text fw={700} inherit>
                                        {t('publicMenu.cart.total')}: {totalCartAmount.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}
                                    </Text>
                                </Group>
                            </Button>
                        </Paper>
                    )}
                    
                    <CategoryAccordion
                        categories={menuData.categories}
                        activeAccordionItems={activeAccordionItems}
                        onAccordionChange={setActiveAccordionItems}
                        configuringItemId={configuringItem?.itemDetails.id || null}
                        configuringItemState={menuItemCardConfigState}
                        onStartConfigureItem={handleStartConfigureItem}
                        onCancelConfiguration={handleCancelConfiguration}
                        onConfigQuantityChange={handleConfigQuantityChange}
                        onConfigModifierSelectionChange={handleConfigModifierSelectionChange}
                        onConfigNotesChange={handleConfigNotesChange}
                        onConfigAddToCart={handleConfigAddToCart}
                        onSimpleAddToCart={handleSimpleAddToCart}
                    />
                </Stack>
            </Container>

            {(!activeOrderId || (activeOrderId && canCurrentlyAddToExistingOrder)) && (
                <ShoppingCartModal
                    opened={isCartOpen}
                    onClose={closeCart}
                    orderItems={currentOrderItems}
                    orderNotes={orderNotes}
                    onUpdateItemQuantity={handleUpdateItemQuantityInCart}
                    onRemoveItem={handleRemoveItemFromCart}
                    onUpdateOrderNotes={setOrderNotes}
                    onSubmitOrder={handleSubmitOrder}
                    isSubmittingOrder={isSubmittingOrder}
                    onClearCart={handleClearCart}
                    isAddingToExistingOrder={!!(activeOrderId && canCurrentlyAddToExistingOrder)}
                    activeOrderNumber={activeOrderNumber}
                />
            )}
        </>
    );
};

export default PublicMenuViewPage;