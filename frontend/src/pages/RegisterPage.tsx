// frontend/src/pages/RegisterPage.tsx (MODIFICADO)
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // <-- AÑADIDO useLocation
import axiosInstance from '../shared/services/axiosInstance';
import { getPublicBusinessList, BusinessOption } from '../shared/services/businessService';
import { AxiosError } from 'axios';
import {
    Container, Paper, Title, Text, Stack, TextInput, PasswordInput,
    Button, Select, Anchor, Loader, Group
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Los enums y la interfaz de formulario se quedan igual
enum DocumentType { DNI = 'DNI', NIE = 'NIE', PASSPORT = 'PASSPORT', OTHER = 'OTHER' }
enum UserRole { BUSINESS_ADMIN = 'BUSINESS_ADMIN', CUSTOMER_FINAL = 'CUSTOMER_FINAL' }

interface RegisterFormValues {
    email: string; password: string; confirmPassword: string; name: string; phone: string;
    documentType: DocumentType | null; documentId: string; businessId: string;
}

const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation(); // <-- Hook para obtener la ubicación actual
    const role: UserRole = UserRole.CUSTOMER_FINAL;
    const [isLoading, setIsLoading] = useState(false);
    const documentTypeOptions = Object.values(DocumentType).map(value => ({ value, label: value }));
    const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState<boolean>(true);
    const [errorBusinesses, setErrorBusinesses] = useState<string | null>(null);

    const form = useForm<RegisterFormValues>({
        initialValues: {
            email: '', password: '', confirmPassword: '', name: '', phone: '',
            documentType: null, documentId: '', businessId: '',
        },
        validate: {
            email: (value) => (!value ? t('common.requiredField') : !/^\S+@\S+\.\S+$/.test(value) ? t('registerPage.errorInvalidEmail') : null),
            password: (value) => (!value ? t('common.requiredField') : value.length < 6 ? t('registerPage.errorPasswordLength') : null),
            confirmPassword: (value, values) => (!value ? t('registerPage.errorConfirmPassword') : value !== values.password ? t('registerPage.errorPasswordsDontMatch') : null),
            phone: (value) => (!value ? t('common.requiredField') : !/^\+\d{9,15}$/.test(value) ? t('registerPage.errorPhoneFormat') : null),
            documentType: (value) => (value ? null : t('registerPage.errorDocType')),
            documentId: (value, values) => {
                 if (!value) return t('common.requiredField');
                 if (values.documentType === DocumentType.DNI && !/^\d{8}[A-Z]$/i.test(value)) return t('registerPage.errorDNIFormat');
                 if (values.documentType === DocumentType.NIE && !/^[XYZ]\d{7}[A-Z]$/i.test(value)) return t('registerPage.errorNIEFormat');
                 return null;
            },
            businessId: (value) => (value ? null : t('registerPage.errorBusinessRequired')),
        },
    });

    useEffect(() => {
        const fetchBusinesses = async () => {
            setLoadingBusinesses(true); setErrorBusinesses(null);
            try { const data = await getPublicBusinessList(); setBusinesses(data); }
            catch (err: any) { console.error("Error fetching businesses:", err); setErrorBusinesses(t('registerPage.errorLoadingBusinesses')); }
            finally { setLoadingBusinesses(false); }
        };
        fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (values: RegisterFormValues) => {
        setIsLoading(true);
        const registrationData = {
            email: values.email.trim(), password: values.password, name: values.name.trim() || undefined,
            phone: values.phone.trim(), documentId: values.documentId.trim().toUpperCase(), documentType: values.documentType,
            businessId: values.businessId, role,
         };
        const registerPath = '/auth/register';
        try {
            const response = await axiosInstance.post(registerPath, registrationData);
            console.log('Registration successful:', response.data);
            notifications.show({
                title: t('common.success'),
                message: t('registerPage.successMessage'),
                color: 'green', icon: <IconCheck size={18} />, autoClose: 4000,
            });
            
            // --- CAMBIO PRINCIPAL: LÓGICA DE REDIRECCIÓN ---
            // Después del registro exitoso, en lugar de ir siempre a login,
            // intentamos volver a la página anterior (la carta).
            // Si el registro fallara, no se llega a este punto.
            // Para una experiencia fluida, podríamos incluso auto-loguear al usuario
            // y luego redirigirlo, pero por ahora, lo enviamos a loguearse con la redirección correcta.
            setTimeout(() => {
                const fromPath = location.state?.from?.pathname;
                const fromSearch = location.state?.from?.search;
                const from = fromPath ? `${fromPath}${fromSearch || ''}` : null;
                
                // Le pasamos el 'from' a la página de login para que ella sepa a dónde volver.
                navigate('/login', { state: { registrationSuccess: true, from: from ? { pathname: from } : null } });
            }, 1500);
            // --- FIN DEL CAMBIO ---

        } catch (err: unknown) {
            console.error('Error during registration:', err);
             let message = t('registerPage.errorRegistration');
            if (err instanceof AxiosError && err.response?.data?.message) { message = err.response.data.message; }
            else if (err instanceof Error) { message = err.message; }
             notifications.show({
                  title: t('common.error'), message: message, color: 'red', icon: <IconX size={18} />, autoClose: 6000,
             });
        } finally { setIsLoading(false); }
    };

    const businessSelectOptions = businesses.map(b => ({ value: b.id, label: b.name }));

    return (
        <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}>{t('registerPage.welcomeTitle')}</Title>
             <Text c="dimmed" size="sm" ta="center" mt={5}>
                 {t('registerPage.subtitle')}{' '}
                 <Anchor size="sm" component={Link} to="/login">{t('registerPage.loginLink')}</Anchor>
             </Text>
             <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                 <Title order={2} ta="center" mb="lg">{t('registerPage.title')}</Title>
                 <form onSubmit={form.onSubmit(handleSubmit)}>
                     <Stack>
                         <TextInput
                             label={t('registerPage.emailLabel')}
                             placeholder={t('registerPage.emailPlaceholder')}
                             required disabled={isLoading} {...form.getInputProps('email')} />
                         <PasswordInput
                             label={t('registerPage.passwordLabel')}
                             placeholder={t('registerPage.passwordPlaceholder')}
                             required disabled={isLoading} {...form.getInputProps('password')} />
                         <PasswordInput
                             label={t('registerPage.confirmPasswordLabel')}
                             placeholder={t('registerPage.confirmPasswordPlaceholder')}
                             required disabled={isLoading} {...form.getInputProps('confirmPassword')} />
                         <TextInput
                             label={t('registerPage.nameLabel')}
                             placeholder={t('registerPage.namePlaceholder')}
                             disabled={isLoading} {...form.getInputProps('name')} />
                         <TextInput
                             label={t('registerPage.phoneLabel')}
                             placeholder={t('registerPage.phonePlaceholder')}
                             required disabled={isLoading} {...form.getInputProps('phone')} />
                         <Select
                             label={t('registerPage.docTypeLabel')}
                             placeholder={t('registerPage.docTypePlaceholder')}
                             data={documentTypeOptions} required disabled={isLoading} clearable={false} {...form.getInputProps('documentType')} />
                         <TextInput
                             label={t('registerPage.docIdLabel')}
                             placeholder={t('registerPage.docIdPlaceholder')}
                             required disabled={isLoading} {...form.getInputProps('documentId')} />
                         <Select
                             label={t('registerPage.businessLabel')}
                             placeholder={loadingBusinesses ? t('registerPage.businessSelectLoading') : t('registerPage.businessSelectPlaceholder')}
                             data={businessSelectOptions}
                             required
                             disabled={isLoading || loadingBusinesses || businesses.length === 0}
                             searchable
                             nothingFoundMessage={errorBusinesses ? t('registerPage.businessSelectError') : t('registerPage.businessSelectNotFound')}
                             clearable={false}
                             error={errorBusinesses}
                             {...form.getInputProps('businessId')}
                         />
                         {loadingBusinesses && <Group justify='center'><Loader size="xs" /></Group>}
                         <Button type="submit" loading={isLoading} fullWidth mt="xl" radius="lg">
                             {t('registerPage.registerButton')}
                         </Button>
                      </Stack>
                 </form>
             </Paper>
        </Container>
    );
};

export default RegisterPage;