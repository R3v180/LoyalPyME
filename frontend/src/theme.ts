// File: frontend/src/theme.ts
// Version: 1.0.2 (Blue color, Larger default radius)

import { createTheme } from '@mantine/core';

// 1. Define custom colors if needed (optional for now, using Mantine's green)
// ... (código comentado de myBrandColor) ...

// 2. Create the theme object
export const theme = createTheme({
  /* Put your mantine theme override here */

  // --- CAMBIO: Volver a azul ---
  primaryColor: 'blue',

  // --- CAMBIO: Añadir radio por defecto más grande ---
  defaultRadius: 'lg', // 'xs', 'sm', 'md', 'lg', 'xl'

  // Set default font family
  fontFamily: 'Verdana, sans-serif',

  // Add other theme overrides here later...
  // ... (código comentado de components) ...
});

// End of File: frontend/src/theme.ts