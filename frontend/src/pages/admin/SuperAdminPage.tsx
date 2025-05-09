// frontend/src/pages/admin/SuperAdminPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mantine/core';
import {
    IconCheck,
    IconX,
    IconBuildingCommunity,
    IconLockOpen,
    IconLockOff,
    IconToolsKitchen2,
    IconHeartHandshake,
    IconAlertCircle,
    IconSearch
} from '@tabler/icons-react';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

interface SuperAdminBusiness {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    isLoyaltyCoreActive: boolean;
    isCamareroActive: boolean;
    createdAt: string;
}

const SuperAdminPage: React.FC = () => {
    const { t, i18n } = useTranslation(); // Añadimos i18n para formatear fecha si es necesario
    const [businesses, setBusinesses] = useState<SuperAdminBusiness[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
            notifications.show({
                title: t('common.error'),
                message,
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBusinesses();
    }, [fetchBusinesses]);

    const handleToggleBusinessStatus = async (businessId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const statusText = newStatus ? t('common.active') : t('common.inactive'); // Para el mensaje
        const businessName = businesses.find(b => b.id === businessId)?.name || t('superAdminPage.businessFallbackName');
        try {
            await axiosInstance.patch(`/superadmin/businesses/${businessId}/status`, { isActive: newStatus });
            notifications.show({
                title: t('common.success'),
                message: t('superAdminPage.statusChangeSuccess', { businessName, status: statusText.toLowerCase() }),
                color: 'green',
                icon: <IconCheck />,
            });
            fetchBusinesses();
        } catch (err: any) {
            const message = err.response?.data?.message || t('superAdminPage.statusChangeError');
            notifications.show({ title: t('common.error'), message, color: 'red', icon: <IconX /> });
        }
    };

    const handleToggleModule = async (
        businessId: string,
        module: 'loyaltycore' | 'camarero',
        currentStatus: boolean
    ) => {
        const newStatus = !currentStatus;
        const moduleName = module === 'loyaltycore' ? t('superAdminPage.moduleLoyaltyCore') : t('superAdminPage.moduleCamarero');
        const statusText = newStatus ? t('common.active') : t('common.inactive');
        const businessName = businesses.find(b => b.id === businessId)?.name || t('superAdminPage.businessFallbackName');

        try {
            await axiosInstance.patch(`/superadmin/businesses/${businessId}/module-${module}`, { isActive: newStatus });
            notifications.show({
                title: t('common.success'),
                message: t('superAdminPage.moduleChangeSuccess', { moduleName, status: statusText.toLowerCase(), businessName }),
                color: 'green',
                icon: <IconCheck />,
            });
            fetchBusinesses();
        } catch (err: any) {
            const message = err.response?.data?.message || t('superAdminPage.moduleChangeError', { moduleName });
            notifications.show({ title: t('common.error'), message, color: 'red', icon: <IconX /> });
        }
    };

    const filteredBusinesses = businesses.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const rows = filteredBusinesses.map((business) => (
        <Table.Tr key={business.id}>
            <Table.Td>
                <Text fw={500}>{business.name}</Text>
                <Text size="xs" c="dimmed">{business.slug}</Text>
            </Table.Td>
            <Table.Td>
                <Tooltip label={business.isActive ? t('superAdminPage.tooltipDeactivateBusiness') : t('superAdminPage.tooltipActivateBusiness')}>
                    <ActionIcon
                        variant="subtle"
                        color={business.isActive ? 'red' : 'green'}
                        onClick={() => handleToggleBusinessStatus(business.id, business.isActive)}
                    >
                        {business.isActive ? <IconLockOff size={18} /> : <IconLockOpen size={18} />}
                    </ActionIcon>
                </Tooltip>
                <Badge color={business.isActive ? 'green' : 'gray'} ml="xs">
                    {business.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Switch
                    checked={business.isLoyaltyCoreActive}
                    onChange={() => handleToggleModule(business.id, 'loyaltycore', business.isLoyaltyCoreActive)}
                    labelPosition="left"
                    label={<IconHeartHandshake size={18} title={t('superAdminPage.moduleLoyaltyCoreTooltip')} />}
                    color="teal"
                    aria-label={t('superAdminPage.moduleLoyaltyCoreTooltip')}
                />
            </Table.Td>
            <Table.Td>
                <Switch
                    checked={business.isCamareroActive}
                    onChange={() => handleToggleModule(business.id, 'camarero', business.isCamareroActive)}
                    labelPosition="left"
                    label={<IconToolsKitchen2 size={18} title={t('superAdminPage.moduleCamareroTooltip')} />}
                    color="indigo"
                    aria-label={t('superAdminPage.moduleCamareroTooltip')}
                />
            </Table.Td>
            <Table.Td>{new Date(business.createdAt).toLocaleDateString(i18n.language)}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Title order={2}>
                    <IconBuildingCommunity style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                    {t('superAdminPage.title')}
                </Title>
                
                <TextInput
                    placeholder={t('superAdminPage.searchPlaceholder')}
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    mb="md"
                />

                {loading && <Group justify="center" mt="xl"><Loader /></Group>}
                {error && !loading && <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                
                {!loading && !error && (
                    <Table.ScrollContainer minWidth={800}>
                        <Table striped highlightOnHover withTableBorder verticalSpacing="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t('superAdminPage.tableHeaderBusiness')}</Table.Th>
                                    <Table.Th>{t('superAdminPage.tableHeaderStatus')}</Table.Th>
                                    <Table.Th>
                                        <Group gap="xs" wrap="nowrap">
                                            <IconHeartHandshake size={18}/> {t('superAdminPage.tableHeaderLoyalty')}
                                        </Group>
                                    </Table.Th>
                                    <Table.Th>
                                        <Group gap="xs" wrap="nowrap">
                                            <IconToolsKitchen2 size={18}/> {t('superAdminPage.tableHeaderCamarero')}
                                        </Group>
                                    </Table.Th>
                                    <Table.Th>{t('superAdminPage.tableHeaderRegistered')}</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {rows.length > 0 ? rows : (
                                    <Table.Tr>
                                        <Table.Td colSpan={5} align="center">
                                            <Text c="dimmed">{searchTerm ? t('common.noResults') : t('superAdminPage.noBusinesses')}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                )}
            </Stack>
        </Container>
    );
};

export default SuperAdminPage;