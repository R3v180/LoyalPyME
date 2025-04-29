// filename: frontend/src/pages/RegisterBusinessPage.tsx
// Version: 1.1.0 (Implement i18n using useTranslation)

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import {
    Container, Paper, Title, Text, TextInput, PasswordInput, Button,
    LoadingOverlay, Alert, Stack, Anchor
} from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
// --- NUEVO: Importar useTranslation ---
import { useTranslation } from 'react-i18next';
// --- FIN NUEVO ---

// Esquema Zod (usando t() para mensajes, aunque requeriría pasar t al schema o usar llaves fijas)
// Por simplicidad ahora, dejamos los mensajes fijos en español aquí, pero idealmente se usarían claves
const registerBusinessSchema = z.object({
    businessName: z.string().min(2, { message: 'El nombre del negocio debe tener al menos 2 caracteres' }), // TODO: i18n key
    adminName: z.string().optional(),
    adminEmail: z.string().email({ message: 'Email inválido' }), // TODO: i18n key
    adminPassword: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }), // TODO: i18n key
    confirmPassword: z.string().min(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres' }), // TODO: i18n key
}).refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden", // TODO: i18n key
    path: ["confirmPassword"],
});

type RegisterBusinessFormValues = z.infer<typeof registerBusinessSchema>;
const REGISTER_BUSINESS_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/register-business`;

function RegisterBusinessPage() {
    // --- NUEVO: Hook useTranslation ---
    const { t } = useTranslation();
    // --- FIN NUEVO ---

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<RegisterBusinessFormValues>({
        initialValues: { businessName: '', adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '', },
        // TODO: Pasar la función t al resolver si queremos traducir errores de Zod dinámicamente
        validate: zodResolver(registerBusinessSchema),
    });

    const handleSubmit = async (values: RegisterBusinessFormValues) => {
        setLoading(true);
        setError(null);
        const { confirmPassword, ...dataToSend } = values;
        if (!dataToSend.adminName?.trim()) { delete dataToSend.adminName; }

        try {
            const response = await axios.post(REGISTER_BUSINESS_URL, dataToSend);
            if (response.data.token && response.data.user) {
                 localStorage.setItem('token', response.data.token);
                 localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            // --- CAMBIO: Usar t() en notificaciones ---
            notifications.show({
                 title: t('registerBusinessPage.successTitle'),
                 message: t('registerBusinessPage.successMessage', { businessName: values.businessName, adminEmail: values.adminEmail }), // Pasar variables
                 color: 'green',
                 icon: <IconCircleCheck />,
            });
             // --- FIN CAMBIO ---
            navigate('/admin/dashboard');
        } catch (err: unknown) {
            console.error("Registration error:", err);
            let errorMsg = t('registerBusinessPage.errorRegistration', 'No se pudo completar el registro. Inténtalo de nuevo.'); // Usar clave genérica
            if (axios.isAxiosError(err) && err.response?.data?.message) { errorMsg = err.response.data.message; }
            else if (err instanceof Error) { errorMsg = err.message; }
            setError(errorMsg);
             // --- CAMBIO: Usar t() en notificaciones ---
             notifications.show({
                 title: t('registerBusinessPage.errorTitle'), message: errorMsg, color: 'red',
                 icon: <IconAlertCircle />,
             });
              // --- FIN CAMBIO ---
        } finally {
            setLoading(false);
        }
    };

    // --- JSX MODIFICADO ---
    return (
        <Container size={460} my={40}>
            <Paper withBorder shadow="md" p={30} radius="md" mt="xl" style={{ position: 'relative' }}>
                <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
                {/* Títulos y textos traducidos */}
                <Title ta="center" order={2}>{t('registerBusinessPage.title')}</Title>
                <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
                    {t('registerBusinessPage.subtitle')}
                </Text>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        {/* Inputs con labels y placeholders traducidos */}
                        <TextInput
                            required
                            label={t('registerBusinessPage.businessNameLabel')}
                            placeholder={t('registerBusinessPage.businessNamePlaceholder')}
                            {...form.getInputProps('businessName')} />
                        <TextInput
                            label={t('registerBusinessPage.adminNameLabel')}
                            placeholder={t('registerBusinessPage.adminNamePlaceholder')}
                            {...form.getInputProps('adminName')} />
                        <TextInput
                            required
                            label={t('registerBusinessPage.adminEmailLabel')}
                            placeholder={t('registerBusinessPage.adminEmailPlaceholder')}
                            {...form.getInputProps('adminEmail')} />
                        <PasswordInput
                            required
                            label={t('registerBusinessPage.adminPasswordLabel')}
                            placeholder={t('registerBusinessPage.adminPasswordPlaceholder')}
                            {...form.getInputProps('adminPassword')} />
                        <PasswordInput
                            required
                            label={t('registerBusinessPage.confirmPasswordLabel')}
                            placeholder={t('registerBusinessPage.confirmPasswordPlaceholder')}
                            {...form.getInputProps('confirmPassword')} />

                        {/* Alert de error (sin cambios, usa estado 'error') */}
                        {error && (
                             <Alert title={t('common.error')} color="red" icon={<IconAlertCircle size="1rem" />} mt="md">
                                {error}
                            </Alert>
                         )}
                        {/* Botón traducido */}
                        <Button type="submit" fullWidth mt="xl" disabled={loading}>
                            {t('registerBusinessPage.registerButton')}
                        </Button>
                     </Stack>
                </form>

                 {/* Enlace traducido */}
                 <Text c="dimmed" size="sm" ta="center" mt="md">
                     {t('registerBusinessPage.loginLinkSubtitle')}{' '}
                     <Anchor component={Link} to="/login" size="sm">
                         {t('registerBusinessPage.loginLink')}
                     </Anchor>
                 </Text>
            </Paper>
        </Container>
    );
    // --- FIN JSX MODIFICADO ---
}

export default RegisterBusinessPage;

// End of File: frontend/src/pages/RegisterBusinessPage.tsx