// frontend/src/pages/LoginPage.tsx
// Version: 1.6.4 (Use imported UserRole enum and KDS Staff redirection)

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

// Importar UserData y el ENUM UserRole
import type { UserData } from '../types/customer'; 
import { UserRole } from '../types/customer'; // Importar el ENUM UserRole

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
            const response = await axiosInstance.post<{ user: UserData; token: string }>(
                loginPath, { email, password }
            );
            const { user, token } = response.data;

            if (user && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                if (user.role === UserRole.KITCHEN_STAFF || user.role === UserRole.BAR_STAFF) { 
                    console.log("[LoginPage] Redirecting KDS staff to /admin/kds");
                    navigate('/admin/kds', { replace: true });
                } else if (user.role === UserRole.BUSINESS_ADMIN) {
                    console.log("[LoginPage] Redirecting BUSINESS_ADMIN to /admin/dashboard");
                    navigate('/admin/dashboard', { replace: true });
                } else if (user.role === UserRole.CUSTOMER_FINAL) {
                    console.log("[LoginPage] Redirecting CUSTOMER_FINAL to /customer/dashboard");
                    navigate('/customer/dashboard', { replace: true });
                } else if (user.role === UserRole.SUPER_ADMIN) {
                    console.log("[LoginPage] Redirecting SUPER_ADMIN to /superadmin");
                    navigate('/superadmin', { replace: true });
                } else {
                    console.error("[LoginPage] Unknown user role after login:", user.role);
                    setError(t('loginPage.errorUnknown', { ns: 'translation' }));
                }
            } else {
                console.error("[LoginPage] Login response did not include user or token.");
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