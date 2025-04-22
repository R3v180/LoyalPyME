// File: frontend/src/pages/LoginPage.tsx
// Version: 1.1.5 (Fix Login API Endpoint URL)

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos axios base y nuestra instancia configurada
import axios from 'axios';
//import axiosInstance from '../services/axiosInstance'; // <-- Lo mantenemos por si se usa en otro lado
// Importaciones de Mantine y el icono
import {
    TextInput, PasswordInput, Button, Paper, Title, Stack, Container,
    Alert, LoadingOverlay, Anchor, Group,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

// Interfaz UserResponse (sin cambios)
interface UserResponse { id: string; email: string; name?: string | null; role: 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL'; businessId: string; points?: number; }


function LoginPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        // --- CORRECCIÓN: Usar axios base con URL completa para ruta pública /auth/login ---
        const loginUrl = 'http://localhost:3000/auth/login'; // Puerto 3000 correcto
        console.log('>>> Attempting POST to:', loginUrl); // Log actualizado
        // --- FIN CORRECCIÓN ---

        try {
            // --- CORRECCIÓN: Usar axios.post, no axiosInstance.post ---
            const response = await axios.post<{ user: UserResponse; token: string }>(
                loginUrl, // Usar la URL completa correcta
                { email, password }
            );
            // --- FIN CORRECCIÓN ---

            const { user, token } = response.data;

            if (user && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                if (user.role === 'BUSINESS_ADMIN') { navigate('/admin/dashboard'); }
                else if (user.role === 'CUSTOMER_FINAL') { navigate('/customer/dashboard'); }
                else { /* ... manejo rol desconocido ... */ }
            } else { setError('Respuesta inesperada del servidor.'); }

        } catch (err: any) {
            console.error('Login error:', err);
            if (err.response && err.response.data && err.response.data.message) { setError(err.response.data.message); }
            else if (err.request) { setError('No se pudo conectar con el servidor.'); }
            else { setError('Ocurrió un error durante el inicio de sesión.'); }
        } finally { setLoading(false); }
    };

    return (
        // JSX con Mantine (sin cambios funcionales)
        <Container size="xs" p="md" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper shadow="md" p="xl" radius="lg" withBorder style={{ position: 'relative', width: '100%' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Title order={2} ta="center" mb="xl"> Iniciar Sesión </Title>
                <form onSubmit={handleSubmit}>
                  <Stack gap="lg">
                    <TextInput required label="Email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} error={error && error.toLowerCase().includes('email') ? ' ' : undefined} radius="lg" />
                    <PasswordInput required label="Contraseña" placeholder="Tu contraseña" value={password} onChange={(event) => setPassword(event.currentTarget.value)} error={error && error.toLowerCase().includes('credential') ? ' ' : undefined} radius="lg" />
                    {error && ( <Alert icon={<IconAlertCircle size={16} />} title="Error de Autenticación" color="red" radius="lg" withCloseButton={false}> {error} </Alert> )}
                    <Group justify="space-between" mt="xl">
                      <Anchor component="button" type="button" c="dimmed" onClick={() => { /* No hace nada por ahora */ }} size="sm"> ¿Has olvidado tu contraseña? </Anchor>
                      <Button type="submit" loading={loading} radius="lg"> Iniciar Sesión </Button>
                    </Group>
                  </Stack>
                </form>
            </Paper>
        </Container>
    );
}
export default LoginPage;

// End of File: frontend/src/pages/LoginPage.tsx