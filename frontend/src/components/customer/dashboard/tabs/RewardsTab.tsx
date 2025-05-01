// filename: frontend/src/components/customer/dashboard/tabs/RewardsTab.tsx
// Version: 1.0.7 (Remove explicit Title component to avoid duplication)

import React from 'react';
import { Box } from '@mantine/core'; // Title removed from imports
// import { useTranslation } from 'react-i18next'; // Removed if t() is not used

// Import child component
import RewardList from '../../RewardList';

// Import types needed for props
import { DisplayReward } from '../../../../types/customer';

// Define props for the RewardsTab component
interface RewardsTabProps {
    displayRewards: DisplayReward[];
    userPoints: number | undefined;
    redeemingRewardId: string | null;
    loadingRewards: boolean;
    loadingGrantedRewards: boolean;
    errorRewards: string | null;
    onRedeemPoints: (rewardId: string) => Promise<void>;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => Promise<void>;
}

const RewardsTab: React.FC<RewardsTabProps> = ({
    displayRewards,
    userPoints,
    redeemingRewardId,
    loadingRewards,
    loadingGrantedRewards,
    errorRewards,
    onRedeemPoints,
    onRedeemGift
}) => {
    // const { t } = useTranslation(); // Removed if t() is not used

    // Optional: Display error directly in this tab if it occurs
    // if (errorRewards && !loadingRewards && !loadingGrantedRewards) {
    //     return (
    //         <Alert title={t('common.errorLoadingData')} color="red" icon={<IconAlertCircle size="1rem" />} mt="md">
    //             {errorRewards}
    //         </Alert>
    //     );
    // }

    return (
        <Box>
            {/* <Title order={4} mb="md"> // <-- TITLE REMOVED
                {t('customerDashboard.rewardsSectionTitle', 'Recompensas y Regalos')}
            </Title> */}

            <RewardList
                rewards={displayRewards}
                userPoints={userPoints}
                redeemingRewardId={redeemingRewardId}
                loadingRewards={loadingRewards}
                loadingGrantedRewards={loadingGrantedRewards}
                errorRewards={errorRewards}
                onRedeemPoints={onRedeemPoints}
                onRedeemGift={onRedeemGift}
            />
        </Box>
    );
};

export default RewardsTab;

// End of File: frontend/src/components/customer/dashboard/tabs/RewardsTab.tsx