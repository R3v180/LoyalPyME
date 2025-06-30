// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/ProfileTab.tsx
import React from 'react';
import { Title, Stack, Grid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useUserProfileData } from '../../../../hooks/useUserProfileData';
import ProfileInfoForm from './profile/ProfileInfoForm';
// La importación de ChangePasswordForm se ha eliminado.

const ProfileTab: React.FC = () => {
    const { t } = useTranslation();
    const { userData, loading, error, refetch } = useUserProfileData();

    return (
        <Stack>
            <Title order={3}>{t('customerDashboard.tabProfile')}</Title>
            <Grid>
                {/* Hacemos que la columna ocupe todo el ancho disponible */}
                <Grid.Col span={12}>
                    <ProfileInfoForm
                        userData={userData}
                        isLoading={loading}
                        error={error}
                        onProfileUpdate={refetch}
                    />
                </Grid.Col>
                
                {/* La columna para ChangePasswordForm se ha eliminado por completo. */}
            </Grid>
        </Stack>
    );
};

export default ProfileTab;