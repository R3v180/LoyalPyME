// frontend/src/modules/camarero/hooks/usePublicOrderCart.ts
import React, { useState, useEffect, useCallback } from 'react';
import { notifications, NotificationData } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { IconShoppingCartPlus, IconCheck } from '@tabler/icons-react';

import { OrderItemFE, AppliedRewardsState } from '../types/publicOrder.types';
import { PublicMenuItem } from '../types/menu.types';
import { Reward } from '../../../shared/types/user.types';

const LOCAL_STORAGE_CART_KEY_PREFIX = 'loyalpyme_public_cart_v2_';
const LOCAL_STORAGE_REWARDS_KEY_PREFIX = 'loyalpyme_public_rewards_v2_';
const LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX = 'loyalpyme_public_order_notes_v2_';

const getTranslatedNameHelper = (item: { name_es?: string | null, name_en?: string | null }, lang: string, defaultName: string = 'Unnamed') => {
    if (lang === 'es' && item.name_es) return item.name_es;
    if (lang === 'en' && item.name_en) return item.name_en;
    return item.name_es || item.name_en || defaultName;
};

export interface UsePublicOrderCartReturn {
    currentOrderItems: OrderItemFE[];
    appliedRewards: AppliedRewardsState;
    orderNotes: string;
    totalCartItems: number;
    totalCartAmount: number;
    totalPointsCost: number;
    addItemToCart: (item: OrderItemFE) => void;
    addSimpleItemToCart: (menuItem: PublicMenuItem, quantity: number) => void;
    updateItemQuantityInCart: (cartItemId: string, newQuantity: number) => void;
    removeItemFromCart: (cartItemId: string) => void;
    updateOrderNotes: (notes: string) => void;
    clearCart: () => void;
    clearCartStorage: () => void;
    applyDiscountReward: (reward: Reward) => void;
    removeDiscountReward: () => void;
    addFreeItemReward: (reward: Reward, menuItem: PublicMenuItem) => void;
    removeFreeItemReward: (rewardId: string) => void;
}

export const usePublicOrderCart = (
    businessSlug: string | undefined,
    tableIdentifier: string | undefined,
    activeOrderId: string | null
): UsePublicOrderCartReturn => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    const cartStorageKey = `${LOCAL_STORAGE_CART_KEY_PREFIX}${businessSlug || 'default'}${tableIdentifier ? `_${tableIdentifier}` : ''}`;
    const rewardsStorageKey = `${LOCAL_STORAGE_REWARDS_KEY_PREFIX}${businessSlug || 'default'}${tableIdentifier ? `_${tableIdentifier}` : ''}`;
    const notesStorageKey = `${LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX}${businessSlug || 'default'}${tableIdentifier ? `_${tableIdentifier}` : ''}`;

    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItemFE[]>([]);
    const [appliedRewards, setAppliedRewards] = useState<AppliedRewardsState>({ discount: null, freeItems: [] });
    const [orderNotes, setOrderNotes] = useState<string>('');

    const loadCartFromStorage = useCallback(() => {
        if (activeOrderId) {
            setCurrentOrderItems([]);
            setAppliedRewards({ discount: null, freeItems: [] });
            setOrderNotes('');
            return;
        }
        try {
            const savedCart = localStorage.getItem(cartStorageKey);
            const savedRewards = localStorage.getItem(rewardsStorageKey);
            const savedNotes = localStorage.getItem(notesStorageKey);
            setCurrentOrderItems(savedCart ? JSON.parse(savedCart) : []);
            setAppliedRewards(savedRewards ? JSON.parse(savedRewards) : { discount: null, freeItems: [] });
            setOrderNotes(savedNotes || '');
        } catch (e) {
            console.error("Error parsing cart state from localStorage", e);
            setCurrentOrderItems([]);
            setAppliedRewards({ discount: null, freeItems: [] });
            setOrderNotes('');
        }
    }, [cartStorageKey, rewardsStorageKey, notesStorageKey, activeOrderId]);
    
    useEffect(() => { loadCartFromStorage(); }, [loadCartFromStorage]);
    useEffect(() => { if (!activeOrderId) localStorage.setItem(cartStorageKey, JSON.stringify(currentOrderItems)); }, [currentOrderItems, cartStorageKey, activeOrderId]);
    useEffect(() => { if (!activeOrderId) localStorage.setItem(rewardsStorageKey, JSON.stringify(appliedRewards)); }, [appliedRewards, rewardsStorageKey, activeOrderId]);
    useEffect(() => { if (!activeOrderId) localStorage.setItem(notesStorageKey, orderNotes); }, [orderNotes, notesStorageKey, activeOrderId]);
    
    const addItemToCart = useCallback((newItem: OrderItemFE) => {
        setCurrentOrderItems((prev: OrderItemFE[]) => {
            const existingItem = prev.find(item => item.cartItemId === newItem.cartItemId);
            if (existingItem) return prev.map(item => item.cartItemId === newItem.cartItemId ? { ...item, quantity: item.quantity + newItem.quantity, totalPriceForItem: item.currentPricePerUnit * (item.quantity + newItem.quantity) } : item);
            return [...prev, newItem];
        });
        const itemName = getTranslatedNameHelper({name_es: newItem.menuItemName_es, name_en: newItem.menuItemName_en}, currentLang, t('publicMenu.unnamedItem'));
        const notifData: NotificationData = { title: t('publicMenu.itemAddedTitle'), message: t('publicMenu.itemAddedMessage', { itemName, quantity: newItem.quantity }), color: 'green', icon: React.createElement(IconShoppingCartPlus, { size: 18 }) };
        notifications.show(notifData);
    }, [currentLang, t]);

    const addSimpleItemToCart = useCallback((menuItem: PublicMenuItem, quantity: number) => {
        const cartItemId = menuItem.id;
        setCurrentOrderItems((prev: OrderItemFE[]) => {
            const existingIdx = prev.findIndex(item => item.menuItemId === menuItem.id && (!item.selectedModifiers || item.selectedModifiers.length === 0) && !item.notes && !item.redeemedRewardId);
            if (existingIdx > -1) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + quantity, totalPriceForItem: updated[existingIdx].currentPricePerUnit * (updated[existingIdx].quantity + quantity) };
                return updated;
            }
            return [...prev, { cartItemId, menuItemId: menuItem.id, menuItemName_es: menuItem.name_es, menuItemName_en: menuItem.name_en, quantity, basePrice: menuItem.price, currentPricePerUnit: menuItem.price, totalPriceForItem: menuItem.price * quantity, notes: undefined, selectedModifiers: [], redeemedRewardId: null }];
        });
        const itemName = getTranslatedNameHelper(menuItem, currentLang, t('publicMenu.unnamedItem'));
        const notifData: NotificationData = { title: t('publicMenu.itemAddedTitle'), message: t('publicMenu.itemAddedMessage', { itemName, quantity }), color: 'green', icon: React.createElement(IconShoppingCartPlus, { size: 18 }) };
        notifications.show(notifData);
    }, [currentLang, t]);
    
    const updateItemQuantityInCart = useCallback((cartItemId: string, newQuantity: number) => {
        setCurrentOrderItems((prev: OrderItemFE[]) => prev.map((item: OrderItemFE) => item.cartItemId === cartItemId ? { ...item, quantity: newQuantity, totalPriceForItem: item.currentPricePerUnit * newQuantity } : item).filter((item: OrderItemFE) => item.quantity > 0));
    }, []);
    
    const removeItemFromCart = useCallback((cartItemId: string) => {
        const itemToRemove = currentOrderItems.find(item => item.cartItemId === cartItemId);
        if(itemToRemove?.redeemedRewardId) {
            setAppliedRewards(prev => ({ ...prev, freeItems: prev.freeItems.filter(r => r.id !== itemToRemove.redeemedRewardId) }));
        }
        setCurrentOrderItems((prev: OrderItemFE[]) => prev.filter((item: OrderItemFE) => item.cartItemId !== cartItemId));
    }, [currentOrderItems]);
    
    const updateOrderNotes = useCallback((notes: string) => { setOrderNotes(notes); }, []);
    
    const clearCart = useCallback(() => {
        setCurrentOrderItems([]);
        setAppliedRewards({ discount: null, freeItems: [] });
        setOrderNotes('');
        notifications.show({ title: t('publicMenu.cart.clearedTitle'), message: t('publicMenu.cart.clearedMsg'), color: 'blue', icon: React.createElement(IconCheck, { size: 18 }) });
    }, [t]);

    const clearCartStorage = useCallback(() => {
        localStorage.removeItem(cartStorageKey);
        localStorage.removeItem(rewardsStorageKey);
        localStorage.removeItem(notesStorageKey);
    }, [cartStorageKey, rewardsStorageKey, notesStorageKey]);
    
    const applyDiscountReward = useCallback((reward: Reward) => setAppliedRewards((prev: AppliedRewardsState) => ({ ...prev, discount: reward })), []);
    const removeDiscountReward = useCallback(() => setAppliedRewards((prev: AppliedRewardsState) => ({ ...prev, discount: null })), []);

    const addFreeItemReward = useCallback((reward: Reward, menuItem: PublicMenuItem) => {
        const newRewardItem: OrderItemFE = { cartItemId: `reward-${reward.id}`, menuItemId: menuItem.id, menuItemName_es: menuItem.name_es, menuItemName_en: menuItem.name_en, quantity: 1, basePrice: 0, currentPricePerUnit: 0, totalPriceForItem: 0, redeemedRewardId: reward.id, selectedModifiers: [] };
        setCurrentOrderItems((prev: OrderItemFE[]) => [...prev.filter(item => !item.redeemedRewardId), newRewardItem]);
        setAppliedRewards((prev: AppliedRewardsState) => ({ ...prev, freeItems: [...prev.freeItems.filter((r: Reward) => r.id !== reward.id), reward] }));
    }, []);

    const removeFreeItemReward = useCallback((rewardId: string) => {
        setCurrentOrderItems((prev: OrderItemFE[]) => prev.filter((item: OrderItemFE) => item.redeemedRewardId !== rewardId));
        setAppliedRewards((prev: AppliedRewardsState) => ({ ...prev, freeItems: prev.freeItems.filter((r: Reward) => r.id !== rewardId) }));
    }, []);

    const totalCartItems = currentOrderItems.reduce((sum: number, item: OrderItemFE) => sum + item.quantity, 0);
    const totalCartAmount = currentOrderItems.reduce((sum: number, item: OrderItemFE) => sum + item.totalPriceForItem, 0);
    const totalPointsCost = (appliedRewards.discount?.pointsCost ?? 0) + appliedRewards.freeItems.reduce((sum: number, item: Reward) => sum + item.pointsCost, 0);

    return {
        currentOrderItems, appliedRewards, orderNotes, totalCartItems, totalCartAmount, totalPointsCost,
        addItemToCart, addSimpleItemToCart, updateItemQuantityInCart, removeItemFromCart, updateOrderNotes,
        clearCart, clearCartStorage, applyDiscountReward, removeDiscountReward, addFreeItemReward, removeFreeItemReward
    };
};