// File: frontend/src/pages/RegisterPage.tsx
// Version: 1.1.0 (Implement API call and notifications)

import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// --- CAMBIO: Importar axios ---
import axios from 'axios';
// --- FIN CAMBIO ---
import {
    Container, Paper, Title, Text, Stack, TextInput, PasswordInput,
    Button, Select, Anchor
    // --- CAMBIO: Quitar Alert ---
    // Alert
    // --- FIN CAMBIO ---
} from '@mantine/core';
// --- CAMBIO: Importar notifications e iconos ---
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
// --- FIN CAMBIO ---


// Enums (sin cambios)
enum DocumentType { DNI = 'DNI', NIE = 'NIE', PASSPORT = 'PASSPORT', OTHER = 'OTHER' }
enum UserRole { BUSINESS_ADMIN = 'BUSINESS_ADMIN', CUSTOMER_FINAL = 'CUSTOMER_FINAL' }


const RegisterPage: React.FC = () => {
    const navigate = useNavigate();

    // Estados del formulario (sin cambios)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [documentId, setDocumentId] = useState('');
    const [documentType, setDocumentType] = useState<DocumentType | null>(null);
    const [businessId, setBusinessId] = useState('');
    const role: UserRole = UserRole.CUSTOMER_FINAL;
    const [isLoading, setIsLoading] = useState(false);
    // --- CAMBIO: Quitar estado de error local ---
    // const [error, setError] = useState<string | null>(null);
    // --- FIN CAMBIO ---

    // Opciones Select (sin cambios)
    const documentTypeOptions = Object.values(DocumentType).map(value => ({ value, label: value }));

    // handleSubmit (Implementar API call y notificaciones)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        //setError(null); // Ya no existe

        // Validación básica de contraseña
        if (password !== confirmPassword) {
            notifications.show({ title: 'Error', message: 'Las contraseñas no coinciden.', color: 'orange', icon: <IconAlertCircle size={18} /> });
            return;
        }
        // Validación básica de campos obligatorios
        if (!email || !password || !phone || !documentId || !documentType || !businessId) {
             notifications.show({ title: 'Campos Incompletos', message: 'Por favor, completa todos los campos obligatorios.', color: 'orange', icon: <IconAlertCircle size={18} /> });
             return;
        }

        setIsLoading(true);

        const registrationData = {
            email: email.trim(), // Limpiar espacios
            password, // Enviar contraseña plana, el backend la hashea
            name: name.trim() || undefined, // Enviar undefined si está vacío para que BD use NULL
            phone: phone.trim(),
            documentId: documentId.trim().toUpperCase(), // Guardar en mayúsculas por consistencia?
            documentType,
            businessId: businessId.trim(),
            role,
        };

        console.log('Intentando registrar:', registrationData);

        // --- CAMBIO: Implementar API Call con Axios y Notificaciones ---
        try {
            // Usamos axios base con la URL completa
            const response = await axios.post('http://localhost:3000/auth/register', registrationData);
            console.log('Registration successful:', response.data);

            // Notificación de éxito
            notifications.show({
                title: '¡Registro Exitoso!',
                message: 'Tu cuenta ha sido creada. Serás redirigido a la página de inicio de sesión.',
                color: 'green',
                icon: <IconCheck size={18} />,
                autoClose: 4000,
            });

            // Redirigir a login después de mostrar la notificación (con un pequeño delay opcional)
            setTimeout(() => {
                 navigate('/login', { state: { registrationSuccess: true } }); // Pasar estado opcional
            }, 1500); // Esperar 1.5s antes de redirigir


        } catch (err: any) {
            console.error('Error during registration:', err);
            const message = err.response?.data?.message || err.message || 'Error desconocido durante el registro.';

            // Notificación de error
             notifications.show({
                title: 'Error de Registro',
                message: message, // Mostramos el error específico de la API
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: 6000,
            });
            // setError(message); // Ya no se usa

        } finally {
            setIsLoading(false);
        }
        // --- FIN CAMBIO ---
    };

    // JSX
    return (
        <Container size={480} my={40}>
            <Title ta="center" style={{ fontWeight: 900 }}> ¡Bienvenido a LoyalPyME! </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}> ¿Ya tienes cuenta?{' '} <Anchor size="sm" component={Link} to="/login"> Inicia sesión </Anchor> </Text>
            <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                <Title order={2} ta="center" mb="lg">Crea tu Cuenta</Title>
                <form onSubmit={handleSubmit}>
                    <Stack>
                        {/* Campos del formulario (sin cambios estructurales) */}
                        <TextInput label="Email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required disabled={isLoading} />
                        <PasswordInput label="Contraseña" placeholder="Tu contraseña" value={password} onChange={(event) => setPassword(event.currentTarget.value)} required disabled={isLoading} />
                        <PasswordInput label="Confirmar Contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.currentTarget.value)} required disabled={isLoading} />
                        <TextInput label="Nombre (Opcional)" placeholder="Tu nombre" value={name} onChange={(event) => setName(event.currentTarget.value)} disabled={isLoading} />
                        <TextInput label="Teléfono (formato internacional)" placeholder="+346..." value={phone} onChange={(event) => setPhone(event.currentTarget.value)} required disabled={isLoading} />
                        <Select label="Tipo de Documento" placeholder="Selecciona uno" data={documentTypeOptions} value={documentType} onChange={(value) => setDocumentType(value as DocumentType | null)} required disabled={isLoading} clearable={false} />
                        <TextInput label="Número de Documento" placeholder="DNI, NIE, Pasaporte..." value={documentId} onChange={(event) => setDocumentId(event.currentTarget.value)} required disabled={isLoading} />
                        <TextInput label="ID del Negocio (Temporal)" placeholder="Pega el ID del negocio aquí" value={businessId} onChange={(event) => setBusinessId(event.currentTarget.value)} required disabled={isLoading} description="Necesario para asociar tu cuenta (ej: cafe-el-sol)" />

                        {/* --- CAMBIO: Eliminar Alert de error --- */}
                        {/* {error && ( <Alert ...>{error}</Alert> )} */}
                        {/* --- FIN CAMBIO --- */}

                        <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg"> Registrarse </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default RegisterPage;

// End of File: frontend/src/pages/RegisterPage.tsx