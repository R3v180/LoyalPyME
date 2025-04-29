// filename: frontend/src/main.tsx
// Version: 1.4.0 (Import i18n config and add Suspense)

import React from 'react'; // Necesario para Suspense
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Mantine Imports
import '@mantine/core/styles.css';
import { MantineProvider, Loader, Center } from '@mantine/core'; // Añadido Loader y Center para fallback
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals';
import { theme } from './theme';

// React Router
import { BrowserRouter } from 'react-router-dom';

// --- NUEVO: Importar la configuración de i18next ---
// Simplemente importarlo aquí ejecuta el código de inicialización
import './i18n';
// --- FIN NUEVO ---

// Renderizar la aplicación React
ReactDOM.createRoot(document.getElementById('root')!).render(
  // MantineProvider y BrowserRouter envuelven todo
  <MantineProvider theme={theme}>
    <BrowserRouter>
      {/* --- NUEVO: Envolver App con Suspense --- */}
      {/* Muestra un loader mientras i18next carga las traducciones iniciales */}
      <React.Suspense fallback={
          <Center style={{ height: '100vh' }}> {/* Centrar el loader */}
            <Loader color="blue" />
          </Center>
        }>
        <ModalsProvider>
          <Notifications position="top-right" zIndex={1000} />
          <App /> {/* App ahora está dentro de Suspense */}
        </ModalsProvider>
      </React.Suspense>
      {/* --- FIN NUEVO --- */}
    </BrowserRouter>
  </MantineProvider>
);

// Ocultar/Eliminar el loader inicial HTML (sin cambios)
const loaderElement = document.getElementById('initial-loader');
if (loaderElement) {
     loaderElement.remove();
     console.log("Initial loader removed.");
 }

// End of file: frontend/src/main.tsx