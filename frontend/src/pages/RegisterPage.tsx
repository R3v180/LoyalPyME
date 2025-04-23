// File: frontend/src/pages/RegisterPage.tsx
// Version: 1.2.1 (Remove unused imports)

// MODIFICADO: Quitado FormEvent de la importación
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Paper, Title, Text, Stack, TextInput, PasswordInput,
    Button, Select, Anchor
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
// MODIFICADO: Quitado IconAlertCircle de la importación
import { IconCheck, IconX } from '@tabler/icons-react';

// Enums (sin cambios)
enum DocumentType { DNI = 'DNI', NIE = 'NIE', PASSPORT = 'PASSPORT', OTHER = 'OTHER' }
enum UserRole { BUSINESS_ADMIN = 'BUSINESS_ADMIN', CUSTOMER_FINAL = 'CUSTOMER_FINAL' }

// Interface (sin cambios)
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

    // useForm (sin cambios)
    const form = useForm<RegisterFormValues>({
        initialValues: {
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            phone: '',
            documentType: null,
            documentId: '',
            businessId: '',
        },
        validate: {
            email: (value) => {
                if (!value) return 'El email es obligatorio.';
                if (!/^\S+@\S+\.\S+$/.test(value)) return 'Formato de email inválido.';
                return null;
            },
            password: (value) => {
                if (!value) return 'La contraseña es obligatoria.';
                if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
                return null;
            },
            confirmPassword: (value, values) => {
                if (!value) return 'Confirma la contraseña.';
                if (value !== values.password) return 'Las contraseñas no coinciden.';
                return null;
            },
            phone: (value) => {
                if (!value) return 'El teléfono es obligatorio.';
                if (!/^\+\d{9,15}$/.test(value)) return 'Formato inválido (ej: +34666...).';
                return null;
            },
            documentType: (value) => (value ? null : 'Selecciona un tipo de documento.'),
            documentId: (value, values) => {
                 if (!value) return 'El número de documento es obligatorio.';
                 if (values.documentType === DocumentType.DNI && !/^\d{8}[A-Z]$/i.test(value)) return 'Formato DNI inválido (8 números y 1 letra).';
                 if (values.documentType === DocumentType.NIE && !/^[XYZ]\d{7}[A-Z]$/i.test(value)) return 'Formato NIE inválido (letra, 7 números, letra).';
                 return null;
            },
            businessId: (value) => (value ? null : 'El ID del negocio es obligatorio.'),
        },
    });

    // handleSubmit (sin cambios)
    const handleSubmit = async (values: RegisterFormValues) => {
        setIsLoading(true);
        const registrationData = {
            email: values.email.trim(),
            password: values.password,
            name: values.name.trim() || undefined,
            phone: values.phone.trim(),
            documentId: values.documentId.trim().toUpperCase(),
            documentType: values.documentType,
            businessId: values.businessId.trim(),
            role,
        };
        console.log('Intentando registrar (con useForm):', registrationData);
        try {
            const response = await axios.post('http://localhost:3000/auth/register', registrationData);
            console.log('Registration successful:', response.data);
            notifications.show({
                title: '¡Registro Exitoso!',
                message: 'Tu cuenta ha sido creada. Serás redirigido a la página de inicio de sesión.',
                color: 'green',
                icon: <IconCheck size={18} />,
                autoClose: 4000,
            });
            setTimeout(() => {
                navigate('/login', { state: { registrationSuccess: true } });
            }, 1500);
        } catch (err: any) {
            console.error('Error during registration:', err);
            const message = err.response?.data?.message || err.message || 'Error desconocido durante el registro.';
            notifications.show({
                title: 'Error de Registro',
                message: message,
                color: 'red',
                icon: <IconX size={18} />,
                autoClose: 6000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // JSX (sin cambios)
    return (
        <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}> ¡Bienvenido a LoyalPyME! </Title>
             <Text c="dimmed" size="sm" ta="center" mt={5}> ¿Ya tienes cuenta?{' '} <Anchor size="sm" component={Link} to="/login"> Inicia sesión </Anchor> </Text>
             <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                 <Title order={2} ta="center" mb="lg">Crea tu Cuenta</Title>
                 <form onSubmit={form.onSubmit(handleSubmit)}>
                     <Stack>
                         <TextInput label="Email" placeholder="tu@email.com" required disabled={isLoading} {...form.getInputProps('email')} />
                         <PasswordInput label="Contraseña" placeholder="Tu contraseña" required disabled={isLoading} {...form.getInputProps('password')} />
                         <PasswordInput label="Confirmar Contraseña" placeholder="Repite tu contraseña" required disabled={isLoading} {...form.getInputProps('confirmPassword')} />
                         <TextInput label="Nombre (Opcional)" placeholder="Tu nombre" disabled={isLoading} {...form.getInputProps('name')} />
                         <TextInput label="Teléfono (formato internacional)" placeholder="+346..." required disabled={isLoading} {...form.getInputProps('phone')} />
                         <Select label="Tipo de Documento" placeholder="Selecciona uno" data={documentTypeOptions} required disabled={isLoading} clearable={false} {...form.getInputProps('documentType')} />
                         <TextInput label="Número de Documento" placeholder="DNI, NIE, Pasaporte..." required disabled={isLoading} {...form.getInputProps('documentId')} />
                         <TextInput label="ID del Negocio (Temporal)" placeholder="Pega el ID del negocio aquí" required disabled={isLoading} description="Necesario para asociar tu cuenta (ej: cafe-el-sol)" {...form.getInputProps('businessId')} />
                         <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg"> Registrarse </Button>
                     </Stack>
                 </form>
             </Paper>
         </Container>
    );
};

export default RegisterPage;

// End of File: frontend/src/pages/RegisterPage.tsx