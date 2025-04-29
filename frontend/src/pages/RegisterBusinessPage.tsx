// filename: frontend/src/pages/RegisterBusinessPage.tsx
// Version: 1.0.1 (Fix encoding, remove logs and meta-comments)

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import axios from 'axios'; // Usar axios base para ruta pública
import { notifications } from '@mantine/notifications';
import {
    Container, Paper, Title, Text, TextInput, PasswordInput, Button,
    LoadingOverlay, Alert, Stack, Anchor
} from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';

// Esquema de validación con Zod
const registerBusinessSchema = z.object({
    businessName: z.string().min(2, { message: 'El nombre del negocio debe tener al menos 2 caracteres' }),
    adminName: z.string().optional(), // Nombre del admin es opcional
    adminEmail: z.string().email({ message: 'Email inválido' }), // Corregido: inválido
    adminPassword: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }), // Corregido: contraseña
    confirmPassword: z.string().min(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres' }), // Corregido: confirmación, contraseña
}).refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // Mostrar error en el campo de confirmar contraseña // Corregido: contraseñas, contraseña
});

// Inferir el tipo del formulario
type RegisterBusinessFormValues = z.infer<typeof registerBusinessSchema>;

// URL del endpoint del backend (público)
// Usar variable de entorno si está definida, si no, el valor por defecto
const REGISTER_BUSINESS_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/register-business`;

function RegisterBusinessPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // Estado para errores de submit/API

    const form = useForm<RegisterBusinessFormValues>({
        initialValues: {
            businessName: '', adminName: '', adminEmail: '',
            adminPassword: '', confirmPassword: '',
        },
        validate: zodResolver(registerBusinessSchema),
    });

    const handleSubmit = async (values: RegisterBusinessFormValues) => {
        setLoading(true);
        setError(null);

        // No enviar confirmPassword al backend
        const { confirmPassword, ...dataToSend } = values;
        // Quitar adminName si está vacío
        if (!dataToSend.adminName?.trim()) {
            delete dataToSend.adminName;
        }

        try {
            // console.log('Sending registration data:', dataToSend); // Log eliminado
            // Llamada a la API pública con axios base
            const response = await axios.post(REGISTER_BUSINESS_URL, dataToSend);
            // console.log('Registration successful:', response.data); // Log eliminado

            // Guardar token y datos del usuario si el backend los devuelve
            if (response.data.token && response.data.user) {
                 localStorage.setItem('token', response.data.token);
                 localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            notifications.show({
                 title: '¡Registro Exitoso!', // Corregido: Éxito
                 message: `El negocio '${values.businessName}' y el administrador ${values.adminEmail} se han creado correctamente.`, // Corregido: correctamente
                 color: 'green',
                 icon: <IconCircleCheck />,
            });

            // Redirigir al dashboard de admin
            navigate('/admin/dashboard');

        } catch (err: unknown) {
            console.error("Registration error:", err); // Mantener error log
            let errorMsg = 'No se pudo completar el registro. Inténtalo de nuevo.'; // Corregido: Inténtalo
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                 errorMsg = err.response.data.message;
            } else if (err instanceof Error) {
                 errorMsg = err.message;
            }
            setError(errorMsg); // Guardar para mostrar en Alert
            notifications.show({
                 title: 'Error en el Registro', message: errorMsg, color: 'red',
                 icon: <IconAlertCircle />,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={460} my={40}>
            <Paper withBorder shadow="md" p={30} radius="md" mt="xl" style={{ position: 'relative' }}>
                <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
                <Title ta="center" order={2}>Registrar Nuevo Negocio</Title>
                <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
                    Crea la cuenta para tu negocio y el administrador principal.
                </Text>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <TextInput required label="Nombre del Negocio" placeholder="Mi Cafetería Estupenda" {...form.getInputProps('businessName')} />
                        <TextInput label="Tu Nombre (Admin)" placeholder="Juan Pérez" {...form.getInputProps('adminName')} />
                        <TextInput required label="Tu Email (Admin)" placeholder="juan.perez@micafeteria.com" {...form.getInputProps('adminEmail')} />
                        <PasswordInput required label="Contraseña (Admin)" placeholder="Tu contraseña" {...form.getInputProps('adminPassword')} />
                        <PasswordInput required label="Confirmar Contraseña" placeholder="Repite tu contraseña" {...form.getInputProps('confirmPassword')} />

                        {/* Mostrar error del submit si existe */}
                        {error && (
                            <Alert title="Error" color="red" icon={<IconAlertCircle size="1rem" />} mt="md">
                                {error}
                            </Alert>
                        )}

                        <Button type="submit" fullWidth mt="xl" disabled={loading}>
                            Registrar Negocio
                        </Button>
                    </Stack>
                </form>

                 <Text c="dimmed" size="sm" ta="center" mt="md">
                     ¿Ya tienes una cuenta?{' '}
                     <Anchor component={Link} to="/login" size="sm">
                         Iniciar sesión {/* Corregido: sesión */}
                     </Anchor>
                 </Text>
            </Paper>
        </Container>
    );
}

export default RegisterBusinessPage;

// End of File: frontend/src/pages/RegisterBusinessPage.tsx