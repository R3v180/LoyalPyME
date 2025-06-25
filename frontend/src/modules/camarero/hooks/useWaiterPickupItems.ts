// frontend/src/hooks/useWaiterPickupItems.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
// IconCheck y IconX no se usarán temporalmente en las notificaciones para depurar
// import { IconCheck, IconX } from '@tabler/icons-react'; 

import { getReadyForPickupItems, markOrderItemAsServed } from '../services/waiterService';
import type { ReadyPickupItem } from '../types/camarero.types';

const POLLING_INTERVAL_MS = 15000;

export interface UseWaiterPickupItemsReturn {
    items: ReadyPickupItem[];
    isLoadingInitial: boolean;
    fetchError: string | null;
    markingItemId: string | null;
    fetchItems: (isInitialLoad?: boolean) => Promise<void>; // La declaración es Promise<void>
    handleMarkAsServed: (orderItemId: string) => Promise<void>;
}

export const useWaiterPickupItems = (): UseWaiterPickupItemsReturn => {
    const { t, i18n } = useTranslation();
    const [items, setItems] = useState<ReadyPickupItem[]>([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [markingItemId, setMarkingItemId] = useState<string | null>(null);

    const pollingTimeoutRef = useRef<number | null>(null);
    const isMountedRef = useRef<boolean>(true);

    // fetchItems: Obtiene los ítems listos del servidor.
    // La declaración de retorno es Promise<void> porque es una función async que no devuelve un valor explícito.
    const fetchItems = useCallback(async (isInitialLoad = false): Promise<void> => {
        if (isInitialLoad) {
            setIsLoadingInitial(true);
            setFetchError(null);
        }
        // console.log(`[useWaiterPickupItems] Fetching items. Initial: ${isInitialLoad}`);

        try {
            const fetchedItems = await getReadyForPickupItems();
            if (isMountedRef.current) {
                setItems(fetchedItems);
                if (fetchError && !isInitialLoad) { // Limpiar error si un fetch posterior es exitoso
                    setFetchError(null);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorLoadingData');
            if (isMountedRef.current) {
                setFetchError(msg);
                // console.error("[useWaiterPickupItems] Error fetching items:", msg);
            }
        } finally {
            if (isMountedRef.current && isInitialLoad) {
                setIsLoadingInitial(false);
            }
        }
    }, [t, fetchError]); // Dependencias: t, fetchError

    // Efecto para la carga inicial y limpieza al desmontar
    useEffect(() => {
        isMountedRef.current = true;
        fetchItems(true); // Carga inicial
        return () => {
            isMountedRef.current = false;
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
            }
        };
    }, [fetchItems]); // Solo depende de fetchItems para la carga inicial

    // Efecto para el polling
    useEffect(() => {
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
        }
        // Condiciones para activar el polling
        if (!isLoadingInitial && !fetchError && !markingItemId && isMountedRef.current) {
            pollingTimeoutRef.current = window.setTimeout(() => {
                // console.log(`[useWaiterPickupItems] Polling for new items...`);
                fetchItems(false);
            }, POLLING_INTERVAL_MS);
        }
        // Función de limpieza para este efecto específico (se ejecuta si las dependencias cambian o al desmontar)
        return () => {
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
            }
        };
    }, [items, isLoadingInitial, fetchError, markingItemId, fetchItems]); // Dependencias que reinician el polling

    // handleMarkAsServed: Marca un ítem como servido
    const handleMarkAsServed = async (orderItemId: string): Promise<void> => {
        if (markingItemId) { // Prevenir acciones concurrentes
            notifications.show({
                title: t('common.info'),
                message: t('waiterInterface.actionInProgress', 'Por favor, espera a que la acción actual termine.'),
                color: 'yellow',
            });
            return;
        }

        setMarkingItemId(orderItemId);

        const itemToMark = items.find(it => it.orderItemId === orderItemId);
        const itemNameForNotification =
            (i18n.language === 'es' && itemToMark?.itemNameSnapshot_es)
                ? itemToMark.itemNameSnapshot_es
                : (itemToMark?.itemNameSnapshot_en || itemToMark?.itemNameSnapshot_es || t('common.item', 'Ítem'));

        try {
            await markOrderItemAsServed(orderItemId); // Llamada al servicio

            if (isMountedRef.current) {
                notifications.show({ // Notificación SIN icono temporalmente
                    title: t('common.success'),
                    message: t('waiterInterface.itemMarkedServedSuccess', { itemName: itemNameForNotification }),
                    color: 'green',
                    // icon: <IconCheck size={18} />, // TEMPORALMENTE COMENTADO
                });
                fetchItems(); // Refrescar la lista para mostrar los cambios
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || t('waiterInterface.errorMarkingServed', 'Error al marcar el ítem como servido.');
            if (isMountedRef.current) {
                notifications.show({ // Notificación SIN icono temporalmente
                    title: t('common.error'),
                    message: errorMsg,
                    color: 'red',
                    // icon: <IconX size={18} />, // TEMPORALMENTE COMENTADO
                });
                // console.error(`[useWaiterPickupItems] Error marking item ${orderItemId} as served:`, err);
            }
        } finally {
            if (isMountedRef.current) {
                setMarkingItemId(null);
            }
        }
    };

    return {
        items,
        isLoadingInitial,
        fetchError,
        markingItemId,
        fetchItems,
        handleMarkAsServed,
    };
};