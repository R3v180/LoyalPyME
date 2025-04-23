// File: frontend/src/pages/LoginPage.tsx
// Version: 1.1.6 (Add link to Register page)

import { useState, FormEvent } from 'react';
// --- CAMBIO: Importar Link ---
import { useNavigate, Link } from 'react-router-dom';
// --- FIN CAMBIO ---
import axios from 'axios';
import {
    TextInput, PasswordInput, Button, Paper, Title, Stack, Container,
    Alert, LoadingOverlay, Anchor, Group, Text // Añadir Text
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

// Interfaz UserResponse (sin cambios)
interface UserResponse { id: string; email: string; name?: string | null; role: 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL'; businessId: string; points?: number; }


function LoginPage() {
    // Estados y navigate (sin cambios)
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // handleSubmit (sin cambios)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const loginUrl = 'http://localhost:3000/auth/login';
        console.log('>>> Attempting POST to:', loginUrl);
        try {
            const response = await axios.post<{ user: UserResponse; token: string }>( loginUrl, { email, password } );
            const { user, token } = response.data;
            if (user && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                if (user.role === 'BUSINESS_ADMIN') { navigate('/admin/dashboard'); }
                else if (user.role === 'CUSTOMER_FINAL') { navigate('/customer/dashboard'); }
                else { setError('Rol de usuario desconocido recibido.'); } // Mejor manejo de rol
            } else { setError('Respuesta inesperada del servidor.'); }
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.response?.status === 401) { setError('Credenciales inválidas.'); } // Mensaje específico para 401
            else if (err.response?.data?.message) { setError(err.response.data.message); }
            else if (err.request) { setError('No se pudo conectar con el servidor.'); }
            else { setError('Ocurrió un error durante el inicio de sesión.'); }
        } finally { setLoading(false); }
    };

    // JSX
    return (
        <Container size="xs" p="md" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper shadow="md" p="xl" radius="lg" withBorder style={{ position: 'relative', width: '100%' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Title order={2} ta="center" mb="xl"> Iniciar Sesión </Title>
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                        <TextInput required label="Email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} error={!!error} radius="lg" />
                        <PasswordInput required label="Contraseña" placeholder="Tu contraseña" value={password} onChange={(event) => setPassword(event.currentTarget.value)} error={!!error} radius="lg" />
                        {error && ( <Alert icon={<IconAlertCircle size={16} />} title="Error de Autenticación" color="red" radius="lg" mt="md"> {error} </Alert> )}
                        <Group justify="space-between" mt="xl">
                            <Anchor component="button" type="button" c="dimmed" onClick={() => { /* TODO */ }} size="sm"> ¿Has olvidado tu contraseña? </Anchor>
                            <Button type="submit" loading={loading} radius="lg"> Iniciar Sesión </Button>
                        </Group>
                    </Stack>
                </form>

                {/* --- CAMBIO: Añadir enlace a Registro --- */}
                <Text ta="center" mt="md">
                    ¿No tienes cuenta?{' '}
                    <Anchor component={Link} to="/register" size="sm">
                        Regístrate aquí
                    </Anchor>
                </Text>
                {/* --- FIN CAMBIO --- */}

            </Paper>
        </Container>
    );
}
export default LoginPage;

// End of File: frontend/src/pages/LoginPage.tsx