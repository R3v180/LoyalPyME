// frontend/src/pages/LoginPage.tsx
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import {
    TextInput, PasswordInput, Button, Paper, Title, Stack, Container,
    Alert, LoadingOverlay, Anchor, Group, Text
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface UserResponse {
    id: string;
    email: string;
    name?: string | null;
    role: 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL' | 'SUPER_ADMIN'; // Añadir SUPER_ADMIN al tipo
    businessId: string | null; // Puede ser null para SUPER_ADMIN
    points?: number;
}

function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

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
                localStorage.setItem('user', JSON.stringify(user)); // user ya incluye el rol del backend

                // --- MODIFICACIÓN AQUÍ ---
                if (user.role === 'BUSINESS_ADMIN') {
                    console.log("[LoginPage] Redirecting to /admin/dashboard");
                    navigate('/admin/dashboard');
                } else if (user.role === 'CUSTOMER_FINAL') {
                    console.log("[LoginPage] Redirecting to /customer/dashboard");
                    navigate('/customer/dashboard');
                } else if (user.role === 'SUPER_ADMIN') { // <-- AÑADIR ESTA CONDICIÓN
                    console.log("[LoginPage] Redirecting to /superadmin");
                    navigate('/superadmin');
                } else {
                    console.error("[LoginPage] Unknown user role:", user.role);
                    setError(t('loginPage.errorUnknown', { ns: 'translation' })); // Usar clave i18n correcta
                }
                // --- FIN MODIFICACIÓN ---

            } else {
                console.error("[LoginPage] No user or token in response.");
                setError(t('loginPage.errorServer', { ns: 'translation' }));
            }
        } catch (err: unknown) {
            console.error('Login error in LoginPage:', err);
            if (err instanceof AxiosError && err.response?.status === 401) {
                setError(t('loginPage.errorCredentials', { ns: 'translation' }));
            } else if (err instanceof AxiosError && err.response) {
                setError(err.response.data?.message || t('loginPage.errorServer', { ns: 'translation' }));
            } else if (err instanceof Error) {
                 setError(err.message);
            } else {
                 setError(t('loginPage.errorUnknown', { ns: 'translation' }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="xs" p="md" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper shadow="md" p="xl" radius="lg" withBorder style={{ position: 'relative', width: '100%' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Title order={2} ta="center" mb="xl">{t('loginPage.title')}</Title>
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                        <TextInput
                            required
                            label={t('loginPage.emailLabel')}
                            placeholder={t('loginPage.emailPlaceholder')}
                            value={email}
                            onChange={(event) => setEmail(event.currentTarget.value)}
                            error={!!error}
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
                        {error && (
                            <Alert icon={<IconAlertCircle size={16} />} title={t('common.error')} color="red" radius="lg" mt="md">
                                {error}
                            </Alert>
                        )}
                        <Group justify="space-between" mt="xl">
                            <Anchor component={Link} to="/forgot-password" c="dimmed" size="sm">
                                {t('loginPage.forgotPasswordLink')}
                            </Anchor>
                            <Button type="submit" loading={loading} radius="lg">
                                {t('loginPage.loginButton')}
                            </Button>
                        </Group>
                    </Stack>
                </form>
                <Text ta="center" mt="md">
                    {t('loginPage.subtitle')}{' '}
                    <Anchor component={Link} to="/register" size="sm">
                        {t('loginPage.registerLink')}
                    </Anchor>
                </Text>
            </Paper>
        </Container>
    );
}
export default LoginPage;