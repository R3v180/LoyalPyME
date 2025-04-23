// File: frontend/src/pages/admin/tiers/TierManagementPage.tsx
// Version: 1.4.0 (Integrate Edit Tier Modal, use correct component import paths)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, Button, Group, Loader, Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance'; // Ajusta si es necesario

// --- Importar componentes desde la ubicación correcta ---
import TierTable from '../../../components/admin/tiers/TierTable';
import CreateTierModal from '../../../components/admin/tiers/CreateTierModal';
import DeleteTierModal from '../../../components/admin/tiers/DeleteTierModal';
import EditTierModal from '../../../components/admin/tiers/EditTierModal';
// --- FIN Importaciones ---


// --- Tipos ---
interface TierBenefit { id: string; isActive: boolean; type: any; value: string; description: string | null; }
interface Tier { id: string; name: string; level: number; minValue: number; description: string | null; benefitsDescription: string | null; isActive: boolean; benefits: TierBenefit[]; }
// --- Fin Tipos ---


const TierManagementPage: React.FC = () => {
    // --- Estado ---
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingTier, setDeletingTier] = useState<Tier | null>(null);
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
    const [editingTier, setEditingTier] = useState<Tier | null>(null); // Estado para el tier en edición
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false); // Hook para modal edición
    // --- Fin Estado ---

    // --- Lógica de Datos ---
    const fetchTiers = useCallback(async () => {
        setLoading(true); setError(null); try { const response = await axiosInstance.get<Tier[]>('/tiers/tiers?includeBenefits=true'); setTiers(response.data); } catch (err: any) { console.error("Error fetching tiers:", err); const message = err.response?.data?.message || "Error al cargar la lista de niveles."; setError(message); notifications.show({ title: 'Error de Carga', message: message, color: 'red', icon: <IconAlertCircle size={18} /> }); } finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchTiers(); }, [fetchTiers]);
    // --- Fin Lógica de Datos ---

    // --- Handlers CRUD ---
    const handleCreate = () => { openCreateModal(); };
    const handleCreateSuccess = () => { fetchTiers(); /* El modal de creación se cierra internamente */ };

    // Abrir modal de edición con los datos del tier seleccionado
    const handleEdit = (tierId: string) => {
         const tierToEdit = tiers.find(t => t.id === tierId);
         if (tierToEdit) {
             setEditingTier(tierToEdit); // Guardar el tier completo
             openEditModal();            // Abrir el modal
         }
         else {
             console.error(`Tier with ID ${tierId} not found for editing.`);
             notifications.show({ title: 'Error', message: 'No se encontró el nivel seleccionado para editar.', color: 'orange' });
         }
    };
    // Callback de éxito para la edición
    const handleEditSuccess = () => {
        fetchTiers();         // Refrescar la lista
        setEditingTier(null); // Limpiar el estado del tier en edición
        // El modal de edición se cierra internamente tras el éxito
    };

    // Abrir confirmación de borrado
    const confirmDelete = (tierId: string) => {
        const tierToDelete = tiers.find(t => t.id === tierId);
        if (tierToDelete) { setDeletingTier(tierToDelete); openDeleteModal(); }
    };
    // Ejecutar borrado
    const handleDelete = async () => {
        if (!deletingTier) return; const tierToDeleteId = deletingTier.id; const tierToDeleteName = deletingTier.name; closeDeleteModal(); notifications.show({ id: `delete-tier-${tierToDeleteId}`, title: 'Eliminando...', message: `Intentando eliminar el nivel "${tierToDeleteName}"`, loading: true, autoClose: false, withCloseButton: false }); try { await axiosInstance.delete(`/tiers/tiers/${tierToDeleteId}`); notifications.update({ id: `delete-tier-${tierToDeleteId}`, title: '¡Eliminado!', message: `El nivel "${tierToDeleteName}" se ha eliminado correctamente.`, color: 'green', icon: <IconCheck size={18} />, loading: false, autoClose: 4000 }); setDeletingTier(null); fetchTiers(); } catch (err: any) { console.error(`Error deleting tier ${tierToDeleteId}:`, err); const message = err.response?.data?.message || "Error al eliminar el nivel."; notifications.update({ id: `delete-tier-${tierToDeleteId}`, title: 'Error al Eliminar', message: message, color: 'red', icon: <IconAlertCircle size={18} />, loading: false, autoClose: 6000 }); setDeletingTier(null); }
    };
    // --- Fin Handlers CRUD ---

    // --- Renderizado ---
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Group justify="space-between">
                        <Title order={2}>Gestionar Niveles (Tiers)</Title>
                        <Button leftSection={<IconPlus size={18} />} onClick={handleCreate}>
                            Crear Nuevo Nivel
                        </Button>
                    </Group>

                    {/* Estado de Carga / Error */}
                    {loading && <Group justify="center" mt="xl"><Loader /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}

                    {/* Tabla */}
                    {!loading && !error && (
                        <TierTable
                            tiers={tiers}
                            onEditClick={handleEdit} // Pasamos el handler actualizado
                            onDeleteClick={confirmDelete}
                        />
                    )}
                </Stack>
            </Paper>

            {/* Modales */}
            <CreateTierModal
                opened={createModalOpened}
                onClose={closeCreateModal}
                onSuccess={handleCreateSuccess}
            />

            <DeleteTierModal
                opened={deleteModalOpened}
                onClose={() => { setDeletingTier(null); closeDeleteModal(); }}
                onConfirm={handleDelete}
                tierName={deletingTier?.name}
            />

            {/* Renderizar EditTierModal */}
            {editingTier && ( // Renderizar solo si hay un tier para editar
                 <EditTierModal
                    opened={editModalOpened}
                    onClose={() => { setEditingTier(null); closeEditModal();}} // Limpiar estado al cerrar
                    onSuccess={handleEditSuccess} // Pasar callback de éxito
                    tier={editingTier} // Pasar el tier a editar
                 />
            )}
        </>
    );
};

export default TierManagementPage;

// End of File: frontend/src/pages/admin/tiers/TierManagementPage.tsx