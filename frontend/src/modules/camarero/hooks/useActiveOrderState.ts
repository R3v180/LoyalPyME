// frontend/src/modules/camarero/hooks/useActiveOrderState.ts
// Version 1.1.0 - Corrected logic to handle PENDING_PAYMENT as an active state.

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { OrderStatus } from '../../../shared/types/user.types';
import { PublicOrderStatusInfo } from '../types/publicOrder.types'; // Importar desde la ubicación central

interface ActiveOrderInfo {
    orderId: string;
    orderNumber: string;
    businessSlug: string;
    tableIdentifier?: string;
    savedAt: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';
const ACTIVE_ORDER_INFO_KEY_PREFIX = 'loyalpyme_active_order_info_';

export interface UseActiveOrderStateReturn {
    activeOrderId: string | null;
    activeOrderNumber: string | null;
    canCurrentlyAddToExistingOrder: boolean;
    loadingActiveOrderStatus: boolean;
    checkActiveOrderStatus: () => Promise<void>;
    clearActiveOrder: () => void;
    setActiveOrderManually: (orderId: string, orderNumber: string) => void;
}

export const useActiveOrderState = (businessSlug: string | undefined, tableIdentifier: string | undefined): UseActiveOrderStateReturn => {
    const activeOrderKey = businessSlug ? `${ACTIVE_ORDER_INFO_KEY_PREFIX}${businessSlug}${tableIdentifier ? `_${tableIdentifier}` : ''}` : null;

    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
    const [canCurrentlyAddToExistingOrder, setCanCurrentlyAddToExistingOrder] = useState<boolean>(false);
    const [loadingActiveOrderStatus, setLoadingActiveOrderStatus] = useState<boolean>(true);
    
    // --- CORRECCIÓN 1: Nueva función para determinar si un pedido está "activo" para el cliente ---
    const isOrderActiveForClient = useCallback((status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        // Un pedido está activo si se está preparando O si está pendiente de pago.
        return [
            OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_READY,
            OrderStatus.ALL_ITEMS_READY, OrderStatus.COMPLETED, OrderStatus.PENDING_PAYMENT
        ].includes(status);
    }, []);

    // Función para determinar si se pueden AÑADIR ítems
    const canAddMoreItemsToOrderStatus = useCallback((status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        // Solo se puede añadir si no está pendiente de pago o ya pagado/cancelado.
        return [
            OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_READY,
            OrderStatus.ALL_ITEMS_READY, OrderStatus.COMPLETED
        ].includes(status);
    }, []);


    const checkActiveOrderStatus = useCallback(async (currentOrderId?: string, currentOrderNumber?: string) => {
        const orderIdToCheck = currentOrderId || activeOrderId;
        const orderNumberToCheck = currentOrderNumber || activeOrderNumber;

        if (!orderIdToCheck || !orderNumberToCheck) {
            setCanCurrentlyAddToExistingOrder(false);
            setLoadingActiveOrderStatus(false);
            return;
        }

        setLoadingActiveOrderStatus(true);
        try {
            const response = await axios.get<PublicOrderStatusInfo>(`${API_BASE_URL}/order/${orderIdToCheck}/status`);
            
            // --- CORRECCIÓN 2: Lógica de estado actualizada ---
            if (response.data && isOrderActiveForClient(response.data.orderStatus)) {
                // El pedido SIGUE ACTIVO.
                setActiveOrderId(orderIdToCheck);
                setActiveOrderNumber(orderNumberToCheck);
                // Ahora, comprobamos por separado si se le pueden añadir más cosas.
                setCanCurrentlyAddToExistingOrder(canAddMoreItemsToOrderStatus(response.data.orderStatus));
            } else {
                // El pedido ya no está activo (fue pagado, cancelado o no se encontró).
                setCanCurrentlyAddToExistingOrder(false);
                if (activeOrderKey) localStorage.removeItem(activeOrderKey);
                setActiveOrderId(null);
                setActiveOrderNumber(null);
            }
        } catch (error) {
            console.error(`[useActiveOrderState] Error checking status for order ${orderIdToCheck}:`, error);
            setCanCurrentlyAddToExistingOrder(false);
            if (activeOrderKey) localStorage.removeItem(activeOrderKey);
            setActiveOrderId(null);
            setActiveOrderNumber(null);
        } finally {
            setLoadingActiveOrderStatus(false);
        }
    }, [activeOrderId, activeOrderNumber, activeOrderKey, isOrderActiveForClient, canAddMoreItemsToOrderStatus]);

    useEffect(() => {
        if (activeOrderKey) {
            const storedActiveOrderInfo = localStorage.getItem(activeOrderKey);
            if (storedActiveOrderInfo) {
                try {
                    const parsedInfo: ActiveOrderInfo = JSON.parse(storedActiveOrderInfo);
                    if (parsedInfo.orderId && parsedInfo.orderNumber) {
                        setActiveOrderId(parsedInfo.orderId);
                        setActiveOrderNumber(parsedInfo.orderNumber);
                        checkActiveOrderStatus(parsedInfo.orderId, parsedInfo.orderNumber);
                    } else {
                        localStorage.removeItem(activeOrderKey);
                        setLoadingActiveOrderStatus(false);
                    }
                } catch (e) {
                    localStorage.removeItem(activeOrderKey);
                    setLoadingActiveOrderStatus(false);
                }
            } else {
                setLoadingActiveOrderStatus(false);
            }
        } else {
            setLoadingActiveOrderStatus(false);
        }
    }, [activeOrderKey, checkActiveOrderStatus]);

    const clearActiveOrder = useCallback(() => {
        if (activeOrderKey) {
            localStorage.removeItem(activeOrderKey);
        }
        setActiveOrderId(null);
        setActiveOrderNumber(null);
        setCanCurrentlyAddToExistingOrder(false);
    }, [activeOrderKey]);

    const setActiveOrderManually = useCallback((orderId: string, orderNumber: string) => {
        if (activeOrderKey && businessSlug) {
            const activeOrderData: ActiveOrderInfo = { orderId, orderNumber, businessSlug, tableIdentifier, savedAt: Date.now() };
            localStorage.setItem(activeOrderKey, JSON.stringify(activeOrderData));
            setActiveOrderId(orderId);
            setActiveOrderNumber(orderNumber);
            setCanCurrentlyAddToExistingOrder(true);
        }
    }, [activeOrderKey, businessSlug, tableIdentifier]);

    return {
        activeOrderId,
        activeOrderNumber,
        canCurrentlyAddToExistingOrder,
        loadingActiveOrderStatus,
        checkActiveOrderStatus: () => checkActiveOrderStatus(),
        clearActiveOrder,
        setActiveOrderManually,
    };
};