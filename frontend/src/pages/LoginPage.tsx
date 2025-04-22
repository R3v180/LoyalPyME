// File: frontend/src/pages/LoginPage.tsx
// Version: 1.0.0

import React, { useState } from 'react';
import axios from 'axios'; // Importa axios para hacer peticiones HTTP
import { useNavigate } from 'react-router-dom'; // Para navegar entre rutas

function LoginPage() {
  // Estados locales para el email y la contraseña del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Estado para manejar mensajes de error
  const [error, setError] = useState<string | null>(null);
  // Hook para navegacion programatica
  const navigate = useNavigate();

  // Manejador del envio del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Prevenir que la pagina se recargue al enviar el formulario
    e.preventDefault();
    // Limpiar cualquier error anterior
    setError(null);

    try {
      // Hacer la peticion POST al endpoint de login del backend
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        password,
      });

      // Si el login es exitoso, el backend responde con el usuario y el token
      const { token, user } = response.data;

      // GUARDAR el token y la informacion basica del usuario (ID, role, businessId)
      // Esto es crucial para futuras peticiones autenticadas y para saber que interfaz mostrar
      // Usamos localStorage por ahora, en produccion podriamos usar cookies seguras
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Guardar el objeto user como string JSON

      console.log('Login successful!', user); // Log en consola del navegador

      // Redirigir al usuario segun su rol
      if (user.role === 'BUSINESS_ADMIN') {
        // Redirigir al panel de administrador del negocio
        navigate('/admin/dashboard'); // Esta ruta aun no existe, la definiremos despues
      } else if (user.role === 'CUSTOMER_FINAL') {
        // Redirigir al portal del cliente
        navigate('/customer/dashboard'); // Esta ruta aun no existe, la definiremos despues
      } else {
         // Manejar otros roles o un rol inesperado
         setError('Unknown user role.');
         // Opcional: Limpiar token y user de localStorage si se guardaron
         localStorage.removeItem('token');
         localStorage.removeItem('user');
      }


    } catch (err: any) { // Captura errores de la peticion axios
      // Si la peticion falla (ej: 401 Unauthorized, 400 Bad Request)
      // axios pone la respuesta de error en err.response
      if (err.response && err.response.data && err.response.data.message) {
        // Mostrar el mensaje de error que viene del backend
        setError(err.response.data.message);
      } else {
        // Mostrar un mensaje de error generico si no hay respuesta del backend o es inesperada
        setError('Login failed. Please try again.');
        console.error('Login error:', err); // Log del error completo en consola del navegador
      }
    }
  };

  // Renderizado del componente (el HTML del formulario)
  return (
    <div>
      <h2>Login</h2>
      {/* Mostrar mensaje de error si existe */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          {/* Input para el email. El valor se actualiza en el estado 'email' */}
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required // Campo requerido
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          {/* Input para la contraseña. El valor se actualiza en el estado 'password' */}
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required // Campo requerido
          />
        </div>
        {/* Boton de envio del formulario */}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage; // Exporta el componente

// End of File: frontend/src/pages/LoginPage.tsx