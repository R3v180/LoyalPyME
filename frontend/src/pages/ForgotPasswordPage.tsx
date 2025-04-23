// File: frontend/src/pages/ForgotPasswordPage.tsx
// Version: 1.0.2 (Remove unused imports/enums: Select, DocumentType, UserRole)

import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
// --- CAMBIO: Quitar Select ---
import {
    Container, Paper, Title, Text, Stack, TextInput, Button, Anchor
    // Select // <-- Eliminado
} from '@mantine/core';
// --- FIN CAMBIO ---
import { notifications } from '@mantine/notifications';
// --- CAMBIO: Quitar IconAlertCircle si no se usa en validación ---
import { IconCheck, IconAlertCircle } from '@tabler/icons-react'; // Mantenemos IconAlertCircle por ahora para validación de campo vacío
// --- FIN CAMBIO ---


// --- CAMBIO: Eliminar Enums no usados ---
// enum DocumentType { DNI = 'DNI', NIE = 'NIE', PASSPORT = 'PASSPORT', OTHER = 'OTHER' }
// enum UserRole { BUSINESS_ADMIN = 'BUSINESS_ADMIN', CUSTOMER_FINAL = 'CUSTOMER_FINAL' }
// --- FIN CAMBIO ---


const ForgotPasswordPage: React.FC = () => {
    // Estados (sin cambios)
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    // handleSubmit (sin cambios funcionales)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setMessageSent(false);
        if (!email) {
             notifications.show({ title: 'Campo Requerido', message: 'Por favor, introduce tu dirección de email.', color: 'orange', icon: <IconAlertCircle size={18}/> }); // IconAlertCircle sí se usa aquí
             setIsLoading(false);
             return;
        }
        try {
            console.log('Requesting password reset for:', email);
            await axios.post('http://localhost:3000/auth/forgot-password', { email });
            console.log('Forgot password request sent successfully (or email not found).');
             notifications.show({ title: 'Solicitud Enviada', message: 'Si existe una cuenta con ese email, recibirás (o verás en consola) un enlace para restablecer la contraseña.', color: 'green', icon: <IconCheck size={18} />, autoClose: 7000 });
            setMessageSent(true);
            setEmail('');
        } catch (error: any) {
            console.error('Error requesting password reset:', error);
             notifications.show({ title: 'Solicitud Procesada', message: 'Si existe una cuenta con ese email, recibirás (o verás en consola) un enlace para restablecer la contraseña.', color: 'blue', autoClose: 7000 });
             setMessageSent(true);
        } finally {
            setIsLoading(false);
        }
    };

    // JSX (sin cambios)
    return (
        <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}> Restablecer Contraseña </Title>
             <Text c="dimmed" size="sm" ta="center" mt={5}> ¿Recuerdas tu contraseña?{' '} <Anchor component={Link} to="/login" size="sm"> Volver a Inicio de Sesión </Anchor> </Text>
            <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <Text size="sm" ta="center"> Introduce tu dirección de email y te enviaremos (o mostraremos en la consola del backend) un enlace para restablecer tu contraseña. </Text>
                        <TextInput label="Email Registrado" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required type="email" disabled={isLoading || messageSent} />
                        {messageSent && ( <Text c="green" ta="center" size="sm" mt="md"> Petición enviada. Por favor, revisa tu email (o la consola del backend para pruebas) para encontrar el enlace de reseteo. El enlace expirará en 1 hora. </Text> )}
                        <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg" disabled={messageSent}> Solicitar Reseteo </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default ForgotPasswordPage;

// End of File: frontend/src/pages/ForgotPasswordPage.tsx