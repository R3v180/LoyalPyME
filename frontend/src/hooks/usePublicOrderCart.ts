// frontend/src/hooks/usePublicOrderCart.ts
import React, { useState, useEffect, useCallback } from 'react'; // <-- AÑADIDO React
import { notifications, NotificationData } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { IconShoppingCartPlus, IconCheck } from '@tabler/icons-react';

import { OrderItemFE } from '../types/publicOrder.types';
import { PublicMenuItem } from '../types/menu.types';

const LOCAL_STORAGE_CART_KEY_PREFIX = 'loyalpyme_public_cart_';
const LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX = 'loyalpyme_public_order_notes_';

const getTranslatedNameHelper = (item: { name_es?: string | null, name_en?: string | null }, lang: string, defaultName: string = 'Unnamed') => {
    if (lang === 'es' && item.name_es) return item.name_es;
    if (lang === 'en' && item.name_en) return item.name_en;
    return item.name_es || item.name_en || defaultName;
};

export interface UsePublicOrderCartReturn {
    currentOrderItems: OrderItemFE[];
    orderNotes: string;
    totalCartItems: number;
    totalCartAmount: number;
    addItemToCart: (item: OrderItemFE) => void;
    addSimpleItemToCart: (menuItem: PublicMenuItem, quantity: number) => void;
    updateItemQuantityInCart: (cartItemId: string, newQuantity: number) => void;
    removeItemFromCart: (cartItemId: string) => void;
    updateOrderNotes: (notes: string) => void;
    clearCart: () => void;
    loadCartFromStorage: () => void;
    clearCartStorage: () => void;
}

export const usePublicOrderCart = (
    businessSlug: string | undefined,
    tableIdentifier: string | undefined,
    activeOrderId: string | null
): UsePublicOrderCartReturn => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    const cartStorageKey = `${LOCAL_STORAGE_CART_KEY_PREFIX}${businessSlug || 'default'}${tableIdentifier ? `_${tableIdentifier}` : ''}`;
    const notesStorageKey = `${LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX}${businessSlug || 'default'}${tableIdentifier ? `_${tableIdentifier}` : ''}`;

    const [currentOrderItemsState, setCurrentOrderItemsState] = useState<OrderItemFE[]>([]);
    const [orderNotesState, setOrderNotesState] = useState<string>('');

    const loadCartFromStorage = useCallback((): void => {
        if (activeOrderId) {
            setCurrentOrderItemsState([]);
            setOrderNotesState('');
            return;
        }
        const savedCart = localStorage.getItem(cartStorageKey);
        const savedNotes = localStorage.getItem(notesStorageKey);
        try {
            setCurrentOrderItemsState(savedCart ? JSON.parse(savedCart) : []);
        } catch (e) {
            console.error("Error parsing cart from localStorage", e);
            setCurrentOrderItemsState([]);
        }
        setOrderNotesState(savedNotes || '');
    }, [cartStorageKey, notesStorageKey, activeOrderId]);

    useEffect(() => {
        loadCartFromStorage();
    }, [loadCartFromStorage]);

    useEffect(() => {
        if (!activeOrderId) {
            localStorage.setItem(cartStorageKey, JSON.stringify(currentOrderItemsState));
        }
    }, [currentOrderItemsState, cartStorageKey, activeOrderId]);

    useEffect(() => {
        if (!activeOrderId) {
            localStorage.setItem(notesStorageKey, orderNotesState);
        }
    }, [orderNotesState, notesStorageKey, activeOrderId]);

    const addItemToCart = useCallback((newItem: OrderItemFE): void => {
        setCurrentOrderItemsState((prevItems: OrderItemFE[]) => {
            const existingItemIndex = prevItems.findIndex(item => item.cartItemId === newItem.cartItemId);
            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                const existing = updatedItems[existingItemIndex];
                existing.quantity += newItem.quantity;
                existing.totalPriceForItem = existing.currentPricePerUnit * existing.quantity;
                return updatedItems;
            } else {
                return [...prevItems, newItem];
            }
        });
        const itemName = getTranslatedNameHelper({name_es: newItem.menuItemName_es, name_en: newItem.menuItemName_en}, currentLang, t('publicMenu.unnamedItem'));
        
        const notificationData: NotificationData = {
            title: t('publicMenu.itemAddedTitle'),
            message: t('publicMenu.itemAddedMessage', { itemName: itemName, quantity: newItem.quantity }),
            color: 'green',
            icon: React.createElement(IconShoppingCartPlus, { size: 18 })
        };
        notifications.show(notificationData);
    }, [currentLang, t]);

    const addSimpleItemToCart = useCallback((menuItem: PublicMenuItem, quantity: number): void => {
        const cartItemId = menuItem.id;
        const itemName = getTranslatedNameHelper(menuItem, currentLang, t('publicMenu.unnamedItem'));
        
        setCurrentOrderItemsState((prevItems: OrderItemFE[]) => {
            const existingSimpleItemIndex = prevItems.findIndex(
                (ci: OrderItemFE) => ci.menuItemId === menuItem.id && 
                      (!ci.selectedModifiers || ci.selectedModifiers.length === 0) && 
                      !ci.notes
            );

            if (existingSimpleItemIndex > -1) {
                const updatedItems = [...prevItems];
                const existing = updatedItems[existingSimpleItemIndex];
                existing.quantity += quantity;
                existing.totalPriceForItem = existing.currentPricePerUnit * existing.quantity;
                return updatedItems;
            } else {
                const newCartItem: OrderItemFE = {
                    cartItemId: cartItemId,
                    menuItemId: menuItem.id,
                    menuItemName_es: menuItem.name_es,
                    menuItemName_en: menuItem.name_en,
                    quantity: quantity,
                    basePrice: menuItem.price,
                    currentPricePerUnit: menuItem.price,
                    totalPriceForItem: menuItem.price * quantity,
                    notes: undefined,
                    selectedModifiers: [],
                };
                return [...prevItems, newCartItem];
            }
        });
        
        const notificationData: NotificationData = {
            title: t('publicMenu.itemAddedTitle'),
            message: t('publicMenu.itemAddedMessage', { itemName: itemName, quantity: quantity }),
            color: 'green',
            icon: React.createElement(IconShoppingCartPlus, { size: 18 })
        };
        notifications.show(notificationData);
    }, [currentLang, t]);


    const updateItemQuantityInCart = useCallback((cartItemId: string, newQuantity: number): void => {
        setCurrentOrderItemsState((prevItems: OrderItemFE[]) =>
            prevItems.map((item: OrderItemFE) =>
                item.cartItemId === cartItemId
                    ? { ...item, quantity: newQuantity, totalPriceForItem: item.currentPricePerUnit * newQuantity }
                    : item
            ).filter((item: OrderItemFE) => item.quantity > 0)
        );
    }, []);

    const removeItemFromCart = useCallback((cartItemId: string): void => {
        setCurrentOrderItemsState((prevItems: OrderItemFE[]) => prevItems.filter((item: OrderItemFE) => item.cartItemId !== cartItemId));
    }, []);

    const updateOrderNotes = useCallback((notes: string): void => {
        setOrderNotesState(notes);
    }, []);

    const clearCart = useCallback((): void => {
        setCurrentOrderItemsState([]);
        setOrderNotesState('');
        
        const notificationData: NotificationData = {
            title: t('publicMenu.cart.clearedTitle'),
            message: t('publicMenu.cart.clearedMsg'),
            color: 'blue',
            icon: React.createElement(IconCheck, { size: 18 })
        };
        notifications.show(notificationData);
    }, [t]);

    const clearCartStorage = useCallback((): void => {
        localStorage.removeItem(cartStorageKey);
        localStorage.removeItem(notesStorageKey);
    }, [cartStorageKey, notesStorageKey]);

    const totalCartItems = currentOrderItemsState.reduce((sum: number, item: OrderItemFE) => sum + item.quantity, 0);
    const totalCartAmount = currentOrderItemsState.reduce((sum: number, item: OrderItemFE) => sum + item.totalPriceForItem, 0);

    // Devolver solo las funciones que se usan
    return {
        currentOrderItems: currentOrderItemsState,
        orderNotes: orderNotesState,
        totalCartItems, // Usado en PublicMenuViewPage
        totalCartAmount, // Usado en PublicMenuViewPage
        addItemToCart, // Usado en PublicMenuViewPage
        addSimpleItemToCart, // Usado en PublicMenuViewPage
        updateItemQuantityInCart, // Usado en ShoppingCartModal (pasado desde PublicMenuViewPage)
        removeItemFromCart, // Usado en ShoppingCartModal (pasado desde PublicMenuViewPage)
        updateOrderNotes, // Usado en ShoppingCartModal (pasado desde PublicMenuViewPage)
        clearCart, // Usado en ShoppingCartModal (pasado desde PublicMenuViewPage)
        loadCartFromStorage, // No se usa externamente, pero es parte de la lógica interna del hook
        clearCartStorage, // Usado en PublicMenuViewPage
    };
};