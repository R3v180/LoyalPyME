// filename: frontend/src/components/customer/RewardList.tsx
// Version: 1.0.0 (Initial extraction)

import React from 'react';
import {
    SimpleGrid, Card, Button, Skeleton, Alert, Group, Text, Badge, ThemeIcon, Tooltip, Title
} from '@mantine/core';
import { IconGift, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';

// Importamos el tipo DisplayReward (idealmente desde un archivo centralizado)
// TODO: Mover DisplayReward a src/types/rewards.ts o similar
import { DisplayReward } from '../../hooks/useCustomerRewardsData'; // Ajusta la ruta si es necesario

interface RewardListProps {
    rewards: DisplayReward[];
    userPoints: number | undefined; // Puntos del usuario para validar canje (puede ser undefined si userData es null)
    redeemingRewardId: string | null; // ID del reward/gift en proceso de canje
    loadingRewards: boolean; // Estado de carga de recompensas normales
    loadingGrantedRewards: boolean; // Estado de carga de regalos
    errorRewards: string | null; // Error al cargar recompensas/regalos
    onRedeemPoints: (rewardId: string) => void; // Callback para canjear por puntos
    onRedeemGift: (grantedRewardId: string, rewardName: string) => void; // Callback para canjear regalo
}

const RewardList: React.FC<RewardListProps> = ({
    rewards,
    userPoints,
    redeemingRewardId,
    loadingRewards,
    loadingGrantedRewards,
    errorRewards,
    onRedeemPoints,
    onRedeemGift
}) => {

    const isLoading = loadingRewards || loadingGrantedRewards;

    return (
        <>
            <Title order={4} mb="md">Recompensas y Regalos</Title>

            {isLoading ? (
                // Esqueleto mientras carga
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {[1, 2, 3].map((i) => <Skeleton key={`sk-${i}`} height={180} />)}
                </SimpleGrid>
            ) : errorRewards ? (
                // Mensaje de error si falló la carga
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Recompensas" color="red" mt="lg">
                    No se pudieron cargar las recompensas o regalos. {errorRewards}
                </Alert>
            ) : rewards.length === 0 ? (
                // Mensaje si no hay recompensas ni regalos
                <Text>No hay recompensas ni regalos disponibles en este momento.</Text>
            ) : (
                // Renderizar la lista
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {rewards.map((item) => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={item.isGift ? `G-${item.grantedRewardId}` : `R-${item.id}`}>
                            {item.isGift ? (
                                <>
                                    {/* Card para Regalo */}
                                    <Group justify="space-between" mb="xs">
                                        <Title order={5}>{item.name}</Title>
                                        <ThemeIcon color="yellow" variant="light" radius="xl" size="lg">
                                            <IconGift stroke={1.5} />
                                        </ThemeIcon>
                                    </Group>
                                    {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                    <Group gap="xs" mt="md" justify='space-between'>
                                        <Badge color="lime" variant='light' size="lg" radius="sm">Gratis</Badge>
                                        <Tooltip multiline w={200} withArrow position="top" label={`Regalado por ${item.assignedByString} el ${new Date(item.assignedAt).toLocaleDateString()}`}>
                                            <Group gap={4} style={{ cursor: 'help' }}>
                                                <IconInfoCircle size={16} stroke={1.5} style={{ display: 'block' }}/>
                                                <Text size="xs" c="dimmed">Info</Text>
                                            </Group>
                                        </Tooltip>
                                    </Group>
                                    <Button
                                        variant="filled" color="yellow" fullWidth mt="md" radius="md"
                                        // Llama al callback onRedeemGift
                                        onClick={() => onRedeemGift(item.grantedRewardId!, item.name)}
                                        // Estado de carga/deshabilitado
                                        disabled={redeemingRewardId === item.grantedRewardId || !!redeemingRewardId}
                                        loading={redeemingRewardId === item.grantedRewardId}
                                        leftSection={<IconGift size={16}/>}
                                    >
                                        Canjear Regalo
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Card para Recompensa Normal */}
                                    <Title order={5}>{item.name}</Title>
                                    {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                    <Text fw={500} mt="md">{item.pointsCost} Puntos</Text>
                                    <Button
                                        variant="light" color="blue" fullWidth mt="md" radius="md"
                                        // Llama al callback onRedeemPoints
                                        onClick={() => onRedeemPoints(item.id)}
                                        // Estado de carga/deshabilitado (verifica puntos del usuario)
                                        disabled={typeof userPoints === 'undefined' || userPoints < item.pointsCost || redeemingRewardId === item.id || !!redeemingRewardId}
                                        loading={redeemingRewardId === item.id}
                                        leftSection={<IconGift size={16}/>}
                                    >
                                        {/* Mensaje dinámico del botón */}
                                        {typeof userPoints !== 'undefined' && userPoints >= item.pointsCost ? 'Canjear Recompensa' : 'Puntos insuficientes'}
                                    </Button>
                                </>
                            )}
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </>
    );
};

export default RewardList;