// filename: frontend/src/components/customer/dashboard/tabs/OffersTab.tsx
// Version: 1.0.0 (Placeholder component for Offers & News Tab)

import React from 'react';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// No props needed for this placeholder initially
// interface OffersTabProps {}

const OffersTab: React.FC = (/* props: OffersTabProps */) => {
    const { t } = useTranslation();

    return (
        <Text c="dimmed">
            ({t('common.upcomingFeatureTitle', 'Próximamente')}) {t('customerDashboard.tabOffers', 'Ofertas y Noticias')}
        </Text>
        // Future: Replace with actual offers/news feed component
    );
};

export default OffersTab;

// End of File: frontend/src/components/customer/dashboard/tabs/OffersTab.tsx