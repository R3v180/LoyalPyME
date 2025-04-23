// filename: frontend/src/pages/RegisterBusinessPage.tsx
// --- INICIO DEL CÓDIGO COMPLETO ---
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import axios from 'axios'; // Usar axios base para ruta pública
import { notifications } from '@mantine/notifications';
import {
    Container,
    Paper,
    Title,
    Text,
    TextInput,
    PasswordInput,
    Button,
    LoadingOverlay,
    Alert,
    Stack,
    Anchor // Para el enlace a Login
} from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';

// Esquema de validación con Zod
const registerBusinessSchema = z.object({
    businessName: z.string().min(2, { message: 'El nombre del negocio debe tener al menos 2 caracteres' }),
    adminName: z.string().optional(), // Nombre del admin es opcional
    adminEmail: z.string().email({ message: 'Email inválido' }),
    adminPassword: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    confirmPassword: z.string().min(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres' }),
}).refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // Mostrar error en el campo de confirmar contraseña
});

// Inferir el tipo del formulario desde el esquema Zod
type RegisterBusinessFormValues = z.infer<typeof registerBusinessSchema>;

// URL del endpoint del backend (público)
const REGISTER_BUSINESS_URL = 'http://localhost:3000/auth/register-business'; // Asegúrate que el puerto es correcto

function RegisterBusinessPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<RegisterBusinessFormValues>({
        initialValues: {
            businessName: '',
            adminName: '',
            adminEmail: '',
            adminPassword: '',
            confirmPassword: '',
        },
        validate: zodResolver(registerBusinessSchema),
    });

    const handleSubmit = async (values: RegisterBusinessFormValues) => {
        setLoading(true);
        setError(null);

        // No necesitamos enviar confirmPassword al backend
        const { confirmPassword, ...dataToSend } = values;
        // Quitar adminName si está vacío
        if (!dataToSend.adminName?.trim()) {
            delete dataToSend.adminName;
        }


        try {
            console.log('Sending registration data:', dataToSend);
            const response = await axios.post(REGISTER_BUSINESS_URL, dataToSend);
            console.log('Registration successful:', response.data);

            // Guardar token y datos del usuario administrador (si el backend los devuelve)
            if (response.data.token && response.data.user) {
                 localStorage.setItem('token', response.data.token);
                 localStorage.setItem('user', JSON.stringify(response.data.user)); // Guardar datos del usuario admin
            }

            notifications.show({
                title: '¡Registro Exitoso!',
                message: `El negocio '${values.businessName}' y el administrador ${values.adminEmail} se han creado correctamente.`,
                color: 'green',
                icon: <IconCircleCheck />,
            });

            // Redirigir al dashboard de admin después del registro exitoso
            navigate('/admin/dashboard');

        } catch (err: unknown) {
            console.error("Registration error:", err);
             // Extraer mensaje de error específico del backend si es posible
             let errorMsg = 'No se pudo completar el registro. Inténtalo de nuevo.';
             if (axios.isAxiosError(err) && err.response?.data?.message) {
                 errorMsg = err.response.data.message;
             } else if (err instanceof Error) {
                 errorMsg = err.message;
             }
             setError(errorMsg);
             notifications.show({
                 title: 'Error en el Registro',
                 message: errorMsg,
                 color: 'red',
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
                        <TextInput
                            required
                            label="Nombre del Negocio"
                            placeholder="Mi Cafetería Estupenda"
                            {...form.getInputProps('businessName')}
                        />

                        <TextInput
                            label="Tu Nombre (Admin)"
                            placeholder="Juan Pérez"
                            {...form.getInputProps('adminName')}
                        />

                        <TextInput
                            required
                            label="Tu Email (Admin)"
                            placeholder="juan.perez@micafeteria.com"
                            {...form.getInputProps('adminEmail')}
                        />

                        <PasswordInput
                            required
                            label="Contraseña (Admin)"
                            placeholder="Tu contraseña"
                            {...form.getInputProps('adminPassword')}
                        />

                        <PasswordInput
                            required
                            label="Confirmar Contraseña"
                            placeholder="Repite tu contraseña"
                            {...form.getInputProps('confirmPassword')}
                        />

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
                         Iniciar sesión
                     </Anchor>
                 </Text>
            </Paper>
        </Container>
    );
}

export default RegisterBusinessPage;
// --- FIN DEL CÓDIGO COMPLETO ---