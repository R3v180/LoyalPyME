// File: frontend/src/pages/ResetPasswordPage.tsx
// Version: 1.0.0 (Basic Reset Password Form and Logic)

import React, { useState, useEffect, FormEvent } from 'react';
// --- CAMBIO: Importar useParams para leer el token de la URL ---
import { useNavigate, useParams, Link } from 'react-router-dom';
// --- FIN CAMBIO ---
import axios from 'axios';
import {
    Container, Paper, Title, Text, Stack, PasswordInput, Button, Anchor
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    // --- CAMBIO: Obtener el token de los parámetros de la URL ---
    const { token } = useParams<{ token: string }>();
    // --- FIN CAMBIO ---

    // Estados
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const [error, setError] = useState<string | null>(null); // Usaremos notificaciones

    // --- NUEVO: Verificar si el token existe al cargar ---
    useEffect(() => {
        if (!token) {
            console.error('No reset token found in URL parameters.');
            notifications.show({
                title: 'Error',
                message: 'Falta el token de reseteo. Por favor, usa el enlace enviado a tu email.',
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: false, // Mantener visible
            });
            // Opcional: Redirigir a login o forgot-password
            // navigate('/login');
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); // Dependencia del token
    // --- FIN NUEVO ---


    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        //setError(null);

        // Validación de contraseñas
        if (!password || !confirmPassword) {
             notifications.show({ title: 'Campos Requeridos', message: 'Por favor, introduce y confirma la nueva contraseña.', color: 'orange', icon: <IconAlertCircle size={18}/> });
             return;
        }
        if (password !== confirmPassword) {
            notifications.show({ title: 'Error', message: 'Las contraseñas no coinciden.', color: 'orange', icon: <IconAlertCircle size={18}/> });
            return;
        }
        // Validación básica de longitud (coincide con el backend)
        if (password.length < 6) {
            notifications.show({ title: 'Contraseña Débil', message: 'La nueva contraseña debe tener al menos 6 caracteres.', color: 'orange', icon: <IconAlertCircle size={18}/> });
            return;
        }
        if (!token) { // Doble chequeo por si acaso
             notifications.show({ title: 'Error', message: 'Falta el token de reseteo.', color: 'red', icon: <IconX size={18} /> });
            return;
        }

        setIsLoading(true);

        try {
            console.log(`Attempting password reset with token starting: ${token.substring(0, 5)}...`);
            // Llamamos al endpoint del backend, pasando el token en la URL y la nueva password en el body
            await axios.post(`http://localhost:3000/auth/reset-password/${token}`, { password });

            console.log('Password reset successful');
            // Notificación de éxito
            notifications.show({
                title: '¡Contraseña Cambiada!',
                message: 'Tu contraseña ha sido restablecida con éxito. Serás redirigido a Inicio de Sesión.',
                color: 'green',
                icon: <IconCheck size={18} />,
                autoClose: 5000,
            });

            // Redirigir a login tras éxito
            setTimeout(() => {
                navigate('/login', { state: { passwordResetSuccess: true } });
            }, 2000); // Esperar 2s

        } catch (error: any) {
            console.error('Error resetting password:', error);
            const message = error.response?.data?.message || 'Error al restablecer la contraseña. El token podría ser inválido o haber expirado.';
             // Notificación de error
             notifications.show({
                title: 'Error al Restablecer',
                message: message,
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: 6000,
            });
            // setError(message); // Ya no usamos estado local

        } finally {
            setIsLoading(false);
        }
    };

    return (
         <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}>
                Establecer Nueva Contraseña
            </Title>
             <Text c="dimmed" size="sm" ta="center" mt={5}>
                Introduce tu nueva contraseña a continuación.
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                {/* Mostrar formulario solo si hay token */}
                {token ? (
                    <form onSubmit={handleSubmit}>
                        <Stack>
                            <PasswordInput
                                label="Nueva Contraseña"
                                placeholder="Introduce tu nueva contraseña"
                                value={password}
                                onChange={(event) => setPassword(event.currentTarget.value)}
                                required
                                disabled={isLoading}
                            />
                            <PasswordInput
                                label="Confirmar Nueva Contraseña"
                                placeholder="Repite la nueva contraseña"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                                required
                                disabled={isLoading}
                            />
                            <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg">
                                Guardar Nueva Contraseña
                            </Button>
                        </Stack>
                    </form>
                 ) : (
                    <Text color="red" ta="center">Token de reseteo inválido o no proporcionado en la URL.</Text>
                 )}
                 <Text ta="center" mt="md">
                    <Anchor component={Link} to="/login" size="sm">
                        Volver a Inicio de Sesión
                    </Anchor>
                </Text>
            </Paper>
        </Container>
    );
};

export default ResetPasswordPage;

// End of File: frontend/src/pages/ResetPasswordPage.tsx