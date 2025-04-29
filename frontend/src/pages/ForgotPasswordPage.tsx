// filename: frontend/src/pages/ForgotPasswordPage.tsx
// Version: 1.5.1 (Remove unused imports)

import { useState, FormEvent } from 'react';
// import { useNavigate, Link } from 'react-router-dom'; // Quitamos useNavigate
import { Link } from 'react-router-dom'; // Mantenemos Link
import axios from 'axios';
import {
    Container, Paper, Title, Text, Stack, TextInput, Button, Anchor
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
// import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react'; // Quitamos IconX
import { IconCheck, IconAlertCircle } from '@tabler/icons-react'; // Mantenemos los otros
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const ForgotPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    // const navigate = useNavigate(); // Eliminado
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setMessageSent(false);
        if (!email) {
             notifications.show({
                title: t('forgotPasswordPage.errorTitle'),
                message: t('forgotPasswordPage.errorMissingEmail'),
                color: 'orange',
                icon: <IconAlertCircle size={18}/>
            });
             setIsLoading(false);
             return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
             notifications.show({
                title: t('forgotPasswordPage.successTitle'),
                message: t('forgotPasswordPage.successMessage'),
                color: 'green',
                icon: <IconCheck size={18} />,
                autoClose: 7000
            });
            setMessageSent(true);
            setEmail('');
        } catch (error: any) {
            console.error('Error requesting password reset:', error);
             notifications.show({
                 title: t('forgotPasswordPage.errorGenericTitle'),
                 message: t('forgotPasswordPage.errorGenericMessage'),
                 color: 'blue',
                 autoClose: 7000
             });
             setMessageSent(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size={480} my={40}>
             <Title ta="center" style={{ fontWeight: 900 }}>{t('forgotPasswordPage.title')}</Title>
             <Text c="dimmed" size="sm" ta="center" mt={5}>
                {t('forgotPasswordPage.subtitle')}{' '}
                <Anchor component={Link} to="/login" size="sm">{t('forgotPasswordPage.loginLink')}</Anchor>
             </Text>
            <Paper withBorder shadow="md" p={30} mt={30} radius="lg">
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <Text size="sm" ta="center">{t('forgotPasswordPage.instructions')}</Text>
                        <TextInput
                            label={t('forgotPasswordPage.emailLabel')}
                            placeholder={t('forgotPasswordPage.emailPlaceholder')}
                            value={email}
                            onChange={(event) => setEmail(event.currentTarget.value)}
                            required
                            type="email"
                            disabled={isLoading || messageSent}
                        />
                        {messageSent && (
                           <Text c="green" ta="center" size="sm" mt="md">
                               {t('forgotPasswordPage.successTitle')}
                           </Text>
                         )}
                        <Button
                            type="submit"
                            loading={isLoading}
                            fullWidth
                            mt="xl"
                            radius="lg"
                            disabled={messageSent}
                        >
                            {t('forgotPasswordPage.buttonText')}
                        </Button>
                    </Stack>
                </form>
            </Paper>
         </Container>
    );
};

export default ForgotPasswordPage;

// End of File: frontend/src/pages/ForgotPasswordPage.tsx