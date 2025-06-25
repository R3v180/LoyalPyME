// frontend/src/hooks/usePublicMenuData.ts
// Version 1.0.0 (Created to encapsulate menu fetching logic)

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { PublicDigitalMenuData } from '../types/menu.types';

const API_MENU_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

export interface UsePublicMenuDataReturn {
    menuData: PublicDigitalMenuData | null;
    loadingMenu: boolean;
    errorMenu: string | null;
    fetchMenu: () => void;
}

export const usePublicMenuData = (businessSlug: string | undefined): UsePublicMenuDataReturn => {
    const { t } = useTranslation();
    const [menuData, setMenuData] = useState<PublicDigitalMenuData | null>(null);
    const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
    const [errorMenu, setErrorMenu] = useState<string | null>(null);

    const fetchMenu = useCallback(async () => {
        if (!businessSlug) {
            setErrorMenu(t('error.missingBusinessSlug'));
            setLoadingMenu(false);
            return;
        }
        setLoadingMenu(true);
        setErrorMenu(null);
        try {
            const response = await axios.get<PublicDigitalMenuData>(`${API_MENU_BASE_URL}/menu/business/${businessSlug}`);
            if (response.data) {
                // Parse prices from string to number, as Prisma Decimal can be serialized as string
                const parsedMenuData = {
                    ...response.data,
                    categories: response.data.categories.map(c => ({
                        ...c,
                        items: c.items.map(i => ({
                            ...i,
                            price: parseFloat(String(i.price)),
                            modifierGroups: Array.isArray(i.modifierGroups) ? i.modifierGroups.map(g => ({
                                ...g,
                                options: Array.isArray(g.options) ? g.options.map(o => ({ ...o, priceAdjustment: parseFloat(String(o.priceAdjustment)) })) : []
                            })) : []
                        }))
                    }))
                };
                setMenuData(parsedMenuData);
            } else {
                throw new Error(t('error.noMenuDataReceived'));
            }
        } catch (err: any) {
            setErrorMenu(err.response?.data?.message || err.message || t('common.errorUnknown'));
            setMenuData(null);
        } finally {
            setLoadingMenu(false);
        }
    }, [businessSlug, t]);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    return { menuData, loadingMenu, errorMenu, fetchMenu };
};