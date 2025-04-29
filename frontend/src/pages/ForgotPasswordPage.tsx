// filename: frontend/src/pages/ForgotPasswordPage.tsx
// Version: 1.0.3 (Fix encoding, remove logs, comments, React import)

import { useState, FormEvent } from 'react'; // Quitamos React
import { Link } from 'react-router-dom';
import axios from 'axios'; // Usamos axios base para ruta pública
import {
    Container, Paper, Title, Text, Stack, TextInput, Button, Anchor
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';


const ForgotPasswordPage: React.FC = () => {
    // Estados
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    // handleSubmit
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setMessageSent(false); // Resetear por si reintenta
        if (!email) {
             notifications.show({ title: 'Campo Requerido', message: 'Por favor, introduce tu dirección de email.', color: 'orange', icon: <IconAlertCircle size={18}/> });
             setIsLoading(false);
             return;
        }
        try {
            // console.log('Requesting password reset for:', email); // Log eliminado
            // Usar URL completa porque es una llamada pública sin axiosInstance
            await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/forgot-password`, { email });
            // console.log('Forgot password request sent successfully (or email not found).'); // Log eliminado
             notifications.show({ title: 'Solicitud Enviada', message: 'Si existe una cuenta con ese email, recibirás (o verás en consola) un enlace para restablecer la contraseña.', color: 'green', icon: <IconCheck size={18} />, autoClose: 7000 }); // Corregido: contraseña
            setMessageSent(true); // Mostrar mensaje de éxito en UI
            setEmail(''); // Limpiar input
        } catch (error: any) {
            console.error('Error requesting password reset:', error); // Mantener log de error
             // Notificación genérica incluso en error por seguridad (no revelar si email existe)
             notifications.show({ title: 'Solicitud Procesada', message: 'Si existe una cuenta con ese email, recibirás (o verás en consola) un enlace para restablecer la contraseña.', color: 'blue', autoClose: 7000 }); // Corregido: contraseña
             setMessageSent(true); // Mostrar mensaje incluso si hubo error interno
        } finally {
            setIsLoading(false);
        }
    };

    // JSX
    return (
        <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}> Restablecer Contraseña </Title> {/* Corregido: Contraseña */}
             <Text c="dimmed" size="sm" ta="center" mt={5}> ¿Recuerdas tu contraseña?{' '} <Anchor component={Link} to="/login" size="sm"> Volver a Inicio de Sesión </Anchor> </Text> {/* Corregido: contraseña, Sesión */}
            <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <Text size="sm" ta="center"> Introduce tu dirección de email y te enviaremos (o mostraremos en la consola del backend) un enlace para restablecer tu contraseña. </Text> {/* Corregido: dirección, contraseña */}
                        <TextInput label="Email Registrado" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required type="email" disabled={isLoading || messageSent} />
                        {messageSent && ( <Text c="green" ta="center" size="sm" mt="md"> Petición enviada. Por favor, revisa tu email (o la consola del backend para pruebas) para encontrar el enlace de reseteo. El enlace expirará en 1 hora. </Text> )} {/* Corregido: Petición, expirará */}
                        <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg" disabled={messageSent}> Solicitar Reseteo </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default ForgotPasswordPage;

// End of File: frontend/src/pages/ForgotPasswordPage.tsx