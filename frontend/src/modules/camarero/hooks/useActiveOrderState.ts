// frontend/src/modules/camarero/hooks/useActiveOrderState.ts
// Versión 1.1.1 - CORRECCIÓN: Añadir activeOrderDetails a la interfaz de retorno

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { OrderStatus } from '../../../shared/types/user.types';
import { PublicOrderStatusInfo } from '../types/publicOrder.types'; 

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
    activeOrderDetails: PublicOrderStatusInfo | null; // <--- ¡CORRECCIÓN CLAVE AQUÍ!
}

export const useActiveOrderState = (businessSlug: string | undefined, tableIdentifier: string | undefined): UseActiveOrderStateReturn => {
    const activeOrderKey = businessSlug ? `${ACTIVE_ORDER_INFO_KEY_PREFIX}${businessSlug}${tableIdentifier ? `_${tableIdentifier}` : ''}` : null;

    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
    const [canCurrentlyAddToExistingOrder, setCanCurrentlyAddToExistingOrder] = useState<boolean>(false);
    const [loadingActiveOrderStatus, setLoadingActiveOrderStatus] = useState<boolean>(true);
    const [activeOrderDetails, setActiveOrderDetails] = useState<PublicOrderStatusInfo | null>(null); // Estado para los detalles completos del pedido

    const isOrderActiveForClient = useCallback((status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        return [
            OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_READY,
            OrderStatus.ALL_ITEMS_READY, OrderStatus.COMPLETED, OrderStatus.PENDING_PAYMENT
        ].includes(status);
    }, []);

    const canAddMoreItemsToOrderStatus = useCallback((status: OrderStatus | undefined): boolean => {
        if (!status) return false;
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
            setActiveOrderDetails(null); // Limpiar detalles
            setLoadingActiveOrderStatus(false);
            return;
        }

        setLoadingActiveOrderStatus(true);
        try {
            const response = await axios.get<PublicOrderStatusInfo>(`${API_BASE_URL}/order/${orderIdToCheck}/status`);
            
            if (response.data && isOrderActiveForClient(response.data.orderStatus)) {
                setActiveOrderId(orderIdToCheck);
                setActiveOrderNumber(orderNumberToCheck);
                setActiveOrderDetails(response.data); // Guardar los detalles completos del pedido
                setCanCurrentlyAddToExistingOrder(canAddMoreItemsToOrderStatus(response.data.orderStatus));
            } else {
                setCanCurrentlyAddToExistingOrder(false);
                setActiveOrderDetails(null); // Limpiar detalles
                if (activeOrderKey) localStorage.removeItem(activeOrderKey);
                setActiveOrderId(null);
                setActiveOrderNumber(null);
            }
        } catch (error) {
            console.error(`[useActiveOrderState] Error checking status for order ${orderIdToCheck}:`, error);
            setCanCurrentlyAddToExistingOrder(false);
            setActiveOrderDetails(null); // Limpiar detalles
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
                        // Llamar a checkActiveOrderStatus para obtener los detalles completos también
                        checkActiveOrderStatus(parsedInfo.orderId, parsedInfo.orderNumber);
                    } else {
                        localStorage.removeItem(activeOrderKey);
                        setLoadingActiveOrderStatus(false);
                        setActiveOrderDetails(null); // Limpiar detalles
                    }
                } catch (e) {
                    localStorage.removeItem(activeOrderKey);
                    setLoadingActiveOrderStatus(false);
                    setActiveOrderDetails(null); // Limpiar detalles
                }
            } else {
                setLoadingActiveOrderStatus(false);
                setActiveOrderDetails(null); // Asegurar que sea null si no hay info
            }
        } else {
            setLoadingActiveOrderStatus(false);
            setActiveOrderDetails(null); // Asegurar que sea null si no hay info
        }
    }, [activeOrderKey, checkActiveOrderStatus]);

    const clearActiveOrder = useCallback(() => {
        if (activeOrderKey) {
            localStorage.removeItem(activeOrderKey);
        }
        setActiveOrderId(null);
        setActiveOrderNumber(null);
        setCanCurrentlyAddToExistingOrder(false);
        setActiveOrderDetails(null); // Limpiar detalles al limpiar el pedido
    }, [activeOrderKey]);

    const setActiveOrderManually = useCallback((orderId: string, orderNumber: string) => {
        if (activeOrderKey && businessSlug) {
            const activeOrderData: ActiveOrderInfo = { orderId, orderNumber, businessSlug, tableIdentifier, savedAt: Date.now() };
            localStorage.setItem(activeOrderKey, JSON.stringify(activeOrderData));
            setActiveOrderId(orderId);
            setActiveOrderNumber(orderNumber);
            setCanCurrentlyAddToExistingOrder(true);
            // Si se activa manualmente, se asume que los detalles se obtendrán con la próxima llamada
            // o se pueden pasar aquí si están disponibles. Por ahora, no se actualizan aquí.
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
        activeOrderDetails, // ¡Devolver el nuevo estado!
    };
};