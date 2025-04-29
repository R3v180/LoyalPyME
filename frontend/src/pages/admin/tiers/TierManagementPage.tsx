// filename: frontend/src/pages/admin/tiers/TierManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, Button, Group, Loader, Alert,
    Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';
import { useTranslation } from 'react-i18next'; // Importar hook

// Importar componentes
import TierTable from '../../../components/admin/tiers/TierTable';
import CreateTierModal from '../../../components/admin/tiers/CreateTierModal';
import DeleteTierModal from '../../../components/admin/tiers/DeleteTierModal';
import EditTierModal from '../../../components/admin/tiers/EditTierModal';
import TierBenefitsModal from '../../../components/admin/tiers/TierBenefitsModal';

// Tipos
enum BenefitType { POINTS_MULTIPLIER = 'POINTS_MULTIPLIER', EXCLUSIVE_REWARD_ACCESS = 'EXCLUSIVE_REWARD_ACCESS', CUSTOM_BENEFIT = 'CUSTOM_BENEFIT' }
interface TierBenefit { id: string; isActive: boolean; type: BenefitType; value: string; description: string | null; }
interface Tier { id: string; name: string; level: number; minValue: number; description: string | null; benefitsDescription: string | null; isActive: boolean; benefits: TierBenefit[]; }


const TierManagementPage: React.FC = () => {
    const { t } = useTranslation(); // Hook de traducción
    // Estado
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingTier, setDeletingTier] = useState<Tier | null>(null);
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
    const [editingTier, setEditingTier] = useState<Tier | null>(null);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [viewingBenefitsForTier, setViewingBenefitsForTier] = useState<Tier | null>(null);
    const [benefitsModalOpened, { open: openBenefitsModal, close: closeBenefitsModal }] = useDisclosure(false);

    // Lógica de Datos
    const fetchTiers = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const response = await axiosInstance.get<Tier[]>('/tiers?includeBenefits=true');
            setTiers(response.data);
        } catch (err: any) {
            console.error("Error fetching tiers:", err);
            const message = err.response?.data?.message || t('adminCommon.errorLoadingData'); // Usar t() para error genérico
            setError(message);
            notifications.show({
                title: t('common.errorLoadingData'), // Título genérico
                message: message,
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setLoading(false);
        }
    }, [t]); // Añadir t como dependencia

    useEffect(() => {
        fetchTiers();
    }, [fetchTiers]);

    // Handlers CRUD
    const handleCreate = () => { openCreateModal(); };
    const handleCreateSuccess = () => { fetchTiers(); }; // Ya no muestra notificación, el modal lo hace
    const handleEdit = (tierId: string) => {
        const tierToEdit = tiers.find(t => t.id === tierId);
        if (tierToEdit) {
            setEditingTier(tierToEdit);
            openEditModal();
        } else {
            console.error(`Tier with ID ${tierId} not found for editing.`);
            notifications.show({
                title: t('common.error'), // Título genérico
                message: t('adminTiersManagePage.deleteErrorNotFound'), // Mensaje específico
                color: 'orange'
            });
        }
    };
    const handleEditSuccess = () => { fetchTiers(); setEditingTier(null); }; // Notificación en modal
    const confirmDelete = (tierId: string) => {
        const tierToDelete = tiers.find(t => t.id === tierId);
        if (tierToDelete) {
            setDeletingTier(tierToDelete);
            openDeleteModal(); // El modal DeleteTierModal ahora necesitará usar t() internamente
        }
    };
    const handleDelete = async () => {
        if (!deletingTier) return;
        const tierToDeleteId = deletingTier.id;
        const tierToDeleteName = deletingTier.name;
        closeDeleteModal();

        // Usar t() para las notificaciones de borrado
        notifications.show({
            id: `delete-tier-${tierToDeleteId}`,
            title: t('common.deleting', 'Eliminando...'), // Nueva clave
            message: t('adminTiersManagePage.deleteLoadingMessage', { name: tierToDeleteName }),
            loading: true,
            autoClose: false,
            withCloseButton: false,
        });

        try {
            await axiosInstance.delete(`/tiers/tiers/${tierToDeleteId}`);
            notifications.update({
                id: `delete-tier-${tierToDeleteId}`,
                title: t('adminTiersManagePage.deleteSuccessTitle'),
                message: t('adminTiersManagePage.deleteSuccessMessage', { name: tierToDeleteName }),
                color: 'green',
                icon: <IconCheck size={18} />,
                loading: false,
                autoClose: 4000,
            });
            setDeletingTier(null);
            fetchTiers();
        } catch (err: any) {
            console.error(`Error deleting tier ${tierToDeleteId}:`, err);
            const message = err.response?.data?.message || t('adminTiersManagePage.deleteErrorMessage');
            notifications.update({
                id: `delete-tier-${tierToDeleteId}`,
                title: t('adminTiersManagePage.deleteErrorTitle'),
                message: message,
                color: 'red',
                icon: <IconAlertCircle size={18} />,
                loading: false,
                autoClose: 6000,
            });
            setDeletingTier(null);
        }
    };
    const handleManageBenefits = (tier: Tier) => {
        setViewingBenefitsForTier(tier);
        openBenefitsModal(); // El modal TierBenefitsModal necesita usar t() internamente
    };

    // Renderizado
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Group justify="space-between">
                        <Title order={2}>{t('adminTiersManagePage.title')}</Title>
                        <Button leftSection={<IconPlus size={18} />} onClick={handleCreate}>
                            {t('adminTiersManagePage.addButton')}
                        </Button>
                    </Group>

                    {loading && <Group justify="center" mt="xl"><Loader /></Group>}
                    {error && !loading &&
                        <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>
                            {error}
                        </Alert>
                    }

                    {!loading && !error && (
                        // TierTable necesita i18n internamente
                        <TierTable
                            tiers={tiers}
                            onEditClick={handleEdit}
                            onDeleteClick={confirmDelete}
                            onManageBenefitsClick={handleManageBenefits}
                        />
                    )}
                    {!loading && !error && tiers.length === 0 && (
                        <Text c="dimmed" ta="center" mt="md">{t('adminTiersManagePage.noTiersDefined')}</Text>
                    )}
                </Stack>
            </Paper>

            {/* Modales (necesitan i18n internamente) */}
            <CreateTierModal
                opened={createModalOpened}
                onClose={closeCreateModal}
                onSuccess={handleCreateSuccess} />
            <DeleteTierModal
                opened={deleteModalOpened}
                onClose={() => { setDeletingTier(null); closeDeleteModal(); }}
                onConfirm={handleDelete}
                tierName={deletingTier?.name} />
            {editingTier && (
                <EditTierModal
                    opened={editModalOpened}
                    onClose={() => { setEditingTier(null); closeEditModal();}}
                    onSuccess={handleEditSuccess}
                    tier={editingTier} />
            )}
            {viewingBenefitsForTier && (
                <TierBenefitsModal
                    opened={benefitsModalOpened}
                    onClose={() => { setViewingBenefitsForTier(null); closeBenefitsModal(); }}
                    tier={viewingBenefitsForTier} />
            )}
        </>
    );
};

export default TierManagementPage;