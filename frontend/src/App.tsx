// File: frontend/src/App.tsx
// Version: 1.0.1

import React from 'react';
// Importa nuestro componente que define las rutas
import AppRoutes from './routes/index';

// Opcional: Importar estilos globales si los tenemos (por ahora index.css esta comentado en main.tsx)
// import './index.css';


function App() {
  // El componente App ahora solo renderiza el componente AppRoutes,
  // que se encargara de mostrar la pagina correcta segun la URL.
  return (
    // Puedes envolver AppRoutes con otros componentes de layout aqui (ej: Header, Footer)
    <div className="App"> {/* Puedes añadir clases CSS globales aqui */}
      <AppRoutes /> {/* Renderiza las rutas de la aplicacion */}
    </div>
  );
}

export default App; // Exporta el componente principal App

// End of File: frontend/src/App.tsx