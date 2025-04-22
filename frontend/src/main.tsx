// File: frontend/src/main.tsx
// Version: 1.0.3 (Apply Custom Theme + Remove Unused React Import)

// Ya no importamos React aquí
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Estilos globales de la aplicación

// Importaciones de Mantine
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

// Importar el tema personalizado
import { theme } from './theme';

// Importaciones de React Router
import { BrowserRouter } from 'react-router-dom';


ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  // Aplicamos el tema personalizado al MantineProvider
  <MantineProvider theme={theme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MantineProvider>
  // </React.StrictMode>,
);

// End of File: frontend/src/main.tsx