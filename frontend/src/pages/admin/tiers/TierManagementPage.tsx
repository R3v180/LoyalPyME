// File: frontend/src/pages/admin/tiers/TierManagementPage.tsx
// Version: 1.4.2 (Use local imports, integrate Edit/Benefits Modals correctly - COMPLETE FILE)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, Button, Group, Loader, Alert, // Mantine Layout/Feedback
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance'; // Ajusta si es necesario

// --- Importar componentes desde la MISMA carpeta ---
import TierTable from '../../../components/admin/tiers/TierTable';
import CreateTierModal from '../../../components/admin/tiers/CreateTierModal';
import DeleteTierModal from '../../../components/admin/tiers/DeleteTierModal';
import EditTierModal from '../../../components/admin/tiers/EditTierModal';
import TierBenefitsModal from '../../../components/admin/tiers/TierBenefitsModal'; // Importar también este modal
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
    const [editingTier, setEditingTier] = useState<Tier | null>(null);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    // Estado y controlador para modal de Beneficios (CORRECTAMENTE DENTRO)
    const [viewingBenefitsForTier, setViewingBenefitsForTier] = useState<Tier | null>(null);
    const [benefitsModalOpened, { open: openBenefitsModal, close: closeBenefitsModal }] = useDisclosure(false);
    // --- Fin Estado ---

    // --- Lógica de Datos ---
    const fetchTiers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Incluimos beneficios para mostrarlos en la tabla o pasarlos al modal
            const response = await axiosInstance.get<Tier[]>('/tiers/tiers?includeBenefits=true');
            setTiers(response.data);
        } catch (err: any) {
            console.error("Error fetching tiers:", err);
            const message = err.response?.data?.message || "Error al cargar la lista de niveles.";
            setError(message);
            notifications.show({ title: 'Error de Carga', message: message, color: 'red', icon: <IconAlertCircle size={18} /> });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTiers();
    }, [fetchTiers]);
    // --- Fin Lógica de Datos ---

    // --- Handlers CRUD ---
    const handleCreate = () => {
        openCreateModal();
    };

    const handleCreateSuccess = () => {
        fetchTiers(); // Refresca la lista
    };

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

    const handleEditSuccess = () => {
        fetchTiers();         // Refrescar la lista
        setEditingTier(null); // Limpiar el estado del tier en edición
    };

    const confirmDelete = (tierId: string) => {
        const tierToDelete = tiers.find(t => t.id === tierId);
        if (tierToDelete) {
            setDeletingTier(tierToDelete); // Guardar el tier para mostrar nombre y usar ID
            openDeleteModal();
        }
    };

    // Ejecutar borrado (IMPLEMENTACIÓN COMPLETA)
    const handleDelete = async () => {
        if (!deletingTier) return;
        const tierToDeleteId = deletingTier.id;
        const tierToDeleteName = deletingTier.name; // Guardar nombre para mensaje
        closeDeleteModal(); // Cerrar modal antes de la operación
        notifications.show({
             id: `delete-tier-${tierToDeleteId}`,
             title: 'Eliminando...',
             message: `Intentando eliminar el nivel "${tierToDeleteName}"`,
             loading: true,
             autoClose: false,
             withCloseButton: false,
         });
        try {
            await axiosInstance.delete(`/tiers/tiers/${tierToDeleteId}`);
            notifications.update({
                 id: `delete-tier-${tierToDeleteId}`,
                 title: '¡Eliminado!',
                 message: `El nivel "${tierToDeleteName}" se ha eliminado correctamente.`,
                 color: 'green',
                 icon: <IconCheck size={18} />,
                 loading: false,
                 autoClose: 4000,
            });
            setDeletingTier(null); // Limpiar estado
            fetchTiers(); // Recargar la lista
        } catch (err: any) {
             console.error(`Error deleting tier ${tierToDeleteId}:`, err);
             const message = err.response?.data?.message || "Error al eliminar el nivel.";
             notifications.update({
                 id: `delete-tier-${tierToDeleteId}`,
                 title: 'Error al Eliminar',
                 message: message,
                 color: 'red',
                 icon: <IconAlertCircle size={18} />,
                 loading: false,
                 autoClose: 6000,
            });
             setDeletingTier(null); // Limpiar estado aunque falle
        }
    };

    // Handler para Beneficios (CORRECTAMENTE DENTRO)
    const handleManageBenefits = (tier: Tier) => {
        setViewingBenefitsForTier(tier); // Guardar el tier seleccionado
        openBenefitsModal();            // Abrir su modal
    };
    // --- Fin Handlers CRUD ---


    // --- Renderizado ---
    return (
        // Fragmento porque los Modales es mejor tenerlos fuera del flujo principal del Paper
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Group justify="space-between">
                        <Title order={2}>Gestionar Niveles (Tiers)</Title>
                        <Button leftSection={<IconPlus size={18} />} onClick={handleCreate}>
                            Crear Nuevo Nivel
                        </Button>
                    </Group>

                    {/* Estado de Carga */}
                    {loading && <Group justify="center" mt="xl"><Loader /></Group>}
                    {/* Estado de Error */}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}

                    {/* Tabla */}
                    {!loading && !error && (
                        <TierTable
                            tiers={tiers}
                            onEditClick={handleEdit}
                            onDeleteClick={confirmDelete}
                            onManageBenefitsClick={handleManageBenefits} // Pasar el handler correcto
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
                onClose={() => { setDeletingTier(null); closeDeleteModal(); }} // Limpia estado al cerrar
                onConfirm={handleDelete} // Pasa la función de borrado
                tierName={deletingTier?.name} // Pasa el nombre
            />

            {/* Renderizar EditTierModal */}
            {editingTier && ( // Renderizar solo si hay un tier para editar
                 <EditTierModal
                    opened={editModalOpened}
                    onClose={() => { setEditingTier(null); closeEditModal();}} // Limpia estado al cerrar
                    onSuccess={handleEditSuccess} // Llama a refrescar y limpiar estado
                    tier={editingTier} // Pasa el tier a editar
                 />
            )}

             {/* Renderizar TierBenefitsModal */}
             {viewingBenefitsForTier && ( // Renderizar solo si hay un tier seleccionado
                 <TierBenefitsModal
                     opened={benefitsModalOpened}
                     onClose={() => { setViewingBenefitsForTier(null); closeBenefitsModal(); }} // Limpiar estado al cerrar
                     tier={viewingBenefitsForTier} // Pasar el tier seleccionado
                 />
            )}
        </>
    );
};

export default TierManagementPage;

// End of File: frontend/src/pages/admin/tiers/TierManagementPage.tsx