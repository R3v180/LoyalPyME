// filename: frontend/src/main.tsx
// Version: 1.3.0 (Add initial loader removal)

import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Estilos globales (si los usas)

// Mantine Core
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
// Mantine Notifications
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
// Mantine Modals
import { ModalsProvider } from '@mantine/modals';

// Tema Personalizado
import { theme } from './theme';

// React Router
import { BrowserRouter } from 'react-router-dom';

// Renderizar la aplicación React
ReactDOM.createRoot(document.getElementById('root')!).render(
  // React.StrictMode está comentado, mantenlo así si prefieres
  <MantineProvider theme={theme}>
    <BrowserRouter>
      <ModalsProvider>
        <Notifications position="top-right" zIndex={1000} />
        <App />
      </ModalsProvider>
    </BrowserRouter>
  </MantineProvider>
);

// --- CÓDIGO AÑADIDO PARA OCULTAR/ELIMINAR EL LOADER INICIAL ---
// Buscamos el loader por su ID después de que React haya intentado renderizar
const loaderElement = document.getElementById('initial-loader');
if (loaderElement) {
    // Opción 1: Ocultar con transición (si añadiste la clase .hidden en el CSS)
    // loaderElement.classList.add('hidden');
    // setTimeout(() => loaderElement.remove(), 500); // Eliminar tras la transición

    // Opción 2: Eliminar directamente (más simple)
     loaderElement.remove();
     console.log("Initial loader removed.");
}
// --- FIN CÓDIGO AÑADIDO ---


// End of file: frontend/src/main.tsx