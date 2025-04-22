// File: backend/src/routes/protected.routes.ts
// Version: 1.0.2 (Correct version for modular routing)

import { Router, Request, Response } from 'express';
// Ya NO necesitamos importar authenticateToken aquí

const router = Router();

// NOTA: El middleware authenticateToken YA SE APLICÓ globalmente a '/api' en index.ts

// Ruta protegida para obtener el perfil del usuario autenticado
// Definida como la RAÍZ ('/') relativa al punto de montaje '/api/profile'
router.get('/', (req: Request, res: Response) => {
  if (!req.user) {
    console.error("Error: req.user is missing in /api/profile route handler!");
    return res.status(401).json({ message: 'Authentication failed.' });
  }
  res.json(req.user);
});

// Exporta el router
export default router;

// End of File: backend/src/routes/protected.routes.ts