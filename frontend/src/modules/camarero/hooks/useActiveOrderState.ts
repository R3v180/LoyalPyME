// frontend/src/hooks/useActiveOrderState.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { OrderStatus as PageOrderStatus, PublicOrderStatusInfo as PagePublicOrderStatusInfo } from '../pages/OrderStatusPage'; // Asegúrate que la ruta es correcta

// Importar tipo ActiveOrderInfo
interface ActiveOrderInfo {
    orderId: string;
    orderNumber: string;
    businessSlug: string;
    tableIdentifier?: string;
    savedAt: number; // timestamp de cuando se guardó
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';
const ACTIVE_ORDER_INFO_KEY_PREFIX = 'loyalpyme_active_order_info_';

export interface UseActiveOrderStateReturn {
    activeOrderId: string | null;
    activeOrderNumber: string | null;
    canCurrentlyAddToExistingOrder: boolean;
    loadingActiveOrderStatus: boolean;
    checkActiveOrderStatus: () => Promise<void>; // Para una comprobación manual si es necesario
    clearActiveOrder: () => void;
    setActiveOrderManually: (orderId: string, orderNumber: string) => void; // Para cuando se crea un nuevo pedido
}

export const useActiveOrderState = (businessSlug: string | undefined, tableIdentifier: string | undefined): UseActiveOrderStateReturn => {
    const activeOrderKey = businessSlug ? `${ACTIVE_ORDER_INFO_KEY_PREFIX}${businessSlug}${tableIdentifier ? `_${tableIdentifier}` : ''}` : null;

    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
    const [canCurrentlyAddToExistingOrder, setCanCurrentlyAddToExistingOrder] = useState<boolean>(false);
    const [loadingActiveOrderStatus, setLoadingActiveOrderStatus] = useState<boolean>(true); // Inicia en true

    const canAddMoreItemsToOrderStatus = useCallback((status: PageOrderStatus | undefined): boolean => {
        if (!status) return false;
        return [
            PageOrderStatus.RECEIVED, PageOrderStatus.IN_PROGRESS, PageOrderStatus.PARTIALLY_READY,
            PageOrderStatus.ALL_ITEMS_READY, PageOrderStatus.COMPLETED
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
            const response = await axios.get<PagePublicOrderStatusInfo>(`${API_BASE_URL}/order/${orderIdToCheck}/status`);
            if (response.data && canAddMoreItemsToOrderStatus(response.data.orderStatus)) {
                setCanCurrentlyAddToExistingOrder(true);
                // Reafirmar el estado si la comprobación fue exitosa, en caso de que currentOrderId viniera de localStorage y aún no estuviera en el estado
                setActiveOrderId(orderIdToCheck);
                setActiveOrderNumber(orderNumberToCheck);
            } else {
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
    }, [activeOrderId, activeOrderNumber, activeOrderKey, canAddMoreItemsToOrderStatus]);


    useEffect(() => {
        // console.log(`[useActiveOrderState] useEffect triggered. activeOrderKey: ${activeOrderKey}`);
        if (activeOrderKey) {
            const storedActiveOrderInfo = localStorage.getItem(activeOrderKey);
            if (storedActiveOrderInfo) {
                try {
                    const parsedInfo: ActiveOrderInfo = JSON.parse(storedActiveOrderInfo);
                    if (parsedInfo.orderId && parsedInfo.orderNumber) {
                        // console.log(`[useActiveOrderState] Found active order in localStorage: ${parsedInfo.orderId}`);
                        setActiveOrderId(parsedInfo.orderId);
                        setActiveOrderNumber(parsedInfo.orderNumber);
                        checkActiveOrderStatus(parsedInfo.orderId, parsedInfo.orderNumber);
                    } else {
                        // console.log(`[useActiveOrderState] Invalid info in localStorage for key ${activeOrderKey}, removing.`);
                        localStorage.removeItem(activeOrderKey);
                        setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
                        setLoadingActiveOrderStatus(false);
                    }
                } catch (e) {
                    // console.error(`[useActiveOrderState] Error parsing localStorage for key ${activeOrderKey}:`, e);
                    localStorage.removeItem(activeOrderKey);
                    setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
                    setLoadingActiveOrderStatus(false);
                }
            } else {
                // console.log(`[useActiveOrderState] No active order info in localStorage for key ${activeOrderKey}.`);
                setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
                setLoadingActiveOrderStatus(false);
            }
        } else {
            // console.log(`[useActiveOrderState] activeOrderKey is null.`);
            setActiveOrderId(null); setActiveOrderNumber(null); setCanCurrentlyAddToExistingOrder(false);
            setLoadingActiveOrderStatus(false);
        }
    }, [activeOrderKey, checkActiveOrderStatus]); // Ejecutar solo cuando activeOrderKey cambia

    const clearActiveOrder = useCallback(() => {
        if (activeOrderKey) {
            localStorage.removeItem(activeOrderKey);
        }
        setActiveOrderId(null);
        setActiveOrderNumber(null);
        setCanCurrentlyAddToExistingOrder(false);
        // console.log(`[useActiveOrderState] Active order cleared.`);
    }, [activeOrderKey]);

    const setActiveOrderManually = useCallback((orderId: string, orderNumber: string) => {
        if (activeOrderKey && businessSlug) {
            const activeOrderData: ActiveOrderInfo = { orderId, orderNumber, businessSlug, tableIdentifier, savedAt: Date.now() };
            localStorage.setItem(activeOrderKey, JSON.stringify(activeOrderData));
            setActiveOrderId(orderId);
            setActiveOrderNumber(orderNumber);
            setCanCurrentlyAddToExistingOrder(true); // Asumimos que un nuevo pedido puede tener ítems añadidos
            // console.log(`[useActiveOrderState] Active order set manually: ${orderId}`);
        }
    }, [activeOrderKey, businessSlug, tableIdentifier]);


    return {
        activeOrderId,
        activeOrderNumber,
        canCurrentlyAddToExistingOrder,
        loadingActiveOrderStatus,
        checkActiveOrderStatus: () => checkActiveOrderStatus(), // Envolver para que no requiera params
        clearActiveOrder,
        setActiveOrderManually,
    };
};