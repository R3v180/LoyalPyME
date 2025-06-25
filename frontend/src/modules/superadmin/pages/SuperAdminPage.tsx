import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Container,
    Title,
    Table,
    Switch,
    ActionIcon,
    Tooltip,
    Loader,
    Alert,
    Group,
    Text,
    TextInput,
    Badge,
    Stack,
    SegmentedControl
} from '@mantine/core';
import {
    IconBuildingCommunity,
    IconLockOpen,
    IconLockOff,
    IconToolsKitchen2,
    IconHeartHandshake,
    IconAlertCircle,
    IconSearch,
    IconCash,
    IconSpy,
    IconCheck,
    IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import axiosInstance from '../../../shared/services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import SubscriptionManagementModal from '../components/SubscriptionManagementModal';

// --- CAMBIO: Importar el tipo desde el archivo central ---
import { SuperAdminBusiness } from '../../../shared/types/superadmin.types';

const SuperAdminPage: React.FC = () => {
    const { t } = useTranslation();
    const [businesses, setBusinesses] = useState<SuperAdminBusiness[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    const [subscriptionModalOpened, { open: openSubscriptionModal, close: closeSubscriptionModal }] = useDisclosure(false);
    const [selectedBusiness, setSelectedBusiness] = useState<SuperAdminBusiness | null>(null);
    
    const fetchBusinesses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<SuperAdminBusiness[]>('/superadmin/businesses');
            setBusinesses(response.data);
        } catch (err: any) {
            console.error("Error fetching businesses for superadmin:", err);
            const message = err.response?.data?.message || t('common.errorLoadingData');
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBusinesses();
    }, [fetchBusinesses]);
    
    const handleManageSubscription = (business: SuperAdminBusiness) => {
        // Al pasar el objeto al estado, nos aseguramos que el tipo coincide con lo que el modal espera.
        // La conversión de string a number se maneja dentro del modal.
        setSelectedBusiness(business);
        openSubscriptionModal();
    };

    const handleToggleBusinessStatus = async (businessId: string, currentIsActive: boolean) => {
        const newStatus = !currentIsActive;
        const statusText = newStatus ? t('common.active') : t('common.inactive');
        const businessName = businesses.find(b => b.id === businessId)?.name || t('superAdminPage.businessFallbackName');
        try {
            await axiosInstance.patch(`/superadmin/businesses/${businessId}/status`, { isActive: newStatus });
            notifications.show({ title: t('common.success'), message: t('superAdminPage.statusChangeSuccess', { businessName, status: statusText.toLowerCase() }), color: 'green', icon: <IconCheck />, });
            fetchBusinesses();
        } catch (err: any) {
            const message = err.response?.data?.message || t('superAdminPage.statusChangeError');
            notifications.show({ title: t('common.error'), message, color: 'red', icon: <IconX /> });
        }
    };

    const handleToggleModule = async (businessId: string, moduleKey: 'loyaltycore' | 'camarero', currentIsActive: boolean) => {
        const newStatus = !currentIsActive;
        const moduleName = moduleKey === 'loyaltycore' ? t('superAdminPage.moduleLoyaltyCore') : t('superAdminPage.moduleCamarero');
        const statusText = newStatus ? t('common.active') : t('common.inactive');
        const businessName = businesses.find(b => b.id === businessId)?.name || t('superAdminPage.businessFallbackName');
        try {
            await axiosInstance.patch(`/superadmin/businesses/${businessId}/module-${moduleKey}`, { isActive: newStatus });
            notifications.show({ title: t('common.success'), message: t('superAdminPage.moduleChangeSuccess', { moduleName, status: statusText.toLowerCase(), businessName }), color: 'green', icon: <IconCheck />, });
            fetchBusinesses();
        } catch (err: any) {
            const message = err.response?.data?.message || t('superAdminPage.moduleChangeError', { moduleName });
            notifications.show({ title: t('common.error'), message, color: 'red', icon: <IconX /> });
        }
    };

    const handleImpersonate = (business: SuperAdminBusiness) => {
        console.log("Iniciar suplantación para el admin de:", business.name);
        notifications.show({ title: t('common.upcomingFeatureTitle'), message: `Aquí se iniciaría la suplantación de identidad para el admin de ${business.name}.`, color: 'grape' });
    };
    
    const filteredBusinesses = useMemo(() => {
        return businesses
            .filter(business => 
                business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                business.slug.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter(business => {
                if (statusFilter === 'ALL') return true;
                return business.paymentStatus === statusFilter;
            });
    }, [businesses, searchTerm, statusFilter]);
    
    const rows = filteredBusinesses.map((business) => {
        const paymentStatusConfig = {
            PAID: { color: 'green', label: t('superAdminPage.statusPaid', 'Al día') },
            PENDING: { color: 'orange', label: t('superAdminPage.statusPending', 'Pendiente') },
            OVERDUE: { color: 'red', label: t('superAdminPage.statusOverdue', 'Atrasado') }
        };
        const statusInfo = paymentStatusConfig[business.paymentStatus];

        // Convertir el precio (que puede ser string) a número para formatearlo
        const priceAsNumber = business.monthlyPrice !== null ? Number(business.monthlyPrice) : null;

        return (
            <Table.Tr key={business.id}>
                <Table.Td>
                    <Text fw={500}>{business.name}</Text>
                    <Text size="xs" c="dimmed">{business.slug}</Text>
                </Table.Td>
                
                <Table.Td>
                    <Text ta="right">{`${priceAsNumber !== null ? priceAsNumber.toFixed(2) : 'N/A'} ${business.currency}`}</Text>
                </Table.Td>

                <Table.Td>
                    <Badge color={statusInfo.color} variant="light">{statusInfo.label}</Badge>
                    {business.pendingMonths > 0 && (
                        <Text size="xs" c="dimmed">{`${business.pendingMonths} mes(es) pendiente(s)`}</Text>
                    )}
                </Table.Td>

                <Table.Td>
                    <Switch
                        checked={business.isLoyaltyCoreActive}
                        onChange={() => handleToggleModule(business.id, 'loyaltycore', business.isLoyaltyCoreActive)}
                        thumbIcon={<IconHeartHandshake size={12} />}
                        color="teal"
                        aria-label={t('superAdminPage.moduleLoyaltyCoreTooltip')}
                    />
                </Table.Td>
                <Table.Td>
                    <Switch
                        checked={business.isCamareroActive}
                        onChange={() => handleToggleModule(business.id, 'camarero', business.isCamareroActive)}
                        thumbIcon={<IconToolsKitchen2 size={12} />}
                        color="indigo"
                        aria-label={t('superAdminPage.moduleCamareroTooltip')}
                    />
                </Table.Td>

                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('superAdminPage.manageSubscriptionTooltip', "Gestionar Suscripción y Pagos")}>
                            <ActionIcon variant="subtle" color="blue" onClick={() => handleManageSubscription(business)}>
                                <IconCash size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={business.isActive ? t('superAdminPage.tooltipDeactivateBusiness') : t('superAdminPage.tooltipActivateBusiness')}>
                            <ActionIcon variant="subtle" color={business.isActive ? 'red' : 'green'} onClick={() => handleToggleBusinessStatus(business.id, business.isActive)}>
                                {business.isActive ? <IconLockOff size={18} /> : <IconLockOpen size={18} />}
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('superAdminPage.impersonateTooltip', "Iniciar sesión como este administrador")}>
                             <ActionIcon variant="subtle" color="grape" onClick={() => handleImpersonate(business)}>
                                <IconSpy size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <>
            <Container size="xl" py="xl">
                <Stack gap="lg">
                    <Title order={2}>
                        <IconBuildingCommunity style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                        {t('superAdminPage.title')}
                    </Title>
                    
                    <Group justify="space-between">
                        <TextInput
                            placeholder={t('superAdminPage.searchPlaceholder')}
                            leftSection={<IconSearch size={16} />}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.currentTarget.value)}
                            style={{ flex: 1 }}
                        />
                        <SegmentedControl
                            value={statusFilter}
                            onChange={setStatusFilter}
                            data={[
                                { label: t('superAdminPage.filterAll', 'Todos'), value: 'ALL' },
                                { label: t('superAdminPage.statusPaid', 'Al día'), value: 'PAID' },
                                { label: t('superAdminPage.statusPending', 'Pendientes'), value: 'PENDING' },
                                { label: t('superAdminPage.statusOverdue', 'Atrasados'), value: 'OVERDUE' },
                            ]}
                        />
                    </Group>

                    {loading && <Group justify="center" mt="xl"><Loader /></Group>}
                    {error && !loading && <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                    
                    {!loading && !error && (
                        <Table.ScrollContainer minWidth={900}>
                            <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('superAdminPage.tableHeaderBusiness')}</Table.Th>
                                        <Table.Th ta="right">{t('superAdminPage.tableHeaderPrice', 'Precio/mes')}</Table.Th>
                                        <Table.Th>{t('superAdminPage.tableHeaderPaymentStatus', 'Estado de Pago')}</Table.Th>
                                        <Table.Th>{t('superAdminPage.tableHeaderLoyalty')}</Table.Th>
                                        <Table.Th>{t('superAdminPage.tableHeaderCamarero')}</Table.Th>
                                        <Table.Th ta="right">{t('common.actions', 'Acciones')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {rows.length > 0 ? rows : (
                                        <Table.Tr>
                                            <Table.Td colSpan={6} align="center">
                                                <Text c="dimmed">{searchTerm || statusFilter !== 'ALL' ? t('common.noResults') : t('superAdminPage.noBusinesses')}</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}
                </Stack>
            </Container>

            <SubscriptionManagementModal
                opened={subscriptionModalOpened}
                onClose={() => {
                    closeSubscriptionModal();
                    setSelectedBusiness(null);
                }}
                business={selectedBusiness}
                onSuccess={() => {
                    fetchBusinesses();
                    closeSubscriptionModal();
                    setSelectedBusiness(null);
                }}
            />
        </>
    );
};

export default SuperAdminPage;