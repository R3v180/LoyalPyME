// frontend/src/pages/HomePage.tsx (CORREGIDO)
import React from 'react';
import { Container, Title, Text, Stack, Button, Group, Paper, ThemeIcon, SimpleGrid, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// --- CAMBIO 1: Corregir importación de iconos ---
import { IconBuildingStore, IconUserPlus, IconHeartHandshake, IconToolsKitchen2, IconChartArrowsVertical, IconArrowRight } from '@tabler/icons-react';
// --- FIN CAMBIO 1 ---

// Un pequeño componente para las tarjetas de características
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => {
    const theme = useMantineTheme();
    return (
        <Paper withBorder radius="md" p="lg">
            <Stack align="center" ta="center">
                <ThemeIcon size={48} radius="xl" variant="light" color={theme.primaryColor}>
                    {icon}
                </ThemeIcon>
                <Title order={4} mt="sm">{title}</Title>
                <Text size="sm" c="dimmed">{description}</Text>
            </Stack>
        </Paper>
    );
};

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const theme = useMantineTheme();
    // --- CAMBIO 2: Usar el hook useMantineColorScheme ---
    const { colorScheme } = useMantineColorScheme();
    // --- FIN CAMBIO 2 ---

    return (
        <Container fluid p={0} style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] }}>
            {/* --- SECCIÓN HERO (PRINCIPAL) --- */}
            <Container size="lg" py={{ base: 'xl', md: '5rem' }}>
                <Stack align="center" gap="xl">
                    <img
                        src="/loyalpymelogo.jpg"
                        alt="LoyalPyME Logo"
                        style={{ height: '90px', width: 'auto' }}
                    />
                    <Title order={1} ta="center" maw={700}>
                        {t('homePage.heroTitle', 'Fideliza Clientes y Digitaliza tu Servicio. Todo en un Mismo Lugar.')}
                    </Title>
                    <Text size="xl" c="dimmed" ta="center" maw={600}>
                        {t('homePage.heroSubtitle', 'LoyalPyME es la plataforma definitiva para que restaurantes, cafeterías y PYMES creen programas de lealtad y optimicen su operativa con una carta digital inteligente.')}
                    </Text>

                    <Group mt="xl" justify="center">
                        <Button
                            component={Link}
                            to="/register-business"
                            size="lg"
                            radius="xl"
                            leftSection={<IconBuildingStore size={20} />}
                        >
                            {t('homePage.ctaBusiness', 'Crear Cuenta de Negocio')}
                        </Button>
                        <Button
                            component={Link}
                            to="/login"
                            size="lg"
                            radius="xl"
                            variant="default"
                            // --- CAMBIO 1 (Continuación): Usar el nombre correcto del icono ---
                            leftSection={<IconUserPlus size={20} />}
                            // --- FIN CAMBIO 1 ---
                        >
                            {t('homePage.ctaLogin', 'Ya tengo una cuenta')}
                        </Button>
                    </Group>
                </Stack>
            </Container>

            {/* --- SECCIÓN DE CARACTERÍSTICAS --- */}
            <Container size="lg" py={{ base: 'xl', md: '5rem' }}>
                <Stack align="center" gap="xs">
                    <Text c={theme.primaryColor} fw={700} tt="uppercase">
                        {t('homePage.featuresSection.superTitle', 'Potencia Tu Negocio')}
                    </Text>
                    <Title order={2} ta="center">
                        {t('homePage.featuresSection.title', 'Una Solución, Múltiples Beneficios')}
                    </Title>
                </Stack>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="xl">
                    <FeatureCard
                        icon={<IconHeartHandshake size={24} />}
                        title={t('homePage.features.loyalty.title', 'Programas de Lealtad')}
                        description={t('homePage.features.loyalty.desc', 'Crea un sistema de puntos y niveles para que tus clientes vuelvan una y otra vez. Recompensa su fidelidad con productos y beneficios exclusivos.')}
                    />
                    <FeatureCard
                        icon={<IconToolsKitchen2 size={24} />}
                        title={t('homePage.features.waiter.title', 'Módulo Camarero Digital')}
                        description={t('homePage.features.waiter.desc', 'Digitaliza tu carta, permite que los clientes pidan desde su móvil y optimiza la comunicación con cocina a través de nuestro sistema KDS.')}
                    />
                    <FeatureCard
                        icon={<IconChartArrowsVertical size={24} />}
                        title={t('homePage.features.synergy.title', 'Sinergia Total')}
                        description={t('homePage.features.synergy.desc', 'Cuando un cliente pide desde la carta, ¡automáticamente gana puntos! Los dos módulos trabajan juntos para maximizar el engagement y las ventas.')}
                    />
                </SimpleGrid>
            </Container>

             {/* --- SECCIÓN FINAL DE LLAMADA A LA ACCIÓN --- */}
            <Container size="lg" py={{ base: 'xl', md: '5rem' }}>
                 <Paper withBorder p="xl" radius="lg" shadow="md" style={{
                     // --- CAMBIO 2 (Continuación): Usar la variable del hook ---
                     backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.primaryColor,
                     // --- FIN CAMBIO 2 ---
                     color: theme.white,
                 }}>
                     <Group justify="space-between" align="center">
                         <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                             <Title order={3}>
                                 {t('homePage.finalCta.title', '¿Listo para empezar?')}
                             </Title>
                             <Text maw={500}>
                                 {t('homePage.finalCta.desc', 'Crea tu cuenta hoy mismo y descubre cómo LoyalPyME puede transformar tu negocio.')}
                             </Text>
                         </Stack>
                         <Button
                            component={Link}
                            to="/register-business"
                            size="lg"
                            variant="white"
                            color="dark"
                            radius="xl"
                            rightSection={<IconArrowRight size={18} />}
                         >
                            {t('homePage.ctaBusiness', 'Crear Cuenta de Negocio')}
                         </Button>
                     </Group>
                 </Paper>
            </Container>
        </Container>
    );
};

export default HomePage;