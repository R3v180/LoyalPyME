// frontend/src/modules/loyalpyme/pages/admin/AdminRewardsManagement.tsx
// Version 1.4.5 - Corrected type import path & removed obsolete props from RewardForm

import React, { useState, useCallback } from 'react';
import {
    Group, Button, Title, Text, Loader, Alert, Paper, Stack,
    Table, Badge, ActionIcon, Tooltip, Modal,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';
import {
    IconAlertCircle, IconPencil, IconTrash, IconToggleLeft, IconToggleRight,
    IconPlus
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAdminRewards } from '../../hooks/useAdminRewards';

// --- CORRECCIÓN DE RUTA ---
import type { Reward } from '../../../../shared/types/user.types';
// --- FIN CORRECCIÓN ---
import RewardForm from '../../components/admin/rewards/RewardForm';

const AdminRewardsManagement: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { rewards, loading, error, actionLoading, fetchRewards, handleToggleActive, handleDeleteReward } = useAdminRewards();
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [editModalOpened, { open: openEditModalHandler, close: closeEditModal }] = useDisclosure(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    const handleRewardAdded = useCallback(() => { setShowAddForm(false); fetchRewards(); }, [fetchRewards]);
    const handleOpenEditModal = (reward: Reward) => { setEditingReward(reward); openEditModalHandler(); };
    const handleCloseEditModal = () => { closeEditModal(); setEditingReward(null); };
    const handleRewardUpdated = useCallback(() => { handleCloseEditModal(); fetchRewards(); }, [fetchRewards, handleCloseEditModal]);

    const confirmAndDeleteReward = useCallback((reward: Reward) => {
        const displayName = (i18n.language === 'es' ? reward.name_es : reward.name_en) || reward.name_es || reward.name_en || `ID ${reward.id}`;
        if (window.confirm(t('adminRewardsPage.confirmDeleteMessage', { name: displayName }))) {
            handleDeleteReward(reward.id, displayName);
        }
    }, [handleDeleteReward, t, i18n.language]);


    const renderRewardsTable = () => {
        const rows = rewards.map((reward) => {
            const iconSize = 14;
            const isLoadingToggle = actionLoading?.type === 'toggle' && actionLoading?.id === reward.id;
            const isLoadingDelete = actionLoading?.type === 'delete' && actionLoading?.id === reward.id;
            const isAnyActionLoading = !!actionLoading;
            const displayName = (i18n.language === 'es' ? reward.name_es : reward.name_en) || reward.name_es || reward.name_en || '(Sin nombre)';

            const editIcon = (
                <Tooltip label={t('adminRewardsPage.tooltipEdit')} withArrow position={isMobile ? 'bottom' : 'left'}>
                    <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEditModal(reward)} disabled={isAnyActionLoading}>
                        <IconPencil size={iconSize} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            );
            const toggleIcon = (
                <Tooltip label={reward.isActive ? t('adminRewardsPage.tooltipDeactivate') : t('adminRewardsPage.tooltipActivate')} withArrow position="top">
                    <ActionIcon variant="subtle" color={reward.isActive ? 'orange' : 'teal'} onClick={() => handleToggleActive(reward.id, reward.isActive)} loading={isLoadingToggle} disabled={isAnyActionLoading}>
                        {reward.isActive ? <IconToggleLeft size={iconSize} stroke={1.5} /> : <IconToggleRight size={iconSize} stroke={1.5} />}
                    </ActionIcon>
                </Tooltip>
            );
             const deleteIcon = (
                <Tooltip label={t('adminRewardsPage.tooltipDelete')} withArrow position={isMobile ? 'bottom' : 'right'}>
                    <ActionIcon variant="subtle" color="red" onClick={() => confirmAndDeleteReward(reward)} loading={isLoadingDelete} disabled={isAnyActionLoading}>
                        <IconTrash size={iconSize} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
             );

            return (
                <Table.Tr key={reward.id}>
                    <Table.Td fz={{ base: 'xs', sm: 'sm' }}>{displayName}</Table.Td>
                    <Table.Td fz={{ base: 'xs', sm: 'sm' }}>{reward.pointsCost}</Table.Td>
                    <Table.Td><Badge color={reward.isActive ? 'green' : 'gray'} variant="light" radius="lg" fz={{ base: 'xs', sm: 'sm' }}>{reward.isActive ? t('common.active') : t('common.inactive')}</Badge></Table.Td>
                    <Table.Td>
                        {isMobile ? (
                            <Stack gap={2} align="flex-end">
                                {editIcon}
                                {toggleIcon}
                                {deleteIcon}
                            </Stack>
                        ) : (
                            <Group gap="xs" justify="flex-end" wrap="nowrap">
                                {editIcon}
                                {toggleIcon}
                                {deleteIcon}
                            </Group>
                        )}
                    </Table.Td>
                </Table.Tr>
            );
        });

        return (
            <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th fz={{ base: 'xs', sm: 'sm' }}>{t('adminRewardsPage.tableHeaderName')}</Table.Th>
                        <Table.Th fz={{ base: 'xs', sm: 'sm' }}>{t('adminRewardsPage.tableHeaderCost')}</Table.Th>
                        <Table.Th fz={{ base: 'xs', sm: 'sm' }}>{t('adminRewardsPage.tableHeaderStatus')}</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }} fz={{ base: 'xs', sm: 'sm' }}>{t('adminRewardsPage.tableHeaderActions')}</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        );
    };

    const renderRewardsSectionContent = () => { if (loading && rewards.length === 0) return <Group justify="center" p="lg"><Loader /></Group>; if (error && rewards.length === 0) return (<Alert icon={<IconAlertCircle size={16} />} title={t('common.errorLoadingData')} color="red" radius="lg">{error}</Alert>); if (!loading && rewards.length === 0 && !showAddForm) return <Text c="dimmed" ta="center" p="lg">{t('adminRewardsPage.noRewardsYet')}</Text>; if (rewards.length > 0) return renderRewardsTable(); return null; };

    return (
        <>
            <Paper shadow="xs" p="lg" withBorder radius="lg">
                <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                        <Title order={2}>{t('adminRewardsPage.title')}</Title>
                        <Button
                            leftSection={showAddForm ? undefined : <IconPlus size={18} />}
                            onClick={() => setShowAddForm(!showAddForm)}
                            disabled={loading && rewards.length === 0}
                            variant={showAddForm ? "outline" : "filled"}
                            radius="lg"
                        >
                            {showAddForm ? t('adminRewardsPage.cancelAddButton') : t('adminRewardsPage.addButton')}
                        </Button>
                    </Group>
                     {renderRewardsSectionContent()}
                    {showAddForm && (
                        <Paper withBorder p="md" mt="md" radius="lg">
                            {/* --- CORRECCIÓN: Eliminar prop 'mode' --- */}
                            <RewardForm onSubmitSuccess={handleRewardAdded} onCancel={() => setShowAddForm(false)} />
                        </Paper>
                    )}
                </Stack>
            </Paper>
            <Modal
                opened={editModalOpened}
                onClose={handleCloseEditModal}
                title={t('adminRewardsPage.editFormTitle')}
                centered
                radius="lg"
                size="lg"
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                {editingReward && (
                    /* --- CORRECCIÓN: Eliminar props 'mode' y 'rewardIdToUpdate' --- */
                    <RewardForm
                        initialData={editingReward}
                        onSubmitSuccess={handleRewardUpdated}
                        onCancel={handleCloseEditModal}
                    />
                )}
            </Modal>
        </>
    );
};

export default AdminRewardsManagement;