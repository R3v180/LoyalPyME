// filename: frontend/src/pages/ResetPasswordPage.tsx
// Version: 1.1.0 (Implement i18n using useTranslation)

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Paper, Title, Text, Stack, PasswordInput, Button, Anchor
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
// --- NUEVO: Importar useTranslation ---
import { useTranslation } from 'react-i18next';
// --- FIN NUEVO ---


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const ResetPasswordPage: React.FC = () => {
    // --- NUEVO: Hook useTranslation ---
    const { t } = useTranslation();
    // --- FIN NUEVO ---

    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            console.error('No reset token found in URL parameters.');
            // --- CAMBIO: Usar t() en notificación ---
            notifications.show({
                title: t('resetPasswordPage.errorTitle'),
                message: t('resetPasswordPage.errorMissingToken'),
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: false,
            });
            // --- FIN CAMBIO ---
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); // t() no necesita ser dependencia aquí generalmente


    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
             // --- CAMBIO: Usar t() en notificación ---
             notifications.show({
                title: t('resetPasswordPage.errorTitle'),
                message: t('resetPasswordPage.errorMissingToken'),
                color: 'red',
                icon: <IconX size={18} />
            });
            // --- FIN CAMBIO ---
            return;
        }
        if (!password || !confirmPassword) {
             // --- CAMBIO: Usar t() en notificación ---
             notifications.show({
                title: t('common.error'), // Usar clave común
                message: t('resetPasswordPage.errorPasswordsRequired'),
                color: 'orange',
                icon: <IconAlertCircle size={18}/>
            });
             // --- FIN CAMBIO ---
            return;
        }
        if (password !== confirmPassword) {
             // --- CAMBIO: Usar t() en notificación ---
             notifications.show({
                title: t('common.error'),
                message: t('resetPasswordPage.errorPasswordsDontMatch'),
                color: 'orange',
                icon: <IconAlertCircle size={18}/>
            });
             // --- FIN CAMBIO ---
            return;
        }
        if (password.length < 6) {
             // --- CAMBIO: Usar t() en notificación ---
            notifications.show({
                title: t('resetPasswordPage.errorTitle'), // Título específico? O común?
                message: t('resetPasswordPage.errorPasswordLength'),
                color: 'orange',
                icon: <IconAlertCircle size={18}/>
            });
            // --- FIN CAMBIO ---
            return;
        }

        setIsLoading(true);

        try {
            const resetUrl = `${API_BASE_URL}/api/auth/reset-password/${token}`;
            await axios.post(resetUrl, { password });

            // --- CAMBIO: Usar t() en notificación ---
            notifications.show({
                title: t('resetPasswordPage.successTitle'),
                message: t('resetPasswordPage.successMessage'),
                color: 'green', icon: <IconCheck size={18} />, autoClose: 5000,
            });
            // --- FIN CAMBIO ---

            setTimeout(() => {
                navigate('/login', { state: { passwordResetSuccess: true } });
            }, 2000);
        } catch (error: any) {
            console.error('Error resetting password:', error);
            const message = error.response?.data?.message || t('resetPasswordPage.errorInvalidToken');
            // --- CAMBIO: Usar t() en notificación ---
            notifications.show({
                title: t('resetPasswordPage.errorTitle'),
                message: message,
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: 6000,
            });
            // --- FIN CAMBIO ---
        } finally {
            setIsLoading(false);
        }
    };

    // --- JSX MODIFICADO ---
    return (
         <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}>{t('resetPasswordPage.title')}</Title>
             <Text c="dimmed" size="sm" ta="center" mt={5}>{t('resetPasswordPage.subtitle')}</Text>

             <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                 {token ? (
                     <form onSubmit={handleSubmit}>
                         <Stack>
                             <PasswordInput
                                 label={t('resetPasswordPage.passwordLabel')}
                                 placeholder={t('resetPasswordPage.passwordPlaceholder')}
                                 value={password}
                                 onChange={(event) => setPassword(event.currentTarget.value)}
                                 required
                                 disabled={isLoading} />
                             <PasswordInput
                                 label={t('resetPasswordPage.confirmPasswordLabel')}
                                 placeholder={t('resetPasswordPage.confirmPasswordPlaceholder')}
                                 value={confirmPassword}
                                 onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                                 required
                                 disabled={isLoading} />
                             <Button
                                 type="submit"
                                 loading={isLoading}
                                 fullWidth
                                 mt="xl"
                                 radius="lg"
                             >
                                 {t('resetPasswordPage.buttonText')}
                             </Button>
                         </Stack>
                     </form>
                  ) : (
                      <Text color="red" ta="center">{t('resetPasswordPage.errorMissingToken')}</Text>
                  )}
                  <Text ta="center" mt="md">
                      <Anchor component={Link} to="/login" size="sm">{t('resetPasswordPage.loginLink')}</Anchor>
                  </Text>
            </Paper>
         </Container>
    );
    // --- FIN JSX MODIFICADO ---
};

export default ResetPasswordPage;

// End of File: frontend/src/pages/ResetPasswordPage.tsx