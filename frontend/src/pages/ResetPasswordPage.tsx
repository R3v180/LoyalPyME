// filename: frontend/src/pages/ResetPasswordPage.tsx
// Version: 1.0.1 (Fix encoding, URL, logs, comments, React import)

import { useState, useEffect, FormEvent } from 'react'; // Quitamos React
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios'; // Usar axios base para ruta pública
import {
    Container, Paper, Title, Text, Stack, PasswordInput, Button, Anchor
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

// Usar variable de entorno para la URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>(); // Obtener token de la URL

    // Estados
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Verificar si el token existe al cargar
    useEffect(() => {
        if (!token) {
            console.error('No reset token found in URL parameters.');
            notifications.show({
                title: 'Error',
                message: 'Falta el token de reseteo. Por favor, usa el enlace enviado a tu email.',
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: false,
            });
            // Podríamos redirigir, pero mostrar el error puede ser suficiente
            // navigate('/login');
        }
    }, [token]); // Dependencia del token

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Validación
        if (!token) { // Doble check por si acaso
            notifications.show({ title: 'Error', message: 'Falta el token de reseteo.', color: 'red', icon: <IconX size={18} /> });
            return;
        }
        if (!password || !confirmPassword) {
            notifications.show({ title: 'Campos Requeridos', message: 'Por favor, introduce y confirma la nueva contraseña.', color: 'orange', icon: <IconAlertCircle size={18}/> }); // Corregido: contraseña
            return;
        }
        if (password !== confirmPassword) {
            notifications.show({ title: 'Error', message: 'Las contraseñas no coinciden.', color: 'orange', icon: <IconAlertCircle size={18}/> });
            return;
        }
        if (password.length < 6) {
            notifications.show({ title: 'Contraseña Débil', message: 'La nueva contraseña debe tener al menos 6 caracteres.', color: 'orange', icon: <IconAlertCircle size={18}/> }); // Corregido: Contraseña, contraseña
            return;
        }

        setIsLoading(true);

        try {
            // console.log(`Attempting password reset with token starting: ${token.substring(0, 5)}...`); // Log eliminado
            // Construir URL completa para axios base
            const resetUrl = `${API_BASE_URL}/api/auth/reset-password/${token}`;
            await axios.post(resetUrl, { password });

            // console.log('Password reset successful'); // Log eliminado
            notifications.show({
                title: '¡Contraseña Cambiada!', // Corregido: Contraseña
                message: 'Tu contraseña ha sido restablecida con éxito. Serás redirigido a Inicio de Sesión.', // Corregido: contraseña, éxito, Sesión
                color: 'green', icon: <IconCheck size={18} />, autoClose: 5000,
            });

            // Redirigir a login tras éxito con un pequeño delay
            setTimeout(() => {
                navigate('/login', { state: { passwordResetSuccess: true } });
            }, 2000);

        } catch (error: any) {
            console.error('Error resetting password:', error); // Mantener log de error
            const message = error.response?.data?.message || 'Error al restablecer la contraseña. El token podría ser inválido o haber expirado.'; // Corregido: contraseña, inválido
            notifications.show({
                title: 'Error al Restablecer', message: message, color: 'red',
                icon: <IconX size={18} />, autoClose: 6000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}> Establecer Nueva Contraseña </Title> {/* Corregido: Contraseña */}
             <Text c="dimmed" size="sm" ta="center" mt={5}> Introduce tu nueva contraseña a continuación. </Text> {/* Corregido: contraseña */}

             <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                 {/* Mostrar formulario solo si hay token */}
                 {token ? (
                     <form onSubmit={handleSubmit}>
                         <Stack>
                             <PasswordInput label="Nueva Contraseña" placeholder="Introduce tu nueva contraseña" value={password} onChange={(event) => setPassword(event.currentTarget.value)} required disabled={isLoading} />
                             <PasswordInput label="Confirmar Nueva Contraseña" placeholder="Repite la nueva contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.currentTarget.value)} required disabled={isLoading} />
                             <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg"> Guardar Nueva Contraseña </Button>
                         </Stack>
                     </form>
                  ) : (
                      <Text color="red" ta="center">Token de reseteo inválido o no proporcionado en la URL.</Text> // Corregido: inválido
                  )}
                  <Text ta="center" mt="md">
                      <Anchor component={Link} to="/login" size="sm"> Volver a Inicio de Sesión </Anchor> {/* Corregido: Sesión */}
                  </Text>
             </Paper>
         </Container>
    );
};

export default ResetPasswordPage;

// End of File: frontend/src/pages/ResetPasswordPage.tsx