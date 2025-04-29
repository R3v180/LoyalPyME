// filename: frontend/src/App.tsx
// Version: 1.0.2 (Clean comments, fix encoding)

import AppRoutes from './routes/index'; // Importa el componente que define las rutas

// Opcional: Importar estilos globales si se usan activamente
// import './index.css';

function App() {
  // Renderiza el componente AppRoutes que maneja las páginas según la URL
  return (
    <div className="App"> {/* Clase global opcional */}
      <AppRoutes />
    </div>
  );
}

export default App;

// End of File: frontend/src/App.tsx