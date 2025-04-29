// filename: frontend/src/main.tsx
// Version: 1.3.1 (Clean up comments)

import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Estilos globales

// Mantine Imports
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals';

// Tema Personalizado
import { theme } from './theme';

// React Router
import { BrowserRouter } from 'react-router-dom';

// Renderizar la aplicación React
ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // Comentado
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <ModalsProvider>
          {/* Configuración de Notificaciones Globales */}
          <Notifications position="top-right" zIndex={1000} />
          <App />
        </ModalsProvider>
      </BrowserRouter>
    </MantineProvider>
  // </React.StrictMode>
);

// Ocultar/Eliminar el loader inicial HTML después del primer render
const loaderElement = document.getElementById('initial-loader');
if (loaderElement) {
    // Eliminamos directamente el loader
     loaderElement.remove();
     console.log("Initial loader removed.");
}

// End of file: frontend/src/main.tsx