// File: frontend/src/main.tsx
// Version: 1.0.0

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importa nuestro componente principal App
// import './index.css'; // Mantener o eliminar los estilos globales, lo eliminaremos mas tarde si limpiamos index.css

// Importamos BrowserRouter de react-router-dom para envolver nuestra aplicacion
import { BrowserRouter } from 'react-router-dom';


ReactDOM.createRoot(document.getElementById('root')!).render(
  // React.StrictMode es util para desarrollo, lo mantenemos por ahora
  // <React.StrictMode>
     // Envuelve el componente App con BrowserRouter para habilitar el enrutamiento
     <BrowserRouter>
       <App /> {/* Nuestro componente principal */}
     </BrowserRouter>
  // </React.StrictMode>,
);

// End of File: frontend/src/main.tsx