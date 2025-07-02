// frontend/src/modules/camarero/hooks/usePublicOrderCart.ts
// VERSIÓN 4.1.2 - Corregida para eliminar errores de sintaxis y tipado.

import { useState, useEffect, useCallback } from 'react';
import { notifications, NotificationData } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
//import { IconShoppingCartPlus, IconCheck } from '@tabler/icons-react';
import { v4 as uuidv4 } from 'uuid';

import { OrderItemFE } from '../types/publicOrder.types';
import type { Reward } from '../../../shared/types/user.types';

const LOCAL_STORAGE_CART_KEY_PREFIX = 'loyalpyme_public_cart_v4_';
const NOTES_STORAGE_KEY_PREFIX = 'loyalpyme_public_order_notes_v4_';

export interface MinimalItemForReward {
    id: string;
    name_es: string | null;
    name_en: string | null;
}

export const usePublicOrderCart = (
    businessSlug: string | undefined,
    tableIdentifier: string | undefined,
    activeOrderId: string | null
) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItemFE[]>([]);
    const [orderNotes, setOrderNotes] = useState<string>('');

    const cartStorageKey = businessSlug ? `${LOCAL_STORAGE_CART_KEY_PREFIX}${businessSlug}${tableIdentifier ? `_${tableIdentifier}` : ''}` : null;
    const notesStorageKey = businessSlug ? `${NOTES_STORAGE_KEY_PREFIX}${businessSlug}${tableIdentifier ? `_${tableIdentifier}` : ''}` : null;

    const loadCartFromStorage = useCallback(() => {
        if (activeOrderId || !cartStorageKey) {
            setCurrentOrderItems([]);
            setOrderNotes('');
            return;
        }
        try {
            const savedCart = localStorage.getItem(cartStorageKey);
            const savedNotes = localStorage.getItem(notesStorageKey || '');
            setCurrentOrderItems(savedCart ? JSON.parse(savedCart) : []);
            setOrderNotes(savedNotes || '');
        } catch (e) {
            console.error("Error parsing cart state from localStorage", e);
            setCurrentOrderItems([]);
            setOrderNotes('');
        }
    }, [cartStorageKey, notesStorageKey, activeOrderId]);

    useEffect(() => {
        loadCartFromStorage();
    }, [loadCartFromStorage]);

    useEffect(() => {
        if (!activeOrderId && cartStorageKey) {
            localStorage.setItem(cartStorageKey, JSON.stringify(currentOrderItems));
        }
    }, [currentOrderItems, cartStorageKey, activeOrderId]);

    useEffect(() => {
        if (!activeOrderId && notesStorageKey) {
            localStorage.setItem(notesStorageKey, orderNotes);
        }
    }, [orderNotes, notesStorageKey, activeOrderId]);

    const addFreeItemReward = useCallback((menuItemData: MinimalItemForReward, reward: Reward) => {
        const uniqueCartItemId = `reward-${reward.id}-${uuidv4()}`;
        const newRewardItem: OrderItemFE = {
            cartItemId: uniqueCartItemId,
            menuItemId: menuItemData.id,
            menuItemName_es: menuItemData.name_es,
            menuItemName_en: menuItemData.name_en,
            quantity: 1,
            basePrice: 0,
            currentPricePerUnit: 0,
            totalPriceForItem: 0,
            redeemedRewardId: reward.id,
            selectedModifiers: [],
        };
        setCurrentOrderItems((prev: OrderItemFE[]) => [...prev, newRewardItem]);
        const itemName = (currentLang === 'es' ? menuItemData.name_es : menuItemData.name_en) || 'Recompensa';
        notifications.show({
            title: '¡Recompensa Añadida!',
            message: `${itemName} se ha añadido a tu pedido.`,
            color: 'green',
            // El icono JSX se añade en el componente que llama, no aquí.
        });
    }, [currentLang]);
    
    const getTranslatedNameHelper = useCallback((item: { name_es?: string | null; name_en?: string | null }, lang: string, defaultName: string) => {
        if (lang === 'es' && item.name_es) return item.name_es;
        if (lang === 'en' && item.name_en) return item.name_en;
        return item.name_es || item.name_en || defaultName;
    }, []);

    const addItemToCart = useCallback((newItem: OrderItemFE) => {
        setCurrentOrderItems((prev: OrderItemFE[]) => {
            const existingItem = prev.find((item: OrderItemFE) => item.cartItemId === newItem.cartItemId);
            if (existingItem) {
                return prev.map((item: OrderItemFE) => item.cartItemId === newItem.cartItemId ? { ...item, quantity: item.quantity + newItem.quantity, totalPriceForItem: item.currentPricePerUnit * (item.quantity + newItem.quantity) } : item);
            }
            return [...prev, newItem];
        });
        const itemName = getTranslatedNameHelper({ name_es: newItem.menuItemName_es, name_en: newItem.menuItemName_en }, currentLang, t('publicMenu.unnamedItem'));
        const notifData: NotificationData = { title: t('publicMenu.itemAddedTitle'), message: t('publicMenu.itemAddedMessage', { itemName, quantity: newItem.quantity }), color: 'green' };
        notifications.show(notifData);
    }, [currentLang, t, getTranslatedNameHelper]);

    const addSimpleItemToCart = useCallback((menuItem: { id: string; name_es: string | null; name_en: string | null; price: number }, quantity: number) => {
        const cartItemId = menuItem.id;
        setCurrentOrderItems((prev: OrderItemFE[]) => {
            const existingIdx = prev.findIndex((item: OrderItemFE) => item.menuItemId === menuItem.id && (!item.selectedModifiers || item.selectedModifiers.length === 0) && !item.notes && !item.redeemedRewardId);
            if (existingIdx > -1) { const updated = [...prev]; updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + quantity, totalPriceForItem: updated[existingIdx].currentPricePerUnit * (updated[existingIdx].quantity + quantity) }; return updated; }
            return [...prev, { cartItemId, menuItemId: menuItem.id, menuItemName_es: menuItem.name_es, menuItemName_en: menuItem.name_en, quantity, basePrice: menuItem.price, currentPricePerUnit: menuItem.price, totalPriceForItem: menuItem.price * quantity, notes: undefined, selectedModifiers: [], redeemedRewardId: null }];
        });
        const itemName = getTranslatedNameHelper(menuItem, currentLang, t('publicMenu.unnamedItem'));
        const notifData: NotificationData = { title: t('publicMenu.itemAddedTitle'), message: t('publicMenu.itemAddedMessage', { itemName, quantity }), color: 'green' };
        notifications.show(notifData);
    }, [currentLang, t, getTranslatedNameHelper]);

    const updateItemQuantityInCart = useCallback((cartItemId: string, newQuantity: number) => {
        setCurrentOrderItems((prev: OrderItemFE[]) => prev.map((item: OrderItemFE) => item.cartItemId === cartItemId ? { ...item, quantity: newQuantity, totalPriceForItem: item.currentPricePerUnit * newQuantity } : item).filter((item: OrderItemFE) => item.quantity > 0));
    }, []);

    const removeItemFromCart = useCallback((cartItemId: string) => {
        setCurrentOrderItems((prev: OrderItemFE[]) => prev.filter((item: OrderItemFE) => item.cartItemId !== cartItemId));
    }, []);

    const updateOrderNotes = useCallback((notes: string) => {
        setOrderNotes(notes);
    }, []);

    const clearCart = useCallback(() => {
        setCurrentOrderItems([]);
        setOrderNotes('');
        notifications.show({ title: t('publicMenu.cart.clearedTitle'), message: t('publicMenu.cart.clearedMsg'), color: 'blue' });
    }, [t]);

    const clearCartStorage = useCallback(() => {
        if (cartStorageKey) localStorage.removeItem(cartStorageKey);
        if (notesStorageKey) localStorage.removeItem(notesStorageKey);
    }, [cartStorageKey, notesStorageKey]);
    
    const totalCartItems = currentOrderItems.reduce((sum: number, item: OrderItemFE) => sum + item.quantity, 0);

    return {
        currentOrderItems,
        orderNotes,
        totalCartItems,
        addItemToCart,
        addSimpleItemToCart,
        updateItemQuantityInCart,
        removeItemFromCart,
        updateOrderNotes,
        clearCart,
        clearCartStorage,
        addFreeItemReward,
    };
};