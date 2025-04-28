// filename: frontend/src/pages/RegisterPage.tsx
// Version: 1.4.0 (Use axiosInstance for register API call)

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// CORRECCIÓN: Usar axiosInstance en lugar de axios base
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios'; // Importar AxiosError
import {
    Container, Paper, Title, Text, Stack, TextInput, PasswordInput,
    Button, Select, Anchor, Loader, Group
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

// Importar servicio y tipo para la lista de negocios
import { getPublicBusinessList, BusinessOption } from '../services/businessService';

// Enums
enum DocumentType { DNI = 'DNI', NIE = 'NIE', PASSPORT = 'PASSPORT', OTHER = 'OTHER' }
enum UserRole { BUSINESS_ADMIN = 'BUSINESS_ADMIN', CUSTOMER_FINAL = 'CUSTOMER_FINAL' }

// Interface
interface RegisterFormValues {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    documentType: DocumentType | null;
    documentId: string;
    businessId: string;
}

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const role: UserRole = UserRole.CUSTOMER_FINAL;
    const [isLoading, setIsLoading] = useState(false);
    const documentTypeOptions = Object.values(DocumentType).map(value => ({ value, label: value }));
    const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState<boolean>(true);
    const [errorBusinesses, setErrorBusinesses] = useState<string | null>(null);

    // useForm (sin cambios)
    const form = useForm<RegisterFormValues>({ /* ... (igual que antes) ... */
        initialValues: {
            email: '', password: '', confirmPassword: '', name: '', phone: '',
            documentType: null, documentId: '', businessId: '',
        },
        validate: {
            email: (value) => (!value ? 'El email es obligatorio.' : !/^\S+@\S+\.\S+$/.test(value) ? 'Formato de email inválido.' : null),
            password: (value) => (!value ? 'La contraseña es obligatoria.' : value.length < 6 ? 'La contraseña debe tener al menos 6 caracteres.' : null),
            confirmPassword: (value, values) => (!value ? 'Confirma la contraseña.' : value !== values.password ? 'Las contraseñas no coinciden.' : null),
            phone: (value) => (!value ? 'El teléfono es obligatorio.' : !/^\+\d{9,15}$/.test(value) ? 'Formato inválido (ej: +34666...).' : null),
            documentType: (value) => (value ? null : 'Selecciona un tipo de documento.'),
            documentId: (value, values) => {
                 if (!value) return 'El número de documento es obligatorio.';
                 if (values.documentType === DocumentType.DNI && !/^\d{8}[A-Z]$/i.test(value)) return 'Formato DNI inválido (8 números y 1 letra).';
                 if (values.documentType === DocumentType.NIE && !/^[XYZ]\d{7}[A-Z]$/i.test(value)) return 'Formato NIE inválido (letra, 7 números, letra).';
                 return null;
            },
            businessId: (value) => (value ? null : 'Debes seleccionar un negocio.'),
        },
     });

    // useEffect para cargar negocios (sin cambios)
    useEffect(() => {
        const fetchBusinesses = async () => {
            setLoadingBusinesses(true); setErrorBusinesses(null);
            try {
                const data = await getPublicBusinessList(); setBusinesses(data);
            } catch (err: any) {
                console.error("Error fetching businesses for dropdown:", err); setErrorBusinesses(err.message || "No se pudo cargar la lista de negocios.");
            } finally { setLoadingBusinesses(false); }
        };
        fetchBusinesses();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // handleSubmit MODIFICADO para usar axiosInstance
    const handleSubmit = async (values: RegisterFormValues) => {
        setIsLoading(true);
        const registrationData = {
            email: values.email.trim(), password: values.password, name: values.name.trim() || undefined,
            phone: values.phone.trim(), documentId: values.documentId.trim().toUpperCase(), documentType: values.documentType,
            businessId: values.businessId, role,
        };

        // CORRECCIÓN: Usamos la ruta relativa y axiosInstance
        const registerPath = '/auth/register'; // Ruta relativa a /api
        console.log(`Intentando registrar (con Select y axiosInstance) a: ${registerPath}`, registrationData);

        try {
            // CORRECCIÓN: Usamos axiosInstance.post
            const response = await axiosInstance.post(registerPath, registrationData);
            console.log('Registration successful:', response.data);
            notifications.show({
                title: '¡Registro Exitoso!', message: 'Tu cuenta ha sido creada. Serás redirigido a la página de inicio de sesión.',
                color: 'green', icon: <IconCheck size={18} />, autoClose: 4000,
            });
            setTimeout(() => { navigate('/login', { state: { registrationSuccess: true } }); }, 1500);
        } catch (err: unknown) { // Reusamos el manejo de errores mejorado
            console.error('Error during registration:', err);
             let message = 'Error desconocido durante el registro.';
             if (err instanceof AxiosError) {
                if (err.response) {
                    message = err.response.data?.message || `Error del servidor (${err.response.status})`;
                } else if (err.request) {
                    message = 'No se pudo conectar con el servidor.';
                } else {
                    message = 'Error al preparar la solicitud de registro.';
                }
            } else if (err instanceof Error) {
                message = err.message;
            }
            notifications.show({
                 title: 'Error de Registro', message: message, color: 'red', icon: <IconX size={18} />, autoClose: 6000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Mapeo de opciones (sin cambios)
    const businessSelectOptions = businesses.map(b => ({ value: b.id, label: b.name }));

    // JSX (sin cambios en la estructura)
    return (
        <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}> ¡Bienvenido a LoyalPyME! </Title>
             {/* ... (Text y Paper igual) ... */}
             <Text c="dimmed" size="sm" ta="center" mt={5}> ¿Ya tienes cuenta?{' '} <Anchor size="sm" component={Link} to="/login"> Inicia sesión </Anchor> </Text>
             <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                 <Title order={2} ta="center" mb="lg">Crea tu Cuenta de Cliente</Title>
                 <form onSubmit={form.onSubmit(handleSubmit)}>
                     <Stack>
                         {/* ... (Inputs de email a documentId igual) ... */}
                         <TextInput label="Email" placeholder="tu@email.com" required disabled={isLoading} {...form.getInputProps('email')} />
                         <PasswordInput label="Contraseña" placeholder="Tu contraseña" required disabled={isLoading} {...form.getInputProps('password')} />
                         <PasswordInput label="Confirmar Contraseña" placeholder="Repite tu contraseña" required disabled={isLoading} {...form.getInputProps('confirmPassword')} />
                         <TextInput label="Nombre (Opcional)" placeholder="Tu nombre" disabled={isLoading} {...form.getInputProps('name')} />
                         <TextInput label="Teléfono (formato internacional)" placeholder="+346..." required disabled={isLoading} {...form.getInputProps('phone')} />
                         <Select label="Tipo de Documento" placeholder="Selecciona uno" data={documentTypeOptions} required disabled={isLoading} clearable={false} {...form.getInputProps('documentType')} />
                         <TextInput label="Número de Documento" placeholder="DNI, NIE, Pasaporte..." required disabled={isLoading} {...form.getInputProps('documentId')} />

                         {/* Select para Negocio (igual que antes) */}
                         <Select
                            label="Negocio al que Unirse"
                            placeholder={loadingBusinesses ? "Cargando negocios..." : "Selecciona un negocio"}
                            data={businessSelectOptions}
                            required
                            disabled={isLoading || loadingBusinesses || businesses.length === 0}
                            searchable
                            nothingFoundMessage={errorBusinesses ? "Error al cargar" : "No hay negocios disponibles"}
                            clearable={false}
                            error={errorBusinesses}
                            {...form.getInputProps('businessId')}
                         />
                         {loadingBusinesses && <Group justify='center'><Loader size="xs" /></Group>}

                         <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg"> Registrarse </Button>
                     </Stack>
                 </form>
             </Paper>
        </Container>
    );
};

export default RegisterPage;

// End of File: frontend/src/pages/RegisterPage.tsx