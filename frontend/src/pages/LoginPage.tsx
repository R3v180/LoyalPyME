// filename: frontend/src/pages/LoginPage.tsx
// Version: 1.3.1 (Fix encoding, remove logs and comments)

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance'; // Usar instancia configurada
import { AxiosError } from 'axios';
import {
    TextInput, PasswordInput, Button, Paper, Title, Stack, Container,
    Alert, LoadingOverlay, Anchor, Group, Text
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

// Interfaz para la respuesta del usuario desde la API
interface UserResponse {
    id: string;
    email: string;
    name?: string | null;
    role: 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL'; // Usar tipos literales es más seguro
    businessId: string;
    points?: number; // Puede ser opcional para Admin
}

function LoginPage() {
    // Estados
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // Manejador del submit
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const loginPath = '/auth/login'; // Ruta relativa para usar con axiosInstance
        // console.log(`>>> Attempting POST to: ${loginPath}...`); // Log eliminado

        try {
            // Usamos axiosInstance que ya tiene baseURL y añade token (aunque aquí no haga falta token para login)
            const response = await axiosInstance.post<{ user: UserResponse; token: string }>(
                loginPath,
                { email, password }
            );

            const { user, token } = response.data;
            if (user && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user)); // Guardar usuario en localStorage
                // Redirigir según rol
                if (user.role === 'BUSINESS_ADMIN') {
                    navigate('/admin/dashboard');
                } else if (user.role === 'CUSTOMER_FINAL') {
                    navigate('/customer/dashboard');
                } else {
                    setError('Rol de usuario desconocido recibido.'); // Nunca debería pasar si el backend valida roles
                }
            } else {
                setError('Respuesta inesperada del servidor.');
            }
        } catch (err: unknown) {
            console.error('Login error:', err); // Mantener log de error
            if (err instanceof AxiosError) {
                if (err.response) {
                    // Error 401 debería ser credenciales inválidas
                    if (err.response.status === 401) {
                        setError('Credenciales inválidas.'); // Corregido: inválidas
                    } else {
                         // Otros errores del servidor
                        setError(err.response.data?.message || `Error del servidor (${err.response.status})`);
                    }
                } else if (err.request) {
                    // Error de conexión (proxy, backend caído...)
                    setError('No se pudo conectar con el servidor. Verifica que esté en marcha.');
                } else {
                    // Error al preparar la petición
                    setError('Error al preparar la solicitud de inicio de sesión.'); // Corregido: sesión
                }
            } else {
                 // Error inesperado no-axios
                 setError('Ocurrió un error inesperado durante el inicio de sesión.'); // Corregido: Ocurrió, sesión
            }
        } finally {
            setLoading(false);
        }
    };

    // JSX
    return (
        <Container size="xs" p="md" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper shadow="md" p="xl" radius="lg" withBorder style={{ position: 'relative', width: '100%' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Title order={2} ta="center" mb="xl"> Iniciar Sesión </Title> {/* Corregido: Sesión */}
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                        <TextInput required label="Email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} error={!!error} radius="lg" />
                        <PasswordInput required label="Contraseña" placeholder="Tu contraseña" value={password} onChange={(event) => setPassword(event.currentTarget.value)} error={!!error} radius="lg" /> {/* Corregido: Contraseña, contraseña */}
                        {error && ( <Alert icon={<IconAlertCircle size={16} />} title="Error de Autenticación" color="red" radius="lg" mt="md"> {error} </Alert> )}
                        <Group justify="space-between" mt="xl">
                            <Anchor component={Link} to="/forgot-password" c="dimmed" size="sm">
                                ¿Has olvidado tu contraseña? {/* Corregido: contraseña */}
                            </Anchor>
                            <Button type="submit" loading={loading} radius="lg"> Iniciar Sesión </Button> {/* Corregido: Sesión */}
                        </Group>
                    </Stack>
                </form>
                 <Text ta="center" mt="md">
                     ¿No tienes cuenta?{' '}
                     <Anchor component={Link} to="/register" size="sm">
                         Regístrate aquí {/* Corregido: Regístrate */}
                     </Anchor>
                 </Text>
            </Paper>
        </Container>
    );
}
export default LoginPage;

// End of File: frontend/src/pages/LoginPage.tsx