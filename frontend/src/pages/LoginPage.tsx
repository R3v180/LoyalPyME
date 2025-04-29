// filename: frontend/src/pages/LoginPage.tsx
// Version: 1.4.0 (Implement i18n using useTranslation)

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import {
    TextInput, PasswordInput, Button, Paper, Title, Stack, Container,
    Alert, LoadingOverlay, Anchor, Group, Text
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
// --- NUEVO: Importar hook de traducción ---
import { useTranslation } from 'react-i18next';
// --- FIN NUEVO ---

// Interfaz UserResponse (sin cambios)
interface UserResponse {
    id: string;
    email: string;
    name?: string | null;
    role: 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL';
    businessId: string;
    points?: number;
}

function LoginPage() {
    // --- NUEVO: Obtener función t del hook ---
    const { t } = useTranslation();
    // --- FIN NUEVO ---

    // Estados (sin cambios)
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // handleSubmit (sin cambios en la lógica, solo mensajes de error genéricos por ahora)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const loginPath = '/auth/login';
        try {
            const response = await axiosInstance.post<{ user: UserResponse; token: string }>(
                loginPath, { email, password }
            );
            const { user, token } = response.data;
            if (user && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                if (user.role === 'BUSINESS_ADMIN') { navigate('/admin/dashboard'); }
                else if (user.role === 'CUSTOMER_FINAL') { navigate('/customer/dashboard'); }
                else { setError(t('loginPage.errorUnknown')); } // Usar clave genérica
            } else { setError(t('loginPage.errorServer')); } // Usar clave genérica
        } catch (err: unknown) {
            console.error('Login error:', err);
            if (err instanceof AxiosError && err.response?.status === 401) {
                setError(t('loginPage.errorCredentials')); // Usar clave específica 401
            } else if (err instanceof AxiosError && err.response) {
                setError(err.response.data?.message || t('loginPage.errorServer')); // Usar msg de API o genérico
            } else if (err instanceof Error) {
                 setError(err.message); // Error genérico de JS
            } else {
                 setError(t('loginPage.errorUnknown')); // Error más genérico
            }
        } finally { setLoading(false); }
    };

    // --- JSX Modificado para usar t() ---
    return (
        <Container size="xs" p="md" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper shadow="md" p="xl" radius="lg" withBorder style={{ position: 'relative', width: '100%' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                {/* Usar t() para el título */}
                <Title order={2} ta="center" mb="xl">{t('loginPage.title')}</Title>
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                        {/* Usar t() para labels y placeholders */}
                        <TextInput
                            required
                            label={t('loginPage.emailLabel')}
                            placeholder={t('loginPage.emailPlaceholder')}
                            value={email}
                            onChange={(event) => setEmail(event.currentTarget.value)}
                            error={!!error} // Mantenemos el !!error para mostrar el campo en rojo
                            radius="lg"
                        />
                        <PasswordInput
                            required
                            label={t('loginPage.passwordLabel')}
                            placeholder={t('loginPage.passwordPlaceholder')}
                            value={password}
                            onChange={(event) => setPassword(event.currentTarget.value)}
                            error={!!error}
                            radius="lg"
                        />
                        {/* El Alert muestra el mensaje de error del estado (que ya usa t() o viene de API) */}
                        {error && (
                            <Alert icon={<IconAlertCircle size={16} />} title={t('common.error')} color="red" radius="lg" mt="md">
                                {error}
                            </Alert>
                        )}
                        <Group justify="space-between" mt="xl">
                            {/* Usar t() para texto del enlace */}
                            <Anchor component={Link} to="/forgot-password" c="dimmed" size="sm">
                                {t('loginPage.forgotPasswordLink')}
                            </Anchor>
                            {/* Usar t() para texto del botón */}
                            <Button type="submit" loading={loading} radius="lg">
                                {t('loginPage.loginButton')}
                            </Button>
                        </Group>
                    </Stack>
                </form>
                 {/* Usar t() para textos del pie */}
                <Text ta="center" mt="md">
                    {t('loginPage.subtitle')}{' '}
                    <Anchor component={Link} to="/register" size="sm">
                        {t('loginPage.registerLink')}
                    </Anchor>
                </Text>
            </Paper>
        </Container>
    );
    // --- Fin JSX Modificado ---
}
export default LoginPage;

// End of File: frontend/src/pages/LoginPage.tsx