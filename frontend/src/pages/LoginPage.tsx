// frontend/src/pages/LoginPage.tsx (MODIFICADO)
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- useLocation ya no es necesario aquí
import axiosInstance from '../shared/services/axiosInstance';
import { UserRole } from '../shared/types/user.types';
import type { UserData } from '../shared/types/user.types';
import { AxiosError } from 'axios';
import {
    TextInput, PasswordInput, Button, Paper, Title, Stack, Container,
    Alert, LoadingOverlay, Anchor, Group, Text, Divider
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    const navigate = useNavigate();
    // const location = useLocation(); // <-- YA NO ES NECESARIO

    const [slugInput, setSlugInput] = useState('');

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

                // --- CAMBIO PRINCIPAL: LÓGICA DE REDIRECCIÓN SIMPLIFICADA ---
                // Se elimina la comprobación de 'location.state.from'.
                // Cada rol ahora tiene un destino fijo y único después del login.
                
                if (user.role === UserRole.CUSTOMER_FINAL) {
                    navigate('/customer/dashboard', { replace: true });
                } else if (user.role === UserRole.BUSINESS_ADMIN) {
                    navigate('/admin/dashboard', { replace: true });
                } else if (user.role === UserRole.SUPER_ADMIN) {
                    navigate('/superadmin', { replace: true });
                } else if (user.role === UserRole.WAITER) {
                    navigate('/admin/camarero/pickup', { replace: true });
                } else if (user.role === UserRole.KITCHEN_STAFF || user.role === UserRole.BAR_STAFF) {
                    navigate('/admin/kds', { replace: true });
                } else {
                    // Fallback de seguridad, debería redirigir a una página de inicio o de error.
                    navigate('/', { replace: true });
                }
                // --- FIN DEL CAMBIO ---

            } else {
                setError(t('loginPage.errorServer'));
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError && err.response?.status === 401) {
                setError(t('loginPage.errorCredentials'));
            } else if (err instanceof AxiosError && err.response) {
                setError(err.response.data?.message || t('loginPage.errorServer'));
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(t('loginPage.errorUnknown'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoToMenu = () => {
        if (slugInput.trim()) {
            navigate(`/m/${slugInput.trim()}`);
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

                <Divider label="O" labelPosition="center" my="lg" />
                <Stack>
                    <TextInput
                        label={t('loginPage.accessMenuDirectlyTitle')}
                        placeholder={t('loginPage.businessSlugPlaceholder')}
                        value={slugInput}
                        onChange={(event) => setSlugInput(event.currentTarget.value)}
                        radius="lg"
                    />
                    <Button
                        variant="light"
                        onClick={handleGoToMenu}
                        disabled={!slugInput.trim()}
                        radius="lg"
                    >
                        {t('loginPage.goToMenuButton')}
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}
export default LoginPage;