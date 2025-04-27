// File: frontend/src/main.tsx
// Version: 1.2.1 (Remove unused React import)

// import React from 'react'; // <-- Importación eliminada
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

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


ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <MantineProvider theme={theme}>
    <BrowserRouter>
      <ModalsProvider>
        <Notifications position="top-right" zIndex={1000} />
        <App />
      </ModalsProvider>
    </BrowserRouter>
  </MantineProvider>
  // </React.StrictMode>,
);

// End of File: frontend/src/main.tsx