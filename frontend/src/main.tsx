// File: frontend/src/main.tsx
// Version: 1.1.0 (Add Mantine Notifications Provider)

import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Importaciones de Mantine Core
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
// --- NUEVO: Importar Notifications ---
import { Notifications } from '@mantine/notifications';
// --- FIN NUEVO ---
// Importar CSS de Notificaciones (¡Importante!)
import '@mantine/notifications/styles.css';

// Importar el tema personalizado
import { theme } from './theme';

// Importaciones de React Router
import { BrowserRouter } from 'react-router-dom';


ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // StrictMode comentado
  <MantineProvider theme={theme}>
     {/* --- NUEVO: Añadir el componente Notifications --- */}
     {/* Debe estar dentro de MantineProvider */}
     <Notifications position="top-right" zIndex={1000} />
     {/* --- FIN NUEVO --- */}
     <BrowserRouter>
       <App />
     </BrowserRouter>
  </MantineProvider>
  // </React.StrictMode>,
);

// End of File: frontend/src/main.tsx