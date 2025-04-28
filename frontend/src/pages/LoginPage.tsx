// filename: frontend/src/pages/LoginPage.tsx
// Version: 1.3.0 (Restore axiosInstance usage after backend routing fix)

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// CORRECCIÓN: Volvemos a usar axiosInstance
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios'; // Mantenemos AxiosError
import {
    TextInput, PasswordInput, Button, Paper, Title, Stack, Container,
    Alert, LoadingOverlay, Anchor, Group, Text
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

    // handleSubmit (Vuelve a usar axiosInstance y ruta relativa)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        // CORRECCIÓN: Usamos la ruta relativa que será prefijada por baseURL='/api' de axiosInstance
        const loginPath = '/auth/login';
        console.log(`>>> Attempting POST to: ${loginPath} via axiosInstance (proxy target: http://localhost:3000)`);

        try {
            // CORRECCIÓN: Usamos axiosInstance y la ruta relativa loginPath
            const response = await axiosInstance.post<{ user: UserResponse; token: string }>(
                loginPath,
                { email, password }
            );

            // Lógica de éxito (sin cambios)
            const { user, token } = response.data;
            if (user && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                if (user.role === 'BUSINESS_ADMIN') {
                    navigate('/admin/dashboard');
                } else if (user.role === 'CUSTOMER_FINAL') {
                    navigate('/customer/dashboard');
                } else {
                    setError('Rol de usuario desconocido recibido.');
                }
            } else {
                setError('Respuesta inesperada del servidor.');
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            if (err instanceof AxiosError) {
                if (err.response) {
                    if (err.response.status === 401) {
                        // Ahora este 401 SÍ debería significar credenciales inválidas reales
                        setError('Credenciales inválidas.');
                    } else {
                         setError(err.response.data?.message || `Error del servidor (${err.response.status})`);
                    }
                } else if (err.request) {
                    // Este error "No se pudo conectar..." ya no debería ocurrir si el proxy funciona
                    setError('No se pudo conectar con el servidor (Proxy?). Verifica que ambos servidores corren.');
                } else {
                    setError('Error al preparar la solicitud de inicio de sesión.');
                }
            } else {
                 setError('Ocurrió un error inesperado durante el inicio de sesión.');
            }
        } finally {
            setLoading(false);
        }
    };

    // JSX (sin cambios)
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
                            <Anchor component={Link} to="/forgot-password" c="dimmed" size="sm">
                                ¿Has olvidado tu contraseña?
                            </Anchor>
                            <Button type="submit" loading={loading} radius="lg"> Iniciar Sesión </Button>
                        </Group>
                    </Stack>
                </form>
                 <Text ta="center" mt="md">
                     ¿No tienes cuenta?{' '}
                     <Anchor component={Link} to="/register" size="sm">
                         Regístrate aquí
                     </Anchor>
                 </Text>
            </Paper>
        </Container>
    );
}
export default LoginPage;

// End of File: frontend/src/pages/LoginPage.tsx