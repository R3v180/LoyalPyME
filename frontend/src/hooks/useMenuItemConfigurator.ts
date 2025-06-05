// frontend/src/hooks/useMenuItemConfigurator.ts
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PublicMenuItem,
    ModifierUiType,
} from '../types/menu.types';
import { ConfiguringItemState } from '../types/publicOrder.types';

const getTranslatedNameHelper = (item: { name_es?: string | null, name_en?: string | null }, lang: string, defaultName: string = 'Unnamed') => {
    if (lang === 'es' && item.name_es) return item.name_es;
    if (lang === 'en' && item.name_en) return item.name_en;
    return item.name_es || item.name_en || defaultName;
};

export interface UseMenuItemConfiguratorReturn {
    configuringItem: ConfiguringItemState | null;
    startConfiguringItem: (item: PublicMenuItem) => void;
    cancelConfiguration: () => void;
    updateConfigQuantity: (newQuantity: number) => void;
    updateConfigModifierSelection: (groupId: string, newSelection: string | string[], groupUiType: ModifierUiType) => void;
    updateConfigNotes: (newNotes: string) => void;
}

export const useMenuItemConfigurator = (): UseMenuItemConfiguratorReturn => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;
    const [configuringItem, setConfiguringItem] = useState<ConfiguringItemState | null>(null);

    const calculatePriceAndValidate = useCallback((itemDetails: PublicMenuItem, selectedOptions: Record<string, string[] | string>): { newPrice: number; isValid: boolean } => {
        let newPrice = itemDetails.price;
        let isValid = true;
        const itemNameForLog = getTranslatedNameHelper(itemDetails, currentLang, "Item Desconocido");

        if (Array.isArray(itemDetails.modifierGroups)) {
            for (const group of itemDetails.modifierGroups) {
                const groupNameForLog = getTranslatedNameHelper(group, currentLang, "Grupo Desconocido");
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

                if (group.isRequired && count < group.minSelections) isValid = false;
                if (count > group.maxSelections) isValid = false;
                if (group.uiType === ModifierUiType.RADIO && count > 1) isValid = false;
                
                if(Array.isArray(group.options)) {
                    currentSelectionsForGroup.forEach(optionId => {
                        const option = group.options.find(opt => opt.id === optionId);
                        if (option) {
                            newPrice += option.priceAdjustment;
                        } else {
                            console.warn(`[useMenuItemConfigurator] Option ID "${optionId}" not found in group "${groupNameForLog}" for item "${itemNameForLog}".`);
                        }
                    });
                }
            }
        }
        return { newPrice, isValid };
    }, [currentLang]);

    useEffect(() => {
        if (configuringItem) {
            const { newPrice, isValid } = calculatePriceAndValidate(configuringItem.itemDetails, configuringItem.selectedOptionsByGroup);
            if (newPrice !== configuringItem.currentUnitPrice || isValid !== configuringItem.areModifiersValid) {
                setConfiguringItem(prev => prev ? { ...prev, currentUnitPrice: newPrice, areModifiersValid: isValid } : null);
            }
        }
    }, [configuringItem, calculatePriceAndValidate, currentLang]);

    const startConfiguringItem = useCallback((item: PublicMenuItem) => {
        const initialSelectedOptions: Record<string, string[] | string> = {};
        if (Array.isArray(item.modifierGroups)) {
            item.modifierGroups.forEach(group => {
                const optionsAvailable = Array.isArray(group.options) ? group.options : [];
                const defaultOptions = optionsAvailable.filter(opt => opt.isDefault && opt.isAvailable);

                if (group.uiType === ModifierUiType.RADIO) {
                    let defaultRadioOptionId = '';
                    if (defaultOptions.length > 0) {
                        defaultRadioOptionId = defaultOptions[0].id;
                    } else if (optionsAvailable.length > 0 && group.isRequired && group.minSelections === 1) {
                        const firstAvailableOption = optionsAvailable.find(opt => opt.isAvailable);
                        if (firstAvailableOption) defaultRadioOptionId = firstAvailableOption.id;
                    }
                    initialSelectedOptions[group.id] = defaultRadioOptionId;
                } else {
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
    }, [calculatePriceAndValidate, currentLang]);

    const cancelConfiguration = useCallback(() => setConfiguringItem(null), []);
    const updateConfigQuantity = useCallback((newQuantity: number) => setConfiguringItem(prev => prev ? { ...prev, quantity: newQuantity } : null), []);

    const updateConfigModifierSelection = useCallback((groupId: string, newSelection: string | string[]) => {
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
    }, []);
    
    const updateConfigNotes = useCallback((newNotes: string) => setConfiguringItem(prev => prev ? { ...prev, itemNotes: newNotes } : null), []);

    return {
        configuringItem,
        startConfiguringItem,
        cancelConfiguration,
        updateConfigQuantity,
        updateConfigModifierSelection,
        updateConfigNotes,
    };
};