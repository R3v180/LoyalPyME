// filename: frontend/src/theme.ts
// Version: 1.0.3 (Clean up comments and commented code)

import { createTheme } from '@mantine/core';

// Crear el objeto del tema
export const theme = createTheme({
  /* Aquí puedes añadir tus personalizaciones del tema de Mantine */

  // Color primario establecido a azul
  primaryColor: 'blue',

  // Radio de borde por defecto para componentes
  defaultRadius: 'lg', // Opciones: 'xs', 'sm', 'md', 'lg', 'xl'

  // Fuente por defecto
  fontFamily: 'Verdana, sans-serif',

  // Ejemplo de cómo personalizar componentes específicos (descomentar y ajustar si es necesario):
  /*
  components: {
    Button: {
      defaultProps: {
        // Ejemplo: hacer todos los botones un poco más grandes por defecto
        // size: 'md',
      }
    }
  }
  */
});

// End of File: frontend/src/theme.ts