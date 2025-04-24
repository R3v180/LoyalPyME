// filename: frontend/src/components/customer/RewardList.tsx
// Version: 1.0.0 (Component to display combined rewards/gifts list)

import React from 'react';
import {
    Title, Text, SimpleGrid, Card, Button, Skeleton, Alert, Group, Badge, ThemeIcon, Tooltip
} from '@mantine/core';
// Importar iconos necesarios
import { IconAlertCircle, IconGift, IconInfoCircle } from '@tabler/icons-react';

// --- Tipos necesarios (Idealmente vendrían de un archivo central) ---
// Interfaz para UserData (solo la parte necesaria aquí)
interface UserDataForRewards {
    points: number;
}
// Interfaz para las recompensas normales
interface Reward {
    id: string; name: string; description?: string | null; pointsCost: number;
}
// Interfaz para las recompensas regaladas (estructura simplificada que esperamos recibir combinada)
interface GrantedRewardInfo {
    grantedRewardId: string; // ID de la instancia GrantedReward
    assignedAt: string;
    assignedByString: string; // Nombre del negocio/admin que asignó
}
// Tipo Combinado que espera este componente como prop
type DisplayReward = (Reward & { isGift?: false } & Partial<GrantedRewardInfo>) |
                     (Reward & { isGift: true } & GrantedRewardInfo);
// --------------------------------------------------------------------

// Props que espera este componente
interface RewardListProps {
    loading: boolean; // Estado de carga combinado (rewards + granted)
    error: string | null; // Error general de carga
    displayRewards: DisplayReward[]; // La lista combinada y formateada
    userData: UserDataForRewards | null; // Datos del usuario (para puntos)
    redeemingRewardId: string | null; // Para mostrar loading en el botón correcto
    onRedeemReward: (rewardId: string) => void; // Handler para canjear recompensa normal
    onRedeemGrantedReward: (grantedRewardId: string, rewardName: string) => void; // Handler para canjear regalo
}

const RewardList: React.FC<RewardListProps> = ({
    loading,
    error,
    displayRewards,
    userData,
    redeemingRewardId,
    onRedeemReward,
    onRedeemGrantedReward
}) => {

    // Renderizado de la sección
    return (
        <>
            <Title order={4} mb="md">Recompensas y Regalos</Title>

            {loading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {[1, 2, 3].map((i) => <Skeleton key={`sk-${i}`} height={180} />)}
                </SimpleGrid>
            ) : error && displayRewards.length === 0 ? (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mt="lg"> No se pudieron cargar las recompensas o regalos. {error} </Alert>
            ) : displayRewards.length === 0 ? (
                 <Text c="dimmed" ta="center" mt="lg">No hay recompensas ni regalos disponibles en este momento.</Text>
            ) : (
                 <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                     {/* Iterar sobre la lista combinada displayRewards */}
                     {displayRewards.map((item) => (
                         <Card shadow="sm" padding="lg" radius="md" withBorder key={item.isGift ? `G-${item.grantedRewardId}` : `R-${item.id}`}>
                            {item.isGift ? (
                                // --- Renderizado para REGALO ---
                                <>
                                    <Group justify="space-between" mb="xs">
                                        <Title order={5}>{item.name}</Title>
                                        <ThemeIcon color="yellow" variant="light" radius="xl" size="lg">
                                             <IconGift stroke={1.5}/>
                                        </ThemeIcon>
                                    </Group>
                                    {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                     <Group gap="xs" mt="md" justify='space-between'>
                                          <Badge color="lime" variant='light' size="lg" radius="sm">Gratis</Badge>
                                          <Tooltip multiline w={200} withArrow position="top" label={`Regalado por ${item.assignedByString} el ${new Date(item.assignedAt).toLocaleDateString()}`}>
                                              <Group gap={4} style={{cursor: 'help'}}>
                                                  <IconInfoCircle size={16} stroke={1.5} style={{ display: 'block' }}/>
                                                  <Text size="xs" c="dimmed">Info</Text>
                                              </Group>
                                           </Tooltip>
                                     </Group>
                                     <Button
                                         variant="filled" color="yellow" fullWidth mt="md" radius="md"
                                         // Llama al handler específico con el ID del GrantedReward
                                         onClick={() => onRedeemGrantedReward(item.grantedRewardId, item.name)}
                                         // Compara con ID de instancia para loading/disabled
                                         disabled={redeemingRewardId === item.grantedRewardId || !!redeemingRewardId}
                                         loading={redeemingRewardId === item.grantedRewardId}
                                         leftSection={<IconGift size={16}/>}
                                     >
                                        Canjear Regalo
                                     </Button>
                                </>
                             ) : (
                                 // --- Renderizado para RECOMPENSA NORMAL ---
                                 <>
                                     <Title order={5}>{item.name}</Title>
                                     {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                     <Text fw={500} mt="md">{item.pointsCost} Puntos</Text>
                                     <Button
                                         variant="light" color="blue" fullWidth mt="md" radius="md"
                                         onClick={() => onRedeemReward(item.id)} // Handler original con ID de reward
                                         disabled={!userData || userData.points < item.pointsCost || redeemingRewardId === item.id || !!redeemingRewardId}
                                         loading={redeemingRewardId === item.id}
                                         leftSection={<IconGift size={16}/>}
                                     >
                                         {userData && userData.points >= item.pointsCost ? 'Canjear Recompensa' : 'Puntos insuficientes'}
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