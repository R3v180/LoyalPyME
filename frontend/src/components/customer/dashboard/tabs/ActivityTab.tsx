// filename: frontend/src/components/customer/dashboard/tabs/ActivityTab.tsx
// Version: 1.0.0 (Placeholder component for Activity Tab)

import React from 'react';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// No props needed for this placeholder initially
// interface ActivityTabProps {}

const ActivityTab: React.FC = (/* props: ActivityTabProps */) => {
    const { t } = useTranslation();

    return (
        <Text c="dimmed">
            ({t('common.upcomingFeatureTitle', 'Próximamente')}) {t('customerDashboard.tabActivity', 'Mi Actividad')}
        </Text>
        // Future: Replace with actual activity history component
    );
};

export default ActivityTab;

// End of File: frontend/src/components/customer/dashboard/tabs/ActivityTab.tsx