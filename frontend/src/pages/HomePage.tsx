// frontend/src/pages/HomePage.tsx (CORREGIDO)
import React from 'react';
import { Container, Title, Text, Stack, Button, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBuildingStore, IconUserPlus } from '@tabler/icons-react';

const HomePage: React.FC = () => {
    // Ahora 't' se usa para traducir los textos
    const { t } = useTranslation();

    return (
        <Container size="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
            <Stack align="center" gap="xl">
                <img
                    src="/loyalpymelogo.jpg"
                    alt="LoyalPyME Logo"
                    style={{ height: '80px', width: 'auto' }}
                />
                <Title order={1} ta="center">
                    {/* Usando t() para el título */}
                    {t('homePage.welcomeTitle', 'Bienvenido a LoyalPyME')}
                </Title>
                <Text size="lg" c="dimmed" ta="center" maw={600}>
                    {/* Usando t() para la descripción */}
                    {t('homePage.description', 'La plataforma todo en uno para que las PYMES fidelicen a sus clientes y optimicen su servicio.')}
                </Text>

                <Group mt="xl" justify="center">
                    <Button
                        component={Link}
                        to="/register-business"
                        size="lg"
                        radius="xl"
                        leftSection={<IconBuildingStore size={20} />}
                    >
                        {/* Usando t() para el botón */}
                        {t('homePage.businessButton', 'Soy un Negocio')}
                    </Button>
                    <Button
                        component={Link}
                        to="/login"
                        size="lg"
                        radius="xl"
                        variant="outline"
                        leftSection={<IconUserPlus size={20} />}
                    >
                        {/* Usando t() para el botón */}
                        {t('homePage.customerButton', 'Soy un Cliente')}
                    </Button>
                </Group>
                
                <Text size="sm" c="dimmed" ta="center" mt="xl">
                    {/* Usando t() para el texto final */}
                    {t('homePage.infoTextPart1', 'Si eres un cliente y conoces el identificador del negocio, puedes acceder a su menú directamente desde la página de')}
                    <Text component={Link} to="/login" inherit>
                        {t('homePage.infoTextLink', ' inicio de sesión')}
                    </Text>.
                </Text>
            </Stack>
        </Container>
    );
};

export default HomePage;